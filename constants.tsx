
import { LegendaItem } from './types';

export const CORES_MAPA: Record<string, string> = {
  'bg-red-600': '#dc2626',
  'bg-orange-500': '#f97316',
  'bg-teal-600': '#0d9488',
  'bg-purple-600': '#9333ea',
  'bg-slate-700': '#334155',
  'bg-green-400': '#4ade80',
  'bg-green-800': '#166534',
  'bg-black': '#000000',
  'bg-blue-800': '#1e40af',
  'bg-pink-600': '#db2777',
  'bg-gray-500': '#6b7280'
};

export const ITENS_LEGENDA: LegendaItem[] = [
  { l: 'FERIADO', c: 'bg-red-600' },
  { l: 'PONTO FACULTATIVO', c: 'bg-orange-500' },
  { l: 'ATIVIDADE AVALIATIVA - 1', c: 'bg-teal-600' },
  { l: 'ATIVIDADE AVALIATIVA 2', c: 'bg-purple-600' },
  { l: 'SEM ATIVIDADE', c: 'bg-slate-700' },
  { l: 'INÍCIO DO MÓDULO', c: 'bg-green-400' },
  { l: 'TÉRMINO DO MÓDULO', c: 'bg-green-800' },
  { l: 'RECESSO ESCOLAR', c: 'bg-black' },
  { l: 'FÉRIAS', c: 'bg-blue-800' },
  { l: 'SÁBADO LETIVO', c: 'bg-pink-600' },
  { l: 'OUTRAS ATIVIDADES', c: 'bg-gray-500' }
];

export const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];
