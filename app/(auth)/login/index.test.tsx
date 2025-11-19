// app/(auth)/login/index.test.tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../../../context/AuthContext';
import LoginScreen from './index';

// Mock do AuthContext
const mockSignIn = jest.fn();

jest.mock('../../../context/AuthContext', () => {
  const actual = jest.requireActual('../../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      signIn: mockSignIn,
      loading: false,
    }),
    AuthProvider: ({ children }: any) => children,
  };
});

describe('CT01 - Tela de Login', () => {
  it('deve chamar a função signIn com email e senha corretos', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    // 1. Encontrar os elementos pelos IDs que criamos
    const emailInput = getByTestId('input-email');
    const passwordInput = getByTestId('input-password');
    const button = getByTestId('button-login');

    // 2. Simular a digitação
    fireEvent.changeText(emailInput, 'cliente@teste.com');
    fireEvent.changeText(passwordInput, 'senha123');

    // 3. Clicar no botão
    fireEvent.press(button);

    // 4. Verificar se a função foi chamada com os valores digitados
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('cliente@teste.com', 'senha123');
    });
  });
});