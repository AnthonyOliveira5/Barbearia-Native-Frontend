import { useRouter } from 'expo-router';
import { Scissors, UserCircle } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Pega o tamanho exato do notch/barra de status

  return (
    <View 
      className="bg-black flex-row items-center justify-between px-5 pb-3 border-b border-zinc-800"
      style={{ paddingTop: insets.top + 10 }} // Ajuste dinâmico + um respiro
    >
      
      {/* Logo Compacto */}
      <View className="flex-row items-center gap-2">
        <View className="bg-yellow-400 p-1 rounded-md">
           <Scissors size={16} color="#000" />
        </View>
        <Text className="text-white text-base font-bold tracking-tight">Inova</Text>
      </View>

      {/* Botão de Perfil Minimalista */}
      <Pressable 
        onPress={() => router.push('/(tabs)/perfil')}
        className="flex-row items-center gap-2 active:opacity-70"
      >
        <Text className="text-zinc-300 text-sm font-medium mr-1">
          {user?.name ? `Olá, ${user.name.split(' ')[0]}` : 'Entrar'}
        </Text>
        <UserCircle size={24} color="#FACC15" />
      </Pressable>

    </View>
  );
}