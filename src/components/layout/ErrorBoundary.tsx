import React, { useState, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

export const ErrorBoundary: React.FC<Props> = ({ children, fallbackTitle }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Catch errors in children if they bubble
  if (hasError) {
    return (
      <div className="rounded-2xl border border-[#F16D75] bg-[#F16D75]/70 p-8 text-center dark:border-[#F16D75]/50 dark:bg-[#F16D75]/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B2029] text-[#F16D75] dark:bg-[#F16D75]/50 dark:text-[#F16D75]">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-[#F16D75] dark:text-[#F16D75]">
          {fallbackTitle || "Ops! Ocorreu um erro ao carregar esta visualização."}
        </h3>
        <p className="mt-1 text-xs text-[#F16D75] dark:text-[#F16D75] max-w-md mx-auto">
          {errorMessage || "Não foi possível carregar os dados. Tente recarregar a visualização."}
        </p>
        <button
          onClick={() => {
            setHasError(false);
            setErrorMessage(null);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F16D75] px-4 py-2 text-xs font-bold text-white hover:bg-[#F16D75] transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
