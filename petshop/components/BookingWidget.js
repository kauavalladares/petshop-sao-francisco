'use client';

import { useEffect, useMemo, useState } from 'react';
import { SERVICOS, formatarPreco } from '@/lib/servicos';

const DIAS_SEMANA_LABEL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES_LABEL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function primeiroDiaDoMes(ano, mes) {
  return new Date(ano, mes, 1);
}

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

export default function BookingWidget() {
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [step, setStep] = useState(1);
  const [servicoId, setServicoId] = useState(null);
  const [mesVisivel, setMesVisivel] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [erroHorarios, setErroHorarios] = useState(null);
  const [horaSelecionada, setHoraSelecionada] = useState(null);

  const [form, setForm] = useState({ nome: '', telefone: '', pet: '' });
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [resumoConfirmado, setResumoConfirmado] = useState(null);

  const servico = SERVICOS.find((s) => s.id === servicoId) || null;

  useEffect(() => {
    if (!servico || !dataSelecionada) return;
    setCarregandoHorarios(true);
    setErroHorarios(null);
    setHoraSelecionada(null);

    fetch(`/api/horarios?data=${dataSelecionada}&servico=${servico.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.erro) {
          setErroHorarios(data.erro);
          setHorarios([]);
        } else {
          setHorarios(data.horarios || []);
        }
      })
      .catch(() => setErroHorarios('Não foi possível carregar os horários. Tente novamente.'))
      .finally(() => setCarregandoHorarios(false));
  }, [servico, dataSelecionada]);

  function escolherServico(id) {
    setServicoId(id);
    setDataSelecionada(null);
    setHoraSelecionada(null);
    setStep(2);
  }

  function escolherData(iso) {
    setDataSelecionada(iso);
    setHoraSelecionada(null);
  }

  function irParaDados() {
    if (dataSelecionada && horaSelecionada) setStep(3);
  }

  async function enviarAgendamento(e) {
    e.preventDefault();
    setEnviando(true);
    setErroEnvio(null);

    try {
      const resp = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicoId: servico.id,
          data: dataSelecionada,
          horaInicio: horaSelecionada,
          clienteNome: form.nome,
          clienteTelefone: form.telefone,
          petNome: form.pet,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErroEnvio(data.erro || 'Não foi possível concluir o agendamento.');
        if (resp.status === 409) {
          // horário perdido para outra pessoa - força escolher outro
          setHoraSelecionada(null);
          setStep(2);
        }
        return;
      }
      setResumoConfirmado(data.resumo);
      setStep(4);
    } catch {
      setErroEnvio('Não foi possível concluir o agendamento. Verifique sua conexão e tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  function recomecar() {
    setStep(1);
    setServicoId(null);
    setDataSelecionada(null);
    setHoraSelecionada(null);
    setForm({ nome: '', telefone: '', pet: '' });
    setResumoConfirmado(null);
  }

  return (
    <div className="bg-white rounded-xl2 shadow-soft p-5 md:p-8">
      <Progresso step={step} />

      {step === 1 && (
        <div className="mt-8">
          <p className="font-display text-xl text-teal-900 mb-4">1. Qual serviço o seu pet vai fazer?</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {SERVICOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => escolherServico(s.id)}
                className="text-left border-2 border-cream-line hover:border-clay-500 rounded-2xl p-5 transition-colors focus-ring"
              >
                <p className="font-display text-lg text-teal-900">{s.nome}</p>
                <p className="text-sm text-ink/70 mt-1">{s.resumo}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-display text-xl text-clay-500">{formatarPreco(s.preco)}</span>
                  <span className="text-xs text-ink/50">~{s.duracaoMin} min</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && servico && (
        <div className="mt-8">
          <button type="button" onClick={() => setStep(1)} className="text-sm text-teal-800 hover:text-clay-600 mb-4 focus-ring rounded">
            ← Trocar serviço
          </button>
          <p className="font-display text-xl text-teal-900 mb-1">2. Escolha o dia e o horário</p>
          <p className="text-sm text-ink/60 mb-6">
            {servico.nome} · {formatarPreco(servico.preco)} · ~{servico.duracaoMin} min
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Calendario
              hoje={hoje}
              mesVisivel={mesVisivel}
              setMesVisivel={setMesVisivel}
              dataSelecionada={dataSelecionada}
              onSelecionar={escolherData}
            />

            <div>
              <p className="font-display text-sm text-teal-900 uppercase tracking-wide mb-3">
                Horários disponíveis
              </p>

              {!dataSelecionada && (
                <p className="text-sm text-ink/60">Selecione um dia no calendário.</p>
              )}

              {dataSelecionada && carregandoHorarios && (
                <p className="text-sm text-ink/60">Carregando horários…</p>
              )}

              {dataSelecionada && !carregandoHorarios && erroHorarios && (
                <p className="text-sm text-clay-600">{erroHorarios}</p>
              )}

              {dataSelecionada && !carregandoHorarios && !erroHorarios && horarios.length === 0 && (
                <p className="text-sm text-ink/60">
                  Não há mais horários livres nesse dia para esse serviço. Tente outra data.
                </p>
              )}

              {dataSelecionada && !carregandoHorarios && horarios.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {horarios.map((h) => (
                    <button
                      key={h.inicio}
                      type="button"
                      onClick={() => setHoraSelecionada(h.inicio)}
                      className={`py-2.5 rounded-xl border-2 font-display text-sm transition-colors focus-ring ${
                        horaSelecionada === h.inicio
                          ? 'bg-teal-800 border-teal-800 text-white'
                          : 'border-cream-line hover:border-clay-500 text-teal-900'
                      }`}
                    >
                      {h.inicio}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={!dataSelecionada || !horaSelecionada}
                onClick={irParaDados}
                className="mt-8 w-full bg-clay-500 hover:bg-clay-600 disabled:bg-cream-line disabled:text-ink/40 text-white font-display text-lg py-3 rounded-full shadow-soft transition-colors focus-ring"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && servico && (
        <div className="mt-8">
          <button type="button" onClick={() => setStep(2)} className="text-sm text-teal-800 hover:text-clay-600 mb-4 focus-ring rounded">
            ← Trocar dia ou horário
          </button>
          <p className="font-display text-xl text-teal-900 mb-1">3. Seus dados</p>
          <p className="text-sm text-ink/60 mb-6">
            {servico.nome} · {formatarDataLonga(dataSelecionada)} às {horaSelecionada}
          </p>

          <form onSubmit={enviarAgendamento} className="grid gap-4 max-w-md">
            <Campo
              label="Seu nome"
              value={form.nome}
              onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
              required
            />
            <Campo
              label="Telefone / WhatsApp"
              value={form.telefone}
              onChange={(v) => setForm((f) => ({ ...f, telefone: v }))}
              type="tel"
              placeholder="(54) 9 9999-9999"
              required
            />
            <Campo
              label="Nome do pet"
              value={form.pet}
              onChange={(v) => setForm((f) => ({ ...f, pet: v }))}
              required
            />

            {erroEnvio && <p className="text-sm text-clay-600">{erroEnvio}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 bg-clay-500 hover:bg-clay-600 disabled:opacity-60 text-white font-display text-lg py-3 rounded-full shadow-soft transition-colors focus-ring"
            >
              {enviando ? 'Confirmando…' : 'Confirmar agendamento'}
            </button>
          </form>
        </div>
      )}

      {step === 4 && resumoConfirmado && (
        <div className="mt-8 text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-moss-200 text-moss-600 flex items-center justify-center text-3xl mb-5">
            ✓
          </div>
          <p className="font-display text-2xl text-teal-900 mb-2">Agendamento confirmado!</p>
          <p className="text-ink/70 max-w-sm mx-auto">
            {resumoConfirmado.servico} para {form.pet} em{' '}
            <strong>{formatarDataLonga(resumoConfirmado.data)}</strong> às{' '}
            <strong>{resumoConfirmado.horaInicio}</strong>.
          </p>
          <p className="text-sm text-ink/50 mt-3">
            Valor do serviço: {resumoConfirmado.preco}. Qualquer imprevisto, é só ligar em (54) 99654-1615.
          </p>
          <button
            type="button"
            onClick={recomecar}
            className="mt-8 inline-flex items-center gap-2 border-2 border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white font-display px-6 py-3 rounded-full transition-colors focus-ring"
          >
            Fazer outro agendamento
          </button>
        </div>
      )}
    </div>
  );
}

function Progresso({ step }) {
  const etapas = ['Serviço', 'Data e horário', 'Seus dados', 'Confirmado'];
  return (
    <div className="flex items-center">
      {etapas.map((label, i) => {
        const numero = i + 1;
        const ativo = step >= numero;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-sm transition-colors ${
                  ativo ? 'bg-teal-800 text-white' : 'bg-cream-line text-ink/50'
                }`}
              >
                {numero}
              </div>
              <span className={`text-[11px] hidden sm:block ${ativo ? 'text-teal-900' : 'text-ink/40'}`}>
                {label}
              </span>
            </div>
            {numero !== etapas.length && (
              <div className={`h-0.5 flex-1 mx-2 ${step > numero ? 'bg-teal-800' : 'bg-cream-line'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Calendario({ hoje, mesVisivel, setMesVisivel, dataSelecionada, onSelecionar }) {
  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiro = primeiroDiaDoMes(ano, mes);
  const offset = primeiro.getDay();
  const total = diasNoMes(ano, mes);

  const limiteMinimo = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const limiteMaximo = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 1);

  const celulas = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let dia = 1; dia <= total; dia++) celulas.push(dia);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setMesVisivel(new Date(ano, mes - 1, 1))}
          disabled={mesVisivel <= limiteMinimo}
          className="w-8 h-8 rounded-full border border-cream-line flex items-center justify-center disabled:opacity-30 hover:border-clay-500 focus-ring"
          aria-label="Mês anterior"
        >
          ‹
        </button>
        <p className="font-display text-teal-900">
          {MESES_LABEL[mes]} {ano}
        </p>
        <button
          type="button"
          onClick={() => setMesVisivel(new Date(ano, mes + 1, 1))}
          disabled={mesVisivel >= limiteMaximo}
          className="w-8 h-8 rounded-full border border-cream-line flex items-center justify-center disabled:opacity-30 hover:border-clay-500 focus-ring"
          aria-label="Próximo mês"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/50 mb-1">
        {DIAS_SEMANA_LABEL.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {celulas.map((dia, i) => {
          if (dia === null) return <div key={`vazio-${i}`} />;

          const data = new Date(ano, mes, dia);
          const iso = toISO(data);
          const diaSemana = data.getDay();
          const passado = data < hoje;
          const fimDeSemana = diaSemana === 0 || diaSemana === 6;
          const desabilitado = passado || fimDeSemana;
          const selecionado = iso === dataSelecionada;

          return (
            <button
              key={iso}
              type="button"
              disabled={desabilitado}
              onClick={() => onSelecionar(iso)}
              className={`aspect-square rounded-lg text-sm transition-colors focus-ring ${
                selecionado
                  ? 'bg-teal-800 text-white font-semibold'
                  : desabilitado
                  ? 'text-ink/25 cursor-not-allowed'
                  : 'text-ink/80 hover:bg-clay-100'
              }`}
            >
              {dia}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink/50 mt-3">Atendemos de segunda a sexta.</p>
    </div>
  );
}

function Campo({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <label className="block">
      <span className="text-sm font-display text-teal-900">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border-2 border-cream-line focus:border-clay-500 outline-none px-4 py-2.5 text-ink bg-cream-soft focus-ring"
      />
    </label>
  );
}

function formatarDataLonga(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}
