import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Agendamento, PopulatedAgendamento, Servico } from '../types';

// Ajuste o IP para o da sua máquina/rede local
const BASE_URL = 'http://192.168.18.10:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Adiciona o Token automaticamente em toda requisição
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@Barbearia:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Erro ao pegar token:", error);
  }
  return config;
});

export default api;

// --- SERVIÇOS ---
export const getServicos = async (): Promise<Servico[]> => {
  try {
    const response = await api.get('/servicos');
    const lista = Array.isArray(response.data) 
      ? response.data 
      : (response.data.data || []); 
    
    return lista.filter((s: Servico) => s.isActive);
  } catch (error) {
    throw new Error('Erro ao carregar serviços.');
  }
};

// --- BARBEIROS ---
export const getBarbeiros = async () => {
  try {
    const response = await api.get('/usuarios/barbeiros');
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

// --- DISPONIBILIDADE ---
export interface TimeSlot {
  time: string;
  available: boolean;
}

export const getHorariosDisponiveis = async (date: string, barberId: string): Promise<TimeSlot[]> => {
  try {
    const response = await api.get('/agendamentos/disponibilidade', {
      params: { data: date, barbeiroId: barberId }
    });
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

// --- CRIAÇÃO DE AGENDAMENTO ---
interface CreateAgendamentoPayload {
  cliente: string;
  usuario: string; 
  dataAgendamento: string;
  servicos: { servico: string; quantidade: number; }[];
}

export const createAgendamento = async (payload: CreateAgendamentoPayload): Promise<Agendamento> => {
  try {
    const response = await api.post('/agendamentos', payload);
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Erro no agendamento.';
    throw new Error(msg);
  }
};

// --- BUSCA DE AGENDAMENTOS (A CORREÇÃO PRINCIPAL) ---
export const getMeusAgendamentos = async (clienteId: string): Promise<PopulatedAgendamento[]> => {
  try {
    // Agora passamos o ID (seja Mongo ou Firebase UID) para o backend via Query Param.
    // O backend inteligente vai resolver quem é o usuário e devolver a lista certa.
    const response = await api.get('/agendamentos', {
      params: { clienteId }
    });
    
    // Retorna direto o array que veio do backend (já filtrado e ordenado)
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    throw new Error('Não foi possível carregar seus agendamentos.');
  }
};

// --- REGISTRO DE USUÁRIO ---
export const registerUsuario = async (userData: any) => {
  try {
    const response = await api.post('/usuarios', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro ao criar conta.');
  }
};