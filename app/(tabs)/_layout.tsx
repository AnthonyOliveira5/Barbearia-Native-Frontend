import { Tabs } from 'expo-router';
import { CalendarClock, Home, User } from 'lucide-react-native';
import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Removemos o header padrão (já temos o nosso customizado)
        tabBarShowLabel: false, // Removemos o texto embaixo do ícone para ficar minimalista
        
        // Estilo da Barra
        tabBarStyle: {
          backgroundColor: '#09090B', // Zinc 950 (Preto quase absoluto)
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingTop: 10,
        },
        
        // Cores dos Ícones
        tabBarActiveTintColor: '#FACC15', // Amarelo quando selecionado
        tabBarInactiveTintColor: '#52525B', // Cinza quando inativo
      }}
    >
      {/* 1. Home (Início) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      {/* 2. Aba "Two" vira "Agendamentos" (Futura tela) */}
      <Tabs.Screen
        name="two" // Mantendo o nome do arquivo original por enquanto para não quebrar
        options={{
          title: 'Meus Agendamentos',
          tabBarIcon: ({ color }) => <CalendarClock size={24} color={color} />,
        }}
      />

      {/* 3. Perfil (Opcional, se você criar o arquivo perfil.tsx depois) */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          // Se o arquivo não existir ainda, o Expo vai ignorar ou dar warning, 
          // mas deixamos pronto a estrutura.
        }}
      />
    </Tabs>
  );
}