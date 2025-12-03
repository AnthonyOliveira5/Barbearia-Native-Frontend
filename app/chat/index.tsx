// app/chat/index.tsx
import { useRouter } from 'expo-router';
import { Bot, Send } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Tipo da Mensagem
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: `Olá, ${user?.name}! Sou a IA da Inova Barbearia. Como posso ajudar no seu agendamento hoje?`, 
      sender: 'bot' 
    }
  ]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newMsgUser: Message = { id: Date.now().toString(), text: userMsg, sender: 'user' };
    
    // Atualiza UI imediatamente
    setMessages(prev => [...prev, newMsgUser]);
    setInput('');
    setLoading(true);

    try {
      // Chama o endpoint do Gemini que criamos
      // OBS: Certifique-se de criar a rota POST /bot/chat no backend
      const response = await api.post('/bot/chat', {
        mensagem: userMsg,
        clienteId: user?._id
      });

      const data = response.data; // { sucesso: true, resposta: "...", agendamento: {...} }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.resposta,
        sender: 'bot'
      };

      setMessages(prev => [...prev, botResponse]);

      // Se a IA criou o agendamento com sucesso, podemos redirecionar ou mostrar um botão
      if (data.sucesso && data.agendamento) {
        // Opcional: Redirecionar para a lista de agendamentos após 2 segundos
        setTimeout(() => router.push('/(tabs)/agendamentos'), 3000);
      }

    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "Desculpe, não consegui conectar com o servidor.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header Simples */}
      <View className="p-4 border-b border-gray-200 bg-white flex-row items-center gap-3">
        <View className="bg-yellow-100 p-2 rounded-full">
          <Bot size={24} color="#EAB308" />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-900">Assistente Virtual</Text>
          <Text className="text-xs text-gray-500">Agendamento via IA (Gemini)</Text>
        </View>
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View 
            className={`flex-row ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar do Bot */}
            {item.sender === 'bot' && (
              <View className="w-8 h-8 bg-yellow-100 rounded-full items-center justify-center mr-2 mt-1">
                <Bot size={16} color="#EAB308" />
              </View>
            )}

            {/* Balão da Mensagem */}
            <View 
              className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                item.sender === 'user' 
                  ? 'bg-zinc-900 rounded-tr-none' 
                  : 'bg-white border border-gray-200 rounded-tl-none'
              }`}
            >
              <Text 
                className={`text-base ${
                  item.sender === 'user' ? 'text-white' : 'text-gray-800'
                }`}
              >
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={10}
      >
        <View className="p-4 bg-white border-t border-gray-200 flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-gray-100 p-3 rounded-full text-base border border-gray-200"
            placeholder="Ex: Corte com João amanhã às 15h"
            value={input}
            onChangeText={setInput}
            editable={!loading}
          />
          <Pressable 
            onPress={sendMessage}
            disabled={loading || !input.trim()}
            className={`p-3 rounded-full ${
              loading || !input.trim() ? 'bg-gray-300' : 'bg-yellow-500'
            }`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}