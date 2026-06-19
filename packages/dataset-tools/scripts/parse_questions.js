const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'scratch', 'scratch');
const questions = [];

const files = fs.readdirSync(htmlDir)
    .filter(f => f.match(/^page_\d+\.html$/))
    .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));

console.log(`Found ${files.length} HTML files to parse.`);

for (const file of files) {
    const html = fs.readFileSync(path.join(htmlDir, file), 'utf8');
    if (!html.includes('QUESTION:')) { console.log(`Skipping ${file}`); continue; }

    const qRegex = /QUESTION:\s*(\d+)<\/strong>.*?<p class="lead">(.*?)<div>.*?<ol class="rounded-list"[^>]*>(.*?)<\/ol>.*?Answer\(s\):<\/strong>\s*([A-Z,\s]+)/gs;
    let match;
    while ((match = qRegex.exec(html)) !== null) {
        const qNum = parseInt(match[1]);
        const decode = s => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
        const questionText = decode(match[2]);
        const optionsHtml = match[3];
        const optRegex = /<li data-correct="(True|False)">(.*?)(?=<li|$)/gs;
        const options = []; let optMatch; let i = 0;
        while ((optMatch = optRegex.exec(optionsHtml)) !== null) {
            options.push({ letter: 'ABCDEFGH'[i], text: decode(optMatch[2]), correct: optMatch[1] === 'True' });
            i++;
        }
        let explanation = '';
        const expMatch = html.match(new RegExp(`answerQ${qNum}.*?Explanation:.*?<p>(.*?)(?:</div>)`, 's'));
        if (expMatch) explanation = decode(expMatch[1]);

        questions.push({ number: qNum, question: questionText, options, answer: match[4].trim(), explanation });
    }
    console.log(`${file}: total so far: ${questions.length}`);
}

const seen = new Set(); const unique = [];
for (const q of questions) { if (!seen.has(q.number)) { seen.add(q.number); unique.push(q); } }
unique.sort((a, b) => a.number - b.number);

console.log(`\nTotal unique: ${unique.length} (Q${unique[0]?.number}-Q${unique[unique.length-1]?.number})`);
fs.writeFileSync(path.join(__dirname, 'cad_questions.json'), JSON.stringify(unique, null, 2), 'utf8');
console.log('Saved to cad_questions.json');
