// app/(tabs)/agendamentos.tsx
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMeusAgendamentos } from '../../services/api';
import { PopulatedAgendamento } from '../../types';

// Função auxiliar para formatar a data
const formatarDataHora = (dataISO: string) => {
  const data = new Date(dataISO);
  // Ajuste manual de fuso (opcional, dependendo de como seu backend salva)
  data.setHours(data.getHours() - 3); 
  
  const dia = data.toLocaleDateString('pt-BR');
  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dia} às ${hora}`;
};

// Componente para renderizar cada agendamento na lista
const AgendamentoCard: React.FC<{ item: PopulatedAgendamento }> = ({ item }) => {
  // Função segura para pegar o nome do serviço
  const getPrimeiroServicoNome = () => {
    if (item.servicos.length > 0) {
      const servico = item.servicos[0].servico;
      
      // Verifica se NÃO é uma string (ou seja, é o objeto populado)
      if (typeof servico !== 'string') {
        return servico.name;
      }
    }
    return 'Serviço';
  };

  return (
    <View className="bg-white p-6 m-4 rounded-lg shadow-md">
      <Text className="text-xl font-bold mb-2">
        {formatarDataHora(item.dataAgendamento)}
      </Text>
      <Text className="text-lg text-gray-700 mb-1">
        Serviço: {getPrimeiroServicoNome()}
      </Text>
      <Text className="text-lg text-gray-700 mb-1">
        Barbeiro: {item.usuario.name}
      </Text>
      <Text className="text-lg text-gray-700 mt-2 font-bold">
        Total: R$ {item.total}
      </Text>
    </View>
  );
};

export default function AgendamentosScreen() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<PopulatedAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregarAgendamentos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const data = await getMeusAgendamentos(user._id);
      
      // Ordena: mais recentes primeiro
      data.sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime());
      
      setAgendamentos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect: Roda sempre que a tela ganha foco (usuário entra na aba)
  useFocusEffect(
    useCallback(() => {
      carregarAgendamentos();
      
      // IMPORTANTE: Dependência apenas no ID (string) para evitar loops
      // se o objeto user for recriado na memória.
    }, [user?._id]) 
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 pt-8">
        <Text className="text-3xl font-bold mb-6">Meus Agendamentos</Text>
      </View>

      {loading && agendamentos.length === 0 && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EAB308" />
        </View>
      )}

      {error !== '' && (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-lg text-center">{error}</Text>
          <Text className="text-blue-500 mt-4" onPress={carregarAgendamentos}>Tentar novamente</Text>
        </View>
      )}

      {!loading && agendamentos.length === 0 && !error && (
         <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-500 text-lg text-center">
            Você ainda não possui agendamentos.
          </Text>
        </View>
      )}

      <FlatList
        data={agendamentos}
        renderItem={({ item }) => <AgendamentoCard item={item} />}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={carregarAgendamentos}
            tintColor="#EAB308"
          />
        }
      />
    </SafeAreaView>
  );
}