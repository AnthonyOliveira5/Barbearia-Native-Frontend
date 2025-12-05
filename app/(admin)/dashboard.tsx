import { useFocusEffect } from 'expo-router';
import { AlertCircle, CalendarCheck, Check, CheckCircle2, Clock, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
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

import { BarChart3 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import api, { getRelatorio } from '../../services/api';

// --- HELPERS DE DATA ---
const generateMonthDates = () => {
  const dates = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const year = today.getFullYear();
  
  // Começa do dia 1 do mês atual
  const d = new Date(year, currentMonth, 1);

  while (d.getMonth() === currentMonth) {
    dates.push({
      fullDate: d.toISOString().split('T')[0], // YYYY-MM-DD
      day: d.getDate(),
      weekDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
      isToday: d.toDateString() === today.toDateString()
    });
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

// --- MODAL DE STATUS ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-yellow-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <AlertCircle size={32} color="#EAB308" />}
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{type === 'confirm' ? 'Confirmar Ação' : type === 'success' ? 'Sucesso' : 'Atenção'}</Text>
          <Text className="text-gray-500 text-center mb-6 text-base">{message}</Text>
          
          <View className="flex-row gap-3 w-full">
            {type === 'confirm' && (
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-200">
                <Text className="text-gray-700 font-bold">Cancelar</Text>
              </Pressable>
            )}
            <Pressable 
              onPress={type === 'confirm' ? onConfirm : onClose}
              className={`flex-1 py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-yellow-500'}`}
            >
              <Text className="text-white font-bold">{type === 'confirm' ? 'Confirmar' : 'OK'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface AgendamentoAdmin {
  _id: string;
  dataAgendamento: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado';
  total: number;
  cliente: { name: string; telefone?: string; };
}

const AdminAppointmentCard = ({ item, onAction }: { item: AgendamentoAdmin, onAction: (id: string, action: string) => void }) => {
  const date = new Date(item.dataAgendamento);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let borderClass = "border-l-4 border-l-yellow-400";
  let bgClass = "bg-white";
  if (item.status === 'confirmado') borderClass = "border-l-4 border-l-blue-500";
  if (item.status === 'concluido') { borderClass = "border-l-4 border-l-green-500"; bgClass = "bg-green-50 opacity-80"; }
  if (item.status === 'cancelado') { borderClass = "border-l-4 border-l-red-500"; bgClass = "bg-red-50 opacity-60"; }

  return (
    <View className={`mb-3 mx-4 p-4 rounded-lg shadow-sm border border-gray-100 ${bgClass} ${borderClass}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Clock size={16} color="#4B5563" />
            <Text className="text-lg font-bold text-gray-800">{time}</Text>
          </View>
          <Text className="text-base font-semibold text-gray-900">{item.cliente?.name || "Cliente"}</Text>
          <Text className="text-sm text-gray-500">Total: R$ {item.total?.toFixed(2)}</Text>
        </View>
        <View className={`px-2 py-1 rounded text-xs font-bold capitalize ${
          item.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
          item.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
          item.status === 'concluido' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <Text className="text-xs font-bold capitalize">{item.status}</Text>
        </View>
      </View>

      {['pendente', 'confirmado'].includes(item.status) && (
        <View className="flex-row justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
          <Pressable onPress={() => onAction(item._id, 'cancelado')} className="p-2 bg-red-100 rounded-full active:bg-red-200">
            <X size={20} color="#DC2626" />
          </Pressable>
          {item.status === 'pendente' && (
            <Pressable onPress={() => onAction(item._id, 'confirmado')} className="p-2 bg-blue-100 rounded-full active:bg-blue-200">
              <Check size={20} color="#2563EB" />
            </Pressable>
          )}
          <Pressable onPress={() => onAction(item._id, 'concluido')} className="p-2 bg-green-100 rounded-full active:bg-green-200">
            <CheckCircle2 size={20} color="#16A34A" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({ total: 0, valor: 0 });
  const [reportVisible, setReportVisible] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // ✅ ESTADO DA DATA SELECIONADA
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const monthDates = useMemo(() => generateMonthDates(), []);

  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({
    visible: false, type: 'success', message: ''
  });

    const handleOpenReport = async () => {
    setReportVisible(true);
    setLoadingReport(true);
    try {
      const hoje = new Date();
      // Busca relatório do mês atual
      const data = await getRelatorio(hoje.getMonth() + 1, hoje.getFullYear());
      setReportData(data);
    } catch (error) {
      // Erro silencioso ou toast
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchAgenda = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Busca geral (pode otimizar no back depois para filtrar por data na query)
      const response = await api.get('/agendamentos'); 
      const todos = response.data.data || [];

      // Filtra pela DATA SELECIONADA (selectedDate)
      const agendaDoDia = todos.filter((ag: any) => {
        const agDate = new Date(ag.dataAgendamento).toISOString().split('T')[0];
        const agUserId = typeof ag.usuario === 'object' ? ag.usuario?._id : ag.usuario;
        
        // Regra de permissão: Admin vê tudo, Barbeiro vê só dele
        const isMyService = user.role === 'admin' || agUserId === user._id || agUserId === user.id;
        
        return agDate === selectedDate && isMyService;
      });

      agendaDoDia.sort((a: any, b: any) => new Date(a.dataAgendamento).getTime() - new Date(b.dataAgendamento).getTime());
      setAgendamentos(agendaDoDia);

      const confirmadosEConcluidos = agendaDoDia.filter((a: any) => a.status !== 'cancelado');
      setResumo({
        total: confirmadosEConcluidos.length,
        valor: confirmadosEConcluidos.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0)
      });
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (id: string, novoStatus: string) => {
    setModalConfig({
      visible: true,
      type: 'confirm',
      message: `Deseja marcar este agendamento como ${novoStatus}?`,
      action: () => processUpdate(id, novoStatus)
    });
  };

  const processUpdate = async (id: string, novoStatus: string) => {
    setModalConfig(prev => ({ ...prev, visible: false })); 
    try {
      await api.put(`/agendamentos/${id}`, { status: novoStatus });
      setAgendamentos(prev => prev.map(ag => ag._id === id ? { ...ag, status: novoStatus as any } : ag));
    } catch (error) {
      setModalConfig({ visible: true, type: 'error', message: "Erro ao atualizar status." });
    }
  };

  // Recarrega sempre que mudar usuário ou DATA SELECIONADA
  useFocusEffect(
    useCallback(() => {
      if (user) fetchAgenda();
    }, [user, selectedDate])
  );

  if (authLoading || !user) return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#EAB308" /></View>;

  const nomeExibicao = user.name ? user.name.split(' ')[0] : 'Barbeiro';
  
  // Encontra a data atual para scroll inicial (opcional) ou destaque
  const formatDateTitle = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00'); // Força fuso local
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      
      {/* Header Resumo */}
      <View className="px-6 py-4 bg-zinc-900 rounded-b-[32px] mb-2 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-zinc-400 text-sm">Painel do Profissional</Text>
            <Text className="text-white text-xl font-bold">{nomeExibicao}</Text>
          </View>
          <View className="flex-row gap-3">
             {/* Resumo Mini Compacto */}
              <Pressable onPress={handleOpenReport} className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700 active:bg-zinc-700">
                <BarChart3 size={20} color="#FACC15" />
             </Pressable>
             <View className="items-end">
                <Text className="text-zinc-400 text-xs uppercase font-bold">Hoje</Text>
                <Text className="text-green-400 font-bold">R$ {resumo.valor.toFixed(0)}</Text>
             </View>
          </View>
        </View>

        {/* ✅ SELETOR DE DATA HORIZONTAL */}
        <View>
          <Text className="text-zinc-500 text-xs font-bold mb-2 uppercase">Selecione o dia</Text>
          <FlatList 
            horizontal
            data={monthDates}
            keyExtractor={item => item.fullDate}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 20 }}
            renderItem={({ item }) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <Pressable 
                  onPress={() => setSelectedDate(item.fullDate)}
                  className={`items-center justify-center w-14 h-16 rounded-xl border ${
                    isSelected ? 'bg-yellow-400 border-yellow-400' : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <Text className={`text-xs font-bold mb-1 ${isSelected ? 'text-black' : 'text-zinc-400'}`}>
                    {item.weekDay}
                  </Text>
                  <Text className={`text-lg font-bold ${isSelected ? 'text-black' : 'text-white'}`}>
                    {item.day}
                  </Text>
                  {item.isToday && !isSelected && (
                    <View className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>

      {/* Título Dinâmico */}
      <View className="px-6 mb-2 mt-2">
        <Text className="text-lg font-bold text-gray-900 capitalize">
          {formatDateTitle(selectedDate)}
        </Text>
      </View>

      {/* Lista de Agendamentos */}
      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#EAB308" /></View>
      ) : (
        <FlatList 
          data={agendamentos}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <AdminAppointmentCard item={item} onAction={handleActionClick} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-10 opacity-50">
              <CalendarCheck size={48} color="#9CA3AF" />
              <Text className="text-gray-400 mt-2">Agenda livre para este dia.</Text>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAgenda} colors={["#EAB308"]} />}
        />
      )}

      <StatusModal 
        visible={modalConfig.visible}
        type={modalConfig.type}
        message={modalConfig.message}
        onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
        onConfirm={modalConfig.action}
      />

      
      {/* ✅ MODAL DE RELATÓRIO */}
      <Modal animationType="slide" transparent={true} visible={reportVisible} onRequestClose={() => setReportVisible(false)}>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">Relatório Mensal</Text>
                <Pressable onPress={() => setReportVisible(false)} className="p-1 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable>
            </View>

            {loadingReport ? (
                <ActivityIndicator color="#EAB308" className="py-10" />
            ) : (
                <View className="gap-4">
                    <View className="bg-green-50 p-4 rounded-xl border border-green-100 items-center">
                        <Text className="text-green-800 text-sm font-bold uppercase mb-1">Faturamento Total</Text>
                        <Text className="text-3xl font-bold text-green-600">R$ {reportData?.faturamento?.toFixed(2) || '0.00'}</Text>
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200 items-center">
                            <Text className="text-gray-500 text-xs font-bold uppercase">Agendamentos</Text>
                            <Text className="text-xl font-bold text-gray-900">{reportData?.agendamentos || 0}</Text>
                        </View>
                        <View className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100 items-center">
                            <Text className="text-blue-500 text-xs font-bold uppercase">Concluídos</Text>
                            <Text className="text-xl font-bold text-blue-600">{reportData?.concluidos || 0}</Text>
                        </View>
                    </View>
                    
                    <Text className="text-center text-gray-400 text-xs mt-2">Referente ao mês atual</Text>
                </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}