import React, { useState } from "react";
import { useStudy } from "../../context/StudyContext";
import { X, Sparkles, Plus, BookOpen, Shield } from "lucide-react";

interface NewEditalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewEditalModal: React.FC<NewEditalModalProps> = ({ isOpen, onClose }) => {
  const { createEdital } = useStudy();

  const [title, setTitle] = useState("");
  const [organ, setOrgan] = useState("");
  const [role, setRole] = useState("");
  const [banca, setBanca] = useState("");
  const [vacanciesCount, setVacanciesCount] = useState<number | "">("");
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organ.trim() || !banca.trim()) {
      alert("Por favor, preencha o nome do concurso, órgão e banca.");
      return;
    }

    await createEdital({
      title: title.trim(),
      organ: organ.trim(),
      banca: banca.trim(),
      year,
      examDate: examDate || undefined,
      vacanciesCount: typeof vacanciesCount === "number" ? vacanciesCount : undefined,
      disciplines: [],
      topics: [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl dark:border-[#1E293B] dark:bg-[#1E293B]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF8F4] text-[#249D84] dark:bg-[#16362F] dark:text-[#48C3A7]">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white dark:text-white">
                Novo Plano de Estudo / Concurso
              </h3>
              <p className="text-[11px] text-white dark:text-white">
                Cadastre as informações da sua preparação para o concurso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#737D89] hover:bg-[#F8FAFC] hover:text-[#374151] dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {/* Nome do Plano / Concurso (Largura Total) */}
          <div>
            <label className="font-semibold text-white dark:text-white">
              Nome do plano / concurso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Guarda Civil Municipal de Manaus 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
            />
          </div>

          {/* Órgão e Cargo (Duas Colunas) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-white dark:text-white">
                Órgão <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prefeitura de Manaus, PF..."
                value={organ}
                onChange={(e) => setOrgan(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
            <div>
              <label className="font-semibold text-white dark:text-white">
                Cargo
              </label>
              <input
                type="text"
                placeholder="Ex: Guarda Civil, Agente, Escrivão..."
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
          </div>

          {/* Banca e Vagas (Duas Colunas) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-white dark:text-white">
                Banca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: IBFC, Cebraspe, FGV..."
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
            <div>
              <label className="font-semibold text-white dark:text-white">
                Vagas
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 200"
                value={vacanciesCount}
                onChange={(e) => setVacanciesCount(e.target.value ? parseInt(e.target.value) : "")}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
          </div>

          {/* Data da Prova */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-white dark:text-white">
                Data da prova
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
            <div>
              <label className="font-semibold text-white dark:text-white">
                Ano
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="font-semibold text-white dark:text-white">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Foco na prova discursiva e no TAF..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs text-[#374151] focus:border-[#48C3A7] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
            />
          </div>

          {/* Rodapé com Cancelar e Criar Plano */}
          <div className="mt-5 flex justify-end gap-2 border-t border-[#E2E8F0] pt-3 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-semibold text-[#737D89] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#48C3A7] px-5 py-2 font-bold text-white shadow-sm transition hover:bg-[#249D84]"
            >
              Criar plano
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
