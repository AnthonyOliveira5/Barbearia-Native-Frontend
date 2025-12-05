import { useFocusEffect } from 'expo-router';
import { AlertCircle, Check, CheckCircle2, Edit2, Key, Phone, Plus, Search, Trash2, User, X } from 'lucide-react-native';
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

// Importamos createClientByAdmin para criar sem deslogar
import { createClientByAdmin, deleteUsuario, getClientes, resetClientPassword, updateUsuario } from '../../services/api';

interface Cliente {
  _id: string;
  name: string;
  email: string;
  telefone?: string;
  avatar?: string;
}

// --- MODAL DE STATUS (Reutilizável) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : type === 'confirm' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : type === 'confirm' ? <Key size={32} color="#CA8A04" /> : <Trash2 size={32} color="#EF4444" />}
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'confirm' ? 'Atenção' : type === 'success' ? 'Sucesso' : 'Erro'}
          </Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">{message}</Text>
          
          {type === 'confirm' || message.includes("remover") ? (
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-100"><Text className="text-gray-700 font-bold">Cancelar</Text></Pressable>
              <Pressable onPress={onConfirm} className="flex-1 py-3 rounded-xl items-center bg-zinc-900"><Text className="text-white font-bold">Confirmar</Text></Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}><Text className="text-white font-bold text-base">OK</Text></Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({
    visible: false, type: 'success', message: ''
  });
  
  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      // Erro silencioso ou console.log
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClientes();
    }, [])
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredClientes(clientes);
    } else {
      const lower = text.toLowerCase();
      setFilteredClientes(clientes.filter(c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower)));
    }
  };

  const openModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingId(cliente._id);
      setName(cliente.name);
      setEmail(cliente.email);
      setTelefone(cliente.telefone || '');
    } else {
      setEditingId(null);
      setName('');
      setEmail('');
      setTelefone('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !email) {
      setStatusModal({ visible: true, type: 'error', message: "Nome e Email são obrigatórios." });
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        // Update
        await updateUsuario(editingId, { name, email, telefone });
        setStatusModal({ visible: true, type: 'success', message: "Dados atualizados." });
      } else {
        // ✅ CRIAÇÃO VIA ADMIN (SEM DESLOGAR)
        // Usa a rota do backend que usa o Firebase Admin SDK
        await createClientByAdmin({
          name, 
          email, 
          password: 'mudar123', // Senha inicial
          telefone, 
          role: 'cliente'
        });
        setStatusModal({ visible: true, type: 'success', message: "Cliente criado com sucesso! Senha inicial: mudar123" });
      }
      setModalVisible(false);
      fetchClientes();
    } catch (error: any) {
      setStatusModal({ visible: true, type: 'error', message: error.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  // ✅ DELETE COM MODAL (Funciona na Web)
  const handleDeleteRequest = (id: string) => {
    setStatusModal({
      visible: true,
      type: 'confirm',
      message: "Tem certeza que deseja remover este cliente? O histórico será apagado.",
      action: () => confirmDelete(id)
    });
  };

  const confirmDelete = async (id: string) => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    try {
      await deleteUsuario(id);
      fetchClientes();
      setStatusModal({ visible: true, type: 'success', message: "Cliente removido." });
    } catch (e) {
      setStatusModal({ visible: true, type: 'error', message: "Não foi possível remover." });
    }
  };

  // ✅ RESET SENHA COM MODAL
  const handleResetRequest = (email: string) => {
    setStatusModal({
      visible: true,
      type: 'confirm',
      message: `Resetar a senha deste cliente para 'mudar123'?`,
      action: () => confirmReset(email)
    });
  };

  const confirmReset = async (email: string) => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    try {
      const res = await resetClientPassword(email);
      setStatusModal({ visible: true, type: 'success', message: `Senha resetada! Nova senha temporária: ${res.tempPassword}` });
    } catch (e) {
      setStatusModal({ visible: true, type: 'error', message: "Erro ao resetar senha." });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      
      {/* Header com Busca */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Clientes</Text>
          <Pressable onPress={() => openModal()} className="bg-zinc-900 w-10 h-10 rounded-full items-center justify-center shadow-sm">
            <Plus size={20} color="#FACC15" />
          </Pressable>
        </View>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
          <Search size={18} color="#9CA3AF" />
          <TextInput className="flex-1 ml-2 text-base text-gray-800" placeholder="Buscar por nome..." value={search} onChangeText={handleSearch} />
        </View>
      </View>

      <FlatList 
        data={filteredClientes}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchClientes} colors={["#EAB308"]} />}
        ListEmptyComponent={!loading ? <Text className="text-center text-gray-400 mt-10">Nenhum cliente encontrado.</Text> : null}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100 flex-row items-center gap-4">
            <View className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden items-center justify-center border border-gray-200">
              {item.avatar ? <Image source={{ uri: item.avatar }} className="w-full h-full" /> : <User size={20} color="#9CA3AF" />}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">{item.name}</Text>
              <Text className="text-sm text-gray-500">{item.email}</Text>
              {item.telefone && (
                <View className="flex-row items-center mt-1">
                    <Phone size={12} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 ml-1">{item.telefone}</Text>
                </View>
              )}
            </View>
            
            {/* Ações */}
            <View className="flex-row gap-3">
              <Pressable onPress={() => openModal(item)}><Edit2 size={18} color="#4B5563" /></Pressable>
              {/* Botão Reset Senha */}
              <Pressable onPress={() => handleResetRequest(item.email)}><Key size={18} color="#EAB308" /></Pressable>
              {/* Botão Delete */}
              <Pressable onPress={() => handleDeleteRequest(item._id)}><Trash2 size={18} color="#EF4444" /></Pressable>
            </View>
          </View>
        )}
      />

      {/* MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6"><Text className="text-xl font-bold text-gray-900">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</Text><Pressable onPress={() => setModalVisible(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable></View>
            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Nome</Text><TextInput value={name} onChangeText={setName} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="Nome Completo" />
            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Email</Text><TextInput value={email} onChangeText={setEmail} editable={!editingId} className={`bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 ${editingId ? 'opacity-50' : ''}`} placeholder="email@exemplo.com" autoCapitalize="none" keyboardType="email-address" />
            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Telefone</Text><TextInput value={telefone} onChangeText={setTelefone} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="(XX) XXXXX-XXXX" keyboardType="phone-pad" />
            <Pressable onPress={handleSave} disabled={saving} className="mt-auto bg-yellow-400 py-4 rounded-xl items-center flex-row justify-center gap-2">{saving ? <ActivityIndicator color="black" /> : <><Check size={20} color="black" /><Text className="font-bold text-lg text-black">Salvar Cliente</Text></>}</Pressable>
          </View>
        </View>
      </Modal>

      <StatusModal visible={statusModal.visible} type={statusModal.type} message={statusModal.message} onClose={() => setStatusModal(prev => ({...prev, visible: false}))} onConfirm={statusModal.action} />
    </SafeAreaView>
  );
}