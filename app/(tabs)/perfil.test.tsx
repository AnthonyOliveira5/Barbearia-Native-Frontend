// app/(tabs)/perfil.test.tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import PerfilScreen from './perfil';

// Mock do AuthContext para simular um usuário logado e a função signOut
const mockSignOut = jest.fn();
const mockUser = {
  _id: 'user123',
  name: 'Claudio Arruda',
  email: 'claudio@teste.com',
  role: 'cliente'
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

// Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

describe('CT07 & CT08 - Tela de Perfil e Logout', () => {
  it('CT07: Deve exibir os dados do usuário logado corretamente', () => {
    render(<PerfilScreen />);

    // Verifica se o nome e email do mock estão na tela
    expect(screen.getByText('Olá, Claudio Arruda')).toBeTruthy();
    expect(screen.getByText('claudio@teste.com')).toBeTruthy();
  });

  it('CT08: Deve realizar o logout ao clicar no botão sair', () => {
    render(<PerfilScreen />);

    const botaoSair = screen.getByText('Sair (Logout)');
    fireEvent.press(botaoSair);

    // Verifica se a função signOut foi chamada
    expect(mockSignOut).toHaveBeenCalled();
  });
});