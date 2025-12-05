import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { Agendamento, PopulatedAgendamento, Servico } from '../types';

// ⚠️ ATENÇÃO: Se estiver testando no Celular, troque localhost pelo IP da sua máquina
// Ex: http://192.168.15.10:5000/api
const BASE_URL = 'http://192.168.18.10:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token
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
export const getServicos = async (isAdmin: boolean = false): Promise<Servico[]> => {
  try {
    const response = await api.get('/servicos');
    const lista = Array.isArray(response.data) ? response.data : (response.data.data || []); 
    
    // Se for Admin, retorna tudo. Se for Cliente, só os ativos.
    if (isAdmin) {
        return lista;
    }
    
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

// --- HORÁRIOS / DISPONIBILIDADE ---

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

// --- AGENDAMENTOS ---

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

export const cancelAgendamento = async (id: string) => {
  try {
    const response = await api.put(`/agendamentos/${id}`, { status: 'cancelado' });
    return response.data;
  } catch (error: any) {
    throw new Error('Não foi possível cancelar o agendamento.');
  }
};

export const getMeusAgendamentos = async (clienteId: string): Promise<PopulatedAgendamento[]> => {
  try {
    // Passamos o ID na query string e deixamos o backend resolver se é UID ou ID
    const response = await api.get('/agendamentos', { params: { clienteId } });
    return response.data.data || [];
  } catch (error) {
    throw new Error('Não foi possível carregar seus agendamentos.');
  }
};

// --- USUÁRIOS & AUTH ---

export const registerUsuario = async (userData: any) => {
  try {
    const response = await api.post('/usuarios', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro ao criar conta.');
  }
};

// --- UPLOAD DE IMAGENS (SERVIÇO & AVATAR) ---
const uploadImage = async (url: string, method: 'POST' | 'PUT', keyName: string, imageUri: string | null, additionalData: any = {}) => {
  try {
    const formData = new FormData();

    // Adiciona dados extras
    Object.keys(additionalData).forEach(key => {
      // Só adiciona se tiver valor, para não sobrescrever com undefined
      if (additionalData[key] !== undefined && additionalData[key] !== null) {
          formData.append(key, additionalData[key].toString());
      }
    });

    // Se tiver imagem nova, anexa
    if (imageUri && !imageUri.startsWith('http')) { // Só envia se for URI local (nova), não URL remota (antiga)
      const filename = imageUri.split('/').pop() || 'upload.jpg';
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append(keyName, blob, filename);
      } else {
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        // @ts-ignore
        formData.append(keyName, { uri: imageUri, name: filename, type });
      }
    }

    const response = await (method === 'POST' ? api.post : api.put)(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  } catch (error: any) {
    console.error("Erro upload:", error);
    throw new Error(error.response?.data?.message || 'Falha no envio.');
  }
};

// --- CRIAÇÃO ---
export const createServico = async (data: { name: string; price: string; duracao: string; imageUri: string }) => {
  return uploadImage('/servicos/upload', 'POST', 'image', data.imageUri, {
    name: data.name,
    price: data.price,
    duracao: data.duracao,
    isActive: 'true'
  });
};

// Upload de Avatar
export const uploadUserAvatar = async (userId: string, imageUri: string) => {
  return uploadImage(`/usuarios/${userId}/avatar`, 'avatar', imageUri);
};

// --- ATUALIZAÇÃO COM IMAGEM ---
export const updateServico = async (id: string, data: Partial<Servico> & { imageUri?: string }) => {
  // Se vier imageUri do ImagePicker, mandamos via FormData.
  // Se não vier (null), mandamos os dados via JSON normal ou FormData sem arquivo (o backend trata).
  // Para simplificar, usamos sempre o uploadImage se tivermos que lidar com foto potencial.
  
  // Mas espera! Se for só texto (ex: toggle ativo/inativo), json é mais rápido.
  // Vamos verificar:
  if (data.imageUri && !data.imageUri.startsWith('http')) {
      // Tem foto nova -> FormData
      return uploadImage(`/servicos/${id}`, 'PUT', 'image', data.imageUri, {
          name: data.name,
          price: data.price,
          duracao: data.duracao,
          isActive: data.isActive
      });
  } else {
      // Não tem foto nova -> JSON Padrão
      try {
        const response = await api.put(`/servicos/${id}`, data);
        return response.data;
      } catch (error: any) {
        throw new Error('Erro ao atualizar serviço.');
      }
  }
};

export const deleteServico = async (id: string) => {
  try {
    await api.delete(`/servicos/${id}`);
  } catch (error: any) {
    throw new Error('Erro ao excluir serviço.');
  }
};