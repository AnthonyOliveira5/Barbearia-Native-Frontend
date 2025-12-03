import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Scissors, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Imports do projeto
import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';
import { registerUsuario } from '../../../services/api';
import { auth } from "../../../services/firebase"; // ⚠️ Verifique se o caminho está correto

const RegisterScreen = () => {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefone, setTelefone] = useState(''); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Função auxiliar para gerar senha aleatória para o Backend
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  };

  const handleRegister = async () => {
    setError('');

    // 1. Validações Locais
    if (!name || !email || !password || !confirmPassword || !telefone) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 2. CRIA NO FIREBASE AUTH (Com a senha REAL)
      // Isso garante que o usuário consiga logar depois com essa senha
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase User criado com UID:", user.uid);

      // 3. SALVA NO SEU BACKEND (MongoDB)
      // Aqui enviamos uma senha aleatória, pois o backend exige o campo 'senha',
      // mas nós nunca usaremos essa senha do Mongo para fazer login.
      await registerUsuario({
        name: name,
        email: email,
        senha: generateRandomPassword(), // Senha "dummy" segura
        telefone: telefone,
        role: 'cliente', 
        firebase_uid: user.uid // O vínculo importante
      });

      // Sucesso!
      Alert.alert("Bem-vindo!", "Sua conta foi criada com sucesso.", [
        { text: "Começar", onPress: () => router.replace('/(tabs)') } 
      ]);

    } catch (e: any) {
      console.error("Erro no registro:", e);
      // Tratamento de erros comuns do Firebase
      if (e.code === 'auth/email-already-in-use') {
        setError("Este email já está cadastrado.");
      } else if (e.code === 'auth/invalid-email') {
        setError("Email inválido.");
      } else if (e.code === 'auth/weak-password') {
        setError("A senha é muito fraca.");
      } else {
        // Erro genérico ou do Backend
        setError(e.message || "Ocorreu um erro ao criar a conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Header /> 

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        className="bg-gray-50"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white w-full max-w-md mx-auto p-8 rounded-xl shadow-sm border border-gray-100">
          
          <View className="flex-row items-center justify-center gap-3 mb-6">
            <Scissors size={24} color="#000" /> 
            <Text className="text-2xl font-bold text-gray-900">Crie sua Conta</Text>
          </View>

          <Text className="text-gray-500 text-center mb-6">
            Preencha os dados abaixo para começar a agendar.
          </Text>

          {/* Input Nome */}
          <TextInput
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-4"
            placeholder="Nome Completo"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {/* Input Telefone */}
          <TextInput
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-4"
            placeholder="Celular (com DDD)"
            placeholderTextColor="#6B7280"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          {/* Input Email */}
          <TextInput
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-4"
            placeholder="Email"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Input Senha */}
          <TextInput
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-4"
            placeholder="Senha"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Input Confirmar Senha */}
          <TextInput
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-6"
            placeholder="Confirmar Senha"
            placeholderTextColor="#6B7280"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}

          <Pressable
            className="w-full bg-yellow-400 p-4 rounded-lg items-center active:bg-yellow-500 flex-row justify-center gap-2"
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text className="text-black text-lg font-bold">Cadastrar</Text>
                <UserPlus size={20} color="black" />
              </>
            )}
          </Pressable>

          <View className="mt-6 items-center">
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-gray-500">
                  Já possui uma conta? <Text className="text-black font-bold">Entrar</Text>
                </Text>
              </Pressable>
            </Link>
          </View>

        </View>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

export default RegisterScreen;