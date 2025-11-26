// app/(auth)/register/index.test.tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../../../context/AuthContext';
import RegisterScreen from './index';

const mockSignUp = jest.fn();

jest.mock('../../../context/AuthContext', () => {
  const actual = jest.requireActual('../../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      signUp: mockSignUp,
      loading: false,
    }),
    AuthProvider: ({ children }: any) => children,
  };
});

describe('CT02 - Tela de Cadastro', () => {
  it('deve preencher o formulário e chamar signUp', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    // 1. Preencher os campos
    fireEvent.changeText(getByPlaceholderText('Nome Completo'), 'Novo Cliente');
    fireEvent.changeText(getByPlaceholderText('Email'), 'novo@teste.com');
    fireEvent.changeText(getByPlaceholderText('CPF'), '12345678900');
    fireEvent.changeText(getByPlaceholderText('Data Nasc. (DD-MM-AAAA)'), '01-01-2000');
    fireEvent.changeText(getByPlaceholderText('Endereço'), 'Rua Teste');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');

    // 2. Clicar em Cadastrar
    fireEvent.press(getByText('Cadastrar'));

    // 3. Verificar se a função foi chamada com os dados corretos
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Novo Cliente',
        email: 'novo@teste.com',
        CPF: '12345678900',
        role: 'cliente'
      }));
    });
  });
});