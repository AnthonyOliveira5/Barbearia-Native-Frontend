// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Agendamento, PopulatedAgendamento, Servico } from '../types';

// Use o IP da sua máquina local se estiver testando no celular.
// Se estiver no emulador/web, 'localhost' funciona.
// A porta 5000 foi baseada nos exemplos do seu documento [cite: 363, 398]
const BASE_URL = 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Isso é um "Interceptor". Ele vai anexar automaticamente o token
// de autenticação em CADA requisição que fizermos,
// o que é essencial para suas rotas protegidas[cite: 254].
api.interceptors.request.use(
  async (config) => {
    // Pega o token salvo no AsyncStorage 
    const token = await AsyncStorage.getItem('userToken'); 
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const getServicos = async (): Promise<Servico[]> => {
  try {
    const response = await api.get('/servicos');
    // Filtramos aqui, mas o ideal é o backend já mandar só os ativos
    return response.data.filter((servico: Servico) => servico.isActive);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    throw new Error('Não foi possível carregar os serviços.');
  }
};

export const createAgendamento = async (
  clienteId: string,
  servicoId: string,
  dataAgendamento: string
): Promise<Agendamento> => {
  try {
    // A Figura 13 do seu doc tinha um ID de 'usuario' (barbeiro)
    // Como não temos seleção de barbeiro, vamos usar um ID fixo
    // que estava no seu exemplo:
    const barberIdFixo = "681c145bb825e2d3ae87bdb2";

    const payload = {
      cliente: clienteId,
      usuario: barberIdFixo,
      dataAgendamento: dataAgendamento, // Deve ser uma data ISO
      servicos: [
        {
          servico: servicoId,
          quantidade: 1,
        },
      ],
    };

    const response = await api.post('/agendamentos', payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    throw new Error('Não foi possível confirmar seu agendamento.');
  }
};

/**
 * Busca os agendamentos filtrados por cliente
 * Baseado na rota GET /agendamentos/filtrados
 */
export const getMeusAgendamentos = async (
  clienteId: string
): Promise<PopulatedAgendamento[]> => {
  try {
    // A rota do doc (Fig 6) também filtra por data.
    // Como queremos "todos", vamos enviar datas bem abertas.
    const dataInicio = '2000-01-01';
    const dataFim = '2100-01-01';

    const response = await api.get('/agendamentos/filtrados', {
      params: {
        clienteId,
        dataInicio,
        dataFim,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw new Error('Não foi possível carregar seus agendamentos.');
  }
};