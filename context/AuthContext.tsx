import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

// Importa funções do Firebase
import { signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'client';
  firebase_uid: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadStorageData() {
      const storageUser = await AsyncStorage.getItem('@Barbearia:user');
      const storageToken = await AsyncStorage.getItem('@Barbearia:token');

      if (storageUser && storageToken) {
        // Restaura o token para as chamadas de API
        api.defaults.headers.Authorization = `Bearer ${storageToken}`;
        setUser(JSON.parse(storageUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn(email: string, pass: string) {
    try {
      // 1. Autentica no Firebase (verifica senha)
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken(); // Token JWT do Firebase

      // 2. Busca os dados no SEU Backend usando o UID
      // (Essa é a chamada para a função getUsuarioByFirebaseUid que você mostrou)
      const response = await api.get(`/usuarios/firebase/${firebaseUser.uid}`);

      if (!response.data.success) {
        throw new Error('Usuário não encontrado no sistema.');
      }

      const userData = response.data.data;

      // 3. Configura a sessão
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      await AsyncStorage.setItem('@Barbearia:user', JSON.stringify(userData));
      await AsyncStorage.setItem('@Barbearia:token', token);

      setUser(userData);
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error("Erro no login:", error);
      // Tratamento de erros comuns do Firebase
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Email ou senha incorretos.');
      }
      throw new Error('Erro ao acessar a conta. Verifique sua conexão.');
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth); // Desloga do Firebase
      await AsyncStorage.clear();  // Limpa dados locais
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}