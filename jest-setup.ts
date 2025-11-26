// jest-setup.ts
import '@testing-library/jest-native/extend-expect';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock do Expo Router
jest.mock('expo-router', () => {
  // SOLUÇÃO: Importamos o React DENTRO do escopo do mock
  const React = require('react'); 
  
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    // Mockamos parâmetros padrão para não quebrar telas que os usam
    useLocalSearchParams: () => ({ servicoId: '123', data: '2025-12-25' }),
    Link: 'Link',
    // Agora podemos usar o useEffect para simular o foco
    useFocusEffect: (callback: any) => React.useEffect(callback, []),
  };
});

// Mock da API
jest.mock('./services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
    },
  }),
  getServicos: jest.fn(),
  createAgendamento: jest.fn(),
  getMeusAgendamentos: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaView: jest.fn(({ children }) => children),
    useSafeAreaInsets: jest.fn(() => inset),
  };
});