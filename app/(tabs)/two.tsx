import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarClock, Scissors, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Imports
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { getMeusAgendamentos } from '../../services/api';
import { PopulatedAgendamento } from '../../types';

// Função para formatar data (Corrige o Fuso Horário automaticamente)
const formatDate = (isoString: string) => {
  if (!isoString) return "Data inválida";
  const date = new Date(isoString);
  
  // O .toLocaleDateString usa o fuso horário do celular.
  // Como salvamos 13:30 UTC no banco (que é 10:30 BRT + 3h),
  // ao converter para o fuso local (UTC-3), ele exibirá 10:30 corretamente.
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Componente de Badge de Status
const StatusBadge = ({ status }: { status: string }) => {
  let containerStyle = "bg-gray-100";
  let textStyle = "text-gray-600";
  let label = status;

  switch (status) {
    case 'pendente':
      containerStyle = "bg-yellow-100";
      textStyle = "text-yellow-700";
      label = "Agendado";
      break;
    case 'confirmado':
      containerStyle = "bg-green-100";
      textStyle = "text-green-700";
      label = "Confirmado";
      break;
    case 'cancelado':
      containerStyle = "bg-red-100";
      textStyle = "text-red-700";
      label = "Cancelado";
      break;
    case 'concluido':
      containerStyle = "bg-blue-100";
      textStyle = "text-blue-700";
      label = "Concluído";
      break;
  }

  return (
    <View className={`px-3 py-1 rounded-full ${containerStyle}`}>
      <Text className={`text-xs font-bold capitalize ${textStyle}`}>{label}</Text>
    </View>
  );
};

// Card de Agendamento
const AppointmentCard = ({ item }: { item: PopulatedAgendamento }) => {
  // Tratamento de segurança caso o objeto usuario venha nulo ou não populado
  const nomeProfissional = typeof item.usuario === 'object' && item.usuario?.name 
    ? item.usuario.name.split(' ')[0] 
    : 'Profissional';

  return (
    <View className="bg-white p-5 mb-4 rounded-2xl shadow-sm border border-gray-100">
      
      {/* Cabeçalho do Card: Data e Status */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={18} color="#4B5563" />
          <Text className="text-gray-700 font-medium text-sm">
            {formatDate(item.dataAgendamento)}
          </Text>
        </View>
        <StatusBadge status={item.status || 'pendente'} />
      </View>

      {/* Linha Divisória */}
      <View className="h-[1px] bg-gray-100 w-full mb-4" />

      {/* Detalhes: Barbeiro e Preço */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200">
            <User size={20} color="#374151" />
          </View>
          <View>
            <Text className="text-xs text-gray-400 font-medium uppercase">Profissional</Text>
            <Text className="text-gray-900 font-bold text-base">
              {nomeProfissional}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-xs text-gray-400 font-medium uppercase">Total</Text>
          <Text className="text-green-600 font-bold text-lg">
            R$ {item.total ? item.total.toFixed(2) : '0.00'}
          </Text>
        </View>
      </View>

    </View>
  );
};

export default function MeusAgendamentosScreen() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<PopulatedAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAgendamentos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Envia o ID disponível (seja do Mongo ou UID do Firebase)
      // O backend agora é inteligente e sabe buscar pelos dois.
      const userId = user._id || user.uid || user.id; 
      
      const data = await getMeusAgendamentos(userId);
      
      // Ordenação: Futuros primeiro, depois passados (decrescente)
      // Se quiser os mais próximos primeiro, inverta para (a - b)
      const sorted = data.sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime());
      
      setAgendamentos(sorted);
    } catch (error) {
      console.error("Erro ao buscar meus agendamentos", error);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega sempre que a tela ganha foco (ao voltar de um agendamento novo)
  useFocusEffect(
    useCallback(() => {
      fetchAgendamentos();
    }, [user])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right']}>
      <Header /> 

      <View className="flex-1 px-4 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6 px-2">Meus Agendamentos</Text>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#EAB308" />
          </View>
        ) : (
          <FlatList
            data={agendamentos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <AppointmentCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            
            // Empty State (Lista Vazia)
            ListEmptyComponent={() => (
              <View className="items-center justify-center mt-20 opacity-60">
                <Scissors size={64} color="#D1D5DB" />
                <Text className="text-gray-500 text-lg font-medium mt-4">Nenhum agendamento ainda.</Text>
                <Text className="text-gray-400 text-sm text-center px-10 mt-2">
                  Que tal dar um tapa no visual hoje?
                </Text>
              </View>
            )}

            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchAgendamentos} colors={["#EAB308"]} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}