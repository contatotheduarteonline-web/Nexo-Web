import React, { useState } from "react";
import { X, Mail, ArrowRight, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { requestPasswordReset } = useAuth();
  const [step, setStep] = useState<"request" | "success">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Por favor, digite seu e-mail cadastrado.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        setStep("success");
      } else {
        setError(res.error || "E-mail não localizado na base de usuários cadastrados.");
      }
    } catch (err: any) {
      setError(err.message || "Falha ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("request");
    setEmail("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#27272A] dark:bg-[#0B1120]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#527DFF]/15 text-[#F4B544] border border-[#F4B544]/30">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#09090B] dark:text-white">
                Recuperação de Senha
              </h3>
              <p className="text-[11px] text-[#718096] dark:text-[#93A2B7]">
                {step === "request" ? "Redefinição via Firebase Authentication" : "Link de Acesso Enviado"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-[#718096] hover:bg-slate-100 dark:hover:bg-[#172235] dark:text-[#93A2B7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#7A3541] bg-[#3B2029] p-3 text-xs font-semibold text-[#F16D75] dark:border-[#F16D75]/40 dark:bg-[#F16D75]/30 dark:text-[#F16D75]">
            {error}
          </div>
        )}

        {/* STEP 1: Request Email */}
        {step === "request" && (
          <form onSubmit={handleRequestReset} className="mt-4 space-y-4">
            <p className="text-xs text-[#718096] dark:text-[#C4CEDB] leading-relaxed">
              Digite o e-mail cadastrado na sua conta. O Firebase enviará um link seguro e exclusivo para você redefinir sua senha com total segurança.
            </p>

            <div>
              <label className="text-xs font-bold text-[#09090B] dark:text-white">
                E-mail Cadastrado
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="seu.email@exemplo.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-[#09090B] placeholder:text-[#93A2B7] focus:border-[#7DA2FF] focus:bg-white focus:outline-hidden dark:border-[#27272A] dark:bg-[#172235] dark:text-white dark:focus:border-[#7DA2FF]"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#93A2B7]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-slate-100 dark:text-[#C4CEDB] dark:hover:bg-[#172235]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F4B544] to-[#F4B544] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:from-[#D97706] hover:to-[#F4B544] disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Enviando e-mail..." : "Enviar Link de Recuperação"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Success Screen */}
        {step === "success" && (
          <div className="mt-5 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#15382F] text-[#2BBF8A] dark:bg-[#2BBF8A]/40 dark:text-[#2BBF8A] shadow-inner">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-[#09090B] dark:text-white">
              E-mail de Recuperação Enviado!
            </h4>
            <p className="text-xs text-[#718096] dark:text-[#C4CEDB] leading-relaxed">
              Enviamos as instruções e o link seguro para <strong>{email}</strong>.<br />
              Acesse sua caixa de entrada (ou pasta de spam) e clique no link para definir sua nova senha.
            </p>
            <div className="rounded-xl border border-[#2BBF8A]/20 bg-[#2BBF8A]/50 p-3 text-[11px] text-[#2BBF8A] dark:bg-[#2BBF8A]/30 dark:text-[#2BBF8A] text-left flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#2BBF8A] dark:text-[#2BBF8A]" />
              <span>
                O link expira em algumas horas. Após redefinir a senha, você poderá fazer login normalmente no NEXO com sua nova credencial.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#F4B544] to-[#F4B544] py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/25 hover:from-[#D97706] hover:to-[#F4B544] cursor-pointer"
            >
              Voltar ao Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
