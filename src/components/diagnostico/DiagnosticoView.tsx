import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  Target,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Play,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  RotateCw,
  AlertCircle,
} from "lucide-react";

export const DiagnosticoView: React.FC = () => {
  const {
    activeEdital,
    metrics,
    launchStudySessionForTopic,
    studySessions,
  } = useStudy();

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState<string>("");
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = useState(false);

  // Group discipline accuracy
  const disciplineStats = (activeEdital?.disciplines || []).map((disc) => {
    const topics = activeEdital?.topics.filter((t) => t.disciplineId === disc.id) || [];
    let totalQuestions = 0;
    let correctQuestions = 0;
    topics.forEach((t) => {
      totalQuestions += t.questionsDone;
      correctQuestions += t.questionsCorrect;
    });
    const acc = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;
    return {
      discipline: disc,
      totalQuestions,
      correctQuestions,
      accuracyRate: acc,
    };
  });

  const weakDisciplines = disciplineStats
    .filter((d) => d.totalQuestions >= 5 && d.accuracyRate < 75)
    .sort((a, b) => a.accuracyRate - b.accuracyRate);

  const fetchAiDiagnostics = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalHours: metrics.hoursThisWeek,
          accuracyRate: metrics.overallAccuracyRate,
          weakTopics: metrics.weakTopics,
          stats: disciplineStats.map((d) => ({
            name: d.discipline.name,
            accuracy: d.accuracyRate,
            questions: d.totalQuestions,
          })),
        }),
      });
      if (!response.ok) {
        setAiError("Recurso de IA temporariamente indisponível.");
        return;
      }
      const resData = await response.json();
      if (resData.success && resData.data) {
        setAiAnalysis(resData.data);
      } else {
        setAiError("Recurso de IA temporariamente indisponível.");
      }
    } catch {
      setAiError("Recurso de IA temporariamente indisponível.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const generatePracticeQuiz = async (topicName: string, disciplineName: string) => {
    setSelectedPracticeTopic(topicName);
    setIsLoadingAi(true);
    setAiError(null);
    setUserAnswers({});
    setShowExplanations(false);
    try {
      const response = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: disciplineName,
          topic: topicName,
          banca: activeEdital?.banca || "Cebraspe/FGV",
        }),
      });
      if (!response.ok) {
        setAiError("Recurso de IA temporariamente indisponível.");
        return;
      }
      const resData = await response.json();
      if (resData.success && resData.data) {
        setPracticeQuestions(resData.data);
      } else {
        setAiError("Recurso de IA temporariamente indisponível.");
      }
    } catch {
      setAiError("Recurso de IA temporariamente indisponível.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Diagnóstico Estratégico
          </h2>
        </div>

        <button
          onClick={fetchAiDiagnostics}
          disabled={isLoadingAi}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#2B353D] border border-amber-500/40 px-4 py-2.5 text-xs font-bold text-[#FBBF24] shadow-xs transition hover:brightness-110 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#F59E0B]" />
          {isLoadingAi ? "Analisando com IA..." : "Gerar Diagnóstico com IA"}
        </button>
      </div>

      {/* AI Error Notification */}
      {aiError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-bold">{aiError}</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Os dados e gráficos de desempenho continuam sendo computados com precisão diretamente do seu histórico de sessões e simulados.
            </p>
          </div>
        </div>
      )}

      {/* AI Diagnostic Coach Box if loaded */}
      {aiAnalysis && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-[#F59E0B] dark:text-[#FBBF24]">
            <BrainCircuit className="h-5 w-5" />
            <h3 className="text-base font-bold">
              Diagnóstico do Mentor Concurseiro (IA)
            </h3>
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-[#374151] dark:text-slate-200">
            {aiAnalysis.summary}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 uppercase dark:text-white">
                🎯 Ações Prioritárias no Ciclo
              </h4>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {aiAnalysis.keyActions?.map((act: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#F59E0B] dark:text-[#FBBF24]">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-xs dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 uppercase dark:text-white">
                💡 Recomendação Tática
              </h4>
              <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                {aiAnalysis.studyRecommendation}
              </p>
              {aiAnalysis.revisionTip && (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-500/20 p-2.5 text-[11px] font-semibold text-[#F59E0B] dark:bg-amber-950/40 dark:text-[#FBBF24]">
                  🔁 {aiAnalysis.revisionTip}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Breakdown: Disciplinas Críticas & Conteúdos que Merecem Atenção */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Disciplinas Críticas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Disciplinas Abaixo da Meta (Aproveitamento &lt; 75%)
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {weakDisciplines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                🎉 Todas as disciplinas estão acima de 75% de acertos!
              </div>
            ) : (
              weakDisciplines.map((d) => (
                <div
                  key={d.discipline.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: d.discipline.color }}
                      />
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {d.discipline.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      {d.correctQuestions} acertos em {d.totalQuestions} questões resolvidas
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                      {d.accuracyRate}% Acertos
                    </span>
                    <button
                      onClick={() => launchStudySessionForTopic(d.discipline.id, undefined, "Questões")}
                      className="rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706]"
                    >
                      Treinar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tópicos Específicos Críticos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Conteúdos que Merecem Atenção
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {metrics.weakTopics.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                ✨ Nenhum tópico com baixo índice de acertos detectado.
              </div>
            ) : (
              metrics.weakTopics.map((item) => (
                <div
                  key={item.topicId}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/30 p-4 sm:flex-row sm:items-center dark:border-amber-900/30 dark:bg-amber-950/20"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase dark:text-amber-300">
                      {item.disciplineName}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.topicName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Taxa de acertos: <strong className="text-red-600">{item.accuracyRate}%</strong> ({item.questionsCorrect}/{item.questionsDone} questões)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generatePracticeQuiz(item.topicName, item.disciplineName)}
                      className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-[#F59E0B] hover:bg-amber-100 dark:bg-amber-950/30 dark:text-[#FBBF24]"
                    >
                      <Sparkles className="h-3 w-3" />
                      Quiz IA
                    </button>
                    <button
                      onClick={() => launchStudySessionForTopic(item.disciplineId, item.topicId, "Questões")}
                      className="flex items-center gap-1 rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706]"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      Estudar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Practice Quiz Box if loaded */}
      {practiceQuestions.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-white p-6 shadow-xs dark:border-amber-500/30 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#F59E0B] border border-amber-500/30 dark:bg-amber-950/40 dark:text-[#FBBF24]">
                Bateria de Fixação Inteligente
              </span>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                Questões Inéditas: {selectedPracticeTopic}
              </h3>
            </div>
            <button
              onClick={() => setPracticeQuestions([])}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Fechar Bateria
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {practiceQuestions.map((q, qIdx) => (
              <div key={q.id || qIdx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-[#F59E0B] dark:text-[#FBBF24]">Questão {qIdx + 1}:</span> {q.statement}
                </p>

                <div className="mt-3 space-y-2">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = userAnswers[qIdx] === optIdx;
                    const isCorrect = q.correctIndex === optIdx;
                    const showResult = showExplanations;

                    let btnStyle = "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
                    if (isSelected) {
                      btnStyle = "border-[#F59E0B] bg-amber-50 text-[#374151] font-semibold dark:bg-amber-950/30 dark:text-white";
                    }
                    if (showResult) {
                      if (isCorrect) {
                        btnStyle = "border-[#F59E0B] bg-amber-50 text-[#F59E0B] font-bold dark:bg-amber-950/40 dark:text-[#FBBF24]";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "border-red-500 bg-red-50 text-red-900 font-bold dark:bg-red-950 dark:text-red-200";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: optIdx })}
                        className={`flex w-full items-start gap-2.5 rounded-lg border p-3 text-left text-xs transition ${btnStyle}`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {showExplanations && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-500/20 p-3 text-[11px] text-[#374151] dark:bg-amber-950/30 dark:text-[#FBBF24]">
                    <strong className="text-[#F59E0B] dark:text-[#FBBF24]">Gabarito Comentado:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="rounded-xl bg-[#F59E0B] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#D97706]"
            >
              {showExplanations ? "Ocultar Gabarito" : "Verificar Respostas e Gabarito Comentado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
