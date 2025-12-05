import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import "../global.css";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth(); 
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    
    // ✅ NOVA VERIFICAÇÃO: Verifica se está na rota de agendamento
    const inAgendarRoute = segments[0] === 'agendar'; 

    console.log("--- DEBUG ROTA ---");
    console.log("User:", user ? `${user.name} (${user.role})` : "NULL");
    console.log("Segmento:", segments[0]);

    if (!user) {
      // Se não tem usuário e não está no login/registro, manda pro login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      const isBarberOrAdmin = user.role === 'barbeiro' || user.role === 'admin';

      if (isBarberOrAdmin) {
        // Barbeiro deve ficar no Admin (ou agendar se precisar testar)
        if (!inAdminGroup && !inAgendarRoute) {
          router.replace('/(admin)/dashboard');
        }
      } else {
        // Lógica do Cliente:
        // Pode estar nas abas (Home/Perfil) OU na tela de Agendar
        if (!inTabsGroup && !inAgendarRoute) {
          console.log("Cliente fora de área permitida. Redirecionando...");
          router.replace('/(tabs)');
        }
      }
    }

    if (!loading) {
      SplashScreen.hideAsync();
    }

  }, [loading, user, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      
      {/* A tela de agendar fica na raiz, fora dos grupos protegidos */}
      <Stack.Screen 
        name="agendar/[servicoId]" 
        options={{ presentation: 'modal', headerShown: false }} 
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