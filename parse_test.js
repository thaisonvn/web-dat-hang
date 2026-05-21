import fs from 'fs';
let content = fs.readFileSync('firestore.rules', 'utf8');
let open = (content.match(/\{/g) || []).length;
let close = (content.match(/\}/g) || []).length;
console.log('Open:', open, 'Close:', close);
