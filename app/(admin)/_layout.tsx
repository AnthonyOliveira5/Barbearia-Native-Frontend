import { Tabs } from 'expo-router';
import { CalendarDays, Scissors, UserCog, Users } from 'lucide-react-native';
import React from 'react';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#18181B', // Um preto mais claro/cinza chumbo para diferenciar do cliente
          borderTopWidth: 0,
          height: 60,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FACC15',
        tabBarInactiveTintColor: '#71717A',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <CalendarDays size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="servicos"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color }) => <Scissors size={24} color={color} />,
        }}
      />
            {/* ✅ NOVA ABA: CLIENTES */}
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipe"
        options={{
          title: 'Equipe',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <UserCog size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}