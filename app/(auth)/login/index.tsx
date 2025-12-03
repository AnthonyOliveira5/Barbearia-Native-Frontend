// app/(auth)/login/index.tsx
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Scissors } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    // Fundo geral cinza bem clarinho (bg-gray-50)
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header (Certifique-se que o componente Header também é claro) */}
      <Header /> 

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        className="bg-gray-50"
      >
        {/* CARTÃO BRANCO CENTRALIZADO */}
        <View className="bg-white w-full max-w-md mx-auto p-8 rounded-xl shadow-sm border border-gray-100">
          
          <View className="flex-row items-center justify-center gap-3 mb-8">
            <Scissors size={24} color="#000" /> 
            <Text className="text-2xl font-bold text-gray-900">Inova Barbearia</Text>
          </View>

          {/* Input Email */}
          <TextInput
            testID="input-email"
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
            testID="input-password"
            className="w-full bg-gray-100 border border-gray-200 p-4 rounded-lg text-base text-black mb-6"
            placeholder="Senha"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}

          {/* Botão Amarelo */}
          <Pressable
            testID="button-login"
            className="w-full bg-yellow-400 p-4 rounded-lg items-center active:bg-yellow-500"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black text-lg font-bold">Entrar</Text>
            )}
          </Pressable>

          {/* Links */}
          <View className="mt-6 items-center gap-2">
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="text-gray-500">
                  Não tem uma conta? <Text className="text-black font-bold">Cadastre-se</Text>
                </Text>
              </Pressable>
            </Link>
            <Pressable>
              <Text className="text-gray-400 text-sm">Esqueci minha senha</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Footer (Abaixo está o código para deixá-lo claro também) */}
      <Footer />
    </SafeAreaView>
  );
};

export default LoginScreen;