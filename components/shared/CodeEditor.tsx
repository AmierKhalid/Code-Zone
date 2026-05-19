"use client";

import React, { useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = "javascript",
  height = "300px",
  placeholder = "",
  readOnly = false,
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      wordWrap: "on",
      automaticLayout: true,
      readOnly,
      placeholder: {
        text: placeholder,
      },
    });

    // Add placeholder functionality
    if (placeholder && !value) {
      const placeholderDecoration = editor.createDecorationsCollection([
        {
          range: new monaco.Range(1, 1, 1, 1),
          options: {
            className: "editor-placeholder",
            afterContentClassName: "editor-placeholder",
            isWholeLine: true,
          },
        },
      ]);
    }

    // Handle value changes
    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      onChange(newValue);
    });
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onMount={handleEditorDidMount}
        theme="vs-light"
        loading={
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        }
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          wordWrap: "on",
          automaticLayout: true,
          readOnly,
          placeholder,
        }}
      />
      <style jsx>{`
        :global(.editor-placeholder) {
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
