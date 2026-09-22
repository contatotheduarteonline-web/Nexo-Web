import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  X,
  Plus,
  BookOpen,
  ListPlus,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDisciplineId?: string;
  defaultTopicId?: string;
}

type AddContentType = "choose" | "discipline" | "topic" | "subtopic";

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  defaultDisciplineId,
  defaultTopicId,
}) => {
  const { activeEdital, addDiscipline, addTopic, updateTopic } = useStudy();

  const [mode, setMode] = useState<AddContentType>(
    defaultTopicId ? "subtopic" : defaultDisciplineId ? "topic" : "choose"
  );

  // Disciplina Form State
  const [discName, setDiscName] = useState("");
  const [discColor, setDiscColor] = useState("#48C3A7");
  const [discWeight, setDiscWeight] = useState<1 | 2 | 3>(2);
  const [discPriority, setDiscPriority] = useState<"alta" | "media" | "baixa">("media");
  const [discTargetHours, setDiscTargetHours] = useState<number>(30);

  // Tópico Form State
  const [selectedDiscId, setSelectedDiscId] = useState<string>(
    defaultDisciplineId || activeEdital?.disciplines[0]?.id || ""
  );
  const [topicName, setTopicName] = useState("");
  const [topicPriority, setTopicPriority] = useState<"alta" | "media" | "baixa">("media");
  const [topicDifficulty, setTopicDifficulty] = useState<"facil" | "medio" | "dificil">("medio");
  const [topicSubtopicsRaw, setTopicSubtopicsRaw] = useState("");

  // Subtópico Form State
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    defaultTopicId || activeEdital?.topics[0]?.id || ""
  );
  const [subtopicText, setSubtopicText] = useState("");

  const colors = [
    "#48C3A7",
    "#3B82F6",
    "#8B5CF6",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
    "#06B6D4",
    "#6366F1",
    "#10B981",
  ];

  if (!isOpen || !activeEdital) return null;

  const handleCreateDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discName.trim()) return;

    addDiscipline({
      editalId: activeEdital.id,
      name: discName.trim(),
      color: discColor,
      weight: discWeight,
      priority: discPriority,
      targetHours: discTargetHours,
      studiedHours: 0,
      iconName: "BookOpen",
    });

    setDiscName("");
    onClose();
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !selectedDiscId) return;

    const subtopics = topicSubtopicsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    addTopic({
      disciplineId: selectedDiscId,
      name: topicName.trim(),
      subtopics,
      isStudied: false,
      isReviewed: false,
      questionsDone: 0,
      questionsCorrect: 0,
      accuracyRate: 0,
      masteryRate: 0,
      reviewCount: 0,
      priority: topicPriority,
      difficulty: topicDifficulty,
    });

    setTopicName("");
    setTopicSubtopicsRaw("");
    onClose();
  };

  const handleCreateSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicText.trim() || !selectedTopicId) return;

    const topic = activeEdital.topics.find((t) => t.id === selectedTopicId);
    if (topic) {
      const updated = [...(topic.subtopics || []), subtopicText.trim()];
      updateTopic(topic.id, { subtopics: updated });
    }

    setSubtopicText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#1B2126]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 dark:border-[#1E293B] dark:bg-[#182030]/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-[#FF6B00] border border-orange-500/30 dark:bg-orange-500/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#374151] dark:text-white">
                {mode === "choose"
                  ? "Adicionar Conteúdo ao Edital"
                  : mode === "discipline"
                  ? "Nova Disciplina"
                  : mode === "topic"
                  ? "Novo Tópico"
                  : "Novo Subtópico"}
              </h2>
              <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                {activeEdital.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#737D89] hover:bg-[#E2E8F0] hover:text-[#374151] dark:hover:bg-[#1E293B] dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === "choose" && (
            <div className="space-y-3">
              <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                Selecione o nível de conteúdo que deseja cadastrar no edital:
              </p>

              {/* Option 1: Disciplina */}
              <button
                onClick={() => setMode("discipline")}
                className="group flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left shadow-xs transition hover:border-[#FF6B00] hover:bg-orange-50/20 dark:border-[#1E293B] dark:bg-[#111622] dark:hover:bg-[#182030] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/60 dark:bg-orange-950/40 dark:text-[#FFA726] dark:border-orange-800/40">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#374151] group-hover:text-[#FF6B00] dark:text-white dark:group-hover:text-[#FFA726]">
                      Nova Disciplina
                    </h3>
                    <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                      Ex: Direito Constitucional, Raciocínio Lógico, Informática
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#CCD2D8] group-hover:text-[#FF6B00] dark:text-[#3A454F] dark:group-hover:text-[#FFA726]" />
              </button>

              {/* Option 2: Tópico */}
              <button
                onClick={() => setMode("topic")}
                className="group flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left shadow-xs transition hover:border-[#FF6B00] hover:bg-orange-50/20 dark:border-[#1E293B] dark:bg-[#111622] dark:hover:bg-[#182030] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    <ListPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#374151] group-hover:text-[#FF6B00] dark:text-white dark:group-hover:text-[#FFA726]">
                      Novo Tópico
                    </h3>
                    <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                      Ex: Direitos e Garantias Fundamentais, Concordância Verbal
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#CCD2D8] group-hover:text-[#FF6B00] dark:text-[#3A454F] dark:group-hover:text-[#FFA726]" />
              </button>

              {/* Option 3: Subtópico */}
              <button
                onClick={() => setMode("subtopic")}
                className="group flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 text-left shadow-xs transition hover:border-[#FF6B00] hover:bg-orange-50/20 dark:border-[#1E293B] dark:bg-[#111622] dark:hover:bg-[#182030] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B00] dark:bg-orange-950/40 dark:text-[#FFA726]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#374151] group-hover:text-[#FF6B00] dark:text-white dark:group-hover:text-[#FFA726]">
                      Novo Subtópico
                    </h3>
                    <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                      Ex: Habeas Corpus, Inviolabilidade de Domicílio, Art. 5º
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#CCD2D8] group-hover:text-[#FF6B00] dark:text-[#3A454F] dark:group-hover:text-[#FFA726]" />
              </button>
            </div>
          )}

          {mode === "discipline" && (
            <form onSubmit={handleCreateDiscipline} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Nome da Disciplina *
                </label>
                <input
                  type="text"
                  value={discName}
                  onChange={(e) => setDiscName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="Ex: Direito Penal Especial"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Cor da Disciplina
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDiscColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        discColor === c ? "scale-115 ring-2 ring-offset-2 ring-[#FF6B00] dark:ring-white" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Peso na Prova
                  </label>
                  <select
                    value={discWeight}
                    onChange={(e) => setDiscWeight(Number(e.target.value) as 1 | 2 | 3)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  >
                    <option value={1}>Peso 1 (Básico)</option>
                    <option value={2}>Peso 2 (Intermediário)</option>
                    <option value={3}>Peso 3 (Determinante / Específico)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Prioridade de Estudo
                  </label>
                  <select
                    value={discPriority}
                    onChange={(e) => setDiscPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-xs font-semibold text-[#737D89] hover:underline dark:text-[#94A3B8] cursor-pointer"
                >
                  ← Voltar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#3A454F] dark:bg-[#182030] dark:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    Salvar Disciplina
                  </button>
                </div>
              </div>
            </form>
          )}

          {mode === "topic" && (
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Disciplina *
                </label>
                <select
                  value={selectedDiscId}
                  onChange={(e) => setSelectedDiscId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  required
                >
                  {activeEdital.disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Peso {d.weight})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Nome do Tópico / Assunto *
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="Ex: Teoria Geral dos Direitos Fundamentais"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Prioridade
                  </label>
                  <select
                    value={topicPriority}
                    onChange={(e) => setTopicPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Dificuldade Estimada
                  </label>
                  <select
                    value={topicDifficulty}
                    onChange={(e) => setTopicDifficulty(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Subtópicos Iniciais (opcional, 1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={topicSubtopicsRaw}
                  onChange={(e) => setTopicSubtopicsRaw(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-xs text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder={`Conceito e evolução\nCaracterísticas e eficácia\nTitularidade`}
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-xs font-semibold text-[#737D89] hover:underline dark:text-[#94A3B8] cursor-pointer"
                >
                  ← Voltar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#3A454F] dark:bg-[#182030] dark:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    Salvar Tópico
                  </button>
                </div>
              </div>
            </form>
          )}

          {mode === "subtopic" && (
            <form onSubmit={handleCreateSubtopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Tópico Pai *
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-xs font-semibold text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  required
                >
                  {activeEdital.topics.map((t) => {
                    const d = activeEdital.disciplines.find((disc) => disc.id === t.disciplineId);
                    return (
                      <option key={t.id} value={t.id}>
                        [{d?.name || "Geral"}] {t.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Nome do Subtópico *
                </label>
                <input
                  type="text"
                  value={subtopicText}
                  onChange={(e) => setSubtopicText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="Ex: Mandado de Segurança Individual e Coletivo"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-xs font-semibold text-[#737D89] hover:underline dark:text-[#94A3B8] cursor-pointer"
                >
                  ← Voltar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#3A454F] dark:bg-[#182030] dark:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                  >
                    Adicionar Subtópico
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
