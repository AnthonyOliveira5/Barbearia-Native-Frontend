// app/agendar/horario.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { createAgendamento } from '../../services/api';

// Configura esta tela como um modal
export const unstable_settings = {
  presentation: 'modal',
};

// Vamos simular os horários disponíveis (Figura 20)
// No mundo real, isso viria da API (ex: GET /horarios?data=...&barbeiro=...)
const HORARIOS_DISPONIVEIS = [
  "14:00", "15:00", "16:00", "17:00", "18:00"
];

export default function HorarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  console.log("Usuário logado:", user);
  // Pega os parâmetros da URL (ex: ...?servicoId=...&data=...)
  const { servicoId, data } = useLocalSearchParams<{ servicoId: string, data: string }>();
  
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [loading, setLoading] = useState(false);

  // Combina a data (ex: 2025-11-18) e o horário (ex: 15:00)
  // para o formato ISO (ex: "2025-11-18T15:00:00.000Z")
  const formatarDataISO = (data: string, horario: string) => {
    // ATENÇÃO: Esta é uma conversão simples que assume o fuso local.
    // O ideal é usar uma lib como 'date-fns' ou 'moment'
    const [hora, minuto] = horario.split(':');
    const dataObj = new Date(data);
    dataObj.setHours(parseInt(hora));
    dataObj.setMinutes(parseInt(minuto));
    dataObj.setSeconds(0);
    // Adiciona 3h para compensar o fuso (-03:00) para UTC
    dataObj.setHours(dataObj.getHours() + 3); 
    return dataObj.toISOString();
  };

  const handleConfirmar = async () => {
    if (!horarioSelecionado || !user || !servicoId || !data) {
      Alert.alert("Erro", "Informações incompletas.");
      return;
    }

    setLoading(true);
    try {
      const dataISO = formatarDataISO(data, horarioSelecionado);
      
      await createAgendamento(user._id, servicoId, dataISO);

      Alert.alert(
        "Sucesso!",
        `Seu agendamento para ${data} às ${horarioSelecionado} foi confirmado.`
      );
      
      // Limpa o histórico de agendamento e volta para a Home
      router.push('/(tabs)'); 

    } catch (e: any) {
      Alert.alert("Erro ao Agendar", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100 p-8 pt-12">
      <Text className="text-3xl font-bold mb-4">Escolha o Horário</Text>
      <Text className="text-xl text-gray-700 mb-6">Para o dia: {data}</Text>

      {/* Passo 3: Seleção de Horário (Figura 20) */}
      <FlatList
        data={HORARIOS_DISPONIVEIS}
        keyExtractor={(item) => item}
        numColumns={3}
        renderItem={({ item }) => {
          const isSelected = item === horarioSelecionado;
          return (
            <Pressable
              className={`flex-1 m-2 p-4 rounded-lg items-center ${
                isSelected ? 'bg-yellow-500' : 'bg-white'
              }`}
              onPress={() => setHorarioSelecionado(item)}
            >
              <Text className={isSelected ? 'text-white font-bold' : 'text-black'}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Resumo do Agendamento (Figura 20) */}
      {horarioSelecionado && (
        <View className="my-8 p-4 bg-white rounded-lg shadow-md">
          <Text className="text-xl font-bold mb-4">Resumo do Agendamento</Text>
          <Text className="text-lg mb-2">Cliente: {user?.name}</Text>
          <Text className="text-lg mb-2">Data: {data}</Text>
          <Text className="text-lg mb-2">Horário: {horarioSelecionado}</Text>
        </View>
      )}

      <Pressable
        className={`w-full p-4 rounded-lg items-center mt-4 ${
          !horarioSelecionado ? 'bg-gray-400' : 'bg-green-500'
        }`}
        onPress={handleConfirmar}
        disabled={!horarioSelecionado || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Confirmar Agendamento</Text>
        )}
      </Pressable>

      <Pressable
        className="w-full bg-gray-300 p-4 rounded-lg items-center mt-4"
        onPress={() => router.back()} // Botão de Voltar
      >
        <Text className="text-black text-lg font-bold">Voltar</Text>
      </Pressable>
    </View>
  );
}