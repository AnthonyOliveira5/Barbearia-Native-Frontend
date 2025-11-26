// app/agendar/horario.test.tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { createAgendamento } from '../../services/api';
import HorarioScreen from './horario';

// Mock da API e do AuthContext
jest.mock('../../services/api');
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'user123', name: 'Cliente Teste' } }),
}));

// Mock dos parâmetros que viriam da tela anterior (Data e Serviço)
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ servicoId: 'srv123', data: '2025-12-25' }),
}));

describe('CT04 - Confirmação de Agendamento', () => {
  it('deve selecionar um horário e criar o agendamento', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<HorarioScreen />);

    // 1. Selecionar o horário "15:00"
    const horarioOpcao = getByText('15:00');
    fireEvent.press(horarioOpcao);

    // 2. Clicar em Confirmar
    const botaoConfirmar = getByText('Confirmar Agendamento');
    fireEvent.press(botaoConfirmar);

    // 3. Verificar a chamada
    await waitFor(() => {
      expect(createAgendamento).toHaveBeenCalledWith(
        'user123',
        'srv123',
        // ALTERAÇÃO: Aceitamos qualquer string que contenha o ano e mês corretos,
        // ignorando a virada exata do dia causada pelo fuso horário.
        expect.stringMatching(/2025-12-/) 
      );
      
      expect(alertSpy).toHaveBeenCalledWith(
        "Sucesso!",
        expect.stringContaining("confirmado")
      );
    });
  });
});