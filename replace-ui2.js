const fs = require('fs');

const f1 = './apps/simulator/src/components/simulations/quiz-runner.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/"green"/g, '"default"');
c1 = c1.replace(/"red"/g, '"destructive"');
c1 = c1.replace(/"amber"/g, '"destructive"');
c1 = c1.replace(/"blue"/g, '"default"');
c1 = c1.replace(/"neutral"/g, '"secondary"');
c1 = c1.replace(/"primary"/g, '"default"');
fs.writeFileSync(f1, c1, 'utf8');

const f2 = './apps/simulator/src/app/(protected)/dashboard/page.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/"green"/g, '"default"');
c2 = c2.replace(/"red"/g, '"destructive"');
c2 = c2.replace(/topic =>/g, '(topic: string) =>');
fs.writeFileSync(f2, c2, 'utf8');

const f3 = './apps/simulator/src/app/(protected)/estatisticas/page.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(/"green"/g, '"default"');
c3 = c3.replace(/"red"/g, '"destructive"');
c3 = c3.replace(/"blue"/g, '"default"');
fs.writeFileSync(f3, c3, 'utf8');

const f4 = './apps/simulator/src/app/(protected)/revisao-erros/page.tsx';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(/"red"/g, '"destructive"');
c4 = c4.replace(/"neutral"/g, '"secondary"');
c4 = c4.replace(/"amber"/g, '"destructive"');
fs.writeFileSync(f4, c4, 'utf8');

const f5 = './apps/simulator/src/app/(protected)/simulados/[id]/resultado/page.tsx';
let c5 = fs.readFileSync(f5, 'utf8');
c5 = c5.replace(/"red"/g, '"destructive"');
c5 = c5.replace(/"green"/g, '"default"');
c5 = c5.replace(/"amber"/g, '"destructive"');
fs.writeFileSync(f5, c5, 'utf8');

const f6 = './apps/simulator/src/components/simulations/answer-key-panel.tsx';
let c6 = fs.readFileSync(f6, 'utf8');
c6 = c6.replace(/"green"/g, '"default"');
fs.writeFileSync(f6, c6, 'utf8');
