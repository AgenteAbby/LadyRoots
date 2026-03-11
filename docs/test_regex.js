const fs = require('fs');
const html = fs.readFileSync('d:/Apps/DEV/Lady Roots_V1/docs/output.md', 'utf8');

const rows = html.split('<tr');
let achou = false;

for (const row of rows) {
  if (row.includes('class=\"serialized_price_info\"')) {
    const nameMatch = row.match(/class=\"m-b-0 text-left room_name\">\s*(.*?)\s*<\/td>/s);
    const idTokenMatch = row.match(/name=\"units\[(\d+)\]\[serialized_price_info\]\"\s*value=['\"]([^'\"]+)['\"]/);
    if (nameMatch && idTokenMatch) {
      achou = true;
      const suiteName = nameMatch[1].trim();
      const idQ = idTokenMatch[1];
      const token = idTokenMatch[2];
      console.log(`ACHOU: ${suiteName} (ID: ${idQ})`);
    }
  }
}

if (!achou) {
  console.log('NENHUMA VAGA ENCONTRADA PELA REGEX');
}
