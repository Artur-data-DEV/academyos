'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { saveLesson } from '../actions/lesson';

export default function EditorPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Comece a escrever sua aula aqui...</p>',
  });

  const handleSave = async () => {
    if (!editor || !title || !slug || !moduleId) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      // Obter o JSON estruturado do Tiptap para persistir no banco (conforme arquitetura definida)
      const contentJson = editor.getJSON();
      
      await saveLesson(moduleId, title, slug, contentJson);
      
      setMessage('Aula salva com sucesso!');
    } catch (err: any) {
      setMessage(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Editor de Aula</h1>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título da Aula</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Ex: Introdução à AWS"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <input 
            type="text" 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Ex: intro-aws"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">ID do Módulo</label>
          <input 
            type="text" 
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="ID UUID"
          />
        </div>
      </div>

      <div className="border rounded-md p-4 min-h-[400px] prose max-w-none">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar Aula'}
        </button>
        {message && <span className="text-sm font-medium">{message}</span>}
      </div>
    </div>
  );
}
