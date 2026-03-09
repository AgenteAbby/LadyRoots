const fs = require('fs');
const html = fs.readFileSync('docs/output.md', 'utf8');

const regex = /name="units\[(\d+)\]\[serialized_price_info\]"\s*value=['"]([^'"]+)['"]/g;

let match;
let achou = false;

while ((match = regex.exec(html)) !== null) {
  achou = true;
  console.log('ACHOU QUARTO ID:', match[1]);
  console.log('TOKEN ALREADY PARSED:', match[2].substring(0, 30));
}

if (!achou) {
  console.log('NENHUMA VAGA ENCONTRADA PELA REGEX')
}
