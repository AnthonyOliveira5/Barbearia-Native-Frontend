

import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../services/firebase';

import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { sendPasswordResetEmail } from 'firebase/auth';
import { KeyRound, Lock, LogIn, Mail, Scissors, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';

const LoginScreen = () => {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados do Esqueci Minha Senha
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert("Erro no Login", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert("Atenção", "Por favor, digite seu e-mail.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetModalVisible(false);
      Alert.alert("E-mail Enviado!", "Verifique sua caixa de entrada para redefinir sua senha.");
      setResetEmail('');
    } catch (error: any) {
      console.error(error);
      let msg = "Não foi possível enviar o e-mail.";
      if (error.code === 'auth/user-not-found') msg = "Este e-mail não está cadastrado.";
      if (error.code === 'auth/invalid-email') msg = "E-mail inválido.";
      Alert.alert("Erro", msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* ✅ HEADER NO TOPO */}
      <Header />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          
          <View className="bg-white w-full max-w-md mx-auto p-8 rounded-2xl shadow-sm border border-gray-100">
            
            <View className="flex-row items-center justify-center gap-3 mb-8">
              <View className="w-12 h-12 bg-zinc-900 rounded-xl items-center justify-center">
                 <Scissors size={24} color="#FACC15" /> 
              </View>
              <Text className="text-3xl font-bold text-gray-900">Inova</Text>
            </View>

            <Text className="text-gray-500 text-center mb-6">Bem-vindo de volta!</Text>

            <View className="gap-4">
                <View>
                    <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">E-mail</Text>
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-400">
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

                <View>
                    <Text className="text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</Text>
                    <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-400">
                        <Lock size={20} color="#9CA3AF" />
                        <TextInput
                        className="flex-1 ml-3 text-base text-gray-900"
                        placeholder="Sua senha"
                        placeholderTextColor="#D1D5DB"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        />
                    </View>
                </View>
            </View>

            <Pressable
              className="w-full bg-zinc-900 py-4 rounded-xl items-center mt-6 active:bg-zinc-800 flex-row justify-center gap-2"
              onPress={handleLogin}
              disabled={loading || authLoading}
            >
              {loading ? (
                <ActivityIndicator color="#FACC15" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bold">Entrar</Text>
                  <LogIn size={20} color="#FACC15" />
                </>
              )}
            </Pressable>

            <View className="mt-6 items-center gap-4">
              <Pressable onPress={() => setResetModalVisible(true)}>
                <Text className="text-gray-500 text-sm">Esqueci minha senha</Text>
              </Pressable>

              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text className="text-gray-500">
                    Não tem uma conta? <Text className="text-zinc-900 font-bold underline">Cadastre-se</Text>
                  </Text>
                </Pressable>
              </Link>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ FOOTER NO FINAL */}
      <Footer />

      {/* MODAL DE RECUPERAÇÃO */}
      <Modal 
        visible={resetModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">Recuperar Senha</Text>
                <Pressable onPress={() => setResetModalVisible(false)} className="p-1 bg-gray-100 rounded-full">
                    <X size={20} color="#000" />
                </Pressable>
            </View>
            <Text className="text-gray-500 mb-4 text-sm">
              Digite seu e-mail abaixo. Enviaremos um link para você redefinir sua senha.
            </Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                <KeyRound size={20} color="#9CA3AF" />
                <TextInput
                    className="flex-1 ml-3 text-base text-gray-900"
                    placeholder="email@exemplo.com"
                    placeholderTextColor="#9CA3AF"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>
            <Pressable onPress={handleResetPassword} disabled={resetLoading} className="w-full bg-yellow-400 py-3 rounded-xl items-center">
                {resetLoading ? <ActivityIndicator color="black" /> : <Text className="text-black font-bold text-base">Enviar Link</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default LoginScreen;