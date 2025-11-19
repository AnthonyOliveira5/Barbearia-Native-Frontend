// app/(tabs)/index.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { getServicos } from '../../services/api';
import HomeScreen from './index';

// Mock dos dados que viriam do backend
const mockServicos = [
  { _id: '1', name: 'Corte Social', price: '30', duracao: '30', isActive: true },
  { _id: '2', name: 'Barba', price: '25', duracao: '20', isActive: true },
];

// Tipagem para o mock
(getServicos as jest.Mock).mockResolvedValue(mockServicos);

describe('CT03 - Listagem de Serviços', () => {
  it('deve renderizar a lista de serviços vindos da API', async () => {
    const { getByText } = render(<HomeScreen />);

    // Aguarda a API "responder" e a tela atualizar
    await waitFor(() => {
      expect(getByText('Corte Social')).toBeTruthy();
      expect(getByText('Preço: R$ 30')).toBeTruthy();
      expect(getByText('Barba')).toBeTruthy();
    });
  });
});