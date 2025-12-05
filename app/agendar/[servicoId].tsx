import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Plus,
  Trash2,
  User,
  X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { createAgendamento, getBarbeiros, getHorariosDisponiveis, getServicos, TimeSlot } from '../../services/api';
import { Servico } from '../../types';

interface Barbeiro {
  _id: string;
  name: string;
  avatar?: string;
}

// --- MODAL DE STATUS ---
const StatusModal = ({ visible, type, message, onClose }: { visible: boolean; type: 'success' | 'error'; message: string; onClose: () => void }) => {
  // AQUI ESTAVA O ERRO: Havia dois 'return (' seguidos. Agora está correto.
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {type === 'success' ? (
              <CheckCircle2 size={32} color="#16A34A" />
            ) : (
              <AlertCircle size={32} color="#DC2626" />
            )}
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'success' ? 'Sucesso!' : 'Algo deu errado'}
          </Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">
            {message}
          </Text>

          <Pressable 
            onPress={onClose}
            className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}
          >
            <Text className="text-white font-bold text-base">
              {type === 'success' ? 'Ver Agendamentos' : 'Tentar Novamente'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// --- HELPERS DE DATA ---
const generateMonthDates = () => {
  const dates = [];
  const today = new Date();
  
  // REGRA DE NEGÓCIO: Se já passou das 19h, começa a mostrar a partir de amanhã
  if (today.getHours() >= 19) {
    today.setDate(today.getDate() + 1);
  }

  const currentMonth = today.getMonth();
  const d = new Date(today);
  
  // Mostra dias enquanto for o mesmo mês OU garante pelo menos 5 dias se for fim de mês
  while (d.getMonth() === currentMonth || dates.length < 5) {
    dates.push({
      fullDate: d.toISOString().split('T')[0],
      day: d.getDate(),
      weekDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
    });
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const getMonthTitle = () => {
  const today = new Date();
  const mes = today.toLocaleDateString('pt-BR', { month: 'long' });
  const ano = today.getFullYear();
  return `${mes} de ${ano}`.toUpperCase();
};

export default function AgendarScreen() {
  const { servicoId } = useLocalSearchParams<{ servicoId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Estados
  const [allServices, setAllServices] = useState<Servico[]>([]);
  const [selectedServices, setSelectedServices] = useState<Servico[]>([]);
  const [barbers, setBarbers] = useState<Barbeiro[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
    visible: false, type: 'success', message: ''
  });

  const [selectedBarber, setSelectedBarber] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const dates = React.useMemo(() => generateMonthDates(), []);
  const totalDuration = useMemo(() => selectedServices.reduce((acc, curr) => acc + curr.duracao, 0), [selectedServices]);
  const totalPrice = useMemo(() => selectedServices.reduce((acc, curr) => acc + curr.price, 0), [selectedServices]);

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [servicosData, listaBarbeiros] = await Promise.all([getServicos(), getBarbeiros()]);
        setAllServices(servicosData);
        setBarbers([{ _id: 'any', name: 'Qualquer Profissional' }, ...listaBarbeiros]);
        if (servicoId) {
          const initial = servicosData.find((s: Servico) => s._id === servicoId);
          if (initial) setSelectedServices([initial]);
        }
      } catch (error) {
        Alert.alert("Erro", "Falha ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [servicoId]);

  // Busca Slots
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      try {
        setLoadingSlots(true);
        setSelectedTime(null);
        
        const slots = await getHorariosDisponiveis(selectedDate, selectedBarber);
        setAvailableSlots(slots);
      } catch (error) {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedBarber]);

  const handleAddService = (service: Servico) => {
    if (selectedServices.find(s => s._id === service._id)) {
      Alert.alert("Aviso", "Este serviço já foi adicionado.");
      return;
    }
    setSelectedServices([...selectedServices, service]);
    setIsServiceModalOpen(false);
  };

  const handleRemoveService = (id: string) => {
    if (selectedServices.length === 1) {
      Alert.alert("Aviso", "Você precisa de pelo menos um serviço.");
      return;
    }
    setSelectedServices(selectedServices.filter(s => s._id !== id));
  };

  const closeStatusModal = () => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    if (statusModal.type === 'success') {
      router.replace('/(tabs)/two'); // Redireciona para Meus Agendamentos
    } else {
      // Recarrega horários se deu erro (ex: conflito)
      const fetchSlotsAgain = async () => {
         setLoadingSlots(true);
         const slots = await getHorariosDisponiveis(selectedDate, selectedBarber);
         setAvailableSlots(slots);
         setLoadingSlots(false);
      };
      fetchSlotsAgain();
    }
  };

  const handleConfirm = async () => {
    if (!selectedTime) {
      setStatusModal({ visible: true, type: 'error', message: "Por favor, selecione um horário." });
      return;
    }
    if (!user) {
      setStatusModal({ visible: true, type: 'error', message: "Sessão expirada." });
      return;
    }

    try {
      setSubmitting(true);

      let finalBarberId = selectedBarber;
      if (selectedBarber === 'any') {
        const realBarbers = barbers.filter(b => b._id !== 'any');
        if (realBarbers.length > 0) {
          const random = realBarbers[Math.floor(Math.random() * realBarbers.length)];
          finalBarberId = random._id;
        } else {
            // ID Admin/Dono de fallback
            finalBarberId = "681c145bb825e2d3ae87bdb2"; 
        }
      }

      const [ano, mes, dia] = selectedDate.split('-').map(Number);
      const [hora, minuto] = selectedTime.split(':').map(Number);
      
      // UTC+3 para compensar fuso Brasil ao salvar
      const dataUTC = new Date(Date.UTC(ano, mes - 1, dia, hora + 3, minuto, 0));
      
      const payload = {
        cliente: user._id || user.uid || user.id,
        usuario: finalBarberId,
        dataAgendamento: dataUTC.toISOString(),
        servicos: selectedServices.map(s => ({
          servico: s._id,
          quantidade: 1
        }))
      };

      await createAgendamento(payload);

      setStatusModal({ 
        visible: true, 
        type: 'success', 
        message: "Agendamento realizado com sucesso!" 
      });

    } catch (error: any) {
      setStatusModal({ 
        visible: true, 
        type: 'error', 
        message: error.message || "Não foi possível finalizar."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View className="flex-1 justify-center items-center bg-gray-50"><ActivityIndicator size="large" color="#EAB308" /></View>;

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="bg-white border-b border-gray-100">
        <View className="px-4 py-3 flex-row items-center gap-4">
          <Pressable onPress={() => router.back()} className="p-2 bg-gray-100 rounded-full"><ChevronLeft size={24} color="#000" /></Pressable>
          <Text className="text-lg font-bold text-gray-900">Finalizar Agendamento</Text>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* SERVIÇOS */}
        <View className="bg-white mx-4 mt-4 p-4 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Serviços Selecionados</Text>
          {selectedServices.map((service, index) => (
            <View key={service._id} className={`flex-row justify-between items-center ${index !== 0 ? 'mt-4 pt-4 border-t border-gray-50' : ''}`}>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{service.name}</Text>
                <View className="flex-row items-center gap-3 mt-1">
                  <Text className="text-green-600 font-semibold">R$ {service.price?.toFixed(2)}</Text>
                  <Text className="text-gray-400 text-xs">•</Text>
                  <Text className="text-gray-500 text-xs">{service.duracao} min</Text>
                </View>
              </View>
              <Pressable onPress={() => handleRemoveService(service._id)} className="p-2 bg-red-50 rounded-lg"><Trash2 size={18} color="#EF4444" /></Pressable>
            </View>
          ))}
          <Pressable onPress={() => setIsServiceModalOpen(true)} className="mt-4 py-3 border border-dashed border-gray-300 rounded-xl flex-row justify-center items-center gap-2 active:bg-gray-50"><Plus size={18} color="#6B7280" /><Text className="text-gray-500 font-medium">Adicionar outro serviço</Text></Pressable>
        </View>

        {/* ✅ BARBEIROS COM FOTO */}
        <View className="mt-6">
          <Text className="px-4 text-base font-bold text-gray-900 mb-3">Escolha o Profissional</Text>
          <FlatList 
            horizontal 
            data={barbers} 
            keyExtractor={item => item._id} 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} 
            renderItem={({ item }) => {
              const isSelected = selectedBarber === item._id;
              return (
                <Pressable 
                  onPress={() => setSelectedBarber(item._id)} 
                  className={`items-center w-24 p-3 rounded-2xl border ${isSelected ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-200'}`}
                >
                  <View className={`w-14 h-14 rounded-full mb-2 items-center justify-center overflow-hidden ${isSelected ? 'border-2 border-yellow-400' : 'bg-gray-100'}`}>
                     {item.avatar ? (
                        <Image source={{ uri: item.avatar }} className="w-full h-full" resizeMode="cover" />
                     ) : (
                        <User size={24} color={isSelected ? "#FFF" : "#9CA3AF"} />
                     )}
                  </View>
                  <Text numberOfLines={1} className={`text-center text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-600'}`}>{item.name.split(' ')[0]}</Text>
                </Pressable>
              );
            }} 
          />
        </View>

        {/* DATA */}
        <View className="mt-6">
          <View className="px-4 flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">Escolha a Data</Text>
            <View className="flex-row items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100"><CalendarIcon size={12} color="#854D0E" /><Text className="text-xs font-bold text-yellow-800">{getMonthTitle()}</Text></View>
          </View>
          <FlatList horizontal data={dates} keyExtractor={item => item.fullDate} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }} renderItem={({ item }) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <Pressable onPress={() => setSelectedDate(item.fullDate)} className={`items-center justify-center w-16 h-20 rounded-2xl border ${isSelected ? 'bg-yellow-400 border-yellow-400' : 'bg-white border-gray-200'}`}>
                  <Text className={`text-xs font-bold mb-1 ${isSelected ? 'text-black' : 'text-gray-400'}`}>{item.weekDay}</Text>
                  <Text className={`text-xl font-bold ${isSelected ? 'text-black' : 'text-gray-900'}`}>{item.day}</Text>
                </Pressable>
              );
            }} />
        </View>

        {/* HORÁRIOS */}
        <View className="mt-6 px-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Horários Disponíveis</Text>
          {loadingSlots ? (
            <View className="h-20 justify-center items-center"><ActivityIndicator color="#EAB308" /><Text className="text-gray-400 text-xs mt-2">Buscando disponibilidade...</Text></View>
          ) : availableSlots.length === 0 ? (
             <View className="bg-gray-100 p-6 rounded-xl items-center border border-gray-200"><Clock size={32} color="#9CA3AF" /><Text className="text-gray-500 mt-2 text-center font-medium">Nenhum horário livre.</Text></View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {availableSlots.map(({ time, available }) => {
                const isSelected = selectedTime === time;
                if (!available) {
                  return (
                    <View key={time} className="w-[30%] py-3 rounded-xl border border-gray-100 bg-gray-50 items-center justify-center opacity-50 flex-row gap-1">
                      <Text className="font-bold text-gray-400 line-through">{time}</Text>
                      <X size={12} color="#EF4444" />
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    className={`w-[30%] py-3 rounded-xl border items-center justify-center ${isSelected ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>{time}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-6 pb-8 shadow-2xl">
        <View className="flex-row justify-between items-center mb-4">
          <View><Text className="text-gray-500 text-sm">Total a pagar</Text><Text className="text-2xl font-bold text-gray-900">R$ {totalPrice.toFixed(2)}</Text></View>
          <View className="items-end"><Text className="text-gray-500 text-sm">Duração Total</Text><Text className="text-base font-bold text-gray-900">{totalDuration} min</Text></View>
        </View>
        <Pressable className={`w-full py-4 rounded-xl items-center flex-row justify-center gap-2 ${selectedTime && !submitting ? 'bg-yellow-400' : 'bg-gray-200'}`} onPress={handleConfirm} disabled={!selectedTime || submitting}>
          {submitting ? <ActivityIndicator color="black" /> : <><Text className={`text-lg font-bold ${selectedTime ? 'text-black' : 'text-gray-400'}`}>Confirmar Agendamento</Text>{selectedTime && <CheckCircle2 size={20} color="black" />}</>}
        </Pressable>
      </View>

      {/* MODAL SERVIÇO */}
      <Modal animationType="slide" transparent={true} visible={isServiceModalOpen} onRequestClose={() => setIsServiceModalOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[70%] p-6">
            <View className="flex-row justify-between items-center mb-6"><Text className="text-xl font-bold text-gray-900">Adicionar Serviço</Text><Pressable onPress={() => setIsServiceModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable></View>
            <FlatList data={allServices} keyExtractor={item => item._id} showsVerticalScrollIndicator={false} renderItem={({ item }) => {
                const isAlreadySelected = selectedServices.some(s => s._id === item._id);
                return (
                  <Pressable disabled={isAlreadySelected} onPress={() => handleAddService(item)} className={`flex-row justify-between items-center p-4 mb-3 rounded-xl border ${isAlreadySelected ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-200 active:bg-gray-50'}`}>
                    <View><Text className="font-bold text-gray-900">{item.name}</Text><Text className="text-gray-500 text-xs">R$ {item.price?.toFixed(2)} • {item.duracao} min</Text></View>
                    {isAlreadySelected ? <CheckCircle2 size={20} color="#10B981" /> : <Plus size={20} color="#FACC15" />}
                  </Pressable>
                )
              }} />
          </View>
        </View>
      </Modal>
      
      {/* MODAL STATUS */}
      <StatusModal visible={statusModal.visible} type={statusModal.type} message={statusModal.message} onClose={closeStatusModal} />
    </View>
  );
}