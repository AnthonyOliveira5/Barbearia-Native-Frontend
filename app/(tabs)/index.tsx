import { useRouter } from 'expo-router';
import { Clock, MessageSquareText, Minus, Scissors, Send, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Componentes e API
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import api, { getServicos } from '../../services/api'; // Import da instância do axios
import { Servico } from '../../types';

// --- CHAT WIDGET REAL ---
const ChatWidget = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', text: "Olá! Sou a IA da Inova. Posso agendar seu corte?", sender: 'bot' }
  ]);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll
  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, visible, isTyping]);

  if (!visible) return null;
  const handleSend = async () => {
    if (!msg.trim()) return;

    const userText = msg;
    setMsg('');
    
    // 1. Atualiza visual local
    const newMessages = [...messages, { id: Date.now().toString(), text: userText, sender: 'user' }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // 2. Prepara Histórico
      // IMPORTANTE: Enviamos 'messages' (o histórico antes da msg atual) 
      // ou podemos enviar tudo se o backend for inteligente, 
      // mas o padrão ideal é: historico = passado, mensagem = atual.
      const historyPayload = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        message: m.text
      }));

      const clienteId = user?._id || user?.uid || user?.id; 
      
      const response = await api.post('/chat', {
        mensagem: userText,
        clienteId: clienteId,
        historico: historyPayload // ✅ Envia o contexto!
      });

      const data = response.data;

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: data.resposta, 
        sender: 'bot' 
      }]);

    } catch (error) {
      console.error("Erro chat:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: "Estou sem conexão. Tente mais tarde.", 
        sender: 'bot' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      className="absolute bottom-24 right-4 w-full max-w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
      style={{ elevation: 10 }}
    >
      {/* Header do Chat */}
      <View className="bg-zinc-900 p-3 px-4 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <View className="bg-green-500 w-2 h-2 rounded-full" />
          <Text className="text-white font-bold text-sm">Assistente Inova (IA)</Text>
        </View>
        <Pressable onPress={onClose} className="p-1">
           <Minus size={18} color="#FFF" />
        </Pressable>
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        className="flex-1 bg-gray-50 px-3 py-4"
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View 
            className={`p-3 rounded-2xl max-w-[85%] ${
              item.sender === 'user' 
                ? 'bg-zinc-800 self-end rounded-tr-sm' 
                : 'bg-white border border-gray-200 self-start rounded-tl-sm'
            }`}
          >
            <Text className={`text-sm ${item.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
              {item.text}
            </Text>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View className="p-3 bg-white border border-gray-200 self-start rounded-2xl rounded-tl-sm w-16 items-center">
               <ActivityIndicator size="small" color="#000" />
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View className="p-3 bg-white border-t border-gray-100 flex-row gap-2 items-center">
        <TextInput 
          className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm text-gray-800"
          placeholder="Ex: Corte amanhã as 10h"
          value={msg}
          onChangeText={setMsg}
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleSend}
        />
        <Pressable 
          onPress={handleSend} 
          disabled={isTyping}
          className={`w-10 h-10 rounded-full items-center justify-center ${isTyping ? 'bg-gray-300' : 'bg-yellow-400 active:bg-yellow-500'}`}
        >
          <Send size={18} color="#000" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- CARD DE SERVIÇO ---
const ServicoCard: React.FC<{ item: Servico }> = ({ item }) => {
  const router = useRouter();
  
  return (
    <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100 flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center gap-4">
        <View className="w-12 h-12 bg-gray-50 rounded-xl items-center justify-center border border-gray-100">
           <Scissors size={20} color="#374151" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900 leading-tight">{item.name}</Text>
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">{item.duracao} min</Text>
          </View>
        </View>
      </View>
      <View className="items-end gap-2">
        <Text className="text-sm font-bold text-gray-900">
          R$ {item.price ? item.price.toFixed(2) : '0.00'}
        </Text>
        <Pressable
          className="bg-zinc-900 py-2 px-4 rounded-lg active:bg-zinc-800"
          onPress={() => router.push(`/agendar/${item._id}`)}
        >
          <Text className="text-white text-xs font-bold">Agendar</Text>
        </Pressable>
      </View>
    </View>
  );
};

// --- TELA PRINCIPAL ---
export default function HomeScreen() {
  const router = useRouter();
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

  useEffect(() => {
    carregarServicos();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
      <Header />

      <View className="flex-1 w-full max-w-3xl mx-auto bg-gray-50 overflow-hidden relative">
        {loading && servicos.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#EAB308" />
          </View>
        ) : (
          <FlatList
            data={servicos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <ServicoCard item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              !loading && error ? (
                <View className="p-8 items-center">
                  <Text className="text-red-500 text-center mb-4">{error}</Text>
                  <Pressable onPress={carregarServicos} className="bg-gray-200 p-3 rounded-lg">
                    <Text>Tentar Novamente</Text>
                  </Pressable>
                </View>
              ) : (
                !loading ? <Text className="text-center mt-10 text-gray-400">Nenhum serviço encontrado.</Text> : null
              )
            }
            ListHeaderComponent={() => (
              <View className="mb-6 mt-2">
                <Text className="text-2xl font-bold text-gray-900">Olá, Cliente!</Text>
                <Text className="text-gray-500 text-sm">Qual estilo vamos fazer hoje?</Text>
              </View>
            )}
            ListFooterComponent={() => <Footer />}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={carregarServicos} colors={["#EAB308"]} />
            }
          />
        )}

        {/* CHAT WIDGET */}
        <ChatWidget visible={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {/* BOTÃO FLUTUANTE */}
        <Pressable
          className={`absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95 z-50 border ${isChatOpen ? 'bg-white border-gray-200' : 'bg-zinc-900 border-yellow-500'}`}
          onPress={() => setIsChatOpen(!isChatOpen)}
          style={{ elevation: 5 }}
        >
          {isChatOpen ? <X size={24} color="#000" /> : <MessageSquareText size={24} color="#FACC15" />}
        </Pressable>

      </View>
    </SafeAreaView>
  );
}