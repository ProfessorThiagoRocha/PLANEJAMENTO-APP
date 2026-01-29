import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Importação corrigida para o SDK oficial
import { apiService } from '../services/apiService';
import { Evento } from '../types';

interface LessonPlanGeneratorProps {
  onVoltar: () => void;
}

declare const html2pdf: any;

const LessonPlanGenerator: React.FC<LessonPlanGeneratorProps> = ({ onVoltar }) => {
  const [tipo, setTipo] = useState('BIMESTRAL');
  const [professor, setProfessor] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [anoSerie, setAnoSerie] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [conteudos, setConteudos] = useState('');
  const [planoGerado, setPlanoGerado] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventosCalendario, setEventosCalendario] = useState<Evento[]>([]);

  const [gradeAulas, setGradeAulas] = useState<Record<string, number>>({
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
    'Sunday': 0
  });

  const tiposPlanos = ['SEMANAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];

  const diasOpcoes = [
    { id: 'Monday', label: 'Segunda', short: 'Seg' },
    { id: 'Tuesday', label: 'Terça', short: 'Ter' },
    { id: 'Wednesday', label: 'Quarta', short: 'Qua' },
    { id: 'Thursday', label: 'Quinta', short: 'Qui' },
    { id: 'Friday', label: 'Sexta', short: 'Sex' },
    { id: 'Saturday', label: 'Sábado', short: 'Sáb' },
    { id: 'Sunday', label: 'Domingo', short: 'Dom' },
  ];

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const data = await apiService.buscarDadosCalendario();
        setEventosCalendario(data);
      } catch (e) {
        console.error("Erro ao carregar calendário para a IA:", e);
      }
    };
    fetchEventos();
  }, []);

  const updateGrade = (dia: string, qtd: number) => {
    setGradeAulas(prev => ({ ...prev, [dia]: qtd }));
  };

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const gerarPlano = async () => {
    const temDiaSelecionado = Object.values(gradeAulas).some(qtd => (qtd as number) > 0);
    
    if (!professor || !disciplina || !dataInicio || !dataFim || !conteudos || !temDiaSelecionado) {
      alert("Atenção: Preencha Professor, Disciplina, Datas, Conteúdos e defina as aulas da semana.");
      return;
    }

    setLoading(true);
    setPlanoGerado('');

    try {
      // CORREÇÃO 1: Usando NEXT_PUBLIC para funcionar na Vercel
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      
      // CORREÇÃO 2: Usando o modelo correto (Gemini 1.5 Flash é o ideal para planos rápidos)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const resumoGrade = Object.entries(gradeAulas)
        .filter(([_, qtd]) => (qtd as number) > 0)
        .map(([dia, qtd]) => {
          const dLabel = diasOpcoes.find(o => o.id === dia)?.label;
          return `${dLabel} (${qtd} aulas)`;
        }).join(', ');

      const start = parseLocalDate(dataInicio);
      const end = parseLocalDate(dataFim);
      const yearStart = start.getFullYear();

      const eventosNoPeriodo = eventosCalendario.filter(ev => {
        const [d, m] = ev.data.split('/').map(Number);
        let anoEv = yearStart;
        let dataEv = new Date(anoEv, m - 1, d);
        if (dataEv < start && m === 1) dataEv = new Date(anoEv + 1, m - 1, d);
        return dataEv >= start && dataEv <= end;
      }).map(ev => `${ev.data}: ${ev.legenda}`).join(' | ');

      const prompt = `
        Aja como um Coordenador Pedagógico sênior. Gere um Planejamento ${tipo} DETALHADO.

        DADOS:
        Professor(a): ${professor}
        Disciplina: ${disciplina}
        Ano/Série: ${anoSerie}
        Período: ${dataInicio} a ${dataFim}
        Grade: ${resumoGrade}
        Conteúdos: ${conteudos}
        Eventos Calendário: ${eventosNoPeriodo || 'Nenhum.'}

        REGRAS IMPORTANTES:
        1. "INÍCIO DO MÓDULO" NÃO É FERIADO. É dia letivo normal.
        2. Liste TODAS as datas que têm aula conforme a Grade Semanal.
        3. Formato:
           DATA (em negrito)
           • Aula X: Título da Aula
             Tema: Descrição breve do assunto.
           ________________________________________

        Gere o plano agora.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setPlanoGerado(response.text());

    } catch (error) {
      console.error(error);
      alert("Erro ao gerar. Certifique-se de que a API KEY está configurada na Vercel.");
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Plano_${disciplina}_${anoSerie}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    const printContainer = document.createElement('div');
    printContainer.style.padding = "0";
    printContainer.style.color = "#000";
    printContainer.style.backgroundColor = "#fff";
    printContainer.style.fontFamily = "'Arial', sans-serif";
    printContainer.style.fontSize = "10pt";
    
    let htmlContent = planoGerado
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/________________________________________/g, '<hr style="border:none; border-top: 0.5pt solid #ccc; margin: 10pt 0;"/>')
      .split('\n')
      .map(line => {
        if (/^\d{1,2}\/\d{1,2}/.test(line.trim())) {
          return `<div style="margin-top:12pt; font-weight:bold; font-size:11pt; page-break-after: avoid;">${line}</div>`;
        }
        if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
          return `<div style="margin-left:15pt; margin-top:3pt; page-break-inside: avoid;">${line}</div>`;
        }
        if (line.trim().startsWith('Tema:')) {
          return `<div style="margin-left:25pt; font-size:9pt; color:#444; page-break-inside: avoid;">${line}</div>`;
        }
        return `<div style="page-break-inside: avoid;">${line}</div>`;
      })
      .join('');

    printContainer.innerHTML = `
      <div style="margin-bottom: 15pt; border-bottom: 2pt solid #0077cc; padding-bottom: 5pt;">
        <h1 style="margin: 0; font-size: 14pt; color: #0077cc;">Planejamento ${tipo} – ${disciplina} – ${anoSerie}</h1>
        <div style="margin-top: 3pt; font-size: 9pt;">
          <b>Professor:</b> ${professor} | <b>Datas:</b> ${dataInicio.split('-').reverse().join('/')} a ${dataFim.split('-').reverse().join('/')}
        </div>
      </div>
      <div style="line-height: 1.4;">
        ${htmlContent}
      </div>
    `;

    html2pdf().set(opt).from(printContainer).save();
  };

  return (
    <div className="w-full max-w-[1100px] flex flex-col gap-6 p-4 animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold italic tracking-tighter">Gerador de Planos</h1>
        <button onClick={onVoltar} className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-xl font-bold text-sm shadow-lg">VOLTAR</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#002e3b] p-8 rounded-[40px] shadow-2xl border border-white/5">
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div>
            <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Tipo de Plano</label>
            <select 
              className="input-field w-full p-4 mt-1 text-sm shadow-inner cursor-pointer"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tiposPlanos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Professor(a)</label>
            <input type="text" className="input-field w-full p-4 mt-1 text-sm" value={professor} onChange={(e) => setProfessor(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Disciplina</label>
              <input type="text" className="input-field w-full p-4 mt-1 text-sm" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Turma</label>
              <input type="text" className="input-field w-full p-4 mt-1 text-sm" value={anoSerie} onChange={(e) => setAnoSerie(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Início</label>
              <input type="date" className="input-field w-full p-4 mt-1 text-sm" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Término</label>
              <input type="date" className="input-field w-full p-4 mt-1 text-sm" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Grade Semanal (Aulas por Dia)</label>
          <div className="bg-black/30 p-6 rounded-3xl border border-white/5 space-y-3">
            {diasOpcoes.map(dia => (
              <div key={dia.id} className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">{dia.label}</span>
                <input 
                  type="number" min="0" className="input-field w-14 text-center p-2 text-sm font-bold"
                  value={gradeAulas[dia.id]}
                  onChange={(e) => updateGrade(dia.id, Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <label className="text-[10px] font-black text-[#1abc9c] uppercase tracking-widest ml-1">Ementa / Conteúdos</label>
          <textarea 
            className="input-field w-full p-5 mt-1 flex-grow font-sans text-xs resize-none shadow-inner custom-scrollbar"
            value={conteudos}
            onChange={(e) => setConteudos(e.target.value)}
            placeholder="Digite os temas..."
          />
          <button 
            onClick={gerarPlano} disabled={loading}
            className={`btn-entrar p-5 w-full text-lg shadow-2xl flex items-center justify-center gap-4 ${loading ? 'opacity-50 grayscale' : 'hover:brightness-110'}`}
          >
            {loading ? <div className="w-6 h-6 border-4 border-[#001a24] border-t-transparent rounded-full animate-spin"></div> : 'GERAR PLANO'}
          </button>
        </div>
      </div>

      {planoGerado && (
        <div className="bg-[#002e3b] p-10 rounded-[40px] shadow-2xl mt-10 border border-white/5 animate-fade-in">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <h2 className="text-2xl font-bold text-[#1abc9c]">Planejamento Gerado</h2>
            <button onClick={exportarPDF} className="bg-[#1e40af] hover:bg-blue-700 px-8 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all">SALVAR PDF</button>
          </div>
          <div className="bg-black/20 p-8 rounded-3xl border border-white/5 shadow-inner overflow-y-auto max-h-[800px] custom-scrollbar text-sm font-mono text-gray-200">
            {planoGerado.split('\n').map((line, i) => (
              <p key={i} className={`mb-1 whitespace-pre-wrap ${line.includes('________________') ? 'border-b border-white/10 my-4 pb-2' : ''}`}>
                {line.replace(/\*\*/g, '')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanGenerator;