import React, { useState } from 'react';
// Removida a importação 'styled'
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';

// A variável StyledPressable foi removida

const RegisterScreen = () => {
  // ... (Hooks de state sem alterações) ...
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // ...
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // ... (lógica de cadastro sem alterações)
    setLoading(true);
    setError('');
    
    const clienteData = {
      name,
      email,
      senha,
      CPF: cpf,
      dataNascimento,
      endereco,
      role: 'cliente',
    };
    
    try {
      await signUp(clienteData);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-gray-100">
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-3xl font-bold mb-8">Cadastro</Text>

        {/* ... (Inputs de Texto sem alterações) ... */}
        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="Nome Completo" value={name} onChangeText={setName} />
        {/* ... */}
        <TextInput className="w-full bg-white p-4 rounded-lg mb-6 text-lg" placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

        {error && <Text className="text-red-500 mb-4">{error}</Text>}

        {/* Usamos <Pressable> diretamente */}
        <Pressable
          className="w-full bg-yellow-500 p-4 rounded-lg items-center"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Cadastrar</Text>}
        </Pressable>

        <Link href="/(auth)/login" asChild>
           {/* Usamos <Pressable> diretamente */}
          <Pressable className="mt-8">
            <Text className="text-gray-600">Já possui conta? Faça login</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;