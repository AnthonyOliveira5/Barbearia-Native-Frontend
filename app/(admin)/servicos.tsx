import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { AlertCircle, Check, CheckCircle2, Edit2, Image as ImageIcon, Plus, Scissors, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createServico, deleteServico, getServicos, updateServico } from '../../services/api';
import { Servico } from '../../types';

// --- MODAL DE STATUS (Reutilizável para Delete/Confirmação) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : type === 'error' ? 'bg-red-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : type === 'error' ? <AlertCircle size={32} color="#DC2626" /> : <Trash2 size={32} color="#EF4444" />}
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">{type === 'confirm' ? 'Excluir Serviço?' : type === 'success' ? 'Sucesso' : 'Atenção'}</Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">{message}</Text>
          
          {type === 'confirm' ? (
            <View className="flex-row gap-3 w-full">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-xl items-center bg-gray-100"><Text className="text-gray-700 font-bold">Cancelar</Text></Pressable>
              <Pressable onPress={onConfirm} className="flex-1 py-3 rounded-xl items-center bg-red-500"><Text className="text-white font-bold">Excluir</Text></Pressable>
            </View>
          ) : (
            <Pressable onPress={onClose} className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-green-600' : 'bg-zinc-900'}`}><Text className="text-white font-bold text-base">OK</Text></Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function AdminServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal de Edição
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado do Modal de Status (Delete/Alertas)
  const [statusModal, setStatusModal] = useState<{ visible: boolean; type: 'success' | 'error' | 'confirm'; message: string; action?: () => void }>({
    visible: false, type: 'success', message: ''
  });
  
  // Formulário
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duracao, setDuracao] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const fetchServicos = async () => {
    try {
      setLoading(true);
      // Passamos true para trazer TODOS (ativos e inativos)
      const data = await getServicos(true); 
      setServicos(data);
    } catch (error) {
      // console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServicos();
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openModal = (servico?: Servico) => {
    if (servico) {
      setEditingId(servico._id);
      setName(servico.name);
      setPrice(servico.price.toString());
      setDuracao(servico.duracao.toString());
      setImageUri(servico.image || null);
    } else {
      setEditingId(null);
      setName('');
      setPrice('');
      setDuracao('');
      setImageUri(null);
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !price || !duracao) {
      setStatusModal({ visible: true, type: 'error', message: "Preencha todos os campos obrigatórios." });
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // ✅ CORREÇÃO DO UPDATE: Agora passamos imageUri!
        // A função na API vai detectar se é uma URL http (antiga) ou uri local (nova)
        await updateServico(editingId, {
          name,
          price: parseFloat(price),
          duracao: parseInt(duracao),
          imageUri: imageUri || undefined // Passa a imagem para a API decidir
        });
        setStatusModal({ visible: true, type: 'success', message: "Serviço atualizado com sucesso!" });
      } else {
        // CRIAR
        if (!imageUri) {
          setStatusModal({ visible: true, type: 'error', message: "Selecione uma imagem para o serviço." });
          setSaving(false);
          return;
        }
        await createServico({ name, price, duracao, imageUri });
        setStatusModal({ visible: true, type: 'success', message: "Serviço criado com sucesso!" });
      }

      setModalVisible(false);
      fetchServicos();

    } catch (error: any) {
      setStatusModal({ visible: true, type: 'error', message: error.message || "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE COM MODAL (Funciona na Web) ---
  const handleDeleteRequest = (id: string) => {
    setStatusModal({
      visible: true,
      type: 'confirm',
      message: "Tem certeza? Esta ação removerá o serviço permanentemente.",
      action: () => confirmDelete(id)
    });
  };

  const confirmDelete = async (id: string) => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    try {
      await deleteServico(id);
      fetchServicos();
    } catch (e) {
      setStatusModal({ visible: true, type: 'error', message: "Não foi possível excluir o serviço." });
    }
  };

  const handleToggleStatus = async (item: Servico) => {
    try {
      setServicos(prev => prev.map(s => s._id === item._id ? { ...s, isActive: !s.isActive } : s));
      await updateServico(item._id, { isActive: !item.isActive });
    } catch (error) {
      fetchServicos();
    }
  };

  const closeStatusModal = () => {
    setStatusModal(prev => ({ ...prev, visible: false }));
    // Se foi sucesso, já atualizamos a lista no handleSave, mas garante aqui
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      
      <View className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Serviços</Text>
        <Pressable 
          onPress={() => openModal()}
          className="bg-zinc-900 w-10 h-10 rounded-full items-center justify-center shadow-sm"
        >
          <Plus size={20} color="#FACC15" />
        </Pressable>
      </View>

      <FlatList 
        data={servicos}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchServicos} colors={["#EAB308"]} />}
        ListEmptyComponent={!loading ? <Text className="text-center text-gray-400 mt-10">Nenhum serviço cadastrado.</Text> : null}
        renderItem={({ item }) => (
          <View className={`bg-white p-4 mb-3 rounded-2xl shadow-sm border border-gray-100 flex-row items-center gap-4 ${!item.isActive ? 'opacity-60' : ''}`}>
            <View className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden items-center justify-center border border-gray-200">
              {item.image ? (
                <Image source={{ uri: item.image }} className="w-full h-full" />
              ) : (
                <Scissors size={24} color="#9CA3AF" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">{item.name}</Text>
              <Text className="text-sm text-green-600 font-bold">R$ {item.price.toFixed(2)}</Text>
              <Text className="text-xs text-gray-400">{item.duracao} min</Text>
            </View>
            <View className="items-end gap-2">
              <Switch 
                trackColor={{ false: '#767577', true: '#FACC15' }}
                thumbColor={item.isActive ? '#000' : '#f4f3f4'}
                onValueChange={() => handleToggleStatus(item)}
                value={item.isActive}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <View className="flex-row gap-3">
                <Pressable onPress={() => openModal(item)}><Edit2 size={18} color="#4B5563" /></Pressable>
                
                {/* Botão Delete Chama o Modal Customizado */}
                <Pressable onPress={() => handleDeleteRequest(item._id)}><Trash2 size={18} color="#EF4444" /></Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[85%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} color="#000" /></Pressable>
            </View>

            <Pressable onPress={pickImage} className="w-full h-40 bg-gray-100 rounded-2xl items-center justify-center mb-6 border border-dashed border-gray-300 overflow-hidden">
              {imageUri ? <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" /> : <View className="items-center"><ImageIcon size={32} color="#9CA3AF" /><Text className="text-gray-400 text-xs mt-2">Toque para adicionar foto</Text></View>}
            </Pressable>

            <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Nome do Serviço</Text>
            <TextInput value={name} onChangeText={setName} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="Ex: Corte Degradê" />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Preço (R$)</Text>
                <TextInput value={price} onChangeText={setPrice} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="0.00" keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <Text className="label text-xs font-bold text-gray-500 uppercase mb-1">Duração (Min)</Text>
                <TextInput value={duracao} onChangeText={setDuracao} className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200" placeholder="30" keyboardType="numeric" />
              </View>
            </View>

            <Pressable onPress={handleSave} disabled={saving} className="mt-auto bg-yellow-400 py-4 rounded-xl items-center flex-row justify-center gap-2">
              {saving ? <ActivityIndicator color="black" /> : <><Check size={20} color="black" /><Text className="font-bold text-lg text-black">Salvar Serviço</Text></>}
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