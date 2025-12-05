import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updatePassword } from 'firebase/auth';
import { AlertCircle, Camera, CheckCircle2, Edit2, Lock, LogOut, Mail, Phone, User, X } from 'lucide-react-native';
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
import api, { uploadUserAvatar } from '../../services/api';
import { auth } from '../../services/firebase'; // Certifique-se do caminho

// --- MODAL DE STATUS (Reutilizável) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : type === 'confirm' ? 'bg-red-100' : 'bg-yellow-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <LogOut size={32} color="#EF4444" />}
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'confirm' ? 'Atenção' : type === 'success' ? 'Sucesso' : 'Erro'}
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
                <Text className="text-white font-bold">Confirmar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}>
              <Text className="text-white font-bold text-base">OK</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function PerfilScreen() {
  const { user, signOut, setUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({ visible: false, type: 'success', message: '' });

  // Estados do Formulário
  const [name, setName] = useState(user?.name || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const email = user?.email || '';

  // Estados da Senha
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // --- LOGOUT ---
  const requestSignOut = () => {
    setModalConfig({
      visible: true,
      type: 'confirm',
      message: "Tem certeza que deseja desconectar desta conta?",
      action: async () => {
        setModalConfig(prev => ({ ...prev, visible: false }));
        await signOut();
        router.replace('/(auth)/login');
      }
    });
  };

  // --- SALVAR PERFIL (DADOS) ---
  const handleSave = async () => {
    if (!name.trim()) {
      setModalConfig({ visible: true, type: 'error', message: "Nome é obrigatório." });
      return;
    }

    try {
      setLoading(true);
      const id = user?._id || user?.id || user?.uid;
      const response = await api.put(`/usuarios/${id}`, { name, telefone });

      if (response.data && response.data.data) {
        setUser({ ...user, ...response.data.data }); 
      }

      setIsEditing(false);
      setModalConfig({ visible: true, type: 'success', message: "Perfil atualizado com sucesso!" });

    } catch (error: any) {
      setModalConfig({ visible: true, type: 'error', message: "Erro ao salvar alterações." });
    } finally {
      setLoading(false);
    }
  };

  // --- ALTERAR SENHA (FIREBASE) ---
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setModalConfig({ visible: true, type: 'error', message: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }

    if (!auth.currentUser) return;

    try {
      setLoading(true);
      await updatePassword(auth.currentUser, newPassword);
      
      setPasswordModalVisible(false);
      setNewPassword('');
      setModalConfig({ visible: true, type: 'success', message: "Sua senha foi alterada com sucesso!" });
    } catch (error: any) {
      console.error(error);
      // Se o login for antigo, o Firebase pede reautenticação
      if (error.code === 'auth/requires-recent-login') {
        setModalConfig({ visible: true, type: 'error', message: "Por segurança, faça logout e login novamente antes de trocar a senha." });
      } else {
        setModalConfig({ visible: true, type: 'error', message: "Não foi possível alterar a senha." });
      }
    } finally {
      setLoading(false);
    }
  };

  // --- UPLOAD FOTO ---
  const handleUpdateAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        setLoading(true);
        const uri = result.assets[0].uri;
        const id = user?._id || user?.id || user?.uid;
        
        const response = await uploadUserAvatar(id, uri);

        if (response.data) {
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

  const toggleEdit = () => {
    if (isEditing) {
      setName(user?.name || '');
      setTelefone(user?.telefone || '');
    }
    setIsEditing(!isEditing);
  };

  const getInitials = (n: string) => n ? n.split(' ').map(i => i[0]).join('').slice(0, 2).toUpperCase() : 'US';

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View className="bg-white pb-8 pt-6 rounded-b-[32px] shadow-sm mb-6 items-center px-6">
            <View className="relative">
              <View className="w-28 h-28 bg-gray-100 rounded-full items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} className="w-full h-full" />
                ) : (
                  <Text className="text-3xl font-bold text-gray-400">{getInitials(name)}</Text>
                )}
              </View>
              <Pressable onPress={handleUpdateAvatar} disabled={loading} className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full border-2 border-white shadow-sm">
                <Camera size={16} color="#000" />
              </Pressable>
            </View>

            <Text className="text-2xl font-bold text-gray-900 mt-4 text-center">{name || "Cliente"}</Text>
            <Text className="text-gray-500 text-sm">{email}</Text>
          </View>

          {/* DADOS */}
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
              
              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">Nome</Text>
                <View className={`flex-row items-center bg-gray-50 border rounded-xl px-3 py-3 ${isEditing ? 'border-yellow-400 bg-white' : 'border-gray-100'}`}>
                  <User size={20} color={isEditing ? "#000" : "#9CA3AF"} />
                  <TextInput value={name} onChangeText={setName} editable={isEditing} className={`flex-1 ml-3 text-base ${isEditing ? 'text-gray-900' : 'text-gray-500'}`} />
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">Telefone</Text>
                <View className={`flex-row items-center bg-gray-50 border rounded-xl px-3 py-3 ${isEditing ? 'border-yellow-400 bg-white' : 'border-gray-100'}`}>
                  <Phone size={20} color={isEditing ? "#000" : "#9CA3AF"} />
                  <TextInput value={telefone} onChangeText={setTelefone} editable={isEditing} keyboardType="phone-pad" className={`flex-1 ml-3 text-base ${isEditing ? 'text-gray-900' : 'text-gray-500'}`} />
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-400 font-bold uppercase mb-1 ml-1">E-mail</Text>
                <View className="flex-row items-center bg-gray-100 border border-gray-100 rounded-xl px-3 py-3 opacity-70">
                  <Mail size={20} color="#9CA3AF" />
                  <Text className="flex-1 ml-3 text-base text-gray-500">{email}</Text>
                </View>
              </View>

              {isEditing && (
                <View className="flex-row gap-3 mt-2">
                  <Pressable onPress={toggleEdit} className="flex-1 bg-gray-200 py-3 rounded-xl items-center"><Text className="font-bold text-gray-600">Cancelar</Text></Pressable>
                  <Pressable onPress={handleSave} disabled={loading} className="flex-1 bg-yellow-400 py-3 rounded-xl items-center">
                    {loading ? <ActivityIndicator color="black" /> : <Text className="font-bold text-black">Salvar</Text>}
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* BOTÃO ALTERAR SENHA */}
          <View className="px-6 mt-4">
            <Pressable 
              onPress={() => setPasswordModalVisible(true)}
              className="flex-row items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-xl active:bg-gray-50"
            >
              <Lock size={20} color="#4B5563" />
              <Text className="text-gray-700 font-bold text-base">Alterar Senha</Text>
            </Pressable>
          </View>

          {/* SAIR */}
          <View className="px-6 mt-4">
            <Pressable onPress={requestSignOut} className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-100 p-4 rounded-xl active:bg-red-100">
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold text-lg">Sair da Conta</Text>
            </Pressable>
            <Text className="text-center text-gray-400 text-xs mt-6">Versão 1.0.0</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL GLOBAL (Alertas) */}
      <StatusModal 
        visible={modalConfig.visible} 
        type={modalConfig.type} 
        message={modalConfig.message} 
        onClose={() => setModalConfig(prev => ({...prev, visible: false}))} 
        onConfirm={modalConfig.action} 
      />

      {/* MODAL ALTERAR SENHA */}
      <Modal visible={passwordModalVisible} transparent animationType="slide" onRequestClose={() => setPasswordModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[40%]">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">Nova Senha</Text>
                <Pressable onPress={() => setPasswordModalVisible(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable>
            </View>
            
            <Text className="text-gray-500 mb-4 text-sm">Digite sua nova senha abaixo. Ela deve ter no mínimo 6 caracteres.</Text>
            
            <View className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 flex-row items-center">
                <Lock size={20} color="#9CA3AF" />
                <TextInput 
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nova senha segura"
                    secureTextEntry
                    className="flex-1 ml-3 text-base text-gray-900"
                />
            </View>

            <Pressable onPress={handleChangePassword} disabled={loading} className="mt-auto bg-zinc-900 py-4 rounded-xl items-center flex-row justify-center gap-2">
              {loading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-lg text-white">Atualizar Senha</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}