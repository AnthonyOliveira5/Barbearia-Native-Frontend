// types/index.ts
// Baseado no seu documento (Fig 12) e no Diagrama de Classes
export interface Servico {
  _id: string;
  name: string;
  price: string; 
  duracao: string; 
  isActive: boolean;
}

export interface ServicoAgendado {
  // servico: string | { _id: string; name: string; price: string }; // <-- Esta linha estava errada
  servico: string | Servico; // <-- Esta é a linha correta
  quantidade: number;
}

export interface Agendamento {
  _id: string;
  cliente: string; // ID do Cliente
  usuario: string; // ID do Barbeiro/Admin
  servicos: ServicoAgendado[];
  dataAgendamento: string; // Data no formato ISO (ex: "2025-06-12T15:00:00.000Z")
  total?: number; // Opcional, já que a trigger calcula
}

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

// Tipo para o agendamento com dados populados
export interface PopulatedAgendamento {
  _id: string;
  cliente: PopulatedUser;
  usuario: PopulatedUser; // O Barbeiro
  servicos: ServicoAgendado[];
  dataAgendamento: string; // Data no formato ISO
  total: number;
}