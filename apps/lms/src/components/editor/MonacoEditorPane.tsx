'use client';

import { Editor } from '@monaco-editor/react';

interface MonacoEditorPaneProps {
  value: string;
  onChange: (value: string | undefined) => void;
}

export function MonacoEditorPane({ value, onChange }: MonacoEditorPaneProps) {
  return (
    <div className="h-full border rounded overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        theme="vs-dark"
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          fontSize: 14,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
