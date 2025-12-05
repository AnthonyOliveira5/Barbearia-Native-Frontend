import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { signOut as firebaseSignOut, onIdTokenChanged, signInWithEmailAndPassword } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

import api from '../services/api'; // Sua instância do Axios
import { auth } from '../services/firebase'; // Verifique o caminho do seu firebaseConfig

// Definição do Tipo de Usuário
export interface User {
  _id: string;
  name: string;
  email: string;
  telefone?: string;
  role: 'admin' | 'barbeiro' | 'cliente';
  avatar?: string;
  firebase_uid: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void; // Para atualizar o perfil localmente
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 🔥 O SEGREDO ESTÁ AQUI: onIdTokenChanged
    // Esse listener dispara quando:
    // 1. O usuário faz login.
    // 2. O usuário faz logout.
    // 3. O token é renovado automaticamente pelo Firebase (a cada 1h).
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // 1. Pegar o Token Fresquinho
          const newToken = await firebaseUser.getIdToken();
          
          // 2. Salvar para o api.ts usar
          await AsyncStorage.setItem('@Barbearia:token', newToken);
          setToken(newToken);

          // 3. Buscar dados no MongoDB (Só se não tiver user ou se o token mudou)
          // Isso garante que pegamos a role correta
          try {
            // Nota: Se a rota for diferente, ajuste aqui.
            // Usamos o UID para buscar o usuário no seu backend
            const response = await api.get(`/usuarios/firebase/${firebaseUser.uid}`);
            
            if (response.data && response.data.data) {
              setUser(response.data.data);
            } else {
              // Se não achou no banco, pode ser um usuário novo ou erro de sincronia
              console.warn("Usuário autenticado no Firebase mas não encontrado no MongoDB.");
            }
          } catch (dbError) {
            console.error("Erro ao buscar dados do usuário no MongoDB:", dbError);
            // Não deslogamos aqui para não travar o app se o backend oscilar,
            // mas o user ficará desatualizado.
          }

        } else {
          // Usuário deslogou
          await AsyncStorage.removeItem('@Barbearia:token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Erro no listener de Auth:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // O listener acima vai capturar o login e fazer o resto (buscar no banco, setar token)
    } catch (error: any) {
      console.error("Erro no login:", error);
      let msg = "Não foi possível entrar.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (error.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (error.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (error.code === 'auth/invalid-credential') msg = "Credenciais inválidas.";
      throw new Error(msg);
    }
  };

const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // O listener onIdTokenChanged vai limpar o AsyncStorage e o setUser(null) automaticamente
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
};

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}