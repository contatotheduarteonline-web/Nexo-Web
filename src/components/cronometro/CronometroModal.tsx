import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CronometroView } from "./CronometroView";

interface CronometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registro de Estudos em tela cheia.
 *
 * O Registro de Estudos é um módulo completo e não deve ser exibido
 * dentro de um popup estreito. O overlay ocupa 100% da viewport e o
 * conteúdo interno possui seu próprio scroll vertical/horizontal seguro.
 */
export const CronometroModal: React.FC<CronometroModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="study-registration-modal fixed inset-0 z-[100] flex h-[100dvh] w-[100vw] overflow-hidden bg-[#0d0f12]/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Registro de Estudos"
    >
      <style>{`
        .study-registration-modal,
        .study-registration-modal * {
          box-sizing: border-box;
        }

        .study-registration-modal-dialog {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100vw !important;
          height: 100dvh !important;
          min-width: 0 !important;
          min-height: 0 !important;
          max-width: none !important;
          max-height: none !important;
          margin: 0 !important;
          border-radius: 0 !important;
          border-width: 0 !important;
          overflow: hidden;
        }

        .study-registration-modal-content {
          flex: 1 1 auto;
          min-width: 0;
          min-height: 0;
          width: 100%;
          max-width: none;
          overflow-x: hidden;
          overflow-y: auto;
          padding: clamp(16px, 2.5vw, 32px);
        }

        .study-registration-modal-content > div {
          width: 100%;
          max-width: 1152px;
          min-width: 0;
          margin-left: auto;
          margin-right: auto;
        }

        .study-registration-modal-content .grid.lg\\:grid-cols-12 {
          width: 100%;
          min-width: 0;
          grid-template-columns: minmax(0, 1fr) !important;
        }

        .study-registration-modal-content .lg\\:col-span-8,
        .study-registration-modal-content .lg\\:col-span-4 {
          width: 100%;
          min-width: 0;
          grid-column: auto !important;
        }

        .study-registration-modal-content button,
        .study-registration-modal-content input,
        .study-registration-modal-content select,
        .study-registration-modal-content textarea {
          min-width: 0;
          max-width: 100%;
        }

        .study-registration-modal-content .grid.sm\\:grid-cols-6 {
          width: 100%;
          min-width: 0;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        .study-registration-modal-content .grid.sm\\:grid-cols-6 > button {
          min-width: 0;
          min-height: 44px;
          padding-inline: 8px;
          line-height: 1.2;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .study-registration-modal-content .font-mono.text-7xl {
          width: 100%;
          max-width: 100%;
          font-size: clamp(3.5rem, 7vw, 7rem);
          line-height: 1;
          white-space: nowrap;
        }

        .study-registration-modal-content .grid.grid-cols-3.gap-3 {
          width: 100%;
          min-width: 0;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        .study-registration-modal-content .grid.grid-cols-3.gap-3 > div {
          min-width: 0;
        }

        .study-registration-modal-content .space-y-5 > .rounded-xl:first-child > .flex.items-center.justify-between {
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
        }

        .study-registration-modal-content .space-y-5 > .rounded-xl:first-child > .flex.items-center.justify-between > div {
          max-width: 100%;
          min-width: 0;
          flex-wrap: wrap;
          gap: 2px;
        }

        @media (min-width: 900px) {
          .study-registration-modal-content {
            padding: 24px clamp(24px, 4vw, 56px) 40px;
          }

          .study-registration-modal-content .grid.lg\\:grid-cols-12 {
            grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr) !important;
            column-gap: 24px;
            align-items: start;
          }

          .study-registration-modal-content .lg\\:col-span-8 {
            grid-column: 1 !important;
          }

          .study-registration-modal-content .lg\\:col-span-4 {
            grid-column: 2 !important;
          }
        }

        @media (max-width: 899px) {
          .study-registration-modal-content .grid.lg\\:grid-cols-12 {
            grid-template-columns: minmax(0, 1fr) !important;
          }

          .study-registration-modal-content .lg\\:col-span-8,
          .study-registration-modal-content .lg\\:col-span-4 {
            grid-column: 1 !important;
          }
        }

        @media (max-width: 639px) {
          .study-registration-modal-content {
            padding: 16px 12px 28px;
          }

          .study-registration-modal-content .grid.sm\\:grid-cols-6 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .study-registration-modal-content .grid.grid-cols-3.gap-3 {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        ref={dialogRef}
        className="study-registration-modal-dialog bg-[#11151F] text-white"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#384154] bg-[#171B25] px-5 md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3AA2D] text-[#11151F]">
              <span className="text-xl">◷</span>
            </div>
            <h2 className="truncate text-base font-bold tracking-wide text-white md:text-lg">
              Registro de Estudos
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-white transition hover:bg-[#252B38] cursor-pointer"
            title="Fechar Registro de Estudos"
            aria-label="Fechar Registro de Estudos"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="study-registration-modal-content scrollbar-thin">
          <CronometroView />
        </div>
      </div>
    </div>
  );
};
