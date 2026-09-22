import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  X,
  Upload,
  CheckCircle2,
  BrainCircuit,
  Copy,
  AlertCircle,
} from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { activeEdital, importVerticalizedEdital } = useStudy();

  const [activeTab, setActiveTab] = useState<"verticalize" | "questions" | "explainer">("verticalize");
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Verticalize State
  const [rawEditalText, setRawEditalText] = useState("");
  const [organName, setOrganName] = useState(activeEdital?.organ || "");
  const [bancaName, setBancaName] = useState(activeEdital?.banca || "");
  const [verticalizedResult, setVerticalizedResult] = useState<any>(null);

  // Questions Generator State
  const [selectedDiscipline, setSelectedDiscipline] = useState(activeEdital?.disciplines[0]?.name || "");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);

  // Explainer State
  const [conceptQuery, setConceptQuery] = useState("");
  const [conceptExplanation, setConceptExplanation] = useState("");

  if (!isOpen) return null;

  const handleVerticalize = async () => {
    if (!rawEditalText.trim()) {
      alert("Por favor, cole o texto do edital para verticalização.");
      return;
    }

    setIsLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/verticalize-edital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawEditalText,
          organ: organName,
          banca: bancaName,
        }),
      });
      if (!res.ok) {
        setAiError("Recurso de IA temporariamente indisponível. Na versão estática, você pode cadastrar disciplinas e tópicos manualmente.");
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setVerticalizedResult(data.data);
      } else {
        setAiError("Recurso de IA temporariamente indisponível. Verifique o texto inserido.");
      }
    } catch (e) {
      setAiError("Recurso de IA temporariamente indisponível. Na versão estática, você pode cadastrar disciplinas e tópicos manualmente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyVerticalizedEdital = () => {
    if (!verticalizedResult) return;
    if (importVerticalizedEdital) {
      if (Array.isArray(verticalizedResult)) {
        importVerticalizedEdital(
          activeEdital?.title || `Edital - ${organName}`,
          organName,
          bancaName,
          verticalizedResult
        );
      } else if (verticalizedResult.disciplines) {
        importVerticalizedEdital(
          verticalizedResult.title || activeEdital?.title || `Edital - ${organName}`,
          verticalizedResult.organ || organName,
          verticalizedResult.banca || bancaName,
          verticalizedResult.disciplines
        );
      }
    }
    alert("🎉 Edital verticalizado importado e aplicado com sucesso ao seu painel!");
    onClose();
  };

  const handleGenerateQuestions = async () => {
    setIsLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discipline: selectedDiscipline,
          topic: selectedTopic,
          banca: bancaName,
        }),
      });
      if (!res.ok) {
        setAiError("Recurso de IA temporariamente indisponível.");
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedQuestions(data.data);
      } else {
        setAiError("Recurso de IA temporariamente indisponível.");
      }
    } catch (e) {
      setAiError("Recurso de IA temporariamente indisponível.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainConcept = async () => {
    if (!conceptQuery.trim()) return;
    setIsLoading(true);
    setAiError(null);
    try {
      // Use diagnostic endpoint or ask logic
      const promptText = `Explique de forma didática, direta e focada em concursos públicos o seguinte conceito ou artigo de lei: "${conceptQuery}". Inclua mnemônicos se aplicável e como as bancas costumam cobrar (pegadinhas).`;
      const res = await fetch("/api/ai/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalHours: 10,
          accuracyRate: 70,
          weakTopics: [{ topicName: conceptQuery, accuracyRate: 50 }],
          stats: [],
        }),
      });
      if (!res.ok) {
        setAiError("Recurso de IA temporariamente indisponível.");
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setConceptExplanation(data.data.studyRecommendation || data.data.summary);
      } else {
        setAiError("Recurso de IA temporariamente indisponível.");
      }
    } catch (e) {
      setAiError("Recurso de IA temporariamente indisponível.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B00] text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Inteligência Artificial do Edital
              </h3>
              <p className="text-xs text-slate-500">
                Verticalizador automático, gerador de questões e mentor de concurso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-5 text-xs font-bold dark:border-slate-800 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab("verticalize")}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === "verticalize"
                ? "border-[#FF6B00] text-[#FF6B00] dark:text-[#FFA726]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            📄 Verticalizador de Edital
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`border-b-2 px-4 py-3 transition ${
              activeTab === "questions"
                ? "border-[#FF6B00] text-[#FF6B00] dark:text-[#FFA726]"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            🎯 Gerador de Questões Inéditas
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[calc(92vh-140px)] overflow-y-auto p-6 space-y-4">
          {aiError && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="flex-1">
                <p className="font-bold">{aiError}</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  As funcionalidades manuais (adicionar disciplinas, tópicos, sessões de estudo e simulados) continuam funcionando normalmente e salvas no Firestore.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: VERTICALIZADOR */}
          {activeTab === "verticalize" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Órgão / Cargo</label>
                  <input
                    type="text"
                    value={organName}
                    onChange={(e) => setOrganName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Banca Examinadora</label>
                  <input
                    type="text"
                    value={bancaName}
                    onChange={(e) => setBancaName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cole o Conteúdo Programático do Edital (Texto bruto do PDF)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRawEditalText(`LÍNGUA PORTUGUESA: 1 Compreensão e interpretação de textos. 2 Tipologia textual. 3 Ortografia oficial. 4 Acentuação gráfica. 5 Emprego das classes de palavras. 6 Emprego do sinal indicativo de crase. 7 Sintaxe da oração e do período. 8 Pontuação. 9 Concordância nominal e verbal. 10 Regência nominal e verbal.
DIREITO CONSTITUCIONAL: 1 Direitos e deveres fundamentais: direitos e deveres individuais e coletivos, direito à vida, à liberdade, à igualdade, à segurança e à propriedade. 2 Da Segurança Pública: artigo 144 da Constituição Federal. 3 Organização dos Poderes.`);
                    }}
                    className="text-[11px] font-semibold text-[#FF6B00] hover:underline dark:text-[#FFA726]"
                  >
                    Inserir Exemplo Pronto
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={rawEditalText}
                  onChange={(e) => setRawEditalText(e.target.value)}
                  placeholder="Ex: NOÇÕES DE DIREITO ADMINISTRATIVO: 1 Estado, governo e administração pública. 2 Princípios fundamentais. 3 Poderes da administração pública: poder hierárquico, poder disciplinar, poder regulamentar, poder de polícia..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-[#FF6B00] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleVerticalize}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05D00] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? "Verticalizando com IA..." : "Estruturar e Verticalizar com IA"}
                </button>
              </div>

              {/* Result Preview */}
              {verticalizedResult && (
                <div className="mt-4 rounded-xl border border-orange-500/40 bg-orange-50/60 p-4 dark:border-orange-500/40 dark:bg-orange-500/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#FF6B00] dark:text-[#FFA726]">
                      ✅ Edital Estruturado ({verticalizedResult.disciplines?.length || 0} Disciplinas extraídas)
                    </h4>
                    <button
                      onClick={handleApplyVerticalizedEdital}
                      className="rounded-lg bg-[#FF6B00] hover:bg-[#E05D00] px-4 py-2 text-xs font-bold text-white shadow-xs"
                    >
                      Importar para meu Painel
                    </button>
                  </div>

                  <div className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1 text-xs">
                    {verticalizedResult.disciplines?.map((disc: any, idx: number) => (
                      <div key={idx} className="rounded-lg bg-white p-3 shadow-xs dark:bg-slate-800">
                        <span className="font-bold text-slate-900 dark:text-white">{disc.name}</span>
                        <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                          {disc.topics?.map((top: any, tIdx: number) => (
                            <li key={tIdx} className="flex items-center gap-2 text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />
                              <span>{top.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUESTIONS GENERATOR */}
          {activeTab === "questions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Disciplina</label>
                  <input
                    type="text"
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tópico / Assunto</label>
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05D00] px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? "Gerando Questões..." : "Gerar Questões com IA"}
                </button>
              </div>

              {/* Generated questions list */}
              {generatedQuestions.length > 0 && (
                <div className="mt-4 space-y-4">
                  {generatedQuestions.map((q, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-700 dark:bg-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        <span className="font-bold text-[#FF6B00] dark:text-[#FFA726]">Questão {idx + 1}:</span> {q.statement}
                      </p>

                      <div className="mt-3 space-y-1.5">
                        {q.options?.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`rounded-lg border p-2 text-[11px] ${
                              q.correctIndex === oIdx
                                ? "border-orange-500 bg-orange-50 text-[#FF6B00] font-bold dark:bg-orange-500/20 dark:text-[#FFA726]"
                                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                            }`}
                          >
                            <strong>{String.fromCharCode(65 + oIdx)})</strong> {opt}
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 rounded-md bg-orange-50 border border-orange-200 p-2 text-[11px] text-slate-800 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-[#FFA726]">
                        <strong className="text-[#FF6B00] dark:text-[#FFA726]">Gabarito Comentado:</strong> {q.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
