import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ language = 'json', defaultValue = '', theme = 'vs-dark', height = '500px', onChange }) => {
  const [canEdit, setCanEdit] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [editorInstance, setEditorInstance] = useState(null);

  const handleEditorChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleEditorDidMount = (editor) => {
    setEditorInstance(editor);

    setTimeout(() => {
      if (value) {
        editor.getAction('editor.action.formatDocument').run();
        setCanEdit(true);
      }
    }, 500);
  };

  const formatCode = () => {
    if (editorInstance) {
      editorInstance.getAction('editor.action.formatDocument').run();
    }
  };

  useEffect(() => {
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    formatCode();
  }, [value]);

  return (
    <section style={{ height }} className={`w-100 ${canEdit ? '' : 'd-none'}`}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          automaticLayout: true,
          minimap: { enabled: true },
        }}
      />
    </section>
  );
};

export default CodeEditor;
