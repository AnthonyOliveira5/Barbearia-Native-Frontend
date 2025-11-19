// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
// Use um pacote de ícones do Expo
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EAB308', // Tom de amarelo
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index" // Esta é a nossa tela de Home/Serviços
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="store" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos" // Vamos criar esta tela depois
        options={{
          title: 'Meus Agendamentos',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil" // E esta também
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}