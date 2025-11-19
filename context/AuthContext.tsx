// context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api'; // Nosso serviço de API da Parte 1

// Tipos de dados que seu backend retorna (ajuste conforme seu backend)
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'client';
}

interface AuthData {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (data: any) => Promise<void>; // 'any' para simplificar o cadastro
  signOut: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Cria o "Provedor" do contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para carregar o token do storage ao iniciar o app
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await AsyncStorage.getItem('@BarbeariaApp:token');
        const storedUser = await AsyncStorage.getItem('@BarbeariaApp:user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Atualiza o header da API para futuras requisições
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        }
      } catch (e) {
        console.error("Falha ao carregar dados do storage", e);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      // O documento (Fig 7) mostra uma chamada direta ao Firebase.
      // É MELHOR PRÁTICA ter seu backend MERN fazendo isso.
      // Vamos assumir que seu backend tem uma rota '/auth/login'
      const response = await api.post('/auth/login', {
        email: email,
        password: pass,
      });

      const { user, token }: AuthData = response.data;

      // Salva no estado
      setUser(user);
      setToken(token);

      // Atualiza o header da API
      api.defaults.headers.Authorization = `Bearer ${token}`;

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@BarbeariaApp:token', token);
      await AsyncStorage.setItem('@BarbeariaApp:user', JSON.stringify(user));

    } catch (error) {
      console.error("Erro no login:", error);
      throw new Error("Email ou senha inválidos.");
    }
  };

  const signUp = async (data: any) => {
    try {
      // Baseado na Fig 11 do seu doc, cadastro de cliente
      await api.post('/clientes', data);
      
      // Após cadastrar, faz o login automaticamente
      await signIn(data.email, data.senha);

    } catch (error) {
      console.error("Erro no cadastro:", error);
      throw new Error("Não foi possível criar a conta.");
    }
  };

  const signOut = async () => {
    await AsyncStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}