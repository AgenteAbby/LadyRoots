import json
import os

filepath = r'd:\Apps\DEV\Lady Roots_V1\Workflows\01_Agente_Reserva\Agente Reserva (2).json'

print("Loading", filepath)
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    ntype = node.get('type')
    nname = node.get('name')
    if ntype == '@n8n/n8n-nodes-langchain.toolWorkflow':
        print(f"Found tool node: {nname}")
        params = node.setdefault('parameters', {})
        inputs = params.setdefault('workflowInputs', {})
        
        inputs['mappingMode'] = 'defineBelow'
        
        if nname == 'verificar_vagas':
            print('Patching verificar_vagas')
            inputs['value'] = {
                'acao': "={{$fromAI('acao', 'Ação a ser executada, use consultar', 'string')}}",
                'data_inicio': "={{$fromAI('data_inicio', 'Data de início no formato DD/MM/YYYY', 'string')}}",
                'data_fim': "={{$fromAI('data_fim', 'Data de fim no formato DD/MM/YYYY', 'string')}}",
                'suite': "={{$fromAI('suite', 'Nome da suíte opcional', 'string')}}"
            }
            inputs['schema'] = [
                {'id': k, 'displayName': k, 'required': True, 'type': 'string', 'display': True, 'canBeUsedToMatch': True, 'defaultMatch': False} for k in inputs['value'].keys()
            ]
        elif nname == 'calcular_estadia':
            print('Patching calcular_estadia')
            inputs['value'] = {
                'tipo_calculo': "={{$fromAI('tipo_calculo', 'Deve ser hospedagem ou passeio', 'string')}}",
                'mes': "={{$fromAI('mes', 'Mês da estadia', 'string')}}",
                'dias_fds': "={{$fromAI('dias_fds', 'Dias no fim de semana', 'number')}}",
                'dias_semana': "={{$fromAI('dias_semana', 'Dias na semana', 'number')}}",
                'adultos': "={{$fromAI('adultos', 'Quantidade de adultos', 'number')}}",
                'idades_criancas': "={{$fromAI('idades_criancas', 'Idades das crianças, se houver (ex: 5,10)', 'string')}}",
                'prime_gourmet': "={{$fromAI('prime_gourmet', 'True se cliente disse ter Prime Gourmet', 'boolean')}}",
                'passeio_alvo': "={{$fromAI('passeio_alvo', 'Nome do passeio alvo (só para passeios)', 'string')}}"
            }
            inputs['schema'] = [
                {'id': k, 'displayName': k, 'required': False, 'type': 'string', 'display': True, 'canBeUsedToMatch': True, 'defaultMatch': False} for k in inputs['value'].keys()
            ]
        elif nname == 'criar_reserva_hqbeds':
            print('Patching criar_reserva_hqbeds')
            inputs['value'] = {
                'data_inicio': "={{$fromAI('data_inicio', 'Data de checkin DD/MM/YYYY', 'string')}}",
                'data_fim': "={{$fromAI('data_fim', 'Data de checkout DD/MM/YYYY', 'string')}}",
                'nome_cliente': "={{$fromAI('nome_cliente', 'Nome do cliente completo', 'string')}}",
                'telefone_cliente': "={{$fromAI('telefone_cliente', 'Telefone do cliente com DDI e DDD', 'string')}}",
                'id_quarto': "={{$fromAI('id_quarto', 'ID numérico do quarto escolhido', 'string')}}",
                'token_serializado': "={{$fromAI('token_serializado', 'Token devolvido pela pesquisa de vagas', 'string')}}",
                'valor_total': "={{$fromAI('valor_total', 'Valor total a ser cobrado', 'number')}}"
            }
            inputs['schema'] = [
                {'id': k, 'displayName': k, 'required': True, 'type': 'string', 'display': True, 'canBeUsedToMatch': True, 'defaultMatch': False} for k in inputs['value'].keys()
            ]

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Done.')
