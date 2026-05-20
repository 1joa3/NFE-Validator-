import os
import xml.etree.ElementTree as ET
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil

app = FastAPI(title="NFe Validator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def ler_evento_nfe(caminho_xml):
    try:
        tree = ET.parse(caminho_xml)
        root = tree.getroot()
        
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        
        infEvento = root.find('.//nfe:evento/nfe:infEvento', ns)
        
        if infEvento is not None:
            chave = infEvento.find('nfe:chNFe', ns).text
            cnpj = infEvento.find('nfe:CNPJ', ns).text
            tipo_evento = infEvento.find('.//nfe:descEvento', ns).text
            status_nfe = "Cancelada" if tipo_evento and "Cancelamento" in tipo_evento else "Aprovada"
            
            return {
                "arquivo": os.path.basename(caminho_xml),
                "chave": chave,
                "cnpj": cnpj,
                "tipo_evento": tipo_evento,
                "status_nfe": status_nfe
            }
            
        chave_avulsa = root.find('.//nfe:chNFe', ns)
        if chave_avulsa is not None:
            cStat = root.find('.//nfe:cStat', ns)
            status_nfe = "Desconhecido"
            
            if cStat is not None:
                if cStat.text == '101' or cStat.text == '151':
                    status_nfe = "Cancelada"
                elif cStat.text == '100' or cStat.text == '150':
                    status_nfe = "Aprovada"
                else:
                    status_nfe = f"Outro (cStat: {cStat.text})"

            return {
                "arquivo": os.path.basename(caminho_xml),
                "chave": chave_avulsa.text, 
                "cnpj": "Não encontrado", 
                "tipo_evento": "N/A", 
                "status_nfe": status_nfe
            }

    except Exception as e:
        print(f"Erro ao ler o arquivo {os.path.basename(caminho_xml)}: {e}")
    return None

@app.post("/api/upload")
async def upload_notas(files: List[UploadFile] = File(...)):
    pasta_xmls = '/app/xmls'
    if not os.path.exists(pasta_xmls):
        pasta_xmls = 'notas'
    
    if not os.path.exists(pasta_xmls):
        os.makedirs(pasta_xmls)
        
    for file in files:
        if file.filename.endswith('.xml'):
            caminho_completo = os.path.join(pasta_xmls, file.filename)
            with open(caminho_completo, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
    return {"message": f"{len(files)} arquivos processados"}

@app.get("/api/notas")
def listar_notas():
    pasta_xmls = '/app/xmls'
    if not os.path.exists(pasta_xmls):
        pasta_xmls = 'notas'
        
    if not os.path.exists(pasta_xmls):
        return []

    resultados = []
    for arquivo in os.listdir(pasta_xmls):
        if arquivo.endswith('.xml'):
            caminho_completo = os.path.join(pasta_xmls, arquivo)
            dados = ler_evento_nfe(caminho_completo)
            if dados:
                resultados.append(dados)
                
    return resultados

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)