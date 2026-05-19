FROM python:3.11-slim

WORKDIR /app

# Copia a lista de bibliotecas e instala no Python do container
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia apenas o script de execução (sem os XMLs, pois usaremos Volume)
COPY app.py ./

CMD ["python", "app.py"]