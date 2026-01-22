
import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) return alert("Preencha e-mail e senha");
    
    setLoading(true);
    const res = await apiService.autenticarUsuario(email, senha);
    setLoading(false);

    if (res.status === 'sucesso') {
      onLoginSuccess();
    } else {
      alert(res.mensagem || "Erro desconhecido");
    }
  };

  return (
    <div className="login-card text-center p-10 w-full max-w-[400px]">
      <h1 className="text-2xl font-bold mb-6">Planejamento App</h1>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-MAIL" 
        className="input-field p-3 w-full mb-4" 
      />
      <input 
        type="password" 
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="SENHA" 
        className="input-field p-3 w-full mb-6" 
      />
      <button 
        onClick={handleLogin} 
        disabled={loading}
        className={`btn-entrar p-3 w-full transition-opacity ${loading ? 'opacity-50' : 'hover:opacity-90'}`}
      >
        {loading ? 'AUTENTICANDO...' : 'ENTRAR'}
      </button>
    </div>
  );
};

export default Login;
