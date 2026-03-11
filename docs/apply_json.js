const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Workflows', 'verificar_vagas.json');
let data;

try {
  data = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error("File not found");
  process.exit(1);
}

// Ensure the git checkout worked. If JSON parse fails, git checkout failed.
let workflow;
try {
  workflow = JSON.parse(data);
} catch (e) {
  console.error("JSON parse failed. Git checkout did not work: " + e.message);
  process.exit(1);
}

const jsCode = `try {
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
  let md = "\\n🏨 **RESULTADO DA BUSCA DE VAGAS PARA RESERVA**\\n\\n";

  for (const row of rows) {
    if (row.includes('class="serialized_price_info"')) {
      const nameMatch = row.match(/class="m-b-0 text-left room_name">[^a-zA-Z]*(.*?)<\\/td>/s);
      const idTokenMatch = row.match(/name="units\\[(\\d+)\\]\\[serialized_price_info\\]"\\s*value=['"]([^'"]+)['"]/);
      if (nameMatch && idTokenMatch) {
        achou = true;
        const suiteName = nameMatch[1].replace(/\\s+/g, ' ').trim();
        const idQ = idTokenMatch[1];
        const token = idTokenMatch[2];
        md += \`✅ **\${suiteName} (ID \${idQ})**\\n- **ID para Reserva:** \\\`\${idQ}\\\`\\n- **Token Serializado:** \\\`\${token}\\\`\\n\\n\`;
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

  md += "---\\n📌 **INSTRUÇÃO OBRIGATÓRIA PARA A IA:**\\nAbaixo estão as vagas encontradas. Avise o cliente usando sua linguagem amigável. SE ELE CONFIRMAR A VONTADE DE RESERVAR, use a ferramenta criar_reserva usando o ID e Token Serializado acima.";

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

// Find the "Gerar Resumo em MD" node
const targetNode = workflow.nodes.find(n => n.name === 'Gerar Resumo em MD');
if (targetNode) {
  targetNode.parameters.jsCode = jsCode;
  fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf8');
  console.log("Successfully updated jsCode without breaking JSON");
} else {
  console.error("Node 'Gerar Resumo em MD' not found");
}
