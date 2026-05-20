"use client";

import { useEffect, useState, useRef } from 'react';

interface NFe {
  arquivo: string;
  chave: string;
  cnpj: string;
  tipo_evento: string;
  status_nfe: string;
}

export default function Home() {
  const [notas, setNotas] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Aprovada': true,
    'Cancelada': true,
    'Desconhecido': true
  });

  const fetchNotas = () => {
    fetch('http://localhost:8000/api/notas')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar as notas');
        return res.json();
      })
      .then(data => {
        setNotas(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < event.target.files.length; i++) {
        formData.append('files', event.target.files[i]);
    }

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        fetchNotas();
      } else {
        alert("Erro ao enviar arquivos");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar arquivos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleGroup = (status: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  if (loading) {
    return (
      <main className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Carregando dados...</span>
        </div>
      </main>
    );
  }

  const filteredNotas = notas.filter(nota => {
    const term = searchTerm.toLowerCase();
    return (
      nota.arquivo.toLowerCase().includes(term) ||
      nota.chave.toLowerCase().includes(term) ||
      nota.cnpj.toLowerCase().includes(term) ||
      nota.tipo_evento?.toLowerCase().includes(term)
    );
  });

  const notasAgrupadas = filteredNotas.reduce((acc, nota) => {
    const status = nota.status_nfe || 'Outros';
    if (!acc[status]) acc[status] = [];
    acc[status].push(nota);
    return acc;
  }, {} as Record<string, NFe[]>);

  const ordensPrioridade: Record<string, number> = {
    'Aprovada': 1,
    'Cancelada': 2,
    'Desconhecido': 3
  };

  const statusKeys = Object.keys(notasAgrupadas).sort((a, b) => {
    const prioA = ordensPrioridade[a] || 99;
    const prioB = ordensPrioridade[b] || 99;
    return prioA - prioB;
  });

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>NFe Validator</h1>
          <p className="subtitle">Gestão de Notas Fiscais Eletrônicas</p>
        </div>
        
        <div className="actions-container">
          <div className="filter-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Buscar arquivo, chave ou CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="upload-container">
            <input 
              type="file" 
              multiple 
              accept=".xml" 
              onChange={handleFileUpload} 
              ref={fileInputRef}
              className="hidden-file-input" 
              id="file-upload"
            />
            <label htmlFor="file-upload" className={`upload-button ${uploading ? 'uploading' : ''}`}>
              {uploading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              )}
              {uploading ? 'Enviando...' : 'Adicionar XMLs'}
            </label>
          </div>
        </div>
      </header>
      
      {error && (
        <div className="error-state">
          <h2>Erro de Conexão</h2>
          <p>{error}</p>
        </div>
      )}

      {!error && notas.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{margin: '0 auto 1rem', opacity: 0.5}}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <p>Nenhuma nota encontrada.</p>
          <p style={{fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7}}>Clique em "Adicionar XMLs" para fazer upload.</p>
        </div>
      )}

      {!error && notas.length > 0 && filteredNotas.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma nota corresponde à busca.</p>
        </div>
      )}

      {!error && filteredNotas.length > 0 && (
        <div className="groups-container">
          {statusKeys.map((statusName) => {
            const notasDoGrupo = notasAgrupadas[statusName];
            const isExpanded = expandedGroups[statusName] ?? true;
            
            return (
              <div className="group-section" key={statusName}>
                <button 
                  className={`group-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleGroup(statusName)}
                >
                  <div className="group-header-left">
                    <svg className={`chevron ${isExpanded ? 'rotated' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <h2>{statusName}</h2>
                    <span className="badge-count">{notasDoGrupo.length}</span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="group-content">
                    <div className="table-container">
                      <table className="clean-table">
                        <thead>
                          <tr>
                            <th>Arquivo</th>
                            <th>CNPJ</th>
                            <th>Tipo de Evento</th>
                            <th>Chave</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notasDoGrupo.map((nota, nIndex) => (
                            <tr key={nIndex}>
                              <td className="cell-arquivo" title={nota.arquivo}>{nota.arquivo}</td>
                              <td>{nota.cnpj}</td>
                              <td>{nota.tipo_evento}</td>
                              <td className="cell-chave">{nota.chave}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
