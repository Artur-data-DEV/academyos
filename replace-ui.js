const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./apps/simulator/src');
let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replace(/variant=(["'])(emerald|blue|neutral|green)\1/g, 'variant="default"');
  content = content.replace(/variant=(["'])(amber|red)\1/g, 'variant="destructive"');
  content = content.replace(/variant=(["'])primary\1/g, 'variant="default"');

  // Also replace ternary operators, e.g. `isCorrect ? "green" : "red"` 
  // since they are assigned to `variant`
  content = content.replace(/"green"/g, '"default"');
  content = content.replace(/"red"/g, '"destructive"');
  content = content.replace(/"amber"/g, '"destructive"');
  content = content.replace(/"blue"/g, '"default"');
  content = content.replace(/"neutral"/g, '"secondary"');
  content = content.replace(/"primary"/g, '"default"');
  
  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});
console.log('Arquivos UI variants atualizados: ' + changedCount);
