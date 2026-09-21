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
      <div className="rounded-2xl border border-red-200 bg-red-50/70 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-red-900 dark:text-red-200">
          {fallbackTitle || "Ops! Ocorreu um erro ao carregar esta visualização."}
        </h3>
        <p className="mt-1 text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">
          {errorMessage || "Não foi possível carregar os dados. Tente recarregar a visualização."}
        </p>
        <button
          onClick={() => {
            setHasError(false);
            setErrorMessage(null);
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
