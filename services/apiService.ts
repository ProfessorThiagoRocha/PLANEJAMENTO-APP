
import { ApiResponse, Evento } from '../types';

const API_BASE_URL = 'https://sheetdb.io/api/v1/l88b5jmk1k8ai';

export const apiService = {
  async autenticarUsuario(email: string, senha: string): Promise<ApiResponse> {
    try {
      // O SheetDB permite filtrar ou buscar na aba específica
      const response = await fetch(`${API_BASE_URL}?sheet=Usuarios`);
      if (!response.ok) throw new Error('Erro ao conectar com o banco de dados');
      
      const users = await response.json();
      const emailLimpo = email.trim().toLowerCase();
      const senhaLimpa = senha.trim();

      // Procura o usuário ignorando maiúsculas/minúsculas nas chaves caso variem
      const user = users.find((u: any) => {
        const uEmail = (u.Email || u.email || u['E-mail'] || '').toString().trim().toLowerCase();
        const uSenha = (u.Senha || u.senha || '').toString().trim();
        return uEmail === emailLimpo && uSenha === senhaLimpa;
      });
      
      if (user) {
        return { status: 'sucesso' };
      }
      return { status: 'erro', mensagem: 'E-mail ou senha incorretos' };
    } catch (e: any) {
      return { status: 'erro', mensagem: 'Erro na autenticação: ' + e.message };
    }
  },

  async buscarDadosCalendario(): Promise<Evento[]> {
    try {
      const response = await fetch(`${API_BASE_URL}?sheet=Calendario`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const data = await response.json();
      // Mapeia os campos da API (JSON) para a interface Evento
      // O SheetDB usa os nomes das colunas como chaves
      return data.map((item: any) => ({
        data: item.Data || item.data,
        cor: item.Cor || item.cor,
        legenda: item.Legenda || item.legenda
      }));
    } catch (e) {
      console.error("Erro ao buscar dados do calendário:", e);
      return [];
    }
  },

  async salvarLoteDatas(datasEEventos: { data: string; nome: string }[], cor: string): Promise<ApiResponse> {
    try {
      // Prepara os dados no formato esperado pelo SheetDB: { data: [ { Coluna: Valor }, ... ] }
      const rows = datasEEventos.map(item => ({
        Data: item.data,
        Cor: cor,
        Legenda: item.nome.toUpperCase()
      }));

      const response = await fetch(`${API_BASE_URL}?sheet=Calendario`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: rows })
      });

      if (!response.ok) throw new Error('Erro ao salvar no banco de dados');
      
      const result = await response.json();
      // SheetDB retorna { created: n } após um POST bem sucedido
      return { status: 'sucesso', salvos: result.created || rows.length };
    } catch (e: any) {
      return { status: 'erro', mensagem: 'Erro ao salvar: ' + e.message };
    }
  }
};
