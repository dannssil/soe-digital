import pandas as pd
import requests
import json

# --- SUAS CONFIGURAÇÕES (PEGUE NO ARQUIVO .env) ---
URL = "https://zfryhzmujfaqqzybjuhb.supabase.co"  # Ex: https://...supabase.co
KEY = "sb_publishable_oJqCCMfnBlbQWGMP4Wj3rQ_YqogatOo" # Ex: eyJhbG...

# --- FIM DAS CONFIGURAÇÕES ---

def enviar_via_api():
    print("📂 Lendo planilha...")
    try:
        # Lê o Excel
        df = pd.read_excel("notas_importacao.xlsx") # Ou "notas_importacao.xlsx", verifique o nome!
        df = df.fillna("")
    except Exception as e:
        print(f"❌ Erro ao abrir Excel: {e}")
        return

    print(f"🚀 Preparando envio de {len(df)} alunos via API REST...")

    # Endereço específico para salvar na tabela 'students'
    endpoint = f"{URL}/rest/v1/students"
    
    # As 'chaves' para abrir a porta do banco
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" # Faz o envio ser mais rápido
    }

    sucessos = 0

    for i, linha in df.iterrows():
        # Monta os dados do aluno
        dados = {
            "name": linha['Nome'],
            "class_id": str(linha['Turma']),
            "grades": str(linha['Nota']),
            "absences": int(linha['Faltas']) if linha['Faltas'] != "" else 0,
            "performance": linha['Rendimento']
        }

        try:
            # Envia usando REQUESTS (Maneira leve)
            response = requests.post(endpoint, json=dados, headers=headers)
            
            # Código 201 significa "Criado com sucesso"
            if response.status_code == 201:
                print(f"✅ Sucesso: {dados['name']}")
                sucessos += 1
            else:
                print(f"⚠️ Erro ao enviar {dados['name']}: {response.text}")
                
        except Exception as e:
            print(f"❌ Erro de conexão: {e}")

    print("="*30)
    print(f"🏁 Finalizado! {sucessos} alunos enviados.")

if __name__ == "__main__":
    enviar_via_api()