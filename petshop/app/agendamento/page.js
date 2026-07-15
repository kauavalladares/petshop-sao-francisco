import BookingWidget from '@/components/BookingWidget';

export const metadata = {
  title: 'Agendar banho e tosa | São Francisco',
};

export default function AgendamentoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-14">
      <div className="max-w-2xl mb-10">
        <p className="font-display text-clay-500 text-sm tracking-wide uppercase mb-2">
          Agendamento online
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-teal-900 leading-tight">
          Marque o banho ou a tosa
        </h1>
        <p className="mt-4 text-lg text-ink/80">
          Atendemos de segunda a sexta, das 9h às 12h e das 13h às 17h30. Escolha o serviço, o
          dia e o horário disponível.
        </p>
      </div>

      <BookingWidget />
    </div>
  );
}
