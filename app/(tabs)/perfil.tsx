// app/(tabs)/perfil.tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();

  return (
    <View className="flex-1 justify-center items-center p-8">
      <Text className="text-2xl mb-4">Olá, {user?.name}</Text>
      <Text className="text-lg mb-8">{user?.email}</Text>
      <Pressable
        className="w-full bg-red-500 p-4 rounded-lg items-center"
        onPress={signOut}
      >
        <Text className="text-white text-lg font-bold">Sair (Logout)</Text>
      </Pressable>
    </View>
  );
}