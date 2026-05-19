import os
import xml.etree.ElementTree as ET

def ler_evento_nfe(caminho_xml):
    try:
        tree = ET.parse(caminho_xml)
        root = tree.getroot()
        
        # Define o namespace padrão que está no seu XML
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        
        # Busca as informações dentro do bloco <evento> -> <infEvento>
        infEvento = root.find('.//nfe:evento/nfe:infEvento', ns)
        
        if infEvento is not None:
            chave = infEvento.find('nfe:chNFe', ns).text
            cnpj = infEvento.find('nfe:CNPJ', ns).text
            tipo_evento = infEvento.find('.//nfe:descEvento', ns).text
            
            return {
                "chave": chave,
                "cnpj": cnpj,
                "tipo_evento": tipo_evento
            }
            
        # Caso seja um XML ligeiramente diferente, tenta buscar a chave solta
        chave_avulsa = root.find('.//nfe:chNFe', ns)
        if chave_avulsa is not None:
            return {"chave": chave_avulsa.text, "cnpj": "Não encontrado", "tipo_evento": "Desconhecido"}

    except Exception as e:
        print(f"Erro ao ler o arquivo {os.path.basename(caminho_xml)}: {e}")
    return None

def comparar_com_erp():
    pasta_xmls = '/app/xmls'
    
    print("--- INICIANDO VERIFICAÇÃO DE EVENTOS DE NF-e ---")
    
    if not os.path.exists(pasta_xmls) or not os.listdir(pasta_xmls):
        print("Nenhum arquivo XML encontrado na pasta compartilhada.")
        return

    for arquivo in os.listdir(pasta_xmls):
        if arquivo.endswith('.xml'):
            caminho_completo = os.path.join(pasta_xmls, arquivo)
            dados_evento = ler_evento_nfe(caminho_completo)
            
            if dados_evento:
                print(f"Arquivo: {arquivo}")
                print(f"  └─ Tipo: {dados_evento['tipo_evento']}")
                print(f"  └─ CNPJ Emitente: {dados_evento['cnpj']}")
                print(f"  └─ Chave NF-e: {dados_evento['chave']}")
                print(f"  [ERP] --> Buscando Chave {dados_evento['chave']} no banco do ERP...\n")
                
                # Aqui você fará a query no banco do seu ERP, algo como:
                # cursor.execute("SELECT id FROM notas_fiscais WHERE chave_acesso = %s", (dados_evento['chave'],))

if __name__ == "__main__":
    comparar_com_erp()