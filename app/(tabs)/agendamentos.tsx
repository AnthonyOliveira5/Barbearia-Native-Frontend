// app/(tabs)/agendamentos.tsx
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMeusAgendamentos } from '../../services/api';
import { PopulatedAgendamento } from '../../types';

// Formata a data ISO para "dd/mm/aaaa às HH:MM"
const formatarDataHora = (dataISO: string) => {
  const data = new Date(dataISO);
  // Ajusta para o fuso local (removendo as 3h que adicionamos)
  data.setHours(data.getHours() - 3);

  const dia = data.toLocaleDateString('pt-BR');
  const hora = data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dia} às ${hora}`;
};

const AgendamentoCard: React.FC<{ item: PopulatedAgendamento }> = ({ item }) => {
  // Pega o nome do primeiro serviço (se houver)
  const getPrimeiroServicoNome = () => {
    if (item.servicos.length > 0) {
      const servico = item.servicos[0].servico;

      // --- CORREÇÃO AQUI ---
      // Em vez de checar if (typeof servico === 'object')
      // Checamos se NÃO é uma string.
      if (typeof servico !== 'string') {
        // Se não é string, o TS agora sabe que é o objeto Servico
        return servico.name;
      }
      // Opcional: se for uma string, você poderia retornar o ID
      // return servico; 
    }
    return 'Serviço';
  };

  // ... (o resto do seu componente Card) ...
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
      const data = await getMeusAgendamentos(user._id);
      // Ordena pelos mais recentes primeiro
      data.sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime());
      setAgendamentos(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect é um hook do Expo Router que roda
  // toda vez que o usuário *entra* nesta tela (aba)
  useFocusEffect(
    useCallback(() => {
      carregarAgendamentos();
    }, [user]) // Recarrega se o usuário mudar (ex: login/logout)
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="p-4 pt-8">
        <Text className="text-3xl font-bold mb-6">Meus Agendamentos</Text>
      </View>

      {loading && agendamentos.length === 0 && (
        <ActivityIndicator size="large" color="#EAB308" />
      )}

      {error && (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-lg text-center">{error}</Text>
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
          // Adiciona "Puxar para atualizar"
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