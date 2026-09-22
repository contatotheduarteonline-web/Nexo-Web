import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { Edital } from "../../types";
import {
  X,
  Building2,
  Calendar,
  FileText,
  FileSpreadsheet,
  Link2,
  Upload,
  Trash2,
  Archive,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Shield,
  BookOpen,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";

interface EditalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  edital?: Edital;
  onOpenEditModal?: () => void;
}

export const EditalInfoModal: React.FC<EditalInfoModalProps> = ({
  isOpen,
  onClose,
  edital,
  onOpenEditModal,
}) => {
  const { activeEdital, updateEdital, deleteEdital, activePlan, metrics } = useStudy();
  const targetEdital = edital || activeEdital;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(targetEdital?.title || "");
  const [organ, setOrgan] = useState(targetEdital?.organ || "");
  const [cargo, setCargo] = useState(targetEdital?.cargo || "");
  const [banca, setBanca] = useState(targetEdital?.banca || "");
  const [year, setYear] = useState(targetEdital?.year || new Date().getFullYear());
  const [publicationDate, setPublicationDate] = useState(targetEdital?.publicationDate || "");
  const [examDate, setExamDate] = useState(targetEdital?.examDate || "");
  const [vacanciesCount, setVacanciesCount] = useState<number | "">(
    targetEdital?.vacanciesCount ?? ""
  );
  const [linkUrl, setLinkUrl] = useState(targetEdital?.linkUrl || "");
  const [notes, setNotes] = useState(targetEdital?.notes || "");
  const [pdfFileName, setPdfFileName] = useState(targetEdital?.pdfFileName || "");
  const [pdfUrl, setPdfUrl] = useState(targetEdital?.pdfUrl || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !targetEdital) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEdital(targetEdital.id, {
      title: title.trim() || targetEdital.title,
      organ: organ.trim() || targetEdital.organ,
      cargo: cargo.trim() || undefined,
      banca: banca.trim() || targetEdital.banca,
      year: Number(year) || targetEdital.year,
      publicationDate: publicationDate || undefined,
      examDate: examDate || undefined,
      vacanciesCount: typeof vacanciesCount === "number" ? vacanciesCount : undefined,
      linkUrl: linkUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      pdfFileName: pdfFileName.trim() || undefined,
      pdfUrl: pdfUrl.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setPdfFileName(file.name);
      setPdfUrl(fakeUrl);
      updateEdital(targetEdital.id, {
        pdfFileName: file.name,
        pdfUrl: fakeUrl,
      });
    }
  };

  const handleDelete = () => {
    deleteEdital(targetEdital.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#1B2126]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 dark:border-[#1E293B] dark:bg-[#182030]/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8F4] text-[#249D84] dark:bg-[#16362F] dark:text-[#48C3A7]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#374151] dark:text-white">
                Informações & Configurações do Edital
              </h2>
              <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                {targetEdital.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#737D89] hover:bg-[#E2E8F0] hover:text-[#374151] dark:hover:bg-[#1E293B] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isEditing ? (
            <div className="space-y-6">
              {/* Main Info Card */}
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#1E293B] dark:bg-[#182030]/40">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-full bg-[#EAF8F4] px-2.5 py-0.5 text-[11px] font-bold text-[#249D84] dark:bg-[#16362F] dark:text-[#48C3A7]">
                      {targetEdital.banca} • {targetEdital.year}
                    </span>
                    <h3 className="mt-1.5 text-lg font-extrabold text-[#374151] dark:text-white">
                      {targetEdital.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setTitle(targetEdital.title);
                      setOrgan(targetEdital.organ);
                      setCargo(targetEdital.cargo || "");
                      setBanca(targetEdital.banca);
                      setYear(targetEdital.year);
                      setPublicationDate(targetEdital.publicationDate || "");
                      setExamDate(targetEdital.examDate || "");
                      setVacanciesCount(targetEdital.vacanciesCount ?? "");
                      setLinkUrl(targetEdital.linkUrl || "");
                      setNotes(targetEdital.notes || "");
                      setPdfFileName(targetEdital.pdfFileName || "");
                      setPdfUrl(targetEdital.pdfUrl || "");
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#374151] shadow-xs hover:bg-[#F8FAFC] dark:border-[#1E293B] dark:bg-[#1B2126] dark:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editar Dados
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Órgão / Instituição
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.organ || "Não informado"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Cargo / Especialidade
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.cargo || "Todos os cargos"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Banca Examinadora
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.banca}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Data da Publicação
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.publicationDate
                        ? new Date(targetEdital.publicationDate).toLocaleDateString("pt-BR")
                        : "Não informada"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Data da Prova
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.examDate
                        ? new Date(targetEdital.examDate).toLocaleDateString("pt-BR")
                        : "A definir"}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Número de Vagas
                    </span>
                    <span className="font-semibold text-[#374151] dark:text-[#E5EAEF]">
                      {targetEdital.vacanciesCount !== undefined
                        ? `${targetEdital.vacanciesCount} vagas`
                        : "CR"}
                    </span>
                  </div>
                </div>

                {targetEdital.notes && (
                  <div className="mt-3 border-t border-[#E2E8F0] pt-3 text-xs dark:border-[#1E293B]">
                    <span className="block text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                      Observações
                    </span>
                    <p className="mt-1 text-[#55606E] dark:text-[#94A3B8]">
                      {targetEdital.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* PDF & Documento Original Section */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs dark:border-[#1E293B] dark:bg-[#1B2126]">
                <h4 className="text-xs font-bold tracking-wider text-[#737D89] uppercase dark:text-[#94A3B8]">
                  Arquivo Original do Edital (PDF ou Link)
                </h4>

                {targetEdital.pdfUrl || targetEdital.pdfFileName || targetEdital.linkUrl ? (
                  <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between dark:border-[#1E293B] dark:bg-[#182030]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#374151] dark:text-white">
                          {targetEdital.pdfFileName || "Edital Completo em PDF"}
                        </span>
                        <span className="text-[11px] text-[#737D89] dark:text-[#94A3B8]">
                          {targetEdital.linkUrl || "Arquivo anexado ao plano"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {targetEdital.pdfUrl ? (
                        <a
                          href={targetEdital.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-[#249D84] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1F826D]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visualizar PDF
                        </a>
                      ) : targetEdital.linkUrl ? (
                        <a
                          href={targetEdital.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-[#249D84] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1F826D]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir Link
                        </a>
                      ) : null}

                      <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#1E293B] dark:bg-[#1B2126] dark:text-white">
                        <Upload className="h-3.5 w-3.5" />
                        Substituir
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-[#CCD2D8] p-4 text-center dark:border-[#3A454F]">
                    <p className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                      Nenhum arquivo PDF anexado ao edital.
                    </p>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#EAF8F4] px-3 py-1.5 text-xs font-bold text-[#249D84] hover:bg-[#D7F3EC] dark:bg-[#16362F] dark:text-[#48C3A7]">
                      <Upload className="h-3.5 w-3.5" />
                      Anexar Edital em PDF
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Estatísticas Estruturais do Edital */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-center dark:border-[#1E293B] dark:bg-[#1B2126]">
                  <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                    Disciplinas
                  </span>
                  <span className="mt-1 block text-lg font-black text-[#374151] dark:text-white">
                    {targetEdital.disciplines.length}
                  </span>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-center dark:border-[#1E293B] dark:bg-[#1B2126]">
                  <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                    Tópicos Totais
                  </span>
                  <span className="mt-1 block text-lg font-black text-[#374151] dark:text-white">
                    {targetEdital.topics.length}
                  </span>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 text-center dark:border-[#1E293B] dark:bg-[#1B2126]">
                  <span className="text-[10px] font-bold tracking-wider text-[#737D89] uppercase">
                    Concluídos
                  </span>
                  <span className="mt-1 block text-lg font-black text-[#249D84] dark:text-[#48C3A7]">
                    {targetEdital.topics.filter((t) => t.isStudied).length} / {targetEdital.topics.length}
                  </span>
                </div>
              </div>

              {/* Dangerous Actions (Delete/Archive) */}
              <div className="border-t border-[#E2E8F0] pt-4 dark:border-[#1E293B]">
                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#737D89] dark:text-[#94A3B8]">
                      Ações avançadas de gerenciamento
                    </span>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir este edital
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-900/40 dark:bg-red-950/30">
                    <p className="text-xs font-bold text-red-800 dark:text-red-300">
                      Tem certeza que deseja excluir o edital "{targetEdital.title}"?
                    </p>
                    <p className="mt-1 text-[11px] text-red-700 dark:text-red-400">
                      Todas as disciplinas e tópicos cadastrados neste edital serão removidos.
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-lg border border-[#CCD2D8] bg-white px-3 py-1 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:bg-[#1B2126] dark:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Sim, Excluir Edital
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Editing Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Título do Concurso / Edital *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="Ex: Guarda Civil Municipal de Manaus"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Órgão / Instituição *
                  </label>
                  <input
                    type="text"
                    value={organ}
                    onChange={(e) => setOrgan(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                    placeholder="Ex: Prefeitura de Manaus"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                    placeholder="Ex: Guarda Civil Municipal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Banca *
                  </label>
                  <input
                    type="text"
                    value={banca}
                    onChange={(e) => setBanca(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                    placeholder="Ex: IBFC, Cebraspe, FGV"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Número de Vagas
                  </label>
                  <input
                    type="number"
                    value={vacanciesCount}
                    onChange={(e) =>
                      setVacanciesCount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                    placeholder="Ex: 200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Data da Publicação
                  </label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] dark:text-white">
                    Data da Prova
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Link Oficial do Edital
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="https://exemplo.com.br/edital-oficial.pdf"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] dark:text-white">
                  Observações Gerais
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#CCD2D8] bg-white px-3.5 py-2 text-sm text-[#374151] focus:border-[#48C3A7] focus:outline-hidden dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                  placeholder="Anotações sobre pesos mínimos, critérios de desempate, redação..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-[#CCD2D8] bg-white px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#F8FAFC] dark:border-[#3A454F] dark:bg-[#182030] dark:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#249D84] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1F826D]"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
