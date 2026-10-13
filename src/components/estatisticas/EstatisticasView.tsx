import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export const EstatisticasView: React.FC = () => {
  const { activeEdital, studySessions, metrics } = useStudy();

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  // Aggregate hours by discipline
  const disciplineHoursData = (activeEdital?.disciplines || []).map((disc) => {
    const sessions = studySessions.filter((s) => s.disciplineId === disc.id);
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalQuestions = sessions.reduce((acc, s) => acc + s.questionsDone, 0);
    const correctQuestions = sessions.reduce((acc, s) => acc + s.questionsCorrect, 0);
    const accRate = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

    return {
      name: disc.name,
      hours: Number((totalMinutes / 60).toFixed(1)),
      color: disc.color,
      questions: totalQuestions,
      accuracy: accRate,
    };
  }).filter((d) => d.hours > 0 || d.questions > 0);

  // Group by day of week
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weeklyDaysData = daysOfWeek.map((dayName, idx) => {
    // calculate dummy/recent distribution for visualization
    const sessionsOnDay = studySessions.filter((s) => {
      const d = new Date(s.date);
      return d.getDay() === idx;
    });
    const hours = sessionsOnDay.reduce((acc, s) => acc + s.durationMinutes / 60, 0);
    return {
      day: dayName,
      horas: Number(hours.toFixed(1)),
    };
  });

  // Group by modality
  const modalityData = ["Teoria", "Questões", "Revisão", "Lei Seca", "Videoaula"].map((mod) => {
    const sessions = studySessions.filter((s) => s.modality === mod);
    const totalMin = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      name: mod,
      value: totalMin,
      hours: Number((totalMin / 60).toFixed(1)),
    };
  }).filter((m) => m.value > 0);

  const MODALITY_COLORS = ["#527DFF", "#F4B544", "#2BBF8A", "#0B1120", "#39475C"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-[#263447] dark:bg-[#1D2B40]">
        <div>
          <h2 className="text-2xl font-bold text-white dark:text-white">
            Estatísticas
          </h2>
        </div>

        {/* Time Filter */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-[#172235]">
          <button
            onClick={() => setTimeRange("7d")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              timeRange === "7d"
                ? "bg-[#527DFF] text-white shadow-xs"
                : "text-white hover:text-white dark:text-white"
            }`}
          >
            Últimos 7 Dias
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              timeRange === "30d"
                ? "bg-[#527DFF] text-white shadow-xs"
                : "text-white hover:text-white dark:text-white"
            }`}
          >
            Últimos 30 Dias
          </button>
          <button
            onClick={() => setTimeRange("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              timeRange === "all"
                ? "bg-[#527DFF] text-white shadow-xs"
                : "text-white hover:text-white dark:text-white"
            }`}
          >
            Todo o Histórico
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
          <span className="text-xs font-semibold text-white uppercase">Horas Totais</span>
          <div className="mt-2 text-2xl font-bold text-white dark:text-white">
            {metrics.totalHoursStudied}h
          </div>
          <p className="mt-1 text-xs text-white">{studySessions.length} sessões registradas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
          <span className="text-xs font-semibold text-white uppercase">Questões Feitas</span>
          <div className="mt-2 text-2xl font-bold text-white dark:text-white">
            {metrics.totalQuestionsDone}
          </div>
          <p className="mt-1 text-xs text-white">{metrics.totalQuestionsCorrect} corretas ({metrics.overallAccuracyRate}%)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
          <span className="text-xs font-semibold text-white uppercase">Média Diária</span>
          <div className="mt-2 text-2xl font-bold text-[#F4B544] dark:text-[#F4B544]">
            {(metrics.hoursThisWeek / 7).toFixed(1)}h/dia
          </div>
          <p className="mt-1 text-xs text-white">Ritmo sustentável</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
          <span className="text-xs font-semibold text-white uppercase">Cobertura do Edital</span>
          <div className="mt-2 text-2xl font-bold text-[#F4B544] dark:text-[#F4B544]">
            {metrics.editalStudiedPercentage}%
          </div>
          <p className="mt-1 text-xs text-white">{metrics.studiedTopicsCount} de {metrics.totalTopicsCount} tópicos</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Horas por Dia (Bar Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8 dark:border-[#263447] dark:bg-[#1D2B40]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white dark:text-white">
              Horas Líquidas por Dia da Semana
            </h3>
            <span className="text-xs text-white">Tempo cronometrado</span>
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#263447" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#93A2B7" />
                <YAxis tick={{ fontSize: 12 }} stroke="#93A2B7" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#172235", borderRadius: "8px", border: "none", color: "#FFF" }}
                  formatter={(value: any) => [`${value}h`, "Horas Estudadas"]}
                />
                <Bar dataKey="horas" fill="#527DFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modalidade de Estudo (Pie Chart) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-4 dark:border-[#263447] dark:bg-[#1D2B40]">
          <h3 className="text-base font-bold text-white dark:text-white">
            Distribuição por Modalidade
          </h3>
          <p className="text-xs text-white">Teoria x Questões x Revisão</p>

          <div className="mt-4 flex h-60 items-center justify-center">
            {modalityData.length === 0 ? (
              <div className="text-xs text-white">Sem dados suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modalityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {modalityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MODALITY_COLORS[index % MODALITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${Math.round(Number(value) / 60)}h`, "Tempo"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            {modalityData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: MODALITY_COLORS[idx % MODALITY_COLORS.length] }}
                  />
                  <span className="text-white dark:text-white">{item.name}</span>
                </div>
                <span className="font-semibold text-white dark:text-white">{item.hours}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disciplines Horas & Acertos Breakdown Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-[#263447] dark:bg-[#1D2B40]">
        <h3 className="text-base font-bold text-white dark:text-white">
          Desempenho Detalhado por Disciplina
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-white uppercase dark:border-[#263447] dark:bg-[#172235]/40">
              <tr>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-3 py-3 text-center">Horas Estudadas</th>
                <th className="px-3 py-3 text-center">Questões Feitas</th>
                <th className="px-3 py-3 text-center">Taxa de Acertos</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {disciplineHoursData.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-[#172235]/40">
                  <td className="px-4 py-3 font-semibold text-white dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold">{item.hours}h</td>
                  <td className="px-3 py-3 text-center">{item.questions}</td>
                  <td className="px-3 py-3 text-center font-bold">
                    {item.questions > 0 ? (
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] ${
                          item.accuracy >= 80
                            ? "bg-[#15382F] text-[#2BBF8A] dark:bg-[#15382F] dark:text-[#2BBF8A]"
                            : item.accuracy >= 65
                            ? "bg-[#342B1C] text-[#F4B544] dark:bg-[#342B1C] dark:text-[#F4B544]"
                            : "bg-[#3B2029] text-[#F16D75] dark:bg-[#3B2029] dark:text-[#F16D75]"
                        }`}
                      >
                        {item.accuracy}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.accuracy >= 80 ? (
                      <span className="text-[#2BBF8A] font-medium">🟢 Excelente domínio</span>
                    ) : item.accuracy >= 65 ? (
                      <span className="text-[#F4B544] font-medium">🟡 Bom / Reforçar</span>
                    ) : (
                      <span className="text-[#F16D75] font-medium">🔴 Foco prioritário</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
