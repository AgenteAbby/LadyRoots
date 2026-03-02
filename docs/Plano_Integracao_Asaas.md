# INFORMAÇÕES DO SISTEMA
- **HOJE:** {{ $now.format('FFFF') }}
- **TELEFONE DO HÓSPEDE:** {{ $('Buscar contato Chatwoot').item.json.payload.phone_number }}
- **ID DA NEGOCIAÇÃO / COBRANÇA:** {{ $('Cobrança atualizada').item.json.body.payment.id }}
- **VALOR RECEBIDO:** R$ {{ $('Cobrança atualizada').item.json.body.payment.value }}

# Arquitetura de Integração Asaas x Lady Roots

Esta arquitetura define como o sistema de recebimentos (Asaas) vai se comunicar com o sistema de atendimento (n8n/Lady Roots). Essa documentação serve como roteiro de execução conforme nossas diretrizes.

## 1. Mapeamento do Impacto

A escolha arquitetural impacta diretamente a escalabilidade, a segurança financeira e a consistência da persona "Lady".

A melhor abordagem, mais segura e escalável, é o formato **Híbrido de Microserviços (API Interna com Injeção de Contexto)**.

### Por que a Abordagem de "API Interna" é a mais segura?

Deixar o Workflow da Lady apenas pedir os dados e formular o texto é a arquitetura ideal pelos seguintes motivos (Padrão Clean Architecture):

1. **Separação de Preocupações (Separation of Concerns):** 
   - **Asaas (Back-end Financeiro):** Lida exclusivamente com dados sensíveis, webhooks de banco, verificação de conciliação bancária e atualizações no Supabase. Não sabe o que é "tom de voz" ou "emoji".
   - **Lady (Front-end Atendimento):** Lida exclusivamente com a jornada do hóspede, persuasão e tom "Beachy-Chic". Não sabe como interagir com chaves de API bancárias além de acionar suas *tools*.
2. **Prevenção de Injeção de Prompt (Prompt Injection):** Se o Asaas tiver seu próprio prompt de IA para gerar respostas, um usuário mal-intencionado no WhatsApp poderia tentar enviar um comprovante falso com texto embutido que engana a IA financeira. Mantendo a camada de IA apenas na Lady, a função financeira do Asaas trabalha apenas com dados "duros" e determinísticos (JSON: Pago ou Não Pago).
3. **Memória Contínua (Supabase RAG):** Quando a Lady formula a resposta do pagamento usando a *tool*, essa resposta já fica salva no Supabase (ou no histórico do Chatwoot) como parte natural da conversa ativa. Se o Asaas mandasse o texto "por fora", a Lady perderia esse contexto imediato.

## 2. Proposta de Arquitetura (O Roteiro)

O sistema deve prever duas direções de comunicação:

### Direção 1: O Cliente Pergunta Ativamente ("Meu PIX já caiu?")
1. **Atendimento (Lady):** Recebe a mensagem e a IA decide acionar a Tool `verificar_pagamento`.
2. **Sub-agente (Asaas):** A Tool faz uma requisição HTTP (GET/POST) para o workflow isolado do Asaas passando o identificador do cliente (telefone ou ID Chatwoot).
3. **Processamento (Asaas):** O workflow do Asaas consulta a tabela do Supabase ou a API do Asaas.
4. **Resposta (Asaas para Lady):** Retorna um JSON estrito, ex: `{"status": "CONFIRMADO", "valor_pago": 500.00, "data_checkin": "12/12"}`. Se não encontrar, retorna `{"status": "PENDENTE"}`.
5. **Decisão (Lady):** Com base no JSON, a Lady formula a resposta acolhedora (ex: *"Oi João! Acabei de checar aqui e já recebemos sim!"*) e envia no WhatsApp.

### Direção 2: Webhook Proativo do Banco (Asaas avisa a aprovação imediata)
Esse é o fluxo em que precisamos injetar a mensagem ("o pagamento foi aprovado, vou avisar o cliente") no ciclo da Lady para manter a consistência da persona.

1. **Gatilho (Asaas):** O Webhook do Asaas bate no n8n.
2. **Tratamento (Asaas Workflow):** Atualiza a tabela do Supabase (status financeiro). Identifica o número do Chatwoot/Evolution vinculado àquela cobrança.
3. **Injeção de Comando (De Asaas para Lady Workflow):** O Asaas NÃO manda mensagem para o WhatsApp. Ele faz um POST interno para o webhook de entrada do Workflow da Lady, enviando um payload de sistema (ex: `{"tipo_evento": "pagamento_aprovado", "valor": 500, "id_contato": 1234}`).
4. **Disparo Promocional (Lady):** O Workflow da Lady intercepta o evento, passa os dados para o nó de IA (com uma regra no Prompt ativando o modo proativo) e a Lady gera e envia a confirmação no WhatsApp seguindo as regras de ouro.

## 3. Próximos Passos e Validação Operacional (Com base no Workflow 06)

Eu acabei de analisar o seu **Workflow 06. Integração Asaas.json**. Agora consigo te dar a resposta exata de como devemos fazer.

No seu Workflow atual, quando o webhook do Asaas avisa que a cobrança foi paga (`PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`), ele já faz o seguinte:
1. Atualiza o status no seu Chatwoot.
2. Tem um Nó de Agente de IA (`Agente de notificação de pagamento`) rodando o prompt da "Clínica Moreira".
3. Busca os agendamentos no Google Calendar.
4. Usa o Cérebro da OpenAI + Memória Postgres.
5. Pega a resposta gerada e **envia diretamente para o Chatwoot** (Node "Enviar notificação" - linha 687).

### Respondendo à sua pergunta: Quem deve enviar a mensagem proativa?

**O melhor caminho para você, dado que o n8n já está montado assim, é usar o cenário Híbrido Prático:**

O **Workflow 06 (Asaas)** será o responsável por **ENVIAR** a mensagem proativa quando o pagamento cair de madrugada, MAS ele **não usará um prompt isolado** que perde a persona.

Vamos fazer o Workflow 06 usar a **mesma "alma"** da Lady Roots.

### Como fariamos isso no Workflow 06?

1. **Atualizar o Prompt no Workflow 06:** Nós vamos substituir aquele imenso prompt antigo da "Clínica Moreira" (que está no Node `Agente de notificação de pagamento`) pela versão nova e enxuta que criamos hoje no arquivo `Agente_Assas.md` (adaptado para a Pousada Lady Roots, com tom Beachy-Chic).
2. **Contexto sem quebrar a Memória:** Como o seu Workflow 06 usa o `MemoryPostgresChat` (Node "Memory") filtrado pelo número de telefone (`sessionKey: phone_number`), a memória é **compartilhada**. Ou seja, quando a IA do Asaas responder algo para o cliente, essa fala fica salva no banco de dados. Quando o cliente responder de volta ("obrigado!"), a mensagem vai pro Workflow Principal da Lady, e a Lady vai conseguir ler no banco de dados que o sistema Asaas acabou de dar o recibo para ele.
3. **Substituição da Tool:** O Workflow 06 tem uma Tool `Buscar agendamentos do contato` (Google Calendar). Você precisará garantir que essa tool no Asaas busque os dados da **reserva da Pousada** (checando as planilhas da Lady ou sistema de reservas), para que a mensagem vá com a data certa do check-in.
