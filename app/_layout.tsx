// app/_layout.tsx
import { SplashScreen, Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Importação do CSS Global
import "../global.css";

// Impede o "splash" de sumir antes de decidirmos a rota
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!token) {
      router.replace('/(auth)/login');
    } else {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [token, loading, router]);

  /* ATUALIZAÇÃO AQUI:
    Agora definimos explicitamente as telas para poder configurar o Modal.
  */
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Grupos de Rotas Principais */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 2. Configuração da Tela de Agendamento como MODAL */}
      <Stack.Screen 
        name="agendar/[servicoId]" 
        options={{ 
          presentation: 'modal', // Faz a tela subir (slide up)
          headerShown: false,    // Remove o cabeçalho padrão (você já fez um customizado)
        }} 
      />

      {/* Opcional: Se a tela de horário for a continuação do modal, 
        você pode forçar ela a manter o estilo ou ser padrão.
      */}
      <Stack.Screen 
        name="agendar/horario" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}