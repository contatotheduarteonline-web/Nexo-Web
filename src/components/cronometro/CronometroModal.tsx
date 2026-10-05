import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { CronometroView } from "./CronometroView";

interface CronometroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Registro de Estudos em overlay responsivo.
 *
 * O botão de maximizar usa a Fullscreen API quando disponível. Em navegadores
 * que não permitem fullscreen via API, o componente mantém um fallback CSS
 * que ocupa toda a viewport sem criar overflow horizontal.
 */
export const CronometroModal: React.FC<CronometroModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(true);
      return;
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === dialogRef.current);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement === dialogRef.current) {
          void document.exitFullscreen?.();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, isFullscreen]);

  useEffect(() => {
    if (!isOpen && document.fullscreenElement === dialogRef.current) {
      void document.exitFullscreen?.();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFullscreen = async () => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      if (document.fullscreenElement !== dialog && dialog.requestFullscreen) {
        await dialog.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(true);
    }
  };

  const handleClose = async () => {
    if (document.fullscreenElement === dialogRef.current) {
      try {
        await document.exitFullscreen?.();
      } catch {
        // Ignora falha ao sair do fullscreen e fecha o modal normalmente.
      }
    }
    setIsFullscreen(false);
    onClose();
  };

  return (
    <div
      className={`study-registration-modal fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f12]/70 backdrop-blur-md${
        " is-modal-fullscreen"
      }`}
      onClick={handleClose}
    >
      <style>{`
        .study-registration-modal-dialog {
          width: min(96vw, 1280px);
          height: min(94vh, 920px);
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 32px);
          min-width: 0;
          box-sizing: border-box;
        }

        .study-registration-modal.is-modal-fullscreen {
          padding: 0;
          overflow: hidden;
        }

        .study-registration-modal-dialog.is-fullscreen,
        .study-registration-modal-dialog:fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          min-width: 0;
          border-radius: 0;
          border-width: 0;
        }

        .study-registration-modal-content {
          min-width: 0;
          overflow-x: hidden;
          overflow-y: auto;
          padding: 24px clamp(16px, 2.5vw, 32px);
          box-sizing: border-box;
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
            grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr) !important;
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
          .study-registration-modal-dialog:not(:fullscreen):not(.is-fullscreen) {
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
          .study-registration-modal-dialog:not(:fullscreen):not(.is-fullscreen) {
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
        ref={dialogRef}
        className={`study-registration-modal-dialog flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#384154] bg-[#11151F] shadow-2xl${
          isFullscreen ? " is-fullscreen" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#384154] px-5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#F3AA2D]" />
            <h2 className="truncate text-sm font-bold tracking-wide text-white uppercase">
              Registro de Estudos
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg p-1.5 text-white transition hover:bg-[#252B38] hover:text-white cursor-pointer"
              title="Registro de Estudos em Tela Cheia"
              aria-label="Registro de Estudos em Tela Cheia"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-white transition hover:bg-[#252B38] hover:text-white cursor-pointer"
              title="Fechar"
              aria-label="Fechar Registro de Estudos"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="study-registration-modal-content scrollbar-thin flex-1">
          <CronometroView />
        </div>
      </div>
    </div>
  );
};
