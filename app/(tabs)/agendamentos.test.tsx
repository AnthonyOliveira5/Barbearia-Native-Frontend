// app/(tabs)/agendamentos.test.tsx
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import * as apiService from '../../services/api';
import AgendamentosScreen from './agendamentos';

// 1. Dados Mockados
const mockData = [
  {
    _id: 'ag1',
    dataAgendamento: '2025-12-25T15:00:00.000Z',
    total: 50,
    usuario: { name: 'Barbeiro João', email: 'joao@barber.com' },
    cliente: { name: 'Cliente Teste', email: 'c@teste.com' },
    servicos: [
      { servico: { name: 'Corte Premium', price: '50' }, quantidade: 1 }
    ]
  }
];

// 2. Mocks Globais
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ 
    user: { _id: 'user123', name: 'Cliente Teste' } 
  }),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    // Mantemos a correção do loop infinito
    useFocusEffect: (callback: any) => React.useEffect(callback, []),
    useRouter: () => ({ push: jest.fn() }),
  };
});

jest.mock('../../services/api', () => ({
  getMeusAgendamentos: jest.fn(),
}));

describe('CT06 - Meus Agendamentos', () => {
  it('deve listar os agendamentos retornados pela API', async () => {
    // Configura o mock para retornar os dados
    (apiService.getMeusAgendamentos as jest.Mock).mockResolvedValue(mockData);

    render(<AgendamentosScreen />);

    // --- CORREÇÃO AQUI ---
    // Adicionamos { exact: false } para encontrar o texto mesmo
    // que ele esteja dentro de uma frase como "Serviço: Corte Premium"
    const servico = await screen.findByText('Corte Premium', { exact: false });
    const barbeiro = await screen.findByText('Barbeiro João', { exact: false });
    const total = await screen.findByText('Total: R$ 50', { exact: false });

    // Verificamos se eles foram encontrados
    expect(servico).toBeTruthy();
    expect(barbeiro).toBeTruthy();
    expect(total).toBeTruthy();
  });
});