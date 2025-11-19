// app/agendar/[servicoId].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { getServicos } from '../../services/api'; // Supondo que você exportou getServicos
import { Servico } from '../../types';

// O nome do arquivo [servicoId].tsx nos dá o hook 'servicoId'
const { servicoId } = useLocalSearchParams<{ servicoId: string }>();

// Esta tela será apresentada como um "modal" por cima das abas
// Para fazer isso, adicionamos esta linha:
export const unstable_settings = {
  // Garante que será renderizado em um modal no mobile.
  presentation: 'modal',
};

export default function AgendarScreen() {
  const router = useRouter();
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(''); // Ex: "2025-11-18"

  // 1. Buscar os detalhes do serviço usando o ID
  useEffect(() => {
    if (!servicoId) return;

    const fetchServico = async () => {
      try {
        setLoading(true);
        // Idealmente, seu backend tem uma rota GET /servicos/:id
        // Vamos simular buscando todos e filtrando
        const servicos = await getServicos();
        const srv = servicos.find(s => s._id === servicoId);
        if (srv) {
          setServico(srv);
        } else {
          Alert.alert("Erro", "Serviço não encontrado.");
          router.back();
        }
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar o serviço.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchServico();
  }, [servicoId]);

  const handleProximoPasso = () => {
    if (!dataSelecionada) {
      Alert.alert("Atenção", "Por favor, selecione uma data.");
      return;
    }
    // Navega para o próximo passo (Seleção de Horário)
    // Passando o ID do serviço E a data selecionada
    router.push(`/agendar/horario?servicoId=${servicoId}&data=${dataSelecionada}`);
  };

  if (loading || !servico) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#EAB308" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-8 pt-12">
      <Text className="text-3xl font-bold mb-4">Agendamento</Text>
      <Text className="text-xl text-gray-700 mb-2">Serviço:</Text>
      <Text className="text-2xl font-semibold mb-6">{servico.name}</Text>

      {/* Passo 2: Seleção de Data (Figura 19) */}
      <Text className="text-xl text-gray-700 mb-4">Selecione uma data:</Text>
      
      {/* TODO: Substituir por um componente de Calendário */}
      <TextInput
        className="w-full bg-white p-4 rounded-lg mb-8 text-lg"
        placeholder="AAAA-MM-DD"
        value={dataSelecionada}
        onChangeText={setDataSelecionada}
      />
      
      <Pressable
        className="w-full bg-yellow-500 p-4 rounded-lg items-center mb-4"
        onPress={handleProximoPasso}
      >
        <Text className="text-white text-lg font-bold">Ver Horários</Text>
      </Pressable>
      
      <Pressable
        className="w-full bg-gray-300 p-4 rounded-lg items-center"
        onPress={() => router.back()} // Botão de Voltar
      >
        <Text className="text-black text-lg font-bold">Cancelar</Text>
      </Pressable>
    </View>
  );
}