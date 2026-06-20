'use client';

import { useState } from 'react';

const COMPONENTS = [
  {
    name: 'Quiz',
    description: 'Adiciona um quiz de múltipla escolha.',
    snippet: `<Quiz \n  title="Qual é a capital do Brasil?"\n  options={["São Paulo", "Rio de Janeiro", "Brasília"]}\n/>`,
  },
  {
    name: 'Code Challenge',
    description: 'Adiciona um bloco para o aluno resolver um desafio de código.',
    snippet: `<CodeChallenge \n  language="javascript"\n  prompt="Escreva uma função que soma dois números."\n/>`,
  },
  {
    name: 'Alert (Info)',
    description: 'Bloco de aviso informativo.',
    snippet: `<Alert type="info">\n  Lembre-se de instalar as dependências antes de rodar o projeto!\n</Alert>`,
  },
  {
    name: 'Alert (Warning)',
    description: 'Bloco de atenção/aviso.',
    snippet: `<Alert type="warning">\n  Cuidado ao executar comandos como root.\n</Alert>`,
  }
];

export function ComponentDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed right-0 top-0 h-full bg-white dark:bg-slate-900 border-l shadow-xl transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0 w-80' : 'translate-x-full w-80'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -left-10 top-20 bg-blue-600 text-white p-2 rounded-l-md shadow-md hover:bg-blue-700"
      >
        {isOpen ? '→' : '←'}
      </button>

      <div className="p-4 h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Componentes</h2>
        <p className="text-sm text-slate-500 mb-4">Copie e cole os snippets abaixo no seu código MDX.</p>
        
        <div className="space-y-6">
          {COMPONENTS.map((comp) => (
            <div key={comp.name} className="border p-3 rounded bg-slate-50 dark:bg-slate-800">
              <h3 className="font-semibold">{comp.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{comp.description}</p>
              <div className="relative">
                <pre className="text-xs bg-slate-950 text-slate-200 p-2 rounded overflow-x-auto">
                  {comp.snippet}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(comp.snippet)}
                  className="absolute top-1 right-1 bg-slate-700 text-white text-[10px] px-2 py-1 rounded hover:bg-slate-600"
                >
                  Copiar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
