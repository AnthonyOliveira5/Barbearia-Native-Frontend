import { useRouter } from 'expo-router';
import { Camera, Edit2, LogOut, Mail, Phone, Save, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api'; // Importamos a API direta para fazer o update

export default function PerfilScreen() {
  const { user, signOut, setUser } = useAuth(); // setUser para atualizar o contexto localmente após editar
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState(user?.name || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  // Email geralmente não permitimos editar fácil pois é o login
  const email = user?.email || '';

  const handleSignOut = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sair", 
        style: "destructive", 
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        } 
      }
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || !telefone.trim()) {
      Alert.alert("Erro", "Nome e Telefone são obrigatórios.");
      return;
    }

    try {
      setLoading(true);
      
      // Chama a rota PUT /usuarios/:id
      // Como não criamos a função no api.ts ainda, chamamos direto via axios instance
      const response = await api.put(`/usuarios/${user._id || user.id || user.uid}`, {
        name,
        telefone
      });

      // Atualiza o contexto com os novos dados retornados
      if (response.data && response.data.data) {
        // Mescla os dados antigos com os novos para não perder campos como token
        const updatedUser = { ...user, ...response.data.data };
        setUser(updatedUser); 
      }

      setIsEditing(false);
      Alert.alert("Sucesso", "Perfil atualizado!");

    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    // Se cancelar a edição, reseta os valores para o que estava antes
    if (isEditing) {
      setName(user?.name || '');
      setTelefone(user?.telefone || '');
    }
    setIsEditing(!isEditing);
  };

  // Avatar Placeholder (Iniciais)
  const getInitials = (n: string) => {
    return n ? n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase() : 'US';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* HEADER DO PERFIL */}
          <View className="bg-white pb-8 pt-6 rounded-b-[32px] shadow-sm mb-6 items-center px-6">
            <View className="relative">
              <View className="w-28 h-28 bg-gray-200 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-3xl font-bold text-gray-400">{getInitials(name)}</Text>
                )}
              </View>
              {/* Botão de câmera (Visual apenas por enquanto) */}
              <Pressable className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full border-2 border-white shadow-sm">
                <Camera size={16} color="#000" />
              </Pressable>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">
              {name || "Cliente Inova"}
            </Text>
            <Text className="text-gray-500 text-sm">{email}</Text>
            
            <View className="flex-row gap-2 mt-2">
                <View className="bg-yellow-100 px-3 py-1 rounded-full">
                    <Text className="text-yellow-700 text-xs font-bold uppercase">{user?.role || 'Cliente'}</Text>
                </View>
            </View>
          </View>

          {/* FORMULÁRIO DE DADOS */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Meus Dados</Text>
              {!isEditing && (
                <Pressable onPress={toggleEdit} className="flex-row items-center gap-1">
                  <Edit2 size={16} color="#EAB308" />
                  <Text className="text-yellow-600 font-bold">Editar</Text>
                </Pressable>
              )}
            </View>

            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
              
              {/* Nome */}
              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">Nome Completo</Text>
                <View className={`flex-row items-center bg-gray-50 border rounded-xl px-3 py-3 ${isEditing ? 'border-yellow-400 bg-white' : 'border-gray-100'}`}>
                  <User size={20} color={isEditing ? "#000" : "#9CA3AF"} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    editable={isEditing}
                    className={`flex-1 ml-3 text-base ${isEditing ? 'text-gray-900' : 'text-gray-500'}`}
                  />
                </View>
              </View>

              {/* Telefone */}
              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">Celular / WhatsApp</Text>
                <View className={`flex-row items-center bg-gray-50 border rounded-xl px-3 py-3 ${isEditing ? 'border-yellow-400 bg-white' : 'border-gray-100'}`}>
                  <Phone size={20} color={isEditing ? "#000" : "#9CA3AF"} />
                  <TextInput
                    value={telefone}
                    onChangeText={setTelefone}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    className={`flex-1 ml-3 text-base ${isEditing ? 'text-gray-900' : 'text-gray-500'}`}
                  />
                </View>
              </View>

              {/* Email (Bloqueado) */}
              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">E-mail (Não editável)</Text>
                <View className="flex-row items-center bg-gray-100 border border-gray-100 rounded-xl px-3 py-3 opacity-70">
                  <Mail size={20} color="#9CA3AF" />
                  <Text className="flex-1 ml-3 text-base text-gray-500">{email}</Text>
                </View>
              </View>

              {/* Ações de Edição */}
              {isEditing && (
                <View className="flex-row gap-3 mt-2">
                  <Pressable 
                    onPress={toggleEdit}
                    className="flex-1 bg-gray-200 py-3 rounded-xl items-center flex-row justify-center gap-2"
                  >
                    <X size={18} color="#4B5563" />
                    <Text className="font-bold text-gray-600">Cancelar</Text>
                  </Pressable>
                  
                  <Pressable 
                    onPress={handleSave}
                    disabled={loading}
                    className="flex-1 bg-yellow-400 py-3 rounded-xl items-center flex-row justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <>
                        <Save size={18} color="black" />
                        <Text className="font-bold text-black">Salvar</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

            </View>
          </View>

          {/* BOTÃO DE LOGOUT */}
          <View className="px-6 mt-8">
            <Pressable 
              onPress={handleSignOut}
              className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-100 p-4 rounded-xl active:bg-red-100"
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold text-lg">Sair da Conta</Text>
            </Pressable>
            
            <Text className="text-center text-gray-400 text-xs mt-6">
              Versão 1.0.0 • Inova Barbearia
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}