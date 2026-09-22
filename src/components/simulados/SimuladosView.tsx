import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Simulado, SimuladoDisciplineResult } from "../../types";
import {
  FileCheck,
  Plus,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertCircle,
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

export const SimuladosView: React.FC = () => {
  const { activeEdital, simulados, addSimulado, deleteSimulado } = useStudy();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [scoringSystem, setScoringSystem] = useState<"standard" | "cebraspe_certo_errado">("standard");
  const [disciplineScores, setDisciplineScores] = useState<Record<string, { total: number; correct: number; wrong: number }>>({});

  const handleDisciplineScoreChange = (discId: string, field: "total" | "correct" | "wrong", val: number) => {
    setDisciplineScores((prev) => {
      const current = prev[discId] || { total: 10, correct: 8, wrong: 2 };
      return {
        ...prev,
        [discId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleSaveSimulado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdital) return;

    const results: SimuladoDisciplineResult[] = [];
    let totalQ = 0;
    let totalC = 0;
    let totalW = 0;

    activeEdital.disciplines.forEach((disc) => {
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

    const finalNetScore = scoringSystem === "cebraspe_certo_errado" ? totalC - totalW : totalC;
    const finalPct = totalQ > 0 ? Math.round((Math.max(0, finalNetScore) / totalQ) * 100) : 0;

    addSimulado({
      editalId: activeEdital.id,
      title: title || `Simulado #${simulados.length + 1} - ${activeEdital.title}`,
      date,
      durationMinutes: 240,
      totalQuestions: totalQ,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalBlank: Math.max(0, totalQ - (totalC + totalW)),
      overallScorePercentage: finalPct,
      targetScorePercentage: 80,
      resultsByDiscipline: results,
      notes: scoringSystem === "cebraspe_certo_errado" ? "Regra Cebraspe (1 errada anula 1 certa)" : "Múltipla Escolha Padrão",
    });

    setIsAddOpen(false);
    setTitle("");
    alert("📝 Simulado registrado com sucesso!");
  };

  const chartData = simulados.map((s, idx) => ({
    name: `Simulado ${idx + 1}`,
    data: s.date,
    pontosLiquidos: s.totalCorrect - s.totalWrong,
    aproveitamento: s.overallScorePercentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#252B38]">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Simulados
          </h2>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar Simulado
        </button>
      </div>

      {/* Evolution Chart */}
      {simulados.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Evolução de Aproveitamento nos Simulados (%)
          </h3>
          <p className="text-xs text-slate-500">Histórico de pontuação líquida</p>

          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1E293B", borderRadius: "8px", border: "none", color: "#FFF" }}
                  formatter={(value: any) => [`${value}%`, "Aproveitamento"]}
                />
                <Line
                  type="monotone"
                  dataKey="aproveitamento"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#F59E0B" }}
                  activeDot={{ r: 7, fill: "#FBBF24" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Simulados Cards Grid */}
      {simulados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <FileCheck className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            Nenhum Simulado Registrado
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Registre suas notas de simulados para calcular pontuação líquida, acompanhar gráficos de evolução e identificar pontos fracos.
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            Registrar Primeiro Simulado
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulados.map((sim) => (
            <div
              key={sim.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-[#252B38]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {new Date(sim.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      sim.overallScorePercentage >= 75
                        ? "bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-500/15 dark:text-[#FBBF24] dark:border-amber-500/30"
                        : sim.overallScorePercentage >= 60
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {sim.overallScorePercentage}% Acerto
                  </span>
                </div>

                <h4 className="mt-2 font-bold text-slate-900 dark:text-white">
                  {sim.title}
                </h4>
                <p className="text-xs text-slate-500">
                  {sim.notes || "Simulado Regular"}
                </p>

                {/* Score breakdown pills */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Questões</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{sim.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#F59E0B] uppercase dark:text-[#FBBF24]">Acertos</span>
                    <span className="font-bold text-[#F59E0B] dark:text-[#FBBF24]">{sim.totalCorrect}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-red-500 uppercase">Erros</span>
                    <span className="font-bold text-red-500">{sim.totalWrong}</span>
                  </div>
                </div>

                {/* Disciplines breakdown */}
                {sim.resultsByDiscipline && sim.resultsByDiscipline.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Por Disciplina
                    </span>
                    {sim.resultsByDiscipline.map((dr) => (
                      <div key={dr.disciplineId} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[160px]">{dr.disciplineName}</span>
                        <span className="font-bold">
                          {dr.correct}/{dr.total} ({dr.total > 0 ? Math.round((dr.correct / dr.total) * 100) : 0}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span className="font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                  Líquidos: {sim.totalCorrect - sim.totalWrong} pts
                </span>
                <button
                  onClick={() => {
                    if (confirm("Excluir este simulado?")) {
                      deleteSimulado(sim.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Simulado Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#252B38]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registrar Resultado de Simulado
            </h3>

            <form onSubmit={handleSaveSimulado} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Título do Simulado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Simulado #1 - Gran / Estratégia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data de Realização
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Regra de Pontuação da Banca
                </label>
                <select
                  value={scoringSystem}
                  onChange={(e) => setScoringSystem(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="standard">Múltipla Escolha (1 ponto por acerto, sem penalidade de erro)</option>
                  <option value="cebraspe_certo_errado">Certo e Errado Cebraspe (1 questão errada anula 1 certa)</option>
                </select>
              </div>

              {/* Questions per discipline */}
              <div className="space-y-3">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Pontuação por Disciplina
                </label>
                {activeEdital?.disciplines.map((disc) => {
                  const entry = disciplineScores[disc.id] || { total: 0, correct: 0, wrong: 0 };
                  return (
                    <div
                      key={disc.id}
                      className="grid grid-cols-4 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                    >
                      <span className="col-span-1 truncate font-semibold text-slate-800 dark:text-slate-200">
                        {disc.name}
                      </span>
                      <div>
                        <label className="text-[10px] text-slate-400">Total</label>
                        <input
                          type="number"
                          min="0"
                          value={entry.total}
                          onChange={(e) => handleDisciplineScoreChange(disc.id, "total", parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 p-1 text-center dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#F59E0B] font-bold dark:text-[#FBBF24]">Acertos</label>
                        <input
                          type="number"
                          min="0"
                          value={entry.correct}
                          onChange={(e) => handleDisciplineScoreChange(disc.id, "correct", parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 p-1 text-center font-bold text-[#F59E0B] dark:border-slate-700 dark:bg-slate-800 dark:text-[#FBBF24]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-red-500 font-bold">Erros</label>
                        <input
                          type="number"
                          min="0"
                          value={entry.wrong}
                          onChange={(e) => handleDisciplineScoreChange(disc.id, "wrong", parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-slate-200 p-1 text-center font-bold text-red-500 dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 font-bold text-white shadow-xs"
                >
                  Salvar Simulado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
