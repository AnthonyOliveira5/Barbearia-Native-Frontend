// app/(auth)/login/index.tsx
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';

const LoginScreen = () => {
  // Estado inicial vazio para o teste funcionar
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
    <View className="flex-1 justify-center items-center bg-gray-100 p-8">
      <Text className="text-3xl font-bold mb-8">Inova Barbearia</Text>
      
      <TextInput
        testID="input-email"  // <--- OBRIGATÓRIO
        className="w-full bg-white p-4 rounded-lg mb-4 text-lg"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        testID="input-password" // <--- OBRIGATÓRIO
        className="w-full bg-white p-4 rounded-lg mb-6 text-lg"
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Pressable
        testID="button-login" // <--- OBRIGATÓRIO (O erro atual é por falta disso)
        className="w-full bg-yellow-500 p-4 rounded-lg items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Entrar</Text>
        )}
      </Pressable>

      <Link href="/(auth)/register" asChild>
        <Pressable className="mt-8">
          <Text className="text-gray-600">Não tem uma conta? Cadastre-se</Text>
        </Pressable>
      </Link>
    </View>
  );
};

export default LoginScreen;