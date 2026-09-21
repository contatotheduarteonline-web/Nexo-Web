import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { CycleStep, Discipline } from "../../types";
import {
  RotateCw,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Sliders,
  ChevronRight,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Award,
  Layers,
  Flame,
  Check,
} from "lucide-react";

export const CicloView: React.FC = () => {
  const {
    activeEdital,
    activePlan,
    studyPlans,
    updateStudyPlan,
    advanceCycleStep,
    resetCycleProgress,
    launchStudySessionForTopic,
    setActiveTab,
  } = useStudy();

  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [selectedDisciplineToAdd, setSelectedDisciplineToAdd] = useState<string>("");
  const [addBlockMinutes, setAddBlockMinutes] = useState<number>(60);

  if (!activePlan) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-12 text-center dark:border-[#1E293B] dark:bg-[#0F172A]">
        <Layers className="mx-auto h-12 w-12 text-[#737D89]" />
        <h3 className="mt-3 text-base font-bold text-[#374151] dark:text-white">
          Nenhum Plano de Estudos Ativo
        </h3>
        <p className="mt-1 text-xs text-[#737D89] dark:text-[#94A3B8]">
          Ative ou crie um plano de estudos para visualizar e rodar o ciclo.
        </p>
        <button
          onClick={() => setActiveTab("planos")}
          className="mt-4 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-5 py-2.5 text-xs font-bold text-white transition active:scale-98"
        >
          Ir para Meus Planos
        </button>
      </div>
    );
  }

  const cycleSteps = activePlan.cycle || [];
  const currentIndex = activePlan.currentCycleIndex || 0;
  const currentStep = cycleSteps[currentIndex] || cycleSteps[0];
  const currentDiscipline = activeEdital?.disciplines.find((d) => d.id === currentStep?.disciplineId);

  // Total cycle minutes
  const totalCycleMinutes = cycleSteps.reduce((acc, step) => acc + step.targetMinutes, 0);
  const totalCycleHours = (totalCycleMinutes / 60).toFixed(1);

  // Remaining minutes in current step
  const elapsedInStep = activePlan.currentStepElapsedMinutes || 0;
  const remainingInStep = Math.max(0, (currentStep?.targetMinutes || 60) - elapsedInStep);
  const stepProgressPct = currentStep ? Math.min(100, Math.round((elapsedInStep / currentStep.targetMinutes) * 100)) : 0;

  // Next steps in queue
  const nextSteps = cycleSteps.map((step, idx) => ({
    step,
    discipline: activeEdital?.disciplines.find((d) => d.id === step.disciplineId),
    idx,
    isCurrent: idx === currentIndex,
  }));

  const handleAddBlockToCycle = () => {
    if (!selectedDisciplineToAdd) return;
    const newStep: CycleStep = {
      id: `step-${Date.now()}`,
      disciplineId: selectedDisciplineToAdd,
      targetMinutes: addBlockMinutes,
      order: cycleSteps.length + 1,
    };
    updateStudyPlan(activePlan.id, {
      cycle: [...cycleSteps, newStep],
    });
    setSelectedDisciplineToAdd("");
  };

  const handleRemoveStep = (stepId: string) => {
    const updated = cycleSteps.filter((s) => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 }));
    updateStudyPlan(activePlan.id, {
      cycle: updated,
      currentCycleIndex: Math.min(currentIndex, Math.max(0, updated.length - 1)),
    });
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cycleSteps.length) return;

    const newCycle = [...cycleSteps];
    const temp = newCycle[index];
    newCycle[index] = newCycle[targetIdx];
    newCycle[targetIdx] = temp;

    const reordered = newCycle.map((s, i) => ({ ...s, order: i + 1 }));
    updateStudyPlan(activePlan.id, {
      cycle: reordered,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:flex-row sm:items-center dark:border-[#1E293B] dark:bg-[#0F172A]">
        <div>
          <h2 className="text-xl font-bold text-[#374151] dark:text-white">
            Ciclo de Estudos
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditingCycle(!isEditingCycle)}
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-bold text-[#374151] hover:bg-[#E2E8F0] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{isEditingCycle ? "Concluir Ajustes" : "Personalizar Blocos"}</span>
          </button>

          <button
            onClick={() => setActiveTab("planejamento")}
            className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Replanejar / Algoritmo</span>
          </button>
        </div>
      </div>

      {/* Active Step Highlight Banner */}
      {currentDiscipline && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-50/80 via-white to-white p-6 shadow-sm dark:border-amber-500/30 dark:from-[#2A1508]/60 dark:via-[#0F172A] dark:to-[#0F172A]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            {/* Left: Step Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F59E0B] text-xs font-black text-white">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#F59E0B] dark:text-[#FBBF24]">
                  Vez Atual no Ciclo (Bloco {currentIndex + 1} de {cycleSteps.length})
                </span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#737D89] shadow-2xs dark:bg-[#1E293B] dark:text-[#94A3B8]">
                  {activePlan.completedCycles || 0} voltas concluídas
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#374151] dark:text-white">
                  {currentDiscipline.name}
                </h3>
                <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                  Meta deste bloco: <strong>{currentStep.targetMinutes} minutos</strong> • Prioridade: {currentDiscipline.priority.toUpperCase()} • Peso: {currentDiscipline.weight}
                </p>
              </div>

              {/* Progress bar within current step if elapsed */}
              {elapsedInStep > 0 && (
                <div className="w-full max-w-md space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-[#737D89]">
                    <span>Progresso do bloco: {elapsedInStep} min estudados</span>
                    <span>{remainingInStep} min restantes</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1E293B]">
                    <div
                      className="h-full rounded-full bg-[#F59E0B]"
                      style={{ width: `${stepProgressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => launchStudySessionForTopic(currentDiscipline.id)}
                className="flex items-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-5 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition active:scale-98"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Iniciar Estudo Agora</span>
              </button>

              <button
                onClick={advanceCycleStep}
                className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-xs font-bold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
              >
                <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
                <span>Concluir & Avançar</span>
              </button>

              <button
                onClick={advanceCycleStep}
                title="Pular para o próximo bloco"
                className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-[#737D89] hover:bg-[#F8FAFC] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-[#94A3B8]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Queue Visualizer */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs dark:border-[#1E293B] dark:bg-[#0F172A]">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-base font-bold text-[#374151] dark:text-white">
              Sequência Contínua do Ciclo ({cycleSteps.length} blocos • {totalCycleHours}h total)
            </h4>
            <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
              Ao terminar o último bloco, o ciclo reinicia automaticamente na matéria 1
            </p>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Deseja reiniciar o ponteiro do ciclo para o bloco 1?")) {
                resetCycleProgress(activePlan.id);
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#737D89] hover:text-[#F59E0B] dark:text-[#94A3B8]"
          >
            <RotateCw className="h-3 w-3" />
            Reiniciar Ponteiro
          </button>
        </div>

        {/* Step Cards Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {nextSteps.map(({ step, discipline, idx, isCurrent }) => {
            if (!discipline) return null;

            return (
              <div
                key={step.id}
                onClick={() => {
                  if (!isEditingCycle) {
                    launchStudySessionForTopic(discipline.id);
                  }
                }}
                className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? "border-amber-500 bg-amber-50/80 shadow-md shadow-amber-500/15 dark:border-amber-500 dark:bg-[#2A1508]/60"
                    : "border-[#E2E8F0] bg-white hover:border-amber-500/60 hover:shadow-xs dark:border-[#1E293B] dark:bg-[#1E293B]/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                        isCurrent
                          ? "bg-[#F59E0B] text-white"
                          : "bg-[#F8FAFC] text-[#737D89] dark:bg-[#0F172A] dark:text-[#94A3B8]"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: discipline.color }}
                    />
                  </div>

                  <h5 className="mt-3 text-xs font-bold text-[#374151] line-clamp-2 dark:text-white">
                    {discipline.name}
                  </h5>
                </div>

                <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-2 text-[11px] dark:border-[#1E293B]">
                  <div className="flex items-center justify-between font-semibold text-[#737D89] dark:text-[#94A3B8]">
                    <span>{step.targetMinutes} min</span>
                    {isCurrent ? (
                      <span className="font-bold text-[#F59E0B] dark:text-[#FBBF24]">
                        ▶ Vez Atual
                      </span>
                    ) : (
                      <span className="text-slate-400 group-hover:text-[#F59E0B]">
                        Iniciar →
                      </span>
                    )}
                  </div>

                  {/* Reorder / Delete in edit mode */}
                  {isEditingCycle && (
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(idx, "up");
                          }}
                          className="rounded p-1 text-[#737D89] hover:bg-[#E2E8F0] disabled:opacity-30"
                        >
                          <MoveUp className="h-3 w-3" />
                        </button>
                        <button
                          disabled={idx === cycleSteps.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveStep(idx, "down");
                          }}
                          className="rounded p-1 text-[#737D89] hover:bg-[#E2E8F0] disabled:opacity-30"
                        >
                          <MoveDown className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStep(step.id);
                        }}
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add block inline form if editing */}
        {isEditingCycle && (
          <div className="mt-5 rounded-xl border border-dashed border-amber-500/50 bg-amber-50/30 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
            <h5 className="text-xs font-bold text-[#374151] dark:text-white">
              Adicionar Bloco ao Ciclo
            </h5>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <select
                value={selectedDisciplineToAdd}
                onChange={(e) => setSelectedDisciplineToAdd(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#374151] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
              >
                <option value="">Selecione a disciplina...</option>
                {activeEdital?.disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Peso {d.weight})
                  </option>
                ))}
              </select>

              <select
                value={addBlockMinutes}
                onChange={(e) => setAddBlockMinutes(Number(e.target.value))}
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#374151] dark:border-[#1E293B] dark:bg-[#1E293B] dark:text-white"
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (1h)</option>
                <option value={75}>75 minutos</option>
                <option value={90}>90 minutos (1h30)</option>
                <option value={120}>120 minutos (2h)</option>
              </select>

              <button
                type="button"
                onClick={handleAddBlockToCycle}
                disabled={!selectedDisciplineToAdd}
                className="flex items-center gap-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Bloco
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
