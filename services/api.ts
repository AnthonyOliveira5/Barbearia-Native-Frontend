import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native'; // Importante
import { PopulatedAgendamento, Servico } from '../types';
import { auth } from './firebase'; // Importa a instância do Firebase Auth

// ⚠️ Ajuste o IP conforme necessário
const BASE_URL = 'http://192.168.18.10:5000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// ✅ NOVO: Interceptor de Resposta Melhorado
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    // Se for erro 401 (Token inválido/expirado)
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada (401). Forçando logout...");
      
      try {
        // 1. Limpa token local
        await AsyncStorage.removeItem('@Barbearia:token');
        
        // 2. Força logout no Firebase (Isso dispara o onAuthStateChanged no Contexto)
        // Isso garante que o App redirecione para login automaticamente
        if (auth.currentUser) {
            await auth.signOut();
        }
      } catch (e) {
        console.error("Erro ao limpar sessão:", e);
      }
      
      // Retorna uma promessa pendente ou rejeitada para parar o fluxo da tela
      // Isso evita que a tela tente processar dados que nunca virão
      return Promise.reject(error); 
    }
    return Promise.reject(error);
  }
);

export default api;

// --- FUNÇÃO MÁGICA DE UPLOAD (WEB + MOBILE) ---
const uploadImage = async (url: string, method: 'POST' | 'PUT', keyName: string, imageUri: string | null, additionalData: any = {}) => {
  try {
    const formData = new FormData();

    // Adiciona campos de texto
    Object.keys(additionalData).forEach(key => {
      if (additionalData[key] !== undefined && additionalData[key] !== null) {
          formData.append(key, additionalData[key].toString());
      }
    });

    // Adiciona a imagem (Lógica Híbrida)
    if (imageUri && !imageUri.startsWith('http')) {
      const filename = imageUri.split('/').pop() || 'upload.jpg';
      
      if (Platform.OS === 'web') {
        // 🟢 WEB: Converte a URI para BLOB real
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append(keyName, blob, filename);
      } else {
        // 📱 MOBILE: Envia o objeto que o React Native espera
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        // @ts-ignore
        formData.append(keyName, { uri: imageUri, name: filename, type });
      }
    }

    // Envia
    const response = await (method === 'POST' ? api.post : api.put)(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Falha no envio.');
  }
};

// --- MÉTODOS DE SERVIÇO ---

export const createServico = async (data: { name: string; price: string; duracao: string; imageUri: string }) => {
  return uploadImage('/servicos/upload', 'POST', 'image', data.imageUri, {
    name: data.name,
    price: data.price,
    duracao: data.duracao,
    isActive: 'true'
  });
};

export const updateServico = async (id: string, data: Partial<Servico> & { imageUri?: string }) => {
  // Se tem imagem nova (local), usa uploadImage
  if (data.imageUri && !data.imageUri.startsWith('http')) {
      return uploadImage(`/servicos/${id}`, 'PUT', 'image', data.imageUri, {
          name: data.name,
          price: data.price,
          duracao: data.duracao,
          isActive: data.isActive
      });
  } else {
      // Se não tem imagem nova, manda JSON normal
      try {
        const response = await api.put(`/servicos/${id}`, data);
        return response.data;
      } catch (error: any) {
        throw new Error('Erro ao atualizar serviço.');
      }
  }
};

export const uploadUserAvatar = async (userId: string, imageUri: string) => {
  return uploadImage(`/usuarios/${userId}/avatar`, 'POST', 'avatar', imageUri);
};


// --- GETTERS & OUTROS (MANTIDOS IGUAIS) ---

export const getServicos = async (isAdmin: boolean = false): Promise<Servico[]> => {
  try {
    const response = await api.get('/servicos');
    const lista = Array.isArray(response.data) ? response.data : (response.data.data || []); 
    if (isAdmin) return lista;
    return lista.filter((s: Servico) => s.isActive);
  } catch (error) {
    throw new Error('Erro ao carregar serviços.');
  }
};

export const getBarbeiros = async () => {
  try {
    const response = await api.get('/usuarios/barbeiros');
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

export const getClientes = async () => {
  try {
    const response = await api.get('/usuarios', { params: { role: 'cliente' } });
    return response.data.data || [];
  } catch (error) {
    return [];
  }
};

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

export const createAgendamento = async (payload: any) => {
  try {
    const response = await api.post('/agendamentos', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro no agendamento.');
  }
};

export const cancelAgendamento = async (id: string) => {
  try {
    const response = await api.put(`/agendamentos/${id}`, { status: 'cancelado' });
    return response.data;
  } catch (error: any) {
    throw new Error('Não foi possível cancelar.');
  }
};

export const getMeusAgendamentos = async (clienteId: string): Promise<PopulatedAgendamento[]> => {
  try {
    const response = await api.get('/agendamentos', { params: { clienteId } });
    return response.data.data || [];
  } catch (error) {
    throw new Error('Erro ao carregar agendamentos.');
  }
};

export const getRelatorio = async (mes: number, ano: number) => {
  try {
    const response = await api.get('/agendamentos/relatorio', { params: { mes, ano } });
    return response.data.data;
  } catch (error) {
    throw new Error('Erro ao gerar relatório.');
  }
};

export const registerUsuario = async (userData: any) => {
  try {
    const response = await api.post('/usuarios', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro ao criar conta.');
  }
};

export const updateUsuario = async (id: string, data: any) => {
  try {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error('Erro ao atualizar usuário.');
  }
};

export const deleteUsuario = async (id: string) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error('Erro ao excluir usuário.');
  }
};

export const createClientByAdmin = async (userData: any) => {
  try {
    const response = await api.post('/admin/create-user', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Erro ao criar cliente.');
  }
};

export const deleteServico = async (id: string) => {
    try {
      await api.delete(`/servicos/${id}`);
    } catch (error: any) {
      throw new Error('Erro ao excluir serviço.');
    }
};