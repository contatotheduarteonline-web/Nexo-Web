import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Check, Search, PencilLine, FilePlus2 } from "lucide-react";
import { useStudy } from "../../../context/StudyContext";
import {
  fetchPublishedEditaisFromServer,
  PublishedEditalSnapshot,
} from "../../../lib/serverCatalogService";

interface Step3SpecificGoalProps {
  knowsSpecificGoal?: boolean;
  organ?: string;
  cargo?: string;
  banca?: string;
  onChangeGoalKnown: (known: boolean) => void;
  onChangeOrgan: (organ: string) => void;
  onChangeCargo: (cargo: string) => void;
  onChangeBanca: (banca: string) => void;
  onChangeCatalogSelection: (editalId: string | undefined, cargoId: string | undefined) => void;
  onNext: () => void;
}

interface CatalogGroup {
  key: string;
  institution: string;
  logoUrl?: string | null;
  entries: { edital: PublishedEditalSnapshot; cargoId?: string; cargoName: string; meta: string }[];
}

const normalize = (v: string) =>
  (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const Step3SpecificGoal: React.FC<Step3SpecificGoalProps> = ({
  knowsSpecificGoal,
  organ = "",
  cargo = "",
  banca = "",
  onChangeGoalKnown,
  onChangeOrgan,
  onChangeCargo,
  onChangeBanca,
  onChangeCatalogSelection,
  onNext,
}) => {
  const { catalogEditais, isLoadingCatalog } = useStudy();
  const [serverEditais, setServerEditais] = useState<PublishedEditalSnapshot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showManual, setShowManual] = useState(false);

  // Snapshot completa (cargos + disciplinas) do banco do servidor
  useEffect(() => {
    let isMounted = true;
    fetchPublishedEditaisFromServer().then((list) => {
      if (isMounted) setServerEditais(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Agrupa por órgão: um card por instituição, com todos os cargos listados
  const catalogGroups = useMemo<CatalogGroup[]>(() => {
    // Fonte preferencial: snapshot do servidor (tem cargos embutidos).
    // Editais que só existem no catálogo Firestore entram como fallback.
    const seenIds = new Set(serverEditais.map((e) => e.id));
    const fallback = catalogEditais
      .filter((e) => !seenIds.has(e.id))
      .map((e) => ({ ...e }) as PublishedEditalSnapshot);

    const all = [...serverEditais, ...fallback].filter(
      (e) => (e.status || "published") === "published"
    );

    const groups = new Map<string, CatalogGroup>();
    for (const ed of all) {
      const institution = ed.institution || ed.title;
      const key = normalize(institution);
      if (!key) continue;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          institution,
          logoUrl: ed.logoDataUrl || ed.logoUrl || null,
          entries: [],
        });
      }
      const group = groups.get(key)!;
      if (!group.logoUrl && (ed.logoDataUrl || ed.logoUrl)) {
        group.logoUrl = ed.logoDataUrl || ed.logoUrl;
      }

      const meta = `Ed. ${ed.editalNumber || "01"}/${ed.year} • ${ed.board || "Banca a definir"}`;
      if (ed.cargos && ed.cargos.length > 0) {
        for (const c of ed.cargos) {
          group.entries.push({ edital: ed, cargoId: c.id, cargoName: c.name, meta });
        }
      } else {
        group.entries.push({
          edital: ed,
          cargoName: ed.cargoPretendido || "Edital completo",
          meta,
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.institution.localeCompare(b.institution)
    );
  }, [serverEditais, catalogEditais]);

  const filteredGroups = useMemo<CatalogGroup[]>(() => {
    const q = normalize(searchQuery.trim());
    if (!q) return catalogGroups;
    return catalogGroups
      .map((g) => {
        const instMatch = normalize(g.institution).includes(q);
        const entries = instMatch
          ? g.entries
          : g.entries.filter((e) => normalize(e.cargoName).includes(q));
        return entries.length > 0 ? { ...g, entries } : null;
      })
      .filter(Boolean) as CatalogGroup[];
  }, [catalogGroups, searchQuery]);

  const handleSelectCargo = (
    group: CatalogGroup,
    entry: { edital: PublishedEditalSnapshot; cargoId?: string; cargoName: string }
  ) => {
    onChangeOrgan(group.institution);
    onChangeCargo(entry.cargoName);
    if (entry.edital.board) onChangeBanca(entry.edital.board);
    onChangeCatalogSelection(entry.edital.id, entry.cargoId);
    onNext();
  };

  // If user says "Sim, já sei", they should at least provide organ or cargo to continue, or if "Ainda estou decidindo", they can proceed immediately.
  const canContinue =
    knowsSpecificGoal === false ||
    (knowsSpecificGoal === true && (organ.trim().length > 0 || cargo.trim().length > 0));

  return (
    <div id="step-3-specific-goal" className="w-full">
      {/* Question Header */}
      <div className="mb-6 sm:mb-8 text-left">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Qual concurso e cargo?
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Com o edital, já trazemos todas as disciplinas cobradas para o seu cargo.
        </p>
      </div>

      {/* Two Simple Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        <button
          type="button"
          id="btn-goal-yes"
          onClick={() => onChangeGoalKnown(true)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsSpecificGoal === true
              ? "bg-zinc-800/90 border-[#527DFF] shadow-[0_0_18px_rgba(82,125,255,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsSpecificGoal === true ? "text-white font-semibold" : "text-zinc-200"}`}>
            Sim, já sei
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsSpecificGoal === true
                ? "border-[#527DFF] bg-[#527DFF] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          type="button"
          id="btn-goal-deciding"
          onClick={() => onChangeGoalKnown(false)}
          className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
            knowsSpecificGoal === false
              ? "bg-zinc-800/90 border-[#527DFF] shadow-[0_0_18px_rgba(82,125,255,0.18)]"
              : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700"
          }`}
        >
          <span className={`text-base sm:text-lg font-medium ${knowsSpecificGoal === false ? "text-white font-semibold" : "text-zinc-200"}`}>
            Ainda estou decidindo
          </span>
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              knowsSpecificGoal === false
                ? "border-[#527DFF] bg-[#527DFF] text-white"
                : "border-zinc-700 bg-zinc-800/40 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Catalog Browser — ONLY shown if YES */}
      {knowsSpecificGoal === true && (
        <div className="space-y-4 mb-8">
          {/* Search */}
          <div className="relative">
            <input
              id="input-catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busque pelo órgão, sigla ou cargo"
              className="w-full h-[52px] px-4 pl-11 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF]/40 transition-colors text-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500 pointer-events-none" />
          </div>

          {/* "Não é nenhum desses?" row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-3">
            <span className="text-sm text-zinc-400">Não é nenhum desses?</span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowManual((v) => !v)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  showManual
                    ? "border-[#527DFF] bg-[#527DFF]/15 text-white"
                    : "border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:border-[#527DFF]/60 hover:text-white"
                }`}
              >
                <PencilLine className="h-3.5 w-3.5" />
                <span>Montar com as minhas disciplinas</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManual(true)}
                className="inline-flex items-center justify-center gap-1.5 px-1 py-2 text-xs font-semibold text-[#7DA2FF] hover:text-white transition-colors cursor-pointer"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                <span>Pedir cadastro do edital</span>
              </button>
            </div>
          </div>

          {/* Manual input fields (Órgão, Cargo, Banca) */}
          {showManual && (
            <div className="space-y-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 transition-all duration-200">
              <div>
                <label htmlFor="input-onboarding-organ" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Órgão / Concurso
                </label>
                <input
                  id="input-onboarding-organ"
                  type="text"
                  value={organ}
                  onChange={(e) => {
                    onChangeOrgan(e.target.value);
                    if (e.target.value) onChangeCatalogSelection(undefined, undefined);
                  }}
                  placeholder="Ex: Órgão ou instituição desejada..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF] transition-colors text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="input-onboarding-cargo" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Cargo
                </label>
                <input
                  id="input-onboarding-cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => onChangeCargo(e.target.value)}
                  placeholder="Ex: Cargo ou função pretendida..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF] transition-colors text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="input-onboarding-banca" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Banca
                  </label>
                  <span className="text-[11px] text-zinc-500">Opcional</span>
                </div>
                <input
                  id="input-onboarding-banca"
                  type="text"
                  value={banca}
                  onChange={(e) => onChangeBanca(e.target.value)}
                  placeholder="Ex: Cebraspe, FGV, FCC, Vunesp, etc."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 focus:outline-none focus:border-[#7DA2FF] focus:ring-1 focus:ring-[#7DA2FF] transition-colors text-sm"
                />
              </div>
            </div>
          )}

          {/* Catalog Cards */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {isLoadingCatalog && serverEditais.length === 0 && catalogEditais.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center text-sm text-zinc-400">
                Carregando catálogo de editais...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                <p className="text-sm text-zinc-300 font-semibold">Nenhum edital encontrado{searchQuery ? ` para "${searchQuery}"` : ""}.</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Use "Montar com as minhas disciplinas" para cadastrar seu concurso manualmente.
                </p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors overflow-hidden"
                >
                  {/* Org Header: logo + institution */}
                  <div className="flex items-center gap-3.5 px-4 pt-4 pb-2">
                    {group.logoUrl ? (
                      <img
                        src={group.logoUrl}
                        alt={group.institution}
                        className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white/5 border border-zinc-800"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#527DFF]/15 border border-[#527DFF]/30">
                        <span className="text-base font-black text-[#F4B544]">
                          {group.institution.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {group.institution}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {group.entries.length} {group.entries.length === 1 ? "cargo disponível" : "cargos disponíveis"}
                      </p>
                    </div>
                  </div>

                  {/* Cargo rows */}
                  <div className="px-2 pb-2">
                    {group.entries.map((entry, idx) => (
                      <button
                        key={`${entry.edital.id}-${idx}`}
                        type="button"
                        onClick={() => handleSelectCargo(group, entry)}
                        className="group flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left hover:bg-zinc-800/70 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-zinc-100 group-hover:text-white truncate">
                            {entry.cargoName}
                          </span>
                          <span className="block text-[11px] text-zinc-500 mt-0.5 truncate">
                            {entry.meta}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-[#7DA2FF] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
