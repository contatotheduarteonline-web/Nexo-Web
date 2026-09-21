import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { WeeklyScheduleBlock, Discipline } from "../../types";
import {
  CalendarDays,
  Plus,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  Sparkles,
  Sliders,
  X,
  Layers,
} from "lucide-react";

export const QuadroSemanalView: React.FC = () => {
  const {
    activeEdital,
    activePlan,
    updateStudyPlan,
    launchStudySessionForTopic,
    metrics,
    setActiveTab,
  } = useStudy();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<"seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom">("seg");
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("");
  const [blockDurationMinutes, setBlockDurationMinutes] = useState<number>(90);

  if (!activePlan) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
        <CalendarDays className="mx-auto h-12 w-12 text-[#737D89]" />
        <h3 className="mt-3 text-base font-bold text-[#374151] dark:text-white">
          Nenhum Plano Ativo
        </h3>
        <p className="mt-1 text-xs text-[#737D89] dark:text-[#94A3B8]">
          Ative um plano de estudos para visualizar seu quadro semanal.
        </p>
        <button
          onClick={() => setActiveTab("planos")}
          className="mt-4 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#D97706]"
        >
          Ver Planos
        </button>
      </div>
    );
  }

  const days: Array<{
    key: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
    label: string;
    shortLabel: string;
  }> = [
    { key: "seg", label: "Segunda-feira", shortLabel: "SEG" },
    { key: "ter", label: "Terça-feira", shortLabel: "TER" },
    { key: "qua", label: "Quarta-feira", shortLabel: "QUA" },
    { key: "qui", label: "Quinta-feira", shortLabel: "QUI" },
    { key: "sex", label: "Sexta-feira", shortLabel: "SEX" },
    { key: "sab", label: "Sábado", shortLabel: "SÁB" },
    { key: "dom", label: "Domingo", shortLabel: "DOM" },
  ];

  const weeklySchedule = activePlan.weeklySchedule || [];

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciplineId) return;

    const dayBlocks = weeklySchedule.filter((b) => b.day === selectedDay);
    const newBlock: WeeklyScheduleBlock = {
      id: `ws-${Date.now()}`,
      day: selectedDay,
      disciplineId: selectedDisciplineId,
      targetMinutes: blockDurationMinutes,
      order: dayBlocks.length + 1,
    };

    updateStudyPlan(activePlan.id, {
      weeklySchedule: [...weeklySchedule, newBlock],
    });

    setIsAddModalOpen(false);
    setSelectedDisciplineId("");
  };

  const handleRemoveBlock = (blockId: string) => {
    const updated = weeklySchedule.filter((b) => b.id !== blockId);
    updateStudyPlan(activePlan.id, {
      weeklySchedule: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:flex-row sm:items-center dark:border-[#1E293B] dark:bg-[#0F172A]">
        <div>
          <h2 className="text-xl font-bold text-[#374151] dark:text-white">
            Quadro Semanal
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("ciclo")}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-[#E2E8F0] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Alternar p/ Ciclo Dinâmico</span>
          </button>

          <button
            onClick={() => {
              setSelectedDay("seg");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706]"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Bloco</span>
          </button>
        </div>
      </div>

      {/* Weekly Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
          <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
            Meta Semanal
          </span>
          <p className="mt-1 text-lg font-black text-[#374151] dark:text-white">
            {activePlan.weeklyGoalHours} horas
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
          <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
            Horas no Quadro
          </span>
          <p className="mt-1 text-lg font-black text-[#F59E0B] dark:text-[#FBBF24]">
            {(weeklySchedule.reduce((acc, b) => acc + b.targetMinutes, 0) / 60).toFixed(1)} horas
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
          <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
            Total de Blocos
          </span>
          <p className="mt-1 text-lg font-black text-[#374151] dark:text-white">
            {weeklySchedule.length} sessões
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
          <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
            Estudado nesta semana
          </span>
          <p className="mt-1 text-lg font-black text-[#F59E0B]">
            {metrics.hoursThisWeek}h
          </p>
        </div>
      </div>

      {/* 7 Columns Day Schedule Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {days.map(({ key, label, shortLabel }) => {
          const dayBlocks = weeklySchedule.filter((b) => b.day === key);
          const plannedDailyHours = activePlan.dailyAvailability[key] || 0;
          const scheduledMinutes = dayBlocks.reduce((acc, b) => acc + b.targetMinutes, 0);
          const scheduledHours = (scheduledMinutes / 60).toFixed(1);

          return (
            <div
              key={key}
              className="flex min-h-[380px] flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-xs dark:border-[#1E293B] dark:bg-[#0F172A]"
            >
              <div>
                {/* Column Header */}
                <div className="border-b border-[#E2E8F0] pb-2.5 dark:border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#374151] dark:text-white">
                      {shortLabel}
                    </span>
                    <span className="rounded-md bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-bold text-[#737D89] dark:bg-[#1E293B] dark:text-[#94A3B8]">
                      {scheduledHours}h / {plannedDailyHours}h
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[#737D89]">{label}</p>
                </div>

                {/* Day Blocks List */}
                <div className="mt-3 space-y-2">
                  {dayBlocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E2E8F0] p-4 text-center dark:border-[#1E293B]">
                      <span className="text-[11px] text-[#737D89]">Nenhum bloco</span>
                    </div>
                  ) : (
                    dayBlocks.map((block) => {
                      const disc = activeEdital?.disciplines.find((d) => d.id === block.disciplineId);
                      if (!disc) return null;

                      return (
                        <div
                          key={block.id}
                          className="group relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 transition-all duration-200 hover:border-[#F59E0B] hover:bg-white hover:shadow-xs dark:border-[#1E293B] dark:bg-[#1E293B]/60 dark:hover:bg-[#1E293B]"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: disc.color }}
                              />
                              <h5 className="text-[11px] font-bold text-[#374151] line-clamp-1 dark:text-white">
                                {disc.name}
                              </h5>
                            </div>

                            <button
                              onClick={() => handleRemoveBlock(block.id)}
                              className="opacity-0 transition-opacity group-hover:opacity-100 text-[#737D89] hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-[#737D89] dark:text-[#94A3B8]">
                            <span>{block.targetMinutes} min</span>
                            <button
                              onClick={() => launchStudySessionForTopic(disc.id)}
                              className="flex items-center gap-1 font-bold text-[#F59E0B] hover:underline dark:text-[#FBBF24]"
                            >
                              <Play className="h-2.5 w-2.5 fill-[#F59E0B] dark:fill-[#FBBF24]" />
                              <span>Estudar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Add button for this day */}
              <button
                onClick={() => {
                  setSelectedDay(key);
                  setIsAddModalOpen(true);
                }}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#E2E8F0] py-1.5 text-[11px] font-bold text-[#737D89] hover:border-[#F59E0B] hover:bg-amber-50 hover:text-[#F59E0B] dark:border-[#1E293B] dark:hover:bg-amber-950/20 dark:hover:text-[#FBBF24]"
              >
                <Plus className="h-3 w-3" />
                <span>Adicionar</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Block Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl dark:border-[#1E293B] dark:bg-[#0F172A]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
              <h3 className="text-base font-bold text-[#374151] dark:text-white">
                Adicionar Bloco de Estudo
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-[#737D89] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#374151] dark:text-white">
                  Dia da Semana
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
                >
                  {days.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] dark:text-white">
                  Disciplina
                </label>
                <select
                  required
                  value={selectedDisciplineId}
                  onChange={(e) => setSelectedDisciplineId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
                >
                  <option value="">Selecione a disciplina...</option>
                  {activeEdital?.disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Peso {d.weight})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] dark:text-white">
                  Duração da Sessão
                </label>
                <select
                  value={blockDurationMinutes}
                  onChange={(e) => setBlockDurationMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:bg-white focus:outline-hidden dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1h)</option>
                  <option value={75}>75 minutos (1h15)</option>
                  <option value={90}>90 minutos (1h30)</option>
                  <option value={120}>120 minutos (2h)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#737D89] hover:bg-[#F8FAFC]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedDisciplineId}
                  className="rounded-xl bg-[#F59E0B] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706] disabled:opacity-40"
                >
                  Adicionar ao Quadro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
