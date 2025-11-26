// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getServicos } from '../../services/api';
import { Servico } from '../../types';

// Componente para renderizar cada item da lista
const ServicoCard: React.FC<{ item: Servico }> = ({ item }) => {
  const router = useRouter();

  const handlePress = () => {
    // Navega para o fluxo de agendamento, passando o ID do serviço
    router.push(`/agendar/${item._id}`);
  };

  return (
    <View className="bg-white p-6 m-4 rounded-lg shadow-md">
      <Text className="text-2xl font-bold mb-2">{item.name}</Text>
      <Text className="text-lg text-gray-700 mb-1">Preço: R$ {item.price}</Text>
      <Text className="text-lg text-gray-700 mb-4">Duração: {item.duracao} min</Text>
      
      <Pressable
        className="bg-yellow-500 p-3 rounded-lg items-center"
        onPress={handlePress}
      >
        <Text className="text-white text-lg font-bold">Agendar Agora</Text>
      </Pressable>
    </View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const carregarServicos = async () => {
      try {
        setLoading(true);
        const data = await getServicos();
        setServicos(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    carregarServicos();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 pt-8">
        <Text className="text-3xl font-bold">Seja bem-vindo,</Text>
        <Text className="text-2xl text-gray-700">{user?.name}!</Text>
        <Text className="text-xl text-gray-500 mt-6">Nossos Serviços</Text>
      </View>

      <FlatList
        data={servicos}
        renderItem={({ item }) => <ServicoCard item={item} />}
        keyExtractor={(item) => item._id}
      />
    </SafeAreaView>
  );
}