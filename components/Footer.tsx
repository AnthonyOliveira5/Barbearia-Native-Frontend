import { Mail, MapPin, Phone } from 'lucide-react-native';
import { Linking, Pressable, Text, View } from 'react-native';

export function Footer() {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Erro ao abrir link", err));
  };

  return (
    <View className="bg-gray-50 pt-6 pb-8 px-6 mt-auto items-center">
      
      {/* Linha Divisória Suave */}
      <View className="w-full h-[1px] bg-gray-200 mb-6" />

      {/* Ícones de Contato (Horizontal e Limpo) */}
      <View className="flex-row justify-center gap-8 mb-6">
        
        {/* Mapa */}
        <Pressable 
          className="items-center justify-center bg-white p-3 rounded-full shadow-sm border border-gray-100"
          onPress={() => handleOpenLink('https://maps.google.com/?q=Rua+Dom+Pedro+I,65,Indaiatuba')}
        >
          <MapPin size={20} color="#374151" />
        </Pressable>

        {/* Telefone/Zap */}
        <Pressable 
          className="items-center justify-center bg-white p-3 rounded-full shadow-sm border border-gray-100"
          onPress={() => handleOpenLink('tel:11969800206')}
        >
          <Phone size={20} color="#374151" />
        </Pressable>

        {/* Email */}
        <Pressable 
          className="items-center justify-center bg-white p-3 rounded-full shadow-sm border border-gray-100"
          onPress={() => handleOpenLink('mailto:inova_barber@gmail.com')}
        >
          <Mail size={20} color="#374151" />
        </Pressable>

      </View>

      {/* Copyright Discreto */}
      <Text className="text-gray-400 text-xs text-center font-medium">
        © 2025 Inova Barbearia • Indaiatuba, SP
      </Text>
      
    </View>
  );
}