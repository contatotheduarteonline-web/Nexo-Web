import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  Target,
  Clock,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  Flame,
  Award,
  Save,
  Check,
  RotateCcw,
  Sliders,
  ChevronRight,
} from "lucide-react";

export const MetasView: React.FC = () => {
  const {
    userSettings,
    updateUserSettings,
    activePlan,
    updateStudyPlan,
    metrics,
    studySessions,
    activeEdital,
    setActiveTab,
  } = useStudy();

  // Local state for goals form
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(
    userSettings.dailyGoalHours || 4
  );
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(
    activePlan?.weeklyGoalHours || userSettings.weeklyGoalHours || 20
  );
  const [weeklyGoalQuestions, setWeeklyGoalQuestions] = useState<number>(
    userSettings.weeklyGoalQuestions || 300
  );
  const [targetAccuracy, setTargetAccuracy] = useState<number>(80);

  // Daily availability breakdown
  const [dailyAvailability, setDailyAvailability] = useState({
    seg: activePlan?.dailyAvailability?.seg ?? 4,
    ter: activePlan?.dailyAvailability?.ter ?? 4,
    qua: activePlan?.dailyAvailability?.qua ?? 4,
    qui: activePlan?.dailyAvailability?.qui ?? 4,
    sex: activePlan?.dailyAvailability?.sex ?? 4,
    sab: activePlan?.dailyAvailability?.sab ?? 4,
    dom: activePlan?.dailyAvailability?.dom ?? 2,
  });

  const [isSavedToast, setIsSavedToast] = useState(false);

  // Sync state when activePlan or userSettings change
  React.useEffect(() => {
    if (activePlan) {
      setWeeklyGoalHours(activePlan.weeklyGoalHours || userSettings.weeklyGoalHours || 20);
      if (activePlan.dailyAvailability) {
        setDailyAvailability(activePlan.dailyAvailability);
      }
    }
  }, [activePlan]);

  // Calculate current week metrics
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const weeklyQuestionsDone = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return studySessions
      .filter((s) => new Date(s.date) >= startOfWeek)
      .reduce((acc, s) => acc + (s.questionsDone || 0), 0);
  }, [studySessions]);

  const questionsProgressPercent = weeklyGoalQuestions > 0
    ? Math.min(100, Math.round((weeklyQuestionsDone / weeklyGoalQuestions) * 100))
    : 0;

  const dailyHoursDone = metrics.hoursToday;
  const dailyHoursPercent = dailyGoalHours > 0
    ? Math.min(100, Math.round((dailyHoursDone / dailyGoalHours) * 100))
    : 0;

  const weeklyHoursDone = metrics.hoursThisWeek;
  const weeklyHoursPercent = weeklyGoalHours > 0
    ? Math.min(100, Math.round((weeklyHoursDone / weeklyGoalHours) * 100))
    : 0;

  // Handle saving goals
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDailyHours = Math.max(0, Number(dailyGoalHours) || 0);
    const cleanWeeklyHours = Math.max(0, Number(weeklyGoalHours) || 0);
    const cleanQuestions = Math.max(0, Number(weeklyGoalQuestions) || 0);

    // 1. Update Global User Settings
    updateUserSettings({
      dailyGoalHours: cleanDailyHours,
      weeklyGoalHours: cleanWeeklyHours,
      weeklyGoalQuestions: cleanQuestions,
    });

    // 2. If an active study plan exists, update the plan's goal and daily availability
    if (activePlan) {
      updateStudyPlan(activePlan.id, {
        weeklyGoalHours: cleanWeeklyHours,
        dailyAvailability,
      });
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleDayAvailabilityChange = (day: keyof typeof dailyAvailability, val: number) => {
    const updated = { ...dailyAvailability, [day]: Math.max(0, val) };
    setDailyAvailability(updated);
    const sum = Object.values(updated).reduce((a: number, b: number) => a + b, 0);
    setWeeklyGoalHours(sum);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#252B38]">
        <div>
          <h2 className="text-2xl font-black text-white dark:text-white uppercase tracking-tight">
            Metas de Estudo
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {isSavedToast && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 animate-in fade-in">
              <Check className="h-4 w-4" />
              Metas salvas com sucesso!
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards (Real-time Progress) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Meta Diária */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-white">
              Meta Diária (Hoje)
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white dark:text-white">
              {dailyHoursDone}h
            </span>
            <span className="text-xs font-medium text-white dark:text-white">
              / {dailyGoalHours}h planejadas
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${dailyHoursPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-white dark:text-white">
            {dailyHoursPercent >= 100 ? "🎉 Meta atingida hoje!" : `${dailyHoursPercent}% concluído hoje`}
          </p>
        </div>

        {/* Meta Semanal de Horas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-white">
              Meta Semanal (Horas)
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white dark:text-white">
              {weeklyHoursDone}h
            </span>
            <span className="text-xs font-medium text-white dark:text-white">
              / {weeklyGoalHours}h semanais
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${weeklyHoursPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-white dark:text-white">
            {weeklyHoursPercent >= 100 ? "🔥 Meta semanal batida!" : `${weeklyHoursPercent}% da meta semanal`}
          </p>
        </div>

        {/* Meta de Questões */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-white">
              Questões na Semana
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white dark:text-white">
              {weeklyQuestionsDone}
            </span>
            <span className="text-xs font-medium text-white dark:text-white">
              / {weeklyGoalQuestions} questões
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${questionsProgressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-white dark:text-white">
            {questionsProgressPercent >= 100 ? "🎯 Meta de questões batida!" : `${questionsProgressPercent}% concluído`}
          </p>
        </div>

        {/* Sequência / Taxa de Acertos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-white">
              Taxa Geral de Acertos
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white dark:text-white">
              {metrics.overallAccuracyRate}%
            </span>
            <span className="text-xs font-medium text-white dark:text-white">
              (Alvo: {targetAccuracy}%)
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.overallAccuracyRate >= targetAccuracy ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, metrics.overallAccuracyRate)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-white dark:text-white">
            {metrics.totalQuestionsCorrect} de {metrics.totalQuestionsDone} acertos no total
          </p>
        </div>
      </div>

      {/* Form de Configuração e Ajuste de Metas */}
      <form onSubmit={handleSaveGoals} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Sliders className="h-5 w-5 text-[#F59E0B]" />
            <h3 className="text-base font-bold text-white dark:text-white">
              Configurar Objetivos & Cargas Horárias
            </h3>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Meta Diária (Horas) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Meta Diária (Horas Líquidas)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="16"
                  step="0.5"
                  value={dailyGoalHours}
                  onChange={(e) => setDailyGoalHours(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs font-bold text-white dark:text-white">horas/dia</span>
              </div>
              <p className="mt-1 text-[11px] text-white">
                Tempo recomendado para manter a constância diária.
              </p>
            </div>

            {/* Meta Semanal de Questões */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Meta Semanal de Questões
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="2000"
                  step="10"
                  value={weeklyGoalQuestions}
                  onChange={(e) => setWeeklyGoalQuestions(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs font-bold text-white dark:text-white">questões</span>
              </div>
              <p className="mt-1 text-[11px] text-white">
                Resolução prática semanal para fixação dos tópicos do edital.
              </p>
            </div>

            {/* Meta Alvo de Precisão (%) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                Meta Alvo de Acertos (%)
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="1"
                  value={targetAccuracy}
                  onChange={(e) => setTargetAccuracy(parseInt(e.target.value, 10) || 80)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-white focus:border-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs font-bold text-white dark:text-white">% de acertos</span>
              </div>
              <p className="mt-1 text-[11px] text-white">
                Índice de aproveitamento desejado para aprovação no concurso.
              </p>
            </div>
          </div>

          {/* Distribuição Semanal por Dia */}
          <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white dark:text-white">
                  Disponibilidade & Meta Diária por Dia da Semana
                </h4>
                <p className="text-[11px] text-white dark:text-white">
                  Ajuste as horas disponíveis em cada dia para calibrar automaticamente a meta semanal.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-white">Total da semana: </span>
                <span className="text-sm font-black text-[#F59E0B] dark:text-[#FBBF24]">{weeklyGoalHours}h</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-7">
              {[
                { key: "seg", label: "Segunda" },
                { key: "ter", label: "Terça" },
                { key: "qua", label: "Quarta" },
                { key: "qui", label: "Quinta" },
                { key: "sex", label: "Sexta" },
                { key: "sab", label: "Sábado" },
                { key: "dom", label: "Domingo" },
              ].map((d) => {
                const dayKey = d.key as keyof typeof dailyAvailability;
                return (
                  <div
                    key={d.key}
                    className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700/60 dark:bg-slate-800/40"
                  >
                    <span className="text-[11px] font-bold text-white dark:text-white">
                      {d.label}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="16"
                      step="0.5"
                      value={dailyAvailability[dayKey]}
                      onChange={(e) =>
                        handleDayAvailabilityChange(dayKey, parseFloat(e.target.value) || 0)
                      }
                      className="mt-2 w-16 text-center rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-black text-slate-900 focus:border-[#F59E0B] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="mt-1 text-[10px] text-white">horas</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-98"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Metas</span>
            </button>
          </div>
        </div>
      </form>

      {/* Dica de Consistência e Atalhos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#252B38]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white dark:text-white">
                Deseja sincronizar suas metas com o Planejamento de Estudos?
              </h4>
              <p className="text-xs text-white dark:text-white">
                Seu ciclo e cronograma semanal serão ajustados automaticamente com as novas cargas horárias configuradas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("planejamento")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-white hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 transition"
          >
            <span>Ir para Planejamento</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
