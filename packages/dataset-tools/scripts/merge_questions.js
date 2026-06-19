const fs = require('fs');
const path = require('path');

const scrape = JSON.parse(fs.readFileSync(path.join(__dirname, 'cad_questions.json'), 'utf8'));
const tqb = JSON.parse(fs.readFileSync(path.join(__dirname, 'cad_tqb_questions.json'), 'utf8'));

console.log(`Scraped questions: ${scrape.length}`);
console.log(`TQB questions: ${tqb.length}`);

// Normalize question text for dedup
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);

const seen = new Set();
const merged = [];

// Add scraped questions first
for (const q of scrape) {
    const key = normalize(q.question);
    if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...q, source: 'actual4test' });
    }
}

// Add TQB questions, skip duplicates
let newFromTqb = 0;
for (const q of tqb) {
    const key = normalize(q.question);
    if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...q, source: 'examtopics_tqb' });
        newFromTqb++;
    }
}

// Re-number
merged.forEach((q, i) => q.number = i + 1);

console.log(`\nNew questions from TQB: ${newFromTqb}`);
console.log(`Total merged (unique): ${merged.length}`);

fs.writeFileSync(path.join(__dirname, 'cad_all_questions.json'), JSON.stringify(merged, null, 2), 'utf8');
console.log(`Saved to cad_all_questions.json`);

// Stats
const byType = {};
merged.forEach(q => { byType[q.type || q.answer?.includes(',') ? 'MULTI' : 'SINGLE'] = (byType[q.type || 'SINGLE'] || 0) + 1; });
console.log(`\nBy type:`, byType);
