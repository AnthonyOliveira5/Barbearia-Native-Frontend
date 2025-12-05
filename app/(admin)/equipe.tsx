import { useFocusEffect } from 'expo-router';
import { AlertCircle, Check, CheckCircle2, Trash2, User, UserPlus, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteUsuario, getBarbeiros, registerUsuario } from '../../services/api';

interface Barbeiro {
  _id: string;
  name: string;
  email: string;
  telefone?: string;
  avatar?: string;
  firebase_uid?: string;
}

// --- MODAL DE STATUS (Reutilizável para Delete/Confirmação) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <Trash2 size={32} color="#EF4444" />}
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'confirm' ? 'Remover Profissional?' : type === 'success' ? 'Sucesso' : 'Atenção'}
          </Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">{message}</Text>
          
          {type === 'confirm' ? (
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-100"><Text className="text-gray-700 font-bold">Cancelar</Text></Pressable>
              <Pressable onPress={onConfirm} className="flex-1 py-3 rounded-xl items-center bg-red-500"><Text className="text-white font-bold">Remover</Text></Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}><Text className="text-white font-bold text-base">OK</Text></Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function AdminEquipe() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({
    visible: false, type: 'success', message: ''
  });
  
  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const fetchEquipe = async () => {
    try {
      setLoading(true);
      const data = await getBarbeiros();
      setBarbeiros(data);
    } catch (error) {
      // Silencioso
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEquipe();
    }, [])
  );

  const handleAddBarber = async () => {
    if (!name || !email) {
      setStatusModal({ visible: true, type: 'error', message: "Nome e Email são obrigatórios." });
      return;
    }

    try {
      setSaving(true);
      await registerUsuario({
        name,
        email,
        senha: 'mudar123',
        telefone,
        role: 'barbeiro',
        firebase_uid: '' 
      });

      setStatusModal({ visible: true, type: 'success', message: "Barbeiro pré-cadastrado com sucesso! Peça para ele se registrar no app." });
      setModalVisible(false);
      setName(''); setEmail(''); setTelefone('');
      fetchEquipe();

    } catch (error: any) {
      setStatusModal({ visible: true, type: 'error', message: error.message || "Erro ao cadastrar." });
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE CORRIGIDO ---
  const handleDeleteRequest = (id: string) => {
    setStatusModal({
      visible: true,
      type: 'confirm',
      message: "Tem certeza que deseja remover este profissional da equipe?",
      action: () => confirmDelete(id)
    });
  };

  const confirmDelete = async (id: string) => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    try {
      await deleteUsuario(id); // Usa a função importada do api.ts
      fetchEquipe();
      setStatusModal({ visible: true, type: 'success', message: "Profissional removido." });
    } catch (e) {
      setStatusModal({ visible: true, type: 'error', message: "Não foi possível remover." });
    }
  };

  const closeStatusModal = () => {
    setStatusModal(prev => ({ ...prev, visible: false }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Equipe</Text>
        <Pressable 
          onPress={() => setModalVisible(true)}
          className="bg-zinc-900 w-10 h-10 rounded-full items-center justify-center shadow-sm"
        >
          <UserPlus size={20} color="#FACC15" />
        </Pressable>
      </View>

      <FlatList 
        data={barbeiros}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEquipe} colors={["#EAB308"]} />}
        ListEmptyComponent={!loading ? <Text className="text-center text-gray-400 mt-10">Nenhum barbeiro na equipe.</Text> : null}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100 flex-row items-center gap-4">
            
            <View className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden items-center justify-center border border-gray-200">
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} className="w-full h-full" />
              ) : (
                <User size={24} color="#9CA3AF" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">{item.name}</Text>
              <Text className="text-sm text-gray-500">{item.email}</Text>
              {item.firebase_uid?.startsWith('temp_') && (
                <Text className="text-xs text-yellow-600 font-bold mt-1">Pendente de Registro</Text>
              )}
            </View>

            {/* Botão Delete com Modal */}
            <Pressable onPress={() => handleDeleteRequest(item._id)} className="p-2 bg-red-50 rounded-lg">
              <Trash2 size={18} color="#EF4444" />
            </Pressable>

          </View>
        )}
      />

      {/* MODAL NOVO BARBEIRO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Novo Barbeiro</Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable>
            </View>

            <Text className="text-gray-500 text-sm mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
              ℹ️ O barbeiro precisará baixar o app e se cadastrar usando este mesmo e-mail para ter acesso.
            </Text>

            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</Text>
            <TextInput value={name} onChangeText={setName} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="Ex: João Silva" />

            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">E-mail de Acesso</Text>
            <TextInput value={email} onChangeText={setEmail} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="joao@barbearia.com" keyboardType="email-address" autoCapitalize="none" />

            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Telefone (Opcional)</Text>
            <TextInput value={telefone} onChangeText={setTelefone} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="(11) 99999-9999" keyboardType="phone-pad" />

            <Pressable onPress={handleAddBarber} disabled={saving} className="mt-auto bg-yellow-400 py-4 rounded-xl items-center flex-row justify-center gap-2">
              {saving ? <ActivityIndicator color="black" /> : <><Check size={20} color="black" /><Text className="font-bold text-lg text-black">Cadastrar Equipe</Text></>}
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusModal 
        visible={statusModal.visible} 
        type={statusModal.type} 
        message={statusModal.message} 
        onClose={closeStatusModal} 
        onConfirm={statusModal.action} 
      />

    </SafeAreaView>
  );
}