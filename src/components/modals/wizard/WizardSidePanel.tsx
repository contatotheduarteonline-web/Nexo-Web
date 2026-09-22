import React from "react";
import { Check, X, FileText } from "lucide-react";
import type { CatalogEdital, CatalogCargo } from "../../../types";

// ---------------------------------------------------------------------------
// Painel lateral do assistente de criação de plano (benefícios + ilustração)
// ---------------------------------------------------------------------------

const DEFAULT_BENEFITS = [
  "Planejamento Personalizado",
  "Métricas de Desempenho",
  "Controle de Revisões",
  "Edital Verticalizado",
  "E muito mais",
];

const StairsIllustration: React.FC = () => (
  <svg viewBox="0 0 240 150" className="mx-auto h-36 w-auto" fill="none">
    {/* Degraus de livros */}
    <rect x="8" y="112" width="74" height="28" rx="5" fill="#252B38" stroke="#384154" />
    <rect x="8" y="112" width="74" height="6" rx="3" fill="#F3AA2D" opacity="0.45" />
    <rect x="76" y="82" width="74" height="28" rx="5" fill="#252B38" stroke="#384154" />
    <rect x="76" y="82" width="74" height="6" rx="3" fill="#F3AA2D" opacity="0.7" />
    <rect x="144" y="52" width="74" height="28" rx="5" fill="#252B38" stroke="#384154" />
    <rect x="144" y="52" width="74" height="6" rx="3" fill="#F3AA2D" />
    {/* Mastro e bandeira */}
    <rect x="203" y="24" width="3" height="30" rx="1.5" fill="#384154" />
    <path d="M206 24 h22 l-6 7.5 6 7.5 h-22 z" fill="#F3AA2D" />
    {/* Figura subindo em direção à bandeira */}
    <circle cx="128" cy="56" r="9" fill="#F3AA2D" />
    <rect
      x="121"
      y="66"
      width="15"
      height="36"
      rx="7"
      fill="#64748B"
      transform="rotate(12 128 84)"
    />
    <path d="M133 72 L162 46" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
    <path d="M124 100 L110 118" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
    <path d="M133 100 L150 112" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

interface WizardSidePanelProps {
  title?: string;
  benefits?: string[];
}

export const WizardSidePanel: React.FC<WizardSidePanelProps> = ({
  title = "A sua evolução nos estudos começa aqui!",
  benefits = DEFAULT_BENEFITS,
}) => (
  <aside className="relative hidden overflow-hidden rounded-2xl border border-[#384154] bg-[#171B25] p-5 lg:flex lg:flex-col">
    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#F3AA2D]/10 blur-xl" />
    <h4 className="font-condensed text-base font-bold uppercase leading-snug text-white">
      {title}
    </h4>
    <ul className="mt-4 space-y-2.5">
      {benefits.map((b) => (
        <li key={b} className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F3AA2D] text-[#11151F]">
            <Check className="h-3 w-3" />
          </span>
          <span className="text-xs font-semibold text-white">{b}</span>
        </li>
      ))}
    </ul>
    <div className="mt-auto pt-6">
      <StairsIllustration />
    </div>
  </aside>
);

// ---------------------------------------------------------------------------
// Painel de resumo "Selecionados" da etapa de edital
// ---------------------------------------------------------------------------

interface WizardSelectionPanelProps {
  edital: CatalogEdital | null;
  cargo: CatalogCargo | null;
  disciplinesCount: number;
  topicsCount: number;
  isLoading: boolean;
  onClear: () => void;
}

export const WizardSelectionPanel: React.FC<WizardSelectionPanelProps> = ({
  edital,
  cargo,
  disciplinesCount,
  topicsCount,
  isLoading,
  onClear,
}) => (
  <aside className="self-start rounded-2xl border border-[#384154] bg-[#171B25] p-5">
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
      Selecionados
    </span>

    {cargo && edital ? (
      <div className="mt-3 rounded-xl border border-[#F3AA2D]/40 bg-[#F3AA2D]/10 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">
            Cargo
          </span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-0.5 text-white/60 transition cursor-pointer hover:bg-[#2D3442] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1 text-sm font-bold text-[#F3AA2D]">{cargo.name}</p>
        <p className="text-[11px] text-white/80">{edital.institution}</p>
      </div>
    ) : (
      <div className="mt-3 rounded-xl border border-dashed border-[#384154] p-4 text-center">
        <FileText className="mx-auto h-5 w-5 text-white/40" />
        <p className="mt-2 text-[11px] font-semibold text-white">Nada selecionado ainda</p>
        <p className="mt-0.5 text-[10px] text-white/60">
          {isLoading ? "Carregando cargos..." : "Escolha um edital e o cargo pretendido."}
        </p>
      </div>
    )}

    <div className="mt-4 space-y-1.5 border-t border-[#384154] pt-4">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/60">Disciplinas</span>
        <span className="num-condensed text-sm font-bold text-white">{disciplinesCount}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/60">Tópicos</span>
        <span className="num-condensed text-sm font-bold text-white">{topicsCount}</span>
      </div>
    </div>
  </aside>
);
