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

  const [filterCategory, setFilterCategory] = useState<"TODOS" | "INSCRICOES" | "PROVAS" | "PAGAMENTOS">("TODOS");
  const [filterStatus, setFilterStatus] = useState<"TODOS" | "PENDENTES" | "CONCLUIDOS">("TODOS");

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"INSCRICOES" | "PROVAS" | "PAGAMENTOS">("INSCRICOES");
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
        return "bg-slate-50 text-white border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700";
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center dark:border-[#1E293B]">
        <div>
          <h1 className="text-lg font-bold text-white dark:text-white">
            Lembretes
          </h1>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition active:scale-98 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Lembrete
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#252B38]">
          <div className="text-[10px] font-bold text-white uppercase dark:text-white">Total de Lembretes</div>
          <div className="mt-1 text-2xl font-extrabold text-white dark:text-white">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#252B38]">
          <div className="text-[10px] font-bold text-[#F59E0B] uppercase dark:text-[#FBBF24]">Pendentes</div>
          <div className="mt-1 text-2xl font-extrabold text-white dark:text-white">{stats.pending}</div>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-[#1E293B] dark:bg-[#252B38]">
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Concluídos</div>
          <div className="mt-1 text-2xl font-extrabold text-white dark:text-white">{stats.completed}</div>
        </div>
      </div>

      {/* Form modal/card */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-amber-500/40 bg-amber-50/60 p-4.5 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20"
        >
          <h3 className="text-xs font-bold text-[#F59E0B] uppercase dark:text-[#FBBF24]">
            Cadastrar Novo Lembrete
          </h3>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-white dark:text-white">
                Título do lembrete <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Último dia para pagamento da taxa de inscrição..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white dark:text-white">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              >
                <option value="INSCRICOES">Inscrições</option>
                <option value="PROVAS">Provas</option>
                <option value="PAGAMENTOS">Pagamentos</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white dark:text-white">
                Data limite
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#374151] focus:border-[#F59E0B] focus:outline-none dark:border-[#1E293B] dark:bg-[#0F172A] dark:text-white"
              />
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] hover:from-[#D97706] hover:to-[#F59E0B] px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Salvar Lembrete
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-3 dark:border-[#1E293B] dark:bg-[#252B38]">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(["TODOS", "INSCRICOES", "PROVAS", "PAGAMENTOS"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                filterCategory === cat
                  ? "bg-amber-500/10 text-[#F59E0B] border border-amber-500/30 dark:bg-amber-500/20 dark:text-[#FBBF24]"
                  : "text-[#737D89] hover:bg-[#F8FAFC] dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
              }`}
            >
              {cat === "TODOS" ? "Todas Categorias" : cat}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 rounded-xl bg-[#F8FAFC] p-0.5 text-xs font-bold dark:bg-[#0F172A]">
          {(["TODOS", "PENDENTES", "CONCLUIDOS"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterStatus === st
                  ? "bg-white text-[#F59E0B] shadow-xs dark:bg-[#1E293B] dark:text-[#FBBF24]"
                  : "text-white dark:text-white"
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
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center text-xs text-[#737D89] dark:border-[#1E293B] dark:bg-[#252B38] dark:text-[#94A3B8]">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[#F59E0B]" />
            <p className="font-semibold">Nenhum lembrete encontrado para este filtro.</p>
          </div>
        ) : (
          filteredReminders.map((rem) => (
            <div
              key={rem.id}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                rem.completed
                  ? "border-[#E2E8F0] bg-[#F8FAFC]/70 opacity-70 dark:border-[#1E293B] dark:bg-[#0F172A]/60"
                  : "border-[#E2E8F0] bg-white hover:border-[#F59E0B] dark:border-[#1E293B] dark:bg-[#1E293B]"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rem.completed}
                  onChange={() => toggleReminder(rem.id)}
                  className="h-4 w-4 rounded accent-[#F59E0B] cursor-pointer"
                />
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      rem.completed
                        ? "text-white line-through dark:text-white"
                        : "text-white dark:text-white"
                    }`}
                  >
                    {rem.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-white dark:text-white">
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
                  className="rounded-lg p-1 text-white hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
