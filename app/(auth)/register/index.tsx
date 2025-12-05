import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { AlertCircle, CheckCircle2, ChevronLeft, Lock, Mail, Phone, User, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
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

import { Footer } from '../../../components/Footer'; // ✅ Importado
import { Header } from '../../../components/Header'; // ✅ Importado
import { registerUsuario } from '../../../services/api';
import { auth } from '../../../services/firebase';

// --- MODAL DE STATUS (Reutilizável) ---
const StatusModal = ({ visible, type, message, onClose, onConfirm }: { visible: boolean; type: 'success' | 'error'; message: string; onClose: () => void; onConfirm?: () => void }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center px-6">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 items-center shadow-2xl">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {type === 'success' ? <CheckCircle2 size={32} color="#16A34A" /> : <AlertCircle size={32} color="#DC2626" />}
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            {type === 'success' ? 'Conta Criada!' : 'Algo deu errado'}
          </Text>
          <Text className="text-gray-500 text-center mb-6 text-base leading-5">
            {message}
          </Text>

          <Pressable 
            onPress={onClose}
            className={`w-full py-3 rounded-xl items-center ${type === 'success' ? 'bg-zinc-900' : 'bg-red-500'}`}
          >
            <Text className="text-white font-bold text-base">
              {type === 'success' ? 'Ir para Login' : 'Tentar Novamente'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const RegisterScreen = () => {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefone, setTelefone] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
    visible: false, type: 'success', message: ''
  });

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  };

  const handleRegister = async () => {
    // Validações básicas
    if (!name || !email || !password || !confirmPassword || !telefone) {
      setModalConfig({ visible: true, type: 'error', message: 'Por favor, preencha todos os campos.' });
      return;
    }
    if (password !== confirmPassword) {
      setModalConfig({ visible: true, type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    if (password.length < 6) {
      setModalConfig({ visible: true, type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Cria no Firebase (Auth)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Salva no Backend (MongoDB)
      await registerUsuario({
        name: name,
        email: email,
        senha: generateRandomPassword(), // Senha dummy para o Mongo
        telefone: telefone,
        role: 'cliente', 
        firebase_uid: user.uid
      });

      // ✅ SUCESSO: Abre o Modal
      setModalConfig({ 
        visible: true, 
        type: 'success', 
        message: "Seu cadastro foi realizado com sucesso. Agora você pode entrar e agendar seu horário." 
      });

    } catch (e: any) {
      console.error("Erro registro:", e);
      let msg = "Erro ao criar conta.";
      if (e.code === 'auth/email-already-in-use') msg = "Este email já está cadastrado.";
      else if (e.code === 'auth/invalid-email') msg = "Email inválido.";
      else if (e.code === 'auth/weak-password') msg = "A senha é muito fraca.";
      
      setModalConfig({ visible: true, type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
    // Se foi sucesso, redireciona
    if (modalConfig.type === 'success') {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <StatusBar style="dark" />
      
      {/* ✅ HEADER (Adicionado aqui) */}
      <Header />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          
          {/* Título e Subtítulo (Sem o botão de voltar antigo, pois o Header pode já ter ou ser o suficiente) */}
          {/* Se o seu componente Header for genérico e não tiver botão de voltar, você pode manter este botão 'ChevronLeft' aqui embaixo */}
          <View className="px-6 pt-4 pb-2">
            <Pressable 
              onPress={() => router.back()} 
              className="w-10 h-10 bg-white rounded-full items-center justify-center border border-gray-200 mb-6"
            >
              <ChevronLeft size={24} color="#000" />
            </Pressable>
            
            <Text className="text-3xl font-bold text-gray-900 mb-2">Crie sua conta</Text>
            <Text className="text-gray-500 text-base">
              Preencha seus dados para agendar seu corte de forma rápida e fácil.
            </Text>
          </View>

          <View className="px-6 mt-6 gap-4 pb-10"> 
            
            {/* Nome */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nome Completo</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-400">
                <User size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Ex: João Silva"
                  placeholderTextColor="#D1D5DB"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Telefone */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Celular</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#D1D5DB"
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="seu@email.com"
                  placeholderTextColor="#D1D5DB"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Senha */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#D1D5DB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Confirmar Senha */}
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Confirmar Senha</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Repita a senha"
                  placeholderTextColor="#D1D5DB"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Botão Cadastrar */}
            <Pressable
              className="w-full bg-zinc-900 py-4 rounded-xl items-center mt-4 active:bg-zinc-800 flex-row justify-center gap-2"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FACC15" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold">Criar Conta</Text>
                  <UserPlus size={20} color="#FACC15" />
                </>
              )}
            </Pressable>

            {/* Link Login */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-500">Já tem uma conta? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text className="text-zinc-900 font-bold underline">Faça Login</Text>
                </Pressable>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ FOOTER (Adicionado aqui) */}
      <Footer />

      {/* ✅ MODAL DE SUCESSO / ERRO */}
      <StatusModal 
        visible={modalConfig.visible} 
        type={modalConfig.type as any} 
        message={modalConfig.message} 
        onClose={closeModal} 
      />

    </SafeAreaView>
  );
};

export default RegisterScreen;