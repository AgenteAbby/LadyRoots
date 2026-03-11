# Arquitetura Roteador/Supervisor N8N

## Refatoração da Estrutura

Para suportar um fluxo escalável no n8n sem causar conflitos de ferramentas e prompts gigantes, separamos o fluxo `Atendente Lady` em 5 frentes distintas focadas nos domínios do negócio:

### 00_Main_Router
O fluxo mestre. Sua única responsabilidade é interceptar a mensagem (WhatsApp Trigger/Chatwoot), classificar a intenção do cliente usando um Switch/Router Agent e repassar o contexto (`userMessage`, `sessionId`, `phoneNumber`) para o Sub-workflow apropriado.
- `Atendente Lady.json` (Arquivo base atual)

### 01_Agente_Reserva
Especialista em fluxo de reservas. Tem acesso a ferramentas complexas de booking, agenda e cálculo de estadias.
- `atualizar_agenda.json`
- `calcular_estadia.json`
- `criar_reserva HQBeds.json`
- `criar_reserva.json`
- `verificar_vagas.json`
- **`Agente Reserva.json` [NOVO]**: Workflow que recebe os dados do Router e executa o Agente focado em Reservas.

### 02_Agente_Info
Especialista em tirar dúvidas gerais sobre as facilidades usando bases de conhecimento e site.
- `consultar_site.json`
- **`Agente Info.json` [NOVO]**: Workflow para responder FAQs.

### 03_Agente_Financeiro
Domínio restrito à parte financeira (geração de boletos, Asaas, etc). Apenas opera se a intenção do cliente for claramente voltada para pagamentos.
- `Integração Asaas.json`
- `gerar_cobranca.json`
- `enviar_documento.json`
- **`Agente Financeiro.json` [NOVO]**

### 04_Agente_Humano
Domínio de transbordo e notificação da equipe interna.
- `Escalar humano.json`

## Contrato de Dados (Payload In/Out)

Para a conexão via nó `Execute Workflow` funcionar perfeitamente:

**In (Router -> Sub-workflow via `Execute Workflow Trigger`)**:
- `telefone` (String) -> ex: Telefone do cliente para uso de memory session ID.
- `mensagem` (String) -> ex: A intenção e o prompt originado do cliente/transcrição.
- `id_conta` / `id_conversa` (String/Int) -> Identificadores necessários.

**Out (Sub-workflow -> Router)**:
- O Sub-workflow usará o próprio node `Execute Workflow Trigger` finalizando em um nó simples (ex: `Set`) que devolverá a string configurada. Como nos agentes n8n a última saída do agente já dita o retorno, a comunicação fica fluida.
