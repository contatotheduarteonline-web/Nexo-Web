import React, { useMemo, useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Simulado, SimuladoDisciplineResult } from "../../types";
import {
  FileCheck,
  Plus,
  Clock,
  Layers,
  MessageSquare,
  Trash2,
  Globe,
  PenLine,
  Check,
  X,
  Copy,
  Percent,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartMetric = "desempenho" | "pontuacao";

/** Formata minutos como "01h30min" (ou "25min" quando menor que 1h). */
function formatHM(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}min`;
  return `${m}min`;
}

function scoreBadgeClass(pct: number): string {
  if (pct >= 80) return "bg-[#2BBF8A]/15 text-[#2BBF8A]";
  if (pct >= 60) return "bg-[#F4B544]/25 text-[#F4B544]";
  return "bg-[#F16D75]/15 text-[#F16D75]";
}

function barColor(pct: number): string {
  if (pct >= 80) return "#2BBF8A";
  if (pct >= 60) return "#F4B544";
  return "#F16D75";
}

export const SimuladosView: React.FC = () => {
  const { activeEdital, editais, simulados, addSimulado, deleteSimulado } = useStudy();

  // Edital ativo com fallback para o primeiro edital (mesmo comportamento do Histórico)
  const edital = activeEdital || editais[0] || null;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeSpent, setTimeSpent] = useState("");
  const [scoringSystem, setScoringSystem] = useState<"standard" | "cebraspe_certo_errado">("standard");
  const [comments, setComments] = useState("");
  const [disciplineScores, setDisciplineScores] = useState<Record<string, { total: number; correct: number; wrong: number }>>({});
  const [chartMetric, setChartMetric] = useState<ChartMetric>("desempenho");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const banca = useMemo(() => {
    const ed = editais.find((e) => e.id === edital?.id);
    return ed?.banca || "";
  }, [editais, edital]);

  const handleDisciplineScoreChange = (discId: string, field: "total" | "correct" | "wrong", val: number) => {
    setDisciplineScores((prev) => {
      const current = prev[discId] || { total: 0, correct: 0, wrong: 0 };
      return { ...prev, [discId]: { ...current, [field]: val } };
    });
  };

  const totals = useMemo(() => {
    return (edital?.disciplines || []).reduce(
      (acc, disc) => {
        const entry = disciplineScores[disc.id] || { total: 0, correct: 0, wrong: 0 };
        acc.total += entry.total;
        acc.correct += entry.correct;
        acc.wrong += entry.wrong;
        return acc;
      },
      { total: 0, correct: 0, wrong: 0 }
    );
  }, [edital, disciplineScores]);

  const handleSaveSimulado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edital) return;

    const results: SimuladoDisciplineResult[] = [];
    let totalQ = 0;
    let totalC = 0;
    let totalW = 0;

    edital.disciplines.forEach((disc) => {
      const entry = disciplineScores[disc.id] || { total: 0, correct: 0, wrong: 0 };
      if (entry.total > 0) {
        totalQ += entry.total;
        totalC += entry.correct;
        totalW += entry.wrong;
        const accuracyRate = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
        results.push({
          disciplineId: disc.id,
          disciplineName: disc.name,
          total: entry.total,
          correct: entry.correct,
          wrong: entry.wrong,
          blank: Math.max(0, entry.total - (entry.correct + entry.wrong)),
          accuracyRate,
        });
      }
    });

    const [h, m] = (timeSpent || "").split(":").map((v) => parseInt(v) || 0);
    const durationMinutes = h * 60 + m > 0 ? h * 60 + m : 240;

    const finalNetScore = scoringSystem === "cebraspe_certo_errado" ? totalC - totalW : totalC;
    const finalPct = totalQ > 0 ? Math.round((Math.max(0, finalNetScore) / totalQ) * 100) : 0;

    const scoringLabel =
      scoringSystem === "cebraspe_certo_errado"
        ? "Certo/Errado"
        : "Múltipla Escolha";
    const notesParts = [scoringLabel, comments.trim()].filter(Boolean);

    addSimulado({
      editalId: edital.id,
      title: title || `Simulado #${simulados.length + 1} - ${edital.title}`,
      date,
      durationMinutes,
      totalQuestions: totalQ,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalBlank: Math.max(0, totalQ - (totalC + totalW)),
      overallScorePercentage: finalPct,
      targetScorePercentage: 80,
      resultsByDiscipline: results,
      notes: notesParts.join(" • "),
    });

    setIsAddOpen(false);
    setTitle("");
    setTimeSpent("");
    setComments("");
    setDisciplineScores({});
    alert("📝 Simulado registrado com sucesso!");
  };

  const chartData = useMemo(() => {
    return [...simulados]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s, idx) => ({
        name: `Simulado ${idx + 1}`,
        data: s.date,
        desempenho: s.overallScorePercentage,
        pontuacao: s.totalCorrect - s.totalWrong,
      }));
  }, [simulados]);

  const lastSimulado = simulados.length
    ? [...simulados].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const modalityLabel = (sim: Simulado) => {
    if ((sim.notes || "").toLowerCase().includes("errado")) return "Certo/Errado";
    return "Múltipla Escolha";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold leading-none text-white sm:text-[36px]">
          Simulados
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#527DFF] px-4 py-2 text-[13px] font-bold text-white shadow-xs transition hover:bg-[#416CEB] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Novo Simulado
          </button>

          {edital && (
            <div className="flex items-center gap-2 rounded-xl border border-[#263447] bg-[#1D2B40] px-3.5 py-2 text-[13px] text-[#C4CEDB]">
              <Globe className="h-4 w-4 text-[#527DFF]" />
              <span className="max-w-[220px] truncate font-semibold">
                {edital.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resumo + Desempenho */}
      {simulados.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* Coluna de resumo */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
                Simulados Realizados
              </span>
              <div className="num-condensed mt-4 text-right text-2xl font-bold text-white">
                {simulados.length}
              </div>
            </div>

            {lastSimulado && (
              <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
                  Último Simulado
                </span>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="space-y-1 text-[12px] font-semibold">
                    <span className="block text-[#2BBF8A]">{lastSimulado.totalCorrect} acertos</span>
                    <span className="block text-[#58A6FF]">{lastSimulado.totalBlank} brancos</span>
                    <span className="block text-[#F16D75]">{lastSimulado.totalWrong} erros</span>
                  </div>
                  <div className="num-condensed text-2xl font-bold text-white">
                    {lastSimulado.overallScorePercentage}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico */}
          <div className="rounded-xl border border-[#263447] bg-[#1D2B40] p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#93A2B7]">
                Seu Desempenho
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChartMetric("desempenho")}
                  className={`rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] transition cursor-pointer ${
                    chartMetric === "desempenho"
                      ? "bg-[#527DFF]/15 text-[#527DFF]"
                      : "border border-[#263447] text-[#93A2B7] hover:text-white"
                  }`}
                >
                  Desempenho
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("pontuacao")}
                  className={`rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] transition cursor-pointer ${
                    chartMetric === "pontuacao"
                      ? "bg-[#2BBF8A]/15 text-[#2BBF8A]"
                      : "border border-[#263447] text-[#93A2B7] hover:text-white"
                  }`}
                >
                  Pontuação
                </button>
              </div>
            </div>

            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 16, right: 24, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#263447" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#93A2B7" }} stroke="#263447" />
                  <YAxis tick={{ fontSize: 11, fill: "#93A2B7" }} stroke="#263447" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#172235", borderRadius: "8px", border: "1px solid #263447", color: "#FFF" }}
                    labelStyle={{ color: "#93A2B7" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={chartMetric === "desempenho" ? "#8B5CF6" : "#2BBF8A"}
                    strokeWidth={3}
                    dot={{ r: 4, fill: chartMetric === "desempenho" ? "#8B5CF6" : "#2BBF8A" }}
                    activeDot={{ r: 6 }}
                    label={{
                      position: "top",
                      fontSize: 10,
                      fontWeight: 700,
                      fill: chartMetric === "desempenho" ? "#8B5CF6" : "#2BBF8A",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Lista de simulados */}
      {simulados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#263447] bg-[#1D2B40] p-12 text-center shadow-xs">
          <FileCheck className="mx-auto h-12 w-12 text-[#5B6B80]" />
          <h3 className="nx-title mt-4 text-white">Nenhum Simulado Registrado</h3>
          <p className="nx-body mx-auto mt-1 max-w-md text-[#93A2B7]">
            Registre suas notas de simulados para calcular pontuação líquida, acompanhar gráficos de evolução e identificar pontos fracos.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 rounded-xl bg-[#527DFF] px-4 py-2 text-[13px] font-bold text-white shadow-xs hover:bg-[#416CEB]"
          >
            Registrar Primeiro Simulado
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {[...simulados]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((sim) => {
              const isExpanded = expandedId === sim.id;
              return (
                <div
                  key={sim.id}
                  className="overflow-hidden rounded-xl border border-[#263447] bg-[#1D2B40] shadow-xs transition hover:border-[#32445E]"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedId(isExpanded ? null : sim.id)}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : sim.id)}
                    className="flex cursor-pointer items-center gap-3 px-3 py-3 transition hover:bg-[#172235]"
                  >
                    {/* Data */}
                    <div className="num-condensed w-[64px] shrink-0 text-[12px] text-[#93A2B7]">
                      {new Date(sim.date).toLocaleDateString("pt-BR")}
                    </div>

                    {/* Nome + estilo/banca */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-white">
                        {sim.title}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-[#93A2B7]">
                        {modalityLabel(sim)}
                        {banca ? ` • ${banca}` : ""}
                      </div>
                    </div>

                    {/* Duração */}
                    <div className="hidden items-center gap-1.5 text-[12px] text-[#93A2B7] sm:flex">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="num-condensed">{formatHM(sim.durationMinutes)}</span>
                    </div>

                    {/* Disciplinas */}
                    <div className="hidden items-center gap-1 text-[12px] text-[#93A2B7] md:flex">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="num-condensed">{sim.resultsByDiscipline?.length || 0}</span>
                    </div>

                    {/* Acertos / brancos / erros */}
                    <div className="num-condensed w-10 text-center text-[13px] font-semibold text-[#2BBF8A]">
                      {sim.totalCorrect}
                    </div>
                    <div className="num-condensed hidden w-10 text-center text-[13px] font-semibold text-[#58A6FF] sm:block">
                      {sim.totalBlank}
                    </div>
                    <div className="num-condensed w-10 text-center text-[13px] font-semibold text-[#F16D75]">
                      {sim.totalWrong}
                    </div>

                    {/* Score */}
                    <span
                      className={`num-condensed inline-flex h-7 min-w-[36px] items-center justify-center rounded-md px-1.5 text-[12px] font-bold ${scoreBadgeClass(sim.overallScorePercentage)}`}
                    >
                      {sim.overallScorePercentage}
                    </span>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={sim.notes ? "Ver comentários" : "Sem comentários"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : sim.id);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#172235] cursor-pointer ${
                          sim.notes ? "text-[#F4B544]" : "text-[#5B6B80]"
                        }`}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Excluir simulado"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Excluir este simulado?")) deleteSimulado(sim.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6B80] transition hover:bg-[#F16D75]/10 hover:text-[#F16D75] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronDown
                        className={`h-4 w-4 text-[#5B6B80] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Expansão: resultado por disciplina */}
                  {isExpanded && (
                    <div className="border-t border-[#263447] bg-[#0B1120] px-4 py-3">
                      {sim.notes && (
                        <p className="mb-2.5 text-[12px] text-[#93A2B7]">
                          <span className="font-bold uppercase tracking-wider text-[10px]">Comentários: </span>
                          {sim.notes}
                        </p>
                      )}
                      <div className="overflow-hidden rounded-lg border border-[#263447]">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="bg-[#172235] text-[#93A2B7]">
                              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Disciplina</th>
                              <th className="w-16 px-2 py-2 text-center font-semibold uppercase tracking-wider text-[10px]">Peso</th>
                              <th className="w-16 px-2 py-2 text-center"><PenLine className="mx-auto h-3.5 w-3.5" /></th>
                              <th className="w-16 px-2 py-2 text-center"><Check className="mx-auto h-3.5 w-3.5 text-[#2BBF8A]" /></th>
                              <th className="w-16 px-2 py-2 text-center"><X className="mx-auto h-3.5 w-3.5 text-[#F16D75]" /></th>
                              <th className="w-16 px-2 py-2 text-center"><Copy className="mx-auto h-3.5 w-3.5" /></th>
                              <th className="w-[140px] px-2 py-2 text-center"><Percent className="mx-auto h-3.5 w-3.5" /></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#263447]">
                            {(sim.resultsByDiscipline || []).map((dr) => (
                              <tr key={dr.disciplineId} className="text-[#C4CEDB]">
                                <td className="px-3 py-2 font-semibold text-white">
                                  {dr.disciplineName}
                                </td>
                                <td className="num-condensed px-2 py-2 text-center text-[#93A2B7]">1</td>
                                <td className="num-condensed px-2 py-2 text-center">{dr.total}</td>
                                <td className="num-condensed px-2 py-2 text-center font-semibold text-[#2BBF8A]">{dr.correct}</td>
                                <td className="num-condensed px-2 py-2 text-center font-semibold text-[#F16D75]">{dr.wrong}</td>
                                <td className="num-condensed px-2 py-2 text-center font-semibold text-[#58A6FF]">{dr.blank}</td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-[#263447]">
                                      <div
                                        className="h-full rounded-sm"
                                        style={{ width: `${dr.accuracyRate}%`, backgroundColor: barColor(dr.accuracyRate) }}
                                      />
                                    </div>
                                    <span className="num-condensed w-8 text-right text-[11px] font-bold text-white">
                                      {dr.accuracyRate}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Modal Novo Simulado */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#263447] bg-[#1D2B40] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="nx-title text-white">Novo Simulado</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5B6B80] transition hover:bg-[#172235] hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSimulado} className="mt-4 space-y-4 text-[13px]">
              {/* Campos principais */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#93A2B7]">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#263447] bg-[#0B1120] p-2.5 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#93A2B7]">Nome</label>
                  <input
                    type="text"
                    placeholder="Nome do Simulado"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#263447] bg-[#0B1120] p-2.5 text-white placeholder:text-[#5B6B80]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#93A2B7]">Estilo de Prova</label>
                  <select
                    value={scoringSystem}
                    onChange={(e) => setScoringSystem(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-[#263447] bg-[#0B1120] p-2.5 text-white [color-scheme:dark]"
                  >
                    <option value="standard">Múltipla Escolha</option>
                    <option value="cebraspe_certo_errado">Certo/Errado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#93A2B7]">Tempo Gasto</label>
                  <input
                    type="time"
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#263447] bg-[#0B1120] p-2.5 text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Tabela por disciplina */}
              <div className="overflow-x-auto rounded-lg border border-[#263447]">
                <table className="w-full min-w-[640px] text-[12px]">
                  <thead>
                    <tr className="bg-[#172235] text-[#93A2B7]">
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider text-[10px]">Disciplina</th>
                      <th className="w-14 px-2 py-2 text-center font-semibold uppercase tracking-wider text-[10px]">Peso</th>
                      <th className="w-16 px-2 py-2 text-center"><PenLine className="mx-auto h-3.5 w-3.5" /></th>
                      <th className="w-16 px-2 py-2 text-center"><Check className="mx-auto h-3.5 w-3.5 text-[#2BBF8A]" /></th>
                      <th className="w-16 px-2 py-2 text-center"><X className="mx-auto h-3.5 w-3.5 text-[#F16D75]" /></th>
                      <th className="w-16 px-2 py-2 text-center"><Copy className="mx-auto h-3.5 w-3.5 text-[#58A6FF]" /></th>
                      <th className="w-20 px-2 py-2 text-center"><Percent className="mx-auto h-3.5 w-3.5" /></th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#263447]">
                    {(edital?.disciplines || []).map((disc) => {
                      const entry = disciplineScores[disc.id] || { total: 0, correct: 0, wrong: 0 };
                      const blank = Math.max(0, entry.total - (entry.correct + entry.wrong));
                      const rate = entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0;
                      const isUsed = entry.total > 0;
                      return (
                        <tr key={disc.id} className={isUsed ? "" : "opacity-70"}>
                          <td className="px-3 py-2 font-semibold text-white">{disc.name}</td>
                          <td className="num-condensed px-2 py-2 text-center text-[#93A2B7]">{disc.weight}</td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={entry.total}
                              onChange={(e) => handleDisciplineScoreChange(disc.id, "total", parseInt(e.target.value) || 0)}
                              className="num-condensed w-full rounded-md border border-[#263447] bg-[#0B1120] p-1 text-center text-white"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={entry.correct}
                              onChange={(e) => handleDisciplineScoreChange(disc.id, "correct", parseInt(e.target.value) || 0)}
                              className="num-condensed w-full rounded-md border border-[#263447] bg-[#0B1120] p-1 text-center font-bold text-[#2BBF8A]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={entry.wrong}
                              onChange={(e) => handleDisciplineScoreChange(disc.id, "wrong", parseInt(e.target.value) || 0)}
                              className="num-condensed w-full rounded-md border border-[#263447] bg-[#0B1120] p-1 text-center font-bold text-[#F16D75]"
                            />
                          </td>
                          <td className="num-condensed px-2 py-2 text-center font-semibold text-[#58A6FF]">{blank}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-[#263447]">
                                <div
                                  className="h-full rounded-sm transition-all"
                                  style={{ width: `${rate}%`, backgroundColor: barColor(rate) }}
                                />
                              </div>
                              <span className="num-condensed w-7 text-right text-[10.5px] font-bold text-white">{rate}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {isUsed && (
                              <button
                                type="button"
                                title="Zerar disciplina"
                                onClick={() =>
                                  setDisciplineScores((prev) => ({
                                    ...prev,
                                    [disc.id]: { total: 0, correct: 0, wrong: 0 },
                                  }))
                                }
                                className="text-[#5B6B80] transition hover:text-[#F16D75] cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#172235]">
                      <td className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#93A2B7]">
                        Resultado
                      </td>
                      <td className="px-2 py-2" />
                      <td className="num-condensed px-2 py-2 text-center font-bold text-white">{totals.total}</td>
                      <td className="num-condensed px-2 py-2 text-center font-bold text-[#2BBF8A]">{totals.correct}</td>
                      <td className="num-condensed px-2 py-2 text-center font-bold text-[#F16D75]">{totals.wrong}</td>
                      <td className="num-condensed px-2 py-2 text-center font-bold text-[#58A6FF]">
                        {Math.max(0, totals.total - (totals.correct + totals.wrong))}
                      </td>
                      <td className="px-2 py-2" colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Comentários */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#93A2B7]">Comentários</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#263447] bg-[#0B1120] p-2.5 text-white placeholder:text-[#5B6B80]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-[#263447] px-4 py-2 font-semibold text-[#C4CEDB] transition hover:bg-[#172235] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#527DFF] px-4 py-2 font-bold text-white shadow-xs transition hover:bg-[#416CEB] cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
