// app/_layout.tsx
import { SplashScreen, Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Importação do CSS Global (corrigida para 1 nível)
import "../global.css";

// Impede o "splash" de sumir antes de decidirmos a rota
SplashScreen.preventAutoHideAsync();

/* Este componente decide qual rota mostrar 
  (Login ou Home) baseado no token
*/
function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Se estiver carregando o token, não faz nada (splash está ativa)
      return;
    }

    if (!token) {
      // Se não tem token, manda pro login
      router.replace('/(auth)/login');
    } else {
      // Se tem token, manda pra home (dentro das tabs)
      router.replace('/(tabs)');
    }

    // Esconde a splash screen
    SplashScreen.hideAsync();

  }, [token, loading, router]);

  /*
    Este é o Stack principal. O Expo Router vai renderizar
    o grupo (auth) OU o grupo (tabs) aqui dentro,
    automaticamente, baseado no redirect que fizemos acima.
    
    Note que NÃO definimos <Stack.Screen> aqui.
  */
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

// O layout raiz que envolve tudo no AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}