import React from 'react';

const Quiz = ({ title, options }: { title: string; options: string[] }) => (
  <div className="my-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
    <h3 className="text-lg font-bold mb-2">{title || 'Quiz'}</h3>
    <div className="space-y-2">
      {options?.map((opt, i) => (
        <div key={i} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
          <input type="radio" name="quiz-radio" disabled />
          <span>{opt}</span>
        </div>
      ))}
    </div>
  </div>
);

const CodeChallenge = ({ language, prompt }: { language: string; prompt: string }) => (
  <div className="my-4 border rounded-lg overflow-hidden">
    <div className="bg-slate-800 text-white p-2 text-sm font-mono flex justify-between">
      <span>Desafio de Código: {prompt}</span>
      <span>{language}</span>
    </div>
    <div className="p-4 bg-slate-950 text-green-400 font-mono text-sm">
      <p>{"// Escreva seu código aqui..."}</p>
    </div>
  </div>
);

const Alert = ({ type = 'info', children }: { type?: 'info' | 'warning' | 'error' | 'success'; children: React.ReactNode }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <div className={`p-4 my-4 border rounded ${colors[type]}`}>
      {children}
    </div>
  );
};

export const CustomMdxComponents = {
  Quiz,
  CodeChallenge,
  Alert,
};
