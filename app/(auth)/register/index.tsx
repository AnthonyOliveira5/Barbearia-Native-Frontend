// app/(auth)/register/index.tsx
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';

const RegisterScreen = () => {
  // DEFINIÇÃO DE TODOS OS ESTADOS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [senha, setSenha] = useState(''); // <--- Esta linha estava faltando
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
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

        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="Nome Completo" value={name} onChangeText={setName} />
        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="CPF" value={cpf} onChangeText={setCpf} />
        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="Data Nasc. (DD-MM-AAAA)" value={dataNascimento} onChangeText={setDataNascimento} />
        <TextInput className="w-full bg-white p-4 rounded-lg mb-4 text-lg" placeholder="Endereço" value={endereco} onChangeText={setEndereco} />
        
        {/* O input de senha que estava quebrando */}
        <TextInput className="w-full bg-white p-4 rounded-lg mb-6 text-lg" placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />

        {error && <Text className="text-red-500 mb-4">{error}</Text>}

        <Pressable
          className="w-full bg-yellow-500 p-4 rounded-lg items-center"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Cadastrar</Text>}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-8">
            <Text className="text-gray-600">Já possui conta? Faça login</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;