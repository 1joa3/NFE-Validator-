O sistema é composto por dois containers Docker principais: 

-Backend: FastAPI responsável por processar arquivos XML
-Frontend: Aplicação web para interface com usuário

Os containers se comunicam usando Docker Compose

O fluxo de dados começa quando um usuário envia um arquivo XML ao backend

O backend lê o arquivo e extrai informações relevantes como:

-Número da chave
-CNPJ do emissor
-Tipo de evento
-Status da NF-e

Essas informações são enviadas ao frontend através de uma chamada HTTP POST

O frontend recebe os dados e exibe ao usuário

É fundamental que ambos os containers tenham acesso aos mesmos arquivos XML

Isso é garantido pelo compartilhamento do diretório /app/xmls entre os containers
