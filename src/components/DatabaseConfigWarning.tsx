import React from "react";

const DatabaseConfigWarning: React.FC = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
    <div style={{ background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      <h1 style={{ color: '#dc2626', fontSize: 28, marginBottom: 16 }}>Configuração do Banco de Dados ausente</h1>
      <p style={{ color: '#334155', fontSize: 18, marginBottom: 16 }}>
        As variáveis de ambiente <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b> não estão configuradas.<br />
        Por favor, crie um arquivo <b>.env</b> na raiz do projeto e defina essas variáveis com as credenciais do seu Supabase.
      </p>
      <pre style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 16 }}>
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
      </pre>
    </div>
  </div>
);

export default DatabaseConfigWarning;
