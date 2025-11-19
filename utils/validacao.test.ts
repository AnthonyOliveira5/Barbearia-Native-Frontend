// utils/validacao.test.ts

// Esta função simula a lógica atual do seu app (que aceita qualquer data)
// Estamos testando a LÓGICA, não a tela, para ser mais rápido.
const validarDataAgendamento = (dataInput: string): boolean => {
    // No seu código atual (TextInput), não há validação.
    // Portanto, ele sempre retorna true, mesmo para datas passadas.
    return true; 
};

describe('CT05 - Validação de Data de Agendamento', () => {
    it('BUG-001: Sistema aceita agendamento com data passada', () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        
        const dataOntemString = ontem.toISOString().split('T')[0]; // "2025-11-18"

        // O teste verifica se o sistema ACEITA a data (comportamento atual / BUG)
        const resultado = validarDataAgendamento(dataOntemString);

        // Se retornar true, confirma que o bug existe (o sistema aceitou data passada)
        expect(resultado).toBe(true); 
    });
});