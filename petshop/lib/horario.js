// 0 = domingo, 1 = segunda ... 6 = sábado
export const DIAS_FUNCIONAMENTO = [1, 2, 3, 4, 5];

export const PERIODOS = [
  { inicio: '09:00', fim: '12:00' },
  { inicio: '13:00', fim: '17:30' },
];

// Granularidade dos horários oferecidos no calendário (em minutos)
export const INTERVALO_SLOT_MIN = 20;

// Antecedência mínima para agendar no mesmo dia (em minutos)
export const ANTECEDENCIA_MIN_MESMO_DIA = 30;

export const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
