import { useRouter } from 'expo-router';
import { ChevronRight, Clock, MapPin, MessageSquareText, Minus, Scissors, Send, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import api, { getServicos } from '../../services/api';
import { Servico } from '../../types';

// --- CHAT WIDGET (Mantido igual) ---
const ChatWidget = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', text: "Olá! Sou a IA da Inova. Posso agendar seu corte?", sender: 'bot' }
  ]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [messages, visible, isTyping]);

  if (!visible) return null;

  const handleSend = async () => {
    if (!msg.trim()) return;
    const userText = msg;
    setMsg('');
    const newMessages = [...messages, { id: Date.now().toString(), text: userText, sender: 'user' }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'model', message: m.text }));
      const clienteId = user?._id || user?.uid || user?.id; 
      const response = await api.post('/chat', { mensagem: userText, clienteId: clienteId, historico: historyPayload });
      const data = response.data;
      setMessages(prev => [...prev, { id: Date.now().toString(), text: data.resposta, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Estou sem conexão. Tente mais tarde.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 20} className="absolute bottom-24 right-4 w-full max-w-[350px] z-50" pointerEvents="box-none">
      <View className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-[450px]" style={{ elevation: 10 }}>
        <View className="bg-zinc-900 p-3 px-4 flex-row justify-between items-center">
          <View className="flex-row items-center gap-2"><View className="bg-green-500 w-2 h-2 rounded-full" /><Text className="text-white font-bold text-sm">Assistente Inova (IA)</Text></View>
          <Pressable onPress={onClose} className="p-1"><Minus size={18} color="#FFF" /></Pressable>
        </View>
        <FlatList ref={flatListRef} data={messages} keyExtractor={item => item.id} className="flex-1 bg-gray-50 px-3 py-4" contentContainerStyle={{ gap: 12, paddingBottom: 20 }} showsVerticalScrollIndicator={false} renderItem={({ item }) => (
            <View className={`p-3 rounded-2xl max-w-[85%] ${item.sender === 'user' ? 'bg-zinc-800 self-end rounded-tr-sm' : 'bg-white border border-gray-200 self-start rounded-tl-sm'}`}><Text className={`text-sm ${item.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>{item.text}</Text></View>
          )}
          ListFooterComponent={isTyping ? <View className="p-3 bg-white border border-gray-200 self-start rounded-2xl rounded-tl-sm w-16 items-center"><ActivityIndicator size="small" color="#000" /></View> : null}
        />
        <View className="p-3 bg-white border-t border-gray-100 flex-row gap-2 items-center">
          <TextInput className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm text-gray-800" placeholder="Digite aqui..." value={msg} onChangeText={setMsg} placeholderTextColor="#9CA3AF" onSubmitEditing={handleSend} />
          <Pressable onPress={handleSend} disabled={isTyping} className={`w-10 h-10 rounded-full items-center justify-center ${isTyping ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'}`}><Send size={18} color="#000" /></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- CARD DE SERVIÇO REDESENHADO (SPLIT LAYOUT) ---
const ServicoCard: React.FC<{ item: Servico }> = ({ item }) => {
  const router = useRouter(); 

  const handleAgendar = () => {
    router.push({
      pathname: "/agendar/[servicoId]",
      params: { servicoId: item._id }
    });
  };

  return (
    <View className="bg-white mb-4 w-full rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-row h-36">
      
      {/* LADO ESQUERDO: IMAGEM FULL HEIGHT (35% da largura) */}
      <View className="w-[35%] h-full bg-gray-200 relative">
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
             <Scissors size={32} color="#9CA3AF" />
          </View>
        )}
        {/* Overlay gradiente sutil ou badge de tempo */}
        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md flex-row items-center gap-1">
            <Clock size={10} color="#FFF" />
            <Text className="text-white text-[10px] font-bold">{item.duracao} min</Text>
        </View>
      </View>

      {/* LADO DIREITO: CONTEÚDO (65% da largura) */}
      <View className="flex-1 p-3 justify-between">
        <View>
            <Text className="text-lg font-bold text-gray-900 leading-tight" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-wider">Profissional</Text>
        </View>

        <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xl font-bold text-gray-900">
              R$ {item.price ? item.price.toFixed(2) : '0.00'}
            </Text>
            
            <Pressable 
              className="bg-zinc-900 px-4 py-2 rounded-lg active:bg-zinc-800 flex-row items-center gap-1"
              onPress={handleAgendar}
            >
              <Text className="text-white text-xs font-bold">Agendar</Text>
              <ChevronRight size={14} color="#FACC15" />
            </Pressable>
        </View>
      </View>

    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const carregarServicos = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getServicos();
      setServicos(data);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarServicos(); }, []);

  const nomeCliente = user?.name ? user.name.split(' ')[0] : 'Visitante';
  const getInitials = (n: string) => n ? n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase() : 'US';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      
      {/* HEADER */}
      <View className="px-6 pt-6 pb-12 bg-zinc-900 rounded-b-[32px] mb-4 shadow-md">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-zinc-400 text-sm font-medium mb-1">Bem-vindo de volta,</Text>
            <Text className="text-white text-3xl font-bold">{nomeCliente}</Text>
            <View className="flex-row items-center gap-1 mt-2">
              <MapPin size={14} color="#FACC15" />
              <Text className="text-zinc-400 text-xs">Indaiatuba, SP</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/perfil')} className="w-14 h-14 bg-zinc-800 rounded-full items-center justify-center border-2 border-zinc-700 active:border-yellow-400 overflow-hidden">
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} className="w-full h-full" />
            ) : (
              <Text className="text-yellow-400 font-bold text-lg">{getInitials(user?.name || '')}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View className="flex-1 w-full  overflow-hidden relative">
        {loading && servicos.length === 0 ? (
          <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#EAB308" /></View>
        ) : (
          <FlatList
            data={servicos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <ServicoCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={!loading && error ? <Text className="text-center mt-10 text-gray-500">{error}</Text> : null}
            ListHeaderComponent={() => (
              <View className="mb-4 px-1 flex-row justify-between items-end">
                <View>
                    <Text className="text-xl font-bold text-gray-900">Nossos Serviços</Text>
                    <Text className="text-gray-400 text-xs uppercase font-bold tracking-wider">Escolha um</Text>
                </View>
              </View>
            )}
            ListFooterComponent={() => <Footer />}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={carregarServicos} colors={["#EAB308"]} />}
          />
        )}
        <ChatWidget visible={isChatOpen} onClose={() => setIsChatOpen(false)} />
        <Pressable className={`absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95 z-50 border ${isChatOpen ? 'bg-white border-gray-200' : 'bg-zinc-900 border-yellow-500'}`} onPress={() => setIsChatOpen(!isChatOpen)} style={{ elevation: 5 }}>
          {isChatOpen ? <X size={24} color="#000" /> : <MessageSquareText size={24} color="#FACC15" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}