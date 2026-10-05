import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { CronometroView } from "./CronometroView";

interface CronometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registro de Estudos como overlay popup.
 * Mantém a estrutura visual original do popup e usa o CronometroView
 * atualizado como conteúdo, preservando as novas funcionalidades do registro.
 */
export const CronometroModal: React.FC<CronometroModalProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      return;
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, isFullscreen]);

  if (!isOpen) return null;

  return (
    <div
      className="study-registration-modal fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f12]/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <style>{`
        .study-registration-modal-dialog {
          width: min(96vw, 1280px);
          height: min(94vh, 920px);
          max-height: 94vh;
          min-width: 0;
        }

        .study-registration-modal-dialog.is-fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          border-radius: 0;
          border-width: 0;
        }

        .study-registration-modal-content {
          min-width: 0;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 24px clamp(16px, 2.5vw, 32px);
        }

        .study-registration-modal-content > div {
          min-width: 0;
          width: 100%;
          max-width: none;
        }

        .study-registration-modal-content .grid.lg\\:grid-cols-12 {
          min-width: 0;
          width: 100%;
          grid-template-columns: minmax(0, 1fr) !important;
        }

        .study-registration-modal-content .lg\\:col-span-8,
        .study-registration-modal-content .lg\\:col-span-4 {
          min-width: 0;
          width: 100%;
          grid-column: auto !important;
        }

        .study-registration-modal-content button,
        .study-registration-modal-content input,
        .study-registration-modal-content select,
        .study-registration-modal-content textarea {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        .study-registration-modal-content .grid.sm\\:grid-cols-2,
        .study-registration-modal-content .grid.sm\\:grid-cols-6,
        .study-registration-modal-content .grid.grid-cols-3 {
          min-width: 0;
        }

        .study-registration-modal-content .grid.sm\\:grid-cols-6 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          width: 100%;
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

        .study-registration-modal-content .font-mono {
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
        }

        .study-registration-modal-content .grid.grid-cols-3.gap-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        @media (min-width: 900px) {
          .study-registration-modal-content {
            padding-inline: clamp(20px, 3vw, 40px);
          }

          .study-registration-modal-content .grid.lg\\:grid-cols-12 {
            grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) !important;
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

        @media (min-width: 1200px) {
          .study-registration-modal-dialog:not(.is-fullscreen) {
            width: min(94vw, 1480px);
          }
        }

        .study-registration-modal-content .space-y-5 > .rounded-xl:first-child > .flex.items-center.justify-between {
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
        }

        .study-registration-modal-content .space-y-5 > .rounded-xl:first-child > .flex.items-center.justify-between > div {
          max-width: 100%;
          flex-wrap: wrap;
          gap: 2px;
        }

        .study-registration-modal-content .space-y-5 > .rounded-xl:first-child > .flex.items-center.justify-between button {
          white-space: nowrap;
        }

        .study-registration-modal-content .inline-flex.items-center.rounded-lg {
          max-width: 100%;
          flex-wrap: nowrap;
          justify-content: center;
        }

        .study-registration-modal-content .inline-flex.items-center.rounded-lg button {
          white-space: normal;
          text-align: center;
        }

        .study-registration-modal-content .font-mono.text-7xl {
          width: 100%;
          max-width: 100%;
          font-size: clamp(3.5rem, 6vw, 6.5rem);
          line-height: 1;
          overflow-wrap: normal;
          white-space: nowrap;
        }

        .study-registration-modal-content .grid.grid-cols-3.gap-3 > div {
          min-width: 0;
        }

        .study-registration-modal-content .grid.grid-cols-3.gap-3 > div button {
          flex-shrink: 0;
        }

        @media (max-width: 899px) {
          .study-registration-modal-dialog:not(.is-fullscreen) {
            width: min(96vw, 720px);
          }

          .study-registration-modal-content .grid.lg\\:grid-cols-12 {
            grid-template-columns: 1fr !important;
          }

          .study-registration-modal-content .lg\\:col-span-8,
          .study-registration-modal-content .lg\\:col-span-4 {
            grid-column: 1 !important;
          }
        }

        @media (max-width: 639px) {
          .study-registration-modal-content {
            padding: 16px 12px;
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
        className={`study-registration-modal-dialog flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-2xl${isFullscreen ? " is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#384154] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#F3AA2D]" />
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">
              Registro de Estudos
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="rounded-lg p-1.5 text-white transition hover:bg-[#252B38] hover:text-white cursor-pointer"
              title={isFullscreen ? "Sair da Tela Cheia" : "Abrir Registro de Estudos em Tela Cheia"}
              aria-label={isFullscreen ? "Sair da tela cheia" : "Abrir Registro de Estudos em Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white transition hover:bg-[#252B38] hover:text-white cursor-pointer"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="study-registration-modal-content scrollbar-thin">
          <CronometroView />
        </div>
      </div>
    </div>
  );
};