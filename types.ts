
export interface Evento {
  data: string; // Format: dd/MM
  cor: string;
  legenda: string;
}

export interface ApiResponse<T = any> {
  status: 'sucesso' | 'erro';
  mensagem?: string;
  salvos?: number;
  data?: T;
}

export interface LegendaItem {
  l: string;
  c: string;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  LESSON_PLAN_GENERATOR = 'LESSON_PLAN_GENERATOR'
}
