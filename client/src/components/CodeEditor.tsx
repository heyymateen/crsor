import React, { useEffect, useRef, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { socketService } from '../services/socket';
import { DocumentOperation, CursorPosition, LanguageChangeData } from '../types';
import { Wand2, Download, Copy } from 'lucide-react';

interface CodeEditorProps {
  initialContent: string;
  language: string;
  onLanguageChange: (language: string) => void;
  onContentChange: (content: string) => void;
  userCursors: CursorPosition[];
  isConnected: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'php', label: 'PHP' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'yaml', label: 'YAML' },
];

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialContent,
  language,
  onLanguageChange,
  onContentChange,
  userCursors,
  isConnected
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [content, setContent] = useState(initialContent);
  const [isProcessingRemoteChange, setIsProcessingRemoteChange] = useState(false);
  const lastCursorPosition = useRef<{ line: number; column: number }>({ line: 1, column: 1 });

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Menlo, monospace',
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      cursorStyle: 'line',
      renderWhitespace: 'selection',
      wordWrap: 'on',
      bracketPairColorization: { enabled: true },
    });

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      lastCursorPosition.current = { line: position.lineNumber, column: position.column };
      
      if (isConnected && !isProcessingRemoteChange) {
        socketService.sendCursorPosition({
          line: position.lineNumber,
          column: position.column
        });
      }
    });

    // Track content changes
    editor.onDidChangeModelContent((e) => {
      if (isProcessingRemoteChange) return;

      const model = editor.getModel();
      if (!model) return;

      const newContent = model.getValue();
      setContent(newContent);
      onContentChange(newContent);

      // Send operations to other users
      for (const change of e.changes) {
        const operation: Omit<DocumentOperation, 'id' | 'timestamp'> = {
          type: change.text ? 'insert' : 'delete',
          position: model.getOffsetAt(change.range.getStartPosition()),
          content: change.text,
          length: change.rangeLength
        };

        if (isConnected) {
          socketService.sendDocumentOperation(operation);
        }
      }
    });

    // Add AI assistance command
    editor.addAction({
      id: 'ai-assistance',
      label: 'Get AI Assistance',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (ed) => {
        const position = ed.getPosition();
        const model = ed.getModel();
        if (position && model && isConnected) {
          const lineContent = model.getLineContent(position.lineNumber);
          const context = model.getValueInRange({
            startLineNumber: Math.max(1, position.lineNumber - 5),
            startColumn: 1,
            endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 5),
            endColumn: 1
          });

          socketService.requestAIAssistance({
            position: { line: position.lineNumber, column: position.column },
            context: context
          });
        }
      }
    });

    console.log('Monaco Editor mounted successfully');
  }, [isConnected, onContentChange, isProcessingRemoteChange]);

  // Handle remote document operations
  useEffect(() => {
    const handleDocumentOperation = (operation: DocumentOperation) => {
      if (!editorRef.current || !monacoRef.current) return;

      setIsProcessingRemoteChange(true);
      
      const model = editorRef.current.getModel();
      if (!model) return;

      try {
        const position = model.getPositionAt(operation.position);
        
        if (operation.type === 'insert') {
          const range = new monacoRef.current.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          );
          
          model.pushEditOperations([], [{
            range,
            text: operation.content
          }], () => null);
        } else if (operation.type === 'delete') {
          const endPosition = model.getPositionAt(operation.position + operation.length);
          const range = new monacoRef.current.Range(
            position.lineNumber,
            position.column,
            endPosition.lineNumber,
            endPosition.column
          );
          
          model.pushEditOperations([], [{
            range,
            text: ''
          }], () => null);
        }

        const newContent = model.getValue();
        setContent(newContent);
        onContentChange(newContent);
      } catch (error) {
        console.error('Error applying remote operation:', error);
      } finally {
        setTimeout(() => setIsProcessingRemoteChange(false), 100);
      }
    };

    const handleLanguageChange = (data: LanguageChangeData) => {
      if (!editorRef.current || !monacoRef.current) return;
      
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, data.language);
      }
    };

    if (isConnected) {
      socketService.onDocumentOperation(handleDocumentOperation);
      socketService.onLanguageChange(handleLanguageChange);
    }

    return () => {
      if (isConnected) {
        socketService.removeListener('document-operation');
        socketService.removeListener('language-change');
      }
    };
  }, [isConnected, onContentChange]);

  // Handle AI suggestions
  useEffect(() => {
    const handleAISuggestion = (response: any) => {
      if (!editorRef.current || !monacoRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      const position = model.getPositionAt(0); // You might want to use the actual position from response
      const range = new monacoRef.current.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );

      // Insert AI suggestion
      model.pushEditOperations([], [{
        range,
        text: response.suggestion
      }], () => null);

      // Show notification
      console.log('AI Suggestion applied:', response.suggestion);
    };

    if (isConnected) {
      socketService.onAISuggestion(handleAISuggestion);
    }

    return () => {
      if (isConnected) {
        socketService.removeListener('ai-suggestion');
      }
    };
  }, [isConnected]);

  // Render user cursors
  const renderUserCursors = () => {
    if (!editorRef.current || userCursors.length === 0) return null;

    return userCursors.map((cursor) => (
      <div key={cursor.userId} className="user-cursor" style={{
        top: `${(cursor.cursor.line - 1) * 20}px`,
        left: `${cursor.cursor.column * 8}px`
      }}>
        <div 
          className="user-cursor-line" 
          style={{ backgroundColor: cursor.color }}
        />
        <div 
          className="user-cursor-label"
          style={{ backgroundColor: cursor.color }}
        >
          {cursor.userName}
        </div>
      </div>
    ));
  };

  const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    onLanguageChange(newLanguage);
    
    if (isConnected) {
      socketService.sendLanguageChange(newLanguage);
    }
  };

  const handleRequestAI = () => {
    if (!editorRef.current || !isConnected) return;

    const position = editorRef.current.getPosition();
    const model = editorRef.current.getModel();
    if (position && model) {
      const context = model.getValueInRange({
        startLineNumber: Math.max(1, position.lineNumber - 5),
        startColumn: 1,
        endLineNumber: Math.min(model.getLineCount(), position.lineNumber + 5),
        endColumn: 1
      });

      socketService.requestAIAssistance({
        position: { line: position.lineNumber, column: position.column },
        context: context
      });
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'javascript' ? 'js' : language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={handleLanguageSelect}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRequestAI}
            disabled={!isConnected}
            className="flex items-center space-x-1 px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Wand2 size={14} />
            <span>AI Assist</span>
          </button>
          
          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>
          
          <button
            onClick={handleDownloadCode}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Editor container */}
      <div className="flex-1 relative editor-container">
        <Editor
          height="100%"
          language={language}
          value={content}
          onMount={handleEditorDidMount}
          options={{
            theme: 'vs-dark',
            fontFamily: 'Fira Code, Monaco, Menlo, monospace',
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            cursorStyle: 'line',
            renderWhitespace: 'selection',
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
        
        {/* User cursors overlay */}
        {renderUserCursors()}
      </div>
    </div>
  );
};