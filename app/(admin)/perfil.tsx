import * as ImagePicker from 'expo-image-picker'; // Importar ImagePicker
import { useRouter } from 'expo-router';
import { AlertCircle, Camera, CheckCircle2, Edit2, LogOut, Mail, Phone, Save, ShieldCheck, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import api, { uploadUserAvatar } from '../../services/api'; // Importar uploadUserAvatar

// --- MODAL DE STATUS (Reutilizável) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <LogOut size={32} color="#EF4444" />}
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'confirm' ? 'Sair da Conta' : type === 'success' ? 'Sucesso' : 'Atenção'}
          </Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">
            {message}
          </Text>
          
          {type === 'confirm' ? (
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-100">
                <Text className="text-gray-700 font-bold">Cancelar</Text>
              </Pressable>
              <Pressable onPress={onConfirm} className="flex-1 py-3 rounded-xl items-center bg-red-500">
                <Text className="text-white font-bold">Sair Agora</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable 
              onPress={onClose}
              className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}
            >
              <Text className="text-white font-bold text-base">OK</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function AdminPerfil() {
  const { user, signOut, setUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [name, setName] = useState(user?.name || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const email = user?.email || '';

  // Estado do Modal
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({
    visible: false, type: 'success', message: ''
  });

  // --- LOGOUT ---
  const requestSignOut = () => {
    setModalConfig({
      visible: true,
      type: 'confirm',
      message: "Tem certeza que deseja desconectar desta conta?",
      action: confirmSignOut
    });
  };

const confirmSignOut = async () => {
    // Fecha o modal imediatamente
    setModalConfig(prev => ({ ...prev, visible: false }));
    
    try {
      // 1. Chama o logout
      await signOut();
      
      // 2. Força a navegação para login IMEDIATAMENTE para evitar que a tela tente buscar dados sem token
      // O replace impede que o usuário volte
      router.replace('/(auth)/login');
      
    } catch (error) {
      console.error("Erro ao sair:", error);
      // Mesmo com erro no firebase, forçamos a saída visual
      router.replace('/(auth)/login');
    }
  };

  // --- ATUALIZAR FOTO DE PERFIL ---
  const handleUpdateAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Quadrado perfeito para avatar
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setLoading(true);
        const uri = result.assets[0].uri;
        const id = user?._id || user?.id || user?.uid;
        
        // Chama a API de upload
        const response = await uploadUserAvatar(id, uri);

        // Atualiza o contexto localmente para refletir a nova foto
        if (response.data) {
          // Mescla os dados antigos com os novos
          setUser({ ...user, ...response.data });
          setModalConfig({ visible: true, type: 'success', message: "Foto de perfil atualizada!" });
        }
      } catch (error) {
        setModalConfig({ visible: true, type: 'error', message: "Falha ao enviar imagem." });
      } finally {
        setLoading(false);
      }
    }
  };

  // --- EDITAR DADOS ---
  const toggleEdit = () => {
    if (isEditing) {
      setName(user?.name || '');
      setTelefone(user?.telefone || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setModalConfig({ visible: true, type: 'error', message: "O nome não pode ficar vazio." });
      return;
    }

    try {
      setLoading(true);
      
      const id = user?._id || user?.id || user?.uid;
      const response = await api.put(`/usuarios/${id}`, {
        name,
        telefone
      });

      if (response.data && response.data.data) {
        const updatedUser = { ...user, ...response.data.data };
        setUser(updatedUser); 
      }

      setIsEditing(false);
      setModalConfig({ visible: true, type: 'success', message: "Seus dados foram atualizados!" });

    } catch (error: any) {
      setModalConfig({ visible: true, type: 'error', message: "Não foi possível salvar as alterações." });
    } finally {
      setLoading(false);
    }
  };

  // Iniciais para avatar
  const getInitials = (n: string) => n ? n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase() : 'US';

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
              <View className="w-28 h-28 bg-zinc-900 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                {loading ? (
                   <ActivityIndicator color="#FACC15" />
                ) : user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-3xl font-bold text-yellow-400">{getInitials(name)}</Text>
                )}
              </View>
              
              {/* Botão de câmera clicável */}
              <Pressable 
                onPress={handleUpdateAvatar}
                disabled={loading}
                className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full border-2 border-white shadow-sm active:bg-yellow-500"
              >
                <Camera size={16} color="#000" />
              </Pressable>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">
              {name || "Admin"}
            </Text>
            <Text className="text-gray-500 text-sm">{email}</Text>
            
            <View className="flex-row gap-2 mt-2">
                <View className="bg-yellow-100 px-3 py-1 rounded-full flex-row items-center gap-1">
                    <ShieldCheck size={12} color="#854D0E" />
                    <Text className="text-yellow-700 text-xs font-bold uppercase">{user?.role || 'Admin'}</Text>
                </View>
            </View>
          </View>

          {/* FORMULÁRIO DE DADOS */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">Meus Dados</Text>
              {!isEditing && (
                <Pressable onPress={toggleEdit} className="flex-row items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  <Edit2 size={14} color="#EAB308" />
                  <Text className="text-xs font-bold text-yellow-600">Editar</Text>
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
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">Telefone</Text>
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
                    className="flex-1 bg-gray-100 py-3 rounded-xl items-center flex-row justify-center gap-2"
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
              onPress={requestSignOut}
              className="flex-row items-center justify-center gap-2 bg-white border border-red-100 p-4 rounded-xl active:bg-red-50 shadow-sm"
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold text-lg">Sair da Conta</Text>
            </Pressable>
            
            <Text className="text-center text-gray-400 text-xs mt-6">
              Painel Administrativo • Versão 1.0.0
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL GLOBAL */}
      <StatusModal 
        visible={modalConfig.visible} 
        type={modalConfig.type} 
        message={modalConfig.message} 
        onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))} 
        onConfirm={modalConfig.action} 
      />

    </SafeAreaView>
  );
}