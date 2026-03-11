const fs = require('fs');

const data = fs.readFileSync('d:/Apps/DEV/Lady Roots_V1/Workflows/verificar_vagas.json', 'utf8');
let jsonResponse;
try {
  // Try fixing it, or just read the original file if I broke it.
  jsonResponse = JSON.parse(data);
} catch (e) {
  // If parsing fails, the previous edit broke it. We can just use string replace.
}

const jsCodeNew = `try {
  const json = $input.first().json;

  if (json.error) {
    return [{ json: {
      sucesso: false,
      mensagem: "A Busca falhou devido a um erro no servidor HQBeds.",
      detalhes: "Erro interno no nó 'Consultar Vagas HTML' (TimeOut ou 500)."
    } }];
  }

  const html = json.data || '';
  if (!html) {
     return [{ json: {
       sucesso: false,
       mensagem: "A Busca falhou. Resposta vazia.",
       detalhes: "O conteúdo da página no nó 'Consultar Vagas HTML' retornou vazio."
     } }];
  }

  const rows = html.split('<tr');
  let achou = false;
  let md = "\\nðŸ ¨ **RESULTADO DA BUSCA DE VAGAS PARA RESERVA**\\n\\n";

  for (const row of rows) {
    if (row.includes('class="serialized_price_info"')) {
      const nameMatch = row.match(/class="m-b-0 text-left room_name">[^a-zA-Z]*(.*?)<\\/td>/s);
      const idTokenMatch = row.match(/name="units\\[(\\d+)\\]\\[serialized_price_info\\]"\\s*value=['"]([^'"]+)['"]/);
      if (nameMatch && idTokenMatch) {
        achou = true;
        const suiteName = nameMatch[1].replace(/\\s+/g, ' ').trim();
        const idQ = idTokenMatch[1];
        const token = idTokenMatch[2];
        md += \`âœ… **\${suiteName} (ID \${idQ})**\\n- **ID para Reserva:** \\\`\${idQ}\\\`\\n- **Token Serializado:** \\\`\${token}\\\`\\n\\n\`;
      }
    }
  }

  if (!achou) {
    return [{ json: {
      sucesso: true,
      mensagem: "Nenhuma vaga encontrada para as datas (Lotação esgotada).",
      detalhes: "Sugira ao cliente tentar outras datas."
    } }];
  }

  md += "---\\nðŸ“Œ **INSTRUÇÃO OBRIGATÓRIA PARA A IA:**\\nAbaixo estão as vagas encontradas. Avise o cliente usando sua linguagem amigável. SE ELE CONFIRMAR A VONTADE DE RESERVAR, use a ferramenta criar_reserva usando o ID e Token Serializado acima.";

  return [{ json: {
    sucesso: true,
    mensagem: "Vagas encontradas com DESTAQUE! Leia os detalhes.",
    detalhes: md
  } }];

} catch (e) {
  return [{ json: {
    sucesso: false,
    mensagem: "Erro Javascript ao buscar vagas no nó 'Gerar Resumo em MD'.",
    detalhes: e.message
  } }];
}`;

// However, my previous edit completely butchered the JSON file so JSON.parse won't work. Let's restore from git or just fix the node string!
