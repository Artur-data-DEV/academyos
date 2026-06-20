'use client';

import { useState, useEffect } from 'react';
import { saveLesson } from '../actions/lesson';
import { MonacoEditorPane } from '../../components/editor/MonacoEditorPane';
import { LivePreview } from '../../components/editor/LivePreview';
import { ComponentDrawer } from '../../components/editor/ComponentDrawer';
import { compileMdxPreview } from '../actions/mdx';
import { MDXRemoteSerializeResult } from 'next-mdx-remote';

export default function EditorPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [moduleId, setModuleId] = useState('');
  
  const [mdxContent, setMdxContent] = useState('# Nova Aula\n\nComece a digitar aqui...');
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Debounce for live preview
  useEffect(() => {
    const timer = setTimeout(async () => {
      setCompileError(null);
      const res = await compileMdxPreview(mdxContent);
      if (res.success && res.mdxSource) {
        setMdxSource(res.mdxSource);
      } else {
        setCompileError(res.error || 'Unknown error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mdxContent]);

  const handleSave = async () => {
    if (!title || !slug || !moduleId) {
      setMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      // Wrapper the string into a JSON object to match Prisma schema (Json type)
      const contentJson = { mdx: mdxContent };
      
      await saveLesson(moduleId, title, slug, contentJson);
      
      setMessage('Aula salva com sucesso!');
    } catch (err: any) {
      setMessage(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold">MDX Editor</h1>
        
        <div className="flex items-center space-x-4">
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-1 rounded text-black text-sm w-48"
            placeholder="Título da Aula"
          />
          <input 
            type="text" 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="p-1 rounded text-black text-sm w-40"
            placeholder="Slug (ex: intro)"
          />
          <input 
            type="text" 
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="p-1 rounded text-black text-sm w-40"
            placeholder="ID do Módulo"
          />
          
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {message && (
        <div className="bg-blue-100 text-blue-800 px-4 py-2 text-sm shrink-0 text-center">
          {message}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Pane - Monaco Editor */}
        <div className="w-1/2 p-2 border-r border-slate-200 dark:border-slate-800">
          <MonacoEditorPane 
            value={mdxContent} 
            onChange={(val) => setMdxContent(val || '')} 
          />
        </div>
        
        {/* Right Pane - Live Preview */}
        <div className="w-1/2 overflow-y-auto bg-white dark:bg-slate-950">
          <LivePreview mdxSource={mdxSource} error={compileError} />
        </div>
        
        {/* Component Drawer */}
        <ComponentDrawer />
      </div>
    </div>
  );
}
