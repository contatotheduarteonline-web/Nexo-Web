import React, { useState, useMemo } from "react";
import { useStudy } from "../../context/StudyContext";
import {
  Bell,
  Plus,
  CheckCircle2,
  Calendar,
  Tag,
  Trash2,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Reminder } from "../../types";

export const LembretesView: React.FC = () => {
  const {
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    activeEdital,
  } = useStudy();

  const [filterCategory, setFilterCategory] = useState<"TODOS" | "INSCRICOES" | "PROVAS" | "PAGAMENTOS" | "GERAL">("TODOS");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "PENDENTES" | "CONCLUIDOS">("TODOS");

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"INSCRICOES" | "PROVAS" | "PAGAMENTOS" | "GERAL">("GERAL");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredReminders = useMemo(() => {
    return reminders.filter((rem) => {
      if (filterCategory !== "TODOS" && rem.category !== filterCategory) return false;
      if (filterStatus === "PENDENTES" && rem.completed) return false;
      if (filterStatus === "CONCLUIDOS" && !rem.completed) return false;
      return true;
    });
  }, [reminders, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.completed).length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [reminders]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addReminder({
      title: title.trim(),
      category,
      date,
      completed: false,
      editalId: activeEdital?.id,
    });
    setTitle("");
    setIsAdding(false);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "INSCRICOES":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900";
      case "PROVAS":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
      case "PAGAMENTOS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center dark:border-[#1E293B]">
        <div>
          <h1 className="text-lg font-bold text-[#374151] dark:text-white">
            Lembretes
          </h1>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 transition active:scale-98 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Lembrete
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#1B2126]">
          <div className="text-[10px] font-bold text-[#737D89] uppercase dark:text-[#94A3B8]">Total de Lembretes</div>
          <div className="mt-1 text-2xl font-extrabold text-[#374151] dark:text-white">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#1B2126]">
          <div className="text-[10px] font-bold text-[#FF6B00] uppercase dark:text-[#FFA726]">Pendentes</div>
          <div className="mt-1 text-2xl font-extrabold text-[#374151] dark:text-white">{stats.pending}</div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#1B2126]">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Concluídos</div>
          <div className="mt-1 text-2xl font-extrabold text-[#374151] dark:text-white">{stats.completed}</div>
        </div>
      </div>

      {/* Form modal/card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-orange-500/40 bg-orange-50/60 p-4.5 shadow-sm dark:border-orange-500/30 dark:bg-orange-950/20"
        >
          <h3 className="text-xs font-bold text-[#FF6B00] uppercase dark:text-[#FFA726]">
            Cadastrar Novo Lembrete
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-[#374151] dark:text-[#E5EAEF]">
                Título do lembrete <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Último dia para pagamento da taxa de inscrição..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#FF6B00] focus:outline-none dark:border-[#1E293B] dark:bg-[#111622] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] dark:text-[#E5EAEF]">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#FF6B00] focus:outline-none dark:border-[#1E293B] dark:bg-[#111622] dark:text-white"
              >
                <option value="INSCRICOES">Inscrições</option>
                <option value="PROVAS">Provas</option>
                <option value="PAGAMENTOS">Pagamentos</option>
                <option value="GERAL">Geral</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] dark:text-[#E5EAEF]">
                Data limite
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#FF6B00] focus:outline-none dark:border-[#1E293B] dark:bg-[#111622] dark:text-white"
              />
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-[#737D89] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF8A00] hover:from-[#E05D00] hover:to-[#FF6B00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 cursor-pointer"
              >
                Salvar Lembrete
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-3 dark:border-[#1E293B] dark:bg-[#1B2126]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(["TODOS", "INSCRICOES", "PROVAS", "PAGAMENTOS", "GERAL"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                filterCategory === cat
                  ? "bg-orange-500/10 text-[#FF6B00] border border-orange-500/30 dark:bg-orange-500/20 dark:text-[#FFA726]"
                  : "text-[#737D89] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#182030]"
              }`}
            >
              {cat === "TODOS" ? "Todas Categorias" : cat}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 rounded-xl bg-[#F8FAFC] p-0.5 text-xs font-bold dark:bg-[#111622]">
          {(["TODOS", "PENDENTES", "CONCLUIDOS"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterStatus === st
                  ? "bg-white text-[#FF6B00] shadow-xs dark:bg-[#182030] dark:text-[#FFA726]"
                  : "text-[#737D89] dark:text-[#94A3B8]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-2">
        {filteredReminders.length === 0 ? (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-xs text-[#737D89] dark:border-[#1E293B] dark:bg-[#1B2126] dark:text-[#94A3B8]">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[#FF6B00]" />
            <p className="font-semibold">Nenhum lembrete encontrado para este filtro.</p>
          </div>
        ) : (
          filteredReminders.map((rem) => (
            <div
              key={rem.id}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                rem.completed
                  ? "border-[#E2E8F0] bg-[#F8FAFC]/70 opacity-70 dark:border-[#1E293B] dark:bg-[#111622]/60"
                  : "border-[#E2E8F0] bg-white hover:border-[#FF6B00] dark:border-[#1E293B] dark:bg-[#1B2126]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rem.completed}
                  onChange={() => toggleReminder(rem.id)}
                  className="h-4 w-4 rounded accent-[#FF6B00] cursor-pointer"
                />
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      rem.completed
                        ? "text-[#737D89] line-through dark:text-[#94A3B8]"
                        : "text-[#374151] dark:text-white"
                    }`}
                  >
                    {rem.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#737D89] dark:text-[#94A3B8]">
                    <Calendar className="h-3 w-3" />
                    <span>{rem.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${getCategoryColor(
                    rem.category
                  )}`}
                >
                  {rem.category}
                </span>

                <button
                  onClick={() => deleteReminder(rem.id)}
                  className="rounded-lg p-1 text-[#737D89] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  title="Excluir lembrete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
