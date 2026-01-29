
import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!email || !senha) return alert("Preencha e-mail e senha");
    
    setLoading(true);
    
    if (isRegistering) {
      const res = await apiService.cadastrarUsuario(email, senha);
      setLoading(false);
      if (res.status === 'sucesso') {
        alert("Professor cadastrado com sucesso! Agora você pode entrar.");
        setIsRegistering(false);
      } else {
        alert(res.mensagem || "Erro ao cadastrar");
      }
    } else {
      const res = await apiService.autenticarUsuario(email, senha);
      setLoading(false);
      if (res.status === 'sucesso') {
        onLoginSuccess();
      } else {
        alert(res.mensagem || "Erro de login");
      }
    }
  };

  return (
    <div className="login-card text-center p-10 w-full max-w-[400px] animate-fade-in">
      <h1 className="text-2xl font-bold mb-2 tracking-tighter italic">Planejamento App</h1>
      <p className="text-[10px] text-[#1abc9c] font-black uppercase tracking-widest mb-8 opacity-70">
        {isRegistering ? 'Cadastro de Professor' : 'Acesso ao Sistema'}
      </p>

      <div className="space-y-4">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-MAIL" 
          className="input-field p-4 w-full text-sm shadow-inner" 
        />
        <input 
          type="password" 
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="SENHA" 
          className="input-field p-4 w-full text-sm shadow-inner" 
        />
      </div>

      <button 
        onClick={handleAction} 
        disabled={loading}
        className={`btn-entrar p-4 w-full mt-8 transition-all active:scale-95 shadow-xl ${loading ? 'opacity-50 grayscale' : 'hover:brightness-110'}`}
      >
        {loading ? 'PROCESSANDO...' : isRegistering ? 'CADASTRAR PROFESSOR' : 'ENTRAR'}
      </button>

      <div className="mt-6 pt-6 border-t border-white/5">
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-xs text-gray-400 hover:text-[#1abc9c] transition-colors font-bold uppercase tracking-widest"
        >
          {isRegistering ? 'Já tem conta? Faça Login' : 'Novo Professor? Cadastre-se aqui'}
        </button>
      </div>
    </div>
  );
};

export default Login;
