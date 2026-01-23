
import React, { useState, useEffect, useCallback } from 'react';
import { Evento, LegendaItem } from '../types';
import { apiService } from '../services/apiService';
import { ITENS_LEGENDA, CORES_MAPA, MESES } from '../constants';

interface CalendarViewProps {
  onVoltar: () => void;
}

declare const html2pdf: any;

const CalendarView: React.FC<CalendarViewProps> = ({ onVoltar }) => {
  const [modoAtual, setModoAtual] = useState<number>(12);
  const [mesInicial, setMesInicial] = useState<number>(0);
  const [anoAtual, setAnoAtual] = useState<number>(2026);
  const [eventos, setEventos] = useState<Evento[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [loteConfig, setLoteConfig] = useState<LegendaItem | null>(null);
  const [loteInput, setLoteInput] = useState('');

  const loadEventos = useCallback(async () => {
    const data = await apiService.buscarDadosCalendario();
    setEventos(data);
  }, []);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const handleSalvarLote = async () => {
    if (!loteConfig) return;
    const linhas = loteInput.split('\n').filter(l => l.trim());
    const dados: { data: string; nome: string }[] = [];
    
    linhas.forEach(lin => {
      // Regex que captura data dd/mm e o texto após qualquer separador comum
      const m = lin.match(/(\d{1,2})\/(\d{1,2})(?:\s*[-–—:]\s*(.*))?/i);
      if (m) {
        let df = `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}`;
        const textoExtra = (m[3] || '').trim().toUpperCase();
        
        // Se houver texto extra (ex: "Carnaval"), concatena com a categoria
        let n = textoExtra ? `${loteConfig.l} - ${textoExtra}` : loteConfig.l;
        dados.push({ data: df, nome: n });
      }
    });

    if (dados.length === 0) return alert("Nenhuma data válida encontrada. Use o formato: 16/02 - Nome do Evento");

    const res = await apiService.salvarLoteDatas(dados, loteConfig.c);
    if (res.status === 'sucesso') {
      alert(`Salvo com sucesso! ${res.salvos || dados.length} itens adicionados.`);
      loadEventos();
      fecharModal();
    } else {
      alert(res.mensagem || "Erro ao salvar");
    }
  };

  const abrirModal = (item: LegendaItem) => {
    setLoteConfig(item);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setLoteInput('');
    setLoteConfig(null);
  };

  const renderMonth = (mesIdxAbs: number) => {
    const mesIdx = mesIdxAbs % 12;
    const ano = anoAtual + Math.floor(mesIdxAbs / 12);
    const diasNoMes = new Date(ano, mesIdx + 1, 0).getDate();
    const primeiroDiaSemana = new Date(ano, mesIdx, 1).getDay();

    const dias = [];
    for (let x = 0; x < primeiroDiaSemana; x++) {
      dias.push(<div key={`spacer-${mesIdxAbs}-${x}`} className="w-full"></div>);
    }

    for (let d = 1; d <= diasNoMes; d++) {
      const dataId = `${String(d).padStart(2, '0')}/${String(mesIdx + 1).padStart(2, '0')}`;
      const diaSemana = new Date(ano, mesIdx, d).getDay();
      
      const eventosDia = eventos.filter(e => e.data.trim() === dataId);
      
      let cls = "dia transition-all ";
      let style: React.CSSProperties = {};
      
      if (eventosDia.length > 0) {
        // Usa a cor do primeiro evento como fundo
        const primeiroEvento = eventosDia[0];
        const corHex = CORES_MAPA[primeiroEvento.cor] || (primeiroEvento.cor.startsWith('#') ? primeiroEvento.cor : null);
        if (corHex) {
          style.backgroundColor = corHex;
          style.color = "white";
        } else {
          cls += `${primeiroEvento.cor} text-white `;
        }
      } else {
        if (diaSemana === 0) cls += "dia-domingo ";
        else if (diaSemana === 6) cls += "dia-sabado ";
      }

      dias.push(
        <div 
          key={`${mesIdxAbs}-${dataId}`} 
          className={cls} 
          style={style}
        >
          {d}
          {eventosDia.length > 0 && (
            <div className="custom-tooltip">
              {eventosDia.map((e, idx) => (
                <div key={idx} className={idx > 0 ? "border-t border-white/20 mt-2 pt-2" : ""}>
                  <div className="text-[10px] text-[#1abc9c] font-black uppercase mb-1">
                    {eventosDia.length > 1 ? `Evento ${idx + 1}` : 'Informação'}
                  </div>
                  {e.legenda}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={`mes-cont-${mesIdxAbs}`} className="mes-container">
        <h3 className="text-center font-bold mb-3 text-teal-400 text-sm tracking-widest">
          {MESES[mesIdx]} {ano}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-[9px] text-center opacity-50 mb-1">
          <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias}
        </div>
      </div>
    );
  };

  const exportarPDF = async () => {
    const container = document.createElement('div');
    container.style.width = "210mm";
    container.style.padding = "10mm 5mm";
    container.style.background = "white";
    container.style.color = "black";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.fontSize = "9pt";

    const eventosPorMes = Array(12).fill(null).map(() => [] as Evento[]);
    eventos.forEach(e => {
      const mes = parseInt(e.data.split('/')[1]) - 1;
      if (mes >= 0 && mes < 12) eventosPorMes[mes].push(e);
    });

    const legendaHTML = `
      <div style="margin-top:12mm; border:1px solid #000; padding:4mm 5mm; font-size:8pt; background:#f9f9f9; page-break-inside:avoid;">
          <div style="font-weight:bold; margin-bottom:2mm; text-align:center;">LEGENDA</div>
          <div style="column-count:2; column-gap:12mm;">
              ${ITENS_LEGENDA.map(i => `
                  <div style="margin-bottom:1.5mm; break-inside:avoid;">
                      <span style="display:inline-block; width:9mm; height:9mm; background:${CORES_MAPA[i.c] || i.c}; border-radius:50%; vertical-align:middle; margin-right:3mm;"></span>
                      ${i.l}
                  </div>
              `).join('')}
          </div>
      </div>`;

    const renderMesPdf = (idx: number) => {
      let dMes = new Date(anoAtual, idx + 1, 0).getDate(); 
      let pSem = new Date(anoAtual, idx, 1).getDay();

      let h = `<div style="width:60mm; display:inline-block; vertical-align:top; margin:0 2mm 6mm 2mm; page-break-inside:avoid;">
          <div style="text-align:center; font-weight:bold; background:#f0f0f0; padding:2mm; border:1px solid #000; font-size:10pt;">${MESES[idx]} ${anoAtual}</div>
          <table style="width:100%; border-collapse:collapse; text-align:center; font-size:8pt;">
          <tr>
              <th style="border:1px solid #000; padding:1mm;">D</th>
              <th style="border:1px solid #000; padding:1mm;">S</th>
              <th style="border:1px solid #000; padding:1mm;">T</th>
              <th style="border:1px solid #000; padding:1mm;">Q</th>
              <th style="border:1px solid #000; padding:1mm;">Q</th>
              <th style="border:1px solid #000; padding:1mm;">S</th>
              <th style="border:1px solid #000; padding:1mm;">S</th>
          </tr><tr>`;

      for(let x = 0; x < pSem; x++) h += `<td style="border:1px solid #000; height:6mm;"></td>`;

      let contadorCol = pSem;
      for(let d = 1; d <= dMes; d++) {
          if (contadorCol % 7 === 0 && d !== 1) h += `</tr><tr>`;
          let df = `${String(d).padStart(2,'0')}/${String(idx+1).padStart(2,'0')}`;
          let ds = new Date(anoAtual, idx, d).getDay();
          let evs = eventosPorMes[idx].filter(ev => ev.data.trim() === df);
          
          let bg = evs.length > 0 ? (CORES_MAPA[evs[0].cor] || evs[0].cor) : (ds===0) ? "#a3e635" : (ds===6) ? "#facc15" : "#ffffff";
          let co = evs.length > 0 ? "#ffffff" : (ds===0 || ds===6) ? "#000000" : "#000000";
          
          h += `<td style="border:1px solid #000; padding:1mm; background:${bg}; color:${co}; font-weight:bold; height:6mm;">${d}</td>`;
          contadorCol++;
      }
      while (contadorCol % 7 !== 0) {
          h += `<td style="border:1px solid #000; height:6mm;"></td>`;
          contadorCol++;
      }
      h += `</tr></table>
          <div style="font-size:7pt; padding:2mm 1mm; text-align:left; line-height:1.3;">
              ${eventosPorMes[idx].map(e => `<div style="margin-bottom:1mm;"><b>${e.data}</b> – ${e.legenda}</div>`).join('')}
          </div>
      </div>`;
      return h;
    };

    let html = `
      <h1 style="text-align:center; margin:0 0 8mm 0; font-size:14pt;">CALENDÁRIO LETIVO ${anoAtual}</h1>
      <div style="text-align:center; line-height:1.2;">`;

    for(let i = 0; i < 6; i++) html += renderMesPdf(i);
    html += `</div>${legendaHTML}<div style="page-break-before:always;"></div>`;
    
    html += `
      <h1 style="text-align:center; margin:15mm 0 8mm 0; font-size:14pt;">CALENDÁRIO LETIVO ${anoAtual} (continuação)</h1>
      <div style="text-align:center; line-height:1.2;">`;

    for(let i = 6; i < 12; i++) html += renderMesPdf(i);
    html += `</div>${legendaHTML}`;

    container.innerHTML = html;

    const opt = {
        margin: 0,
        filename: `Calendario_${anoAtual}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(container).save();
  };

  return (
    <div className="w-full max-w-[1200px] flex flex-col items-start mt-4 animate-fade-in">
      <div className="w-full flex flex-wrap justify-between items-center mb-6 gap-4 px-2">
        <h1 className="text-3xl font-bold">Calendário</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {[1, 3, 6, 12].map(n => (
              <button 
                key={n}
                className={`modo-btn ${modoAtual === n ? 'active' : ''}`}
                onClick={() => setModoAtual(n)}
              >
                {n === 12 ? 'Ano Completo' : `${n} Mês${n > 1 ? 'es' : ''}`}
              </button>
            ))}
          </div>
          <select 
            className="input-field w-40 text-sm p-2" 
            value={mesInicial}
            onChange={(e) => setMesInicial(parseInt(e.target.value))}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <input 
            type="number" 
            value={anoAtual}
            onChange={(e) => setAnoAtual(parseInt(e.target.value) || 2026)}
            min="2000" max="2100" 
            className="input-field w-24 text-sm p-2"
          />
          <button onClick={exportarPDF} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-bold text-sm transition-colors">
            EXPORTAR PDF
          </button>
          <button onClick={onVoltar} className="bg-gray-700 hover:bg-gray-800 px-5 py-2 rounded-lg font-bold text-sm transition-colors">
            VOLTAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {Array.from({ length: modoAtual }).map((_, i) => renderMonth(mesInicial + i))}
      </div>

      <div className="mt-8 bg-black/30 p-6 rounded-2xl border border-white/10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ITENS_LEGENDA.map(item => (
            <div 
              key={item.l} 
              onClick={() => abrirModal(item)} 
              className="legenda-item hover:scale-105 transition-transform"
            >
              <div className={`w-3 h-3 ${item.c} rounded-full`}></div> {item.l}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="login-card w-full max-w-[450px] p-8">
            <h2 className="text-lg font-bold mb-4 text-[#1abc9c]">
              {loteConfig?.l}
            </h2>
            <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-tighter">
              Formato: 16/02 - Nome do Evento (Opcional)
            </p>
            <textarea 
              value={loteInput}
              onChange={(e) => setLoteInput(e.target.value)}
              rows={6} 
              className="input-field text-sm font-mono w-full p-4 custom-scrollbar" 
              placeholder="Ex:&#10;16/02 - Carnaval&#10;18/02 - Quarta-feira de Cinzas"
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleSalvarLote} 
                className="btn-entrar flex-1 p-2 shadow-lg active:scale-95 transition-transform"
              >
                SALVAR NO CALENDÁRIO
              </button>
              <button 
                onClick={fecharModal} 
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
