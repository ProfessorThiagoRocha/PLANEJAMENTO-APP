
import React from 'react';

interface DashboardProps {
  onSair: () => void;
  onAbrirCalendario: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSair, onAbrirCalendario }) => {
  return (
    <div className="w-full max-w-[800px] text-center">
      <div className="flex justify-between items-center mb-10 px-4">
        <h1 className="text-4xl font-bold italic">Planejamento App</h1>
        <button onClick={onSair} className="btn-sair">SAIR</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div 
          className="btn-dash bg-[#004d40]" 
          onClick={onAbrirCalendario}
        >
          MEU CALENDÁRIO ESCOLAR
        </div>
        <div 
          className="btn-dash bg-[#a30000]" 
          onClick={() => alert("Funcionalidade em desenvolvimento")}
        >
          GERADOR DE PLANO DE AULA
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
