import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PlanLogo } from "./PlanLogo";

export interface PlanSelectorItem {
  id: string;
  title: string;
  imageUrl?: string | null;
}

interface PlanSelectorProps {
  /** Opções da lista (planos/editais). Vazio = apenas o pill do plano ativo. */
  items?: PlanSelectorItem[];
  /** Rótulo do plano/edital ativo exibido no pill. */
  activeLabel: string;
  /** Id do item ativo. */
  activeId?: string;
  /** Imagem resolvida do plano ativo (customizada > plano > edital). */
  imageUrl?: string | null;
  isLoading?: boolean;
  /** Quando informado, o pill vira um dropdown selecionável. */
  onSelect?: (id: string) => void;
  /** Id opcional para o botão gatilho (testes/atalhos). */
  triggerId?: string;
}

const pillBase =
  "inline-flex items-center gap-2 rounded-lg border border-[#263447] bg-[#1D2B40] px-3.5 py-2 text-[13px] font-semibold text-white transition";

/**
 * Seletor de plano/edital padronizado da plataforma.
 * Pill com logo + nome truncado + chevron; dropdown com a lista de planos quando onSelect é informado.
 */
export const PlanSelector: React.FC<PlanSelectorProps> = ({
  items = [],
  activeLabel,
  activeId,
  imageUrl,
  isLoading = false,
  onSelect,
  triggerId,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const pillContent = (
    <>
      <PlanLogo
        imageUrl={imageUrl}
        isLoading={isLoading}
        alt={activeLabel}
        className="h-5 w-5"
      />
      <span className="max-w-[160px] truncate">{activeLabel}</span>
      {onSelect && <ChevronDown className="h-3.5 w-3.5 text-[#93A2B7]" />}
    </>
  );

  return (
    <div className="relative" ref={rootRef}>
      {onSelect ? (
        <button
          type="button"
          id={triggerId}
          onClick={() => setOpen((prev) => !prev)}
          className={`${pillBase} hover:bg-[#0B1120] cursor-pointer`}
        >
          {pillContent}
        </button>
      ) : (
        <div className={pillBase}>{pillContent}</div>
      )}

      {onSelect && open && (
        <div className="absolute right-0 top-11 z-30 w-64 rounded-xl border border-[#263447] bg-[#1D2B40] p-1.5 shadow-xl">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white transition hover:bg-[#0B1120] cursor-pointer"
            >
              <PlanLogo imageUrl={item.imageUrl} alt={item.title} className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.id === activeId && <Check className="h-4 w-4 shrink-0 text-[#2BBF8A]" />}
            </button>
          ))}
          {items.length === 0 && (
            <span className="block px-3 py-2 text-[12px] text-[#93A2B7]">
              Nenhum plano criado
            </span>
          )}
        </div>
      )}
    </div>
  );
};
