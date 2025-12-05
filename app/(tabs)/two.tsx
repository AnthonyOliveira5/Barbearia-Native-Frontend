import { useFocusEffect } from 'expo-router';
import { AlertCircle, CalendarClock, CheckCircle2, Scissors, User, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { cancelAgendamento, getMeusAgendamentos } from '../../services/api';

// --- TIPAGEM ---
interface PopulatedAgendamento {
  _id: string;
  dataAgendamento: string;
  total: number;
  status?: string;
  usuario: { _id: string; name: string; email: string; } | string;
  cliente: { _id: string; name: string; } | string;
}

// --- MODAL ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <X size={32} color="#EF4444" />}
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{type === 'confirm' ? 'Cancelar?' : type === 'success' ? 'Sucesso' : 'Atenção'}</Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">{message}</Text>
          {type === 'confirm' ? (
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-100"><Text className="text-gray-700 font-bold">Voltar</Text></Pressable>
              <Pressable onPress={onConfirm} className="flex-1 py-3 rounded-xl items-center bg-red-500"><Text className="text-white font-bold">Confirmar</Text></Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}><Text className="text-white font-bold text-base">OK</Text></Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const formatDate = (isoString: string) => {
  if (!isoString) return "Data inválida";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return "Data inválida"; }
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'confirmado') return <View className="px-3 py-1 rounded-full bg-green-100"><Text className="text-xs font-bold capitalize text-green-700">Confirmado</Text></View>;
  if (status === 'concluido') return <View className="px-3 py-1 rounded-full bg-blue-100"><Text className="text-xs font-bold capitalize text-blue-700">Concluído</Text></View>;
  return <View className="px-3 py-1 rounded-full bg-yellow-100"><Text className="text-xs font-bold capitalize text-yellow-700">Agendado</Text></View>;
};

const AppointmentCard = ({ item, onCancel }: { item: PopulatedAgendamento, onCancel: (id: string) => void }) => {
  const nomeProfissional = item.usuario && typeof item.usuario === 'object' && item.usuario.name ? item.usuario.name.split(' ')[0] : 'Profissional';
  const podeCancelar = item.status === 'pendente' || item.status === 'confirmado';

  return (
    <View className="bg-white p-5 mb-4 rounded-2xl shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={18} color="#4B5563" />
          <Text className="text-gray-700 font-medium text-sm">{formatDate(item.dataAgendamento)}</Text>
        </View>
        <StatusBadge status={item.status || 'pendente'} />
      </View>
      <View className="h-[1px] bg-gray-100 w-full mb-4" />
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"><User size={20} color="#374151" /></View>
          <View><Text className="text-xs text-gray-400 font-medium uppercase">Profissional</Text><Text className="text-gray-900 font-bold text-base">{nomeProfissional}</Text></View>
        </View>
        <View className="items-end"><Text className="text-xs text-gray-400 font-medium uppercase">Total</Text><Text className="text-green-600 font-bold text-lg">R$ {item.total ? item.total.toFixed(2) : '0.00'}</Text></View>
      </View>
      {podeCancelar && (
        <Pressable onPress={() => onCancel(item._id)} className="mt-4 flex-row items-center justify-center gap-2 py-2 rounded-lg border border-red-100 bg-red-50 active:bg-red-100">
          <X size={16} color="#EF4444" />
          <Text className="text-red-600 font-bold text-sm">Cancelar Agendamento</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function MeusAgendamentosScreen() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<PopulatedAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({ visible: false, type: 'success', message: '' });

  const fetchAgendamentos = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userId = user._id || user.uid || user.id; 
      if (!userId) return;

      const data = await getMeusAgendamentos(userId);
      
      // ✅ FILTRO: Remove cancelados da lista
      const ativos = Array.isArray(data) ? data.filter(item => item.status !== 'cancelado') : [];
      
      const sorted = ativos.sort((a, b) => new Date(b.dataAgendamento).getTime() - new Date(a.dataAgendamento).getTime());
      
      setAgendamentos(sorted);
    } catch (error) {
      console.error("Erro lista:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCancel = (id: string) => {
    setModalConfig({
      visible: true,
      type: 'confirm',
      message: "Tem certeza? O horário será liberado.",
      action: () => confirmCancel(id)
    });
  };

  const confirmCancel = async (id: string) => {
    setModalConfig(prev => ({ ...prev, visible: false })); 
    try {
      await cancelAgendamento(id);
      
      // ✅ REMOÇÃO VISUAL: Tira da lista imediatamente
      setAgendamentos(prev => prev.filter(ag => ag._id !== id));
      
      setModalConfig({ visible: true, type: 'success', message: "Agendamento cancelado." });
    } catch (error) {
      setModalConfig({ visible: true, type: 'error', message: "Erro ao cancelar." });
    }
  };

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
          <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#EAB308" /></View>
        ) : (
          <FlatList
            data={agendamentos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <AppointmentCard item={item} onCancel={handleRequestCancel} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center mt-20 opacity-60">
                <Scissors size={64} color="#D1D5DB" />
                <Text className="text-gray-500 text-lg font-medium mt-4">Nenhum agendamento ativo.</Text>
                <Text className="text-gray-400 text-sm text-center px-10 mt-2">Que tal marcar um novo horário?</Text>
              </View>
            )}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAgendamentos} colors={["#EAB308"]} />}
          />
        )}
      </View>
      <StatusModal visible={modalConfig.visible} type={modalConfig.type} message={modalConfig.message} onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))} onConfirm={modalConfig.action} />
    </SafeAreaView>
  );
}