import requests
import urllib.parse # Serve para arrumar nomes com espaços (Ex: João Silva)

# --- CONFIGURAÇÕES ---
URL = "https://zfryhzmujfaqqzybjuhb.supabase.co" 
KEY = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo"
# ---------------------

def apagar_individual():
    print("🎯 MODO DE EXCLUSÃO INDIVIDUAL")
    print("-" * 30)
    
    # 1. Pergunta o nome
    nome_alvo = input("Digite o NOME EXATO do aluno que quer excluir: ")
    
    if nome_alvo == "":
        print("❌ Nome vazio. Operação cancelada.")
        return

    # Arruma o nome para pode viajar pela internet (troca espaço por %20, etc)
    nome_formatado = urllib.parse.quote(nome_alvo)

    # 2. Verifica se o aluno existe antes de tentar apagar
    endpoint_busca = f"{URL}/rest/v1/students?name=eq.{nome_formatado}"
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json"
    }

    try:
        # Busca o aluno
        resposta = requests.get(endpoint_busca, headers=headers)
        alunos_encontrados = resposta.json()

        if len(alunos_encontrados) == 0:
            print(f"❌ Não encontrei ninguém com o nome '{nome_alvo}'. Verifique a grafia.")
            return
        
        print(f"✅ Encontrei: {alunos_encontrados[0]['name']} (Turma {alunos_encontrados[0]['class_id']})")
        
        # 3. Confirmação Final
        confirmacao = input("Tem certeza que quer apagar este aluno? (S/N): ")
        
        if confirmacao.lower() == 's':
            # Manda apagar
            requests.delete(endpoint_busca, headers=headers)
            print(f"🗑️  Tchau! O aluno '{nome_alvo}' foi apagado do sistema.")
        else:
            print("Escapou por pouco! Nada foi apagado.")

    except Exception as e:
        print(f"❌ Erro de conexão: {e}")

if __name__ == "__main__":
    apagar_individual()