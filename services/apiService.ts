
import { ApiResponse, Evento } from '../types';

const API_BASE_URL = 'https://sheetdb.io/api/v1/l88b5jmk1k8ai';

export const apiService = {
  async autenticarUsuario(email: string, senha: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}?sheet=Usuarios`);
      if (!response.ok) throw new Error('Erro ao conectar com o banco de dados');
      
      const users = await response.json();
      const emailLimpo = email.trim().toLowerCase();
      const senhaLimpa = senha.trim();

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
      const response = await fetch(`${API_BASE_URL}?sheet=Calendario&cache=false`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.filter(item => item).map((item: any) => {
        const rawData = (item.Data || item.data || '').toString().trim();
        let dataFormatada = "";

        // Verifica se a data é um número (Serial Date do Excel/Google Sheets como 46069)
        if (!isNaN(Number(rawData)) && rawData !== '') {
          const serial = Number(rawData);
          // O Google Sheets conta os dias a partir de 30/12/1899
          const date = new Date(1899, 11, 30 + serial);
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          dataFormatada = `${d}/${m}`;
        } else {
          // Normalização robusta de data para strings como "30/04" ou "2026-04-30"
          const dataParts = rawData.split(/[-/]/);
          if (dataParts.length >= 2) {
            // Se for DD/MM/AAAA ou AAAA-MM-DD
            if (dataParts[0].length === 4) { // Formato ISO AAAA-MM-DD
              dataFormatada = `${dataParts[2].padStart(2, '0')}/${dataParts[1].padStart(2, '0')}`;
            } else { // Formato DD/MM/AAAA
              dataFormatada = `${dataParts[0].padStart(2, '0')}/${dataParts[1].padStart(2, '0')}`;
            }
          } else {
            dataFormatada = rawData;
          }
        }

        return {
          data: dataFormatada,
          cor: (item.Cor || item.cor || '').toString().trim(),
          legenda: (item.Legenda || item.legenda || '').toString().trim()
        };
      });
    } catch (e) {
      console.error("Erro ao buscar dados do calendário:", e);
      return [];
    }
  },

  async salvarLoteDatas(datasEEventos: { data: string; nome: string }[], cor: string): Promise<ApiResponse> {
    try {
      const rows = datasEEventos.map(item => ({
        Data: item.data, // Enviando como DD/MM string para tentar manter consistência
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
      return { status: 'sucesso', salvos: result.created || rows.length };
    } catch (e: any) {
      return { status: 'erro', mensagem: 'Erro ao salvar: ' + e.message };
    }
  }
};
