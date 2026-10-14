import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  Calendar,
  Clock,
  Timer,
  TrendingUp,
  Glasses,
  Trophy,
  Pencil,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

const REMEMBER_EMAIL_KEY = "nexo_remember_email";

export const LoginView: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(() => {
    try {
      return !!localStorage.getItem(REMEMBER_EMAIL_KEY);
    } catch {
      return false;
    }
  });
  const [error, setError] = useState("");
  const [unauthorizedDomainInfo, setUnauthorizedDomainInfo] = useState<{ domain: string } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleGoogleLogin = async () => {
    setError("");
    setUnauthorizedDomainInfo(null);
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        if (res.code === "auth/unauthorized-domain") {
          setUnauthorizedDomainInfo({ domain: res.domain || window.location.hostname });
        } else {
          setError(res.error || "Erro ao autenticar com o Google.");
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError("Informe seu endereço de e-mail.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Formato de e-mail inválido. Verifique o endereço digitado.");
      return;
    }

    if (!cleanPassword) {
      setError("Informe sua senha de acesso.");
      return;
    }

    if (cleanPassword.length < 4) {
      setError("A senha informada não atende aos requisitos mínimos.");
      return;
    }

    try {
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, cleanEmail);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      /* localStorage indisponível — segue o fluxo normal */
    }

    const res = await loginWithEmail(cleanEmail, cleanPassword);
    if (!res.success) {
      setError(res.error || "Credenciais não autorizadas. Verifique seus dados de acesso.");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d0f12] p-4 text-white antialiased selection:bg-[#527DFF]/30 selection:text-[#F4B544] sm:p-8">
      {/* Layer 0: Ambient glows + outline study icons watermark */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#527DFF]/[0.04] blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-[#F4B544]/[0.03] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#527DFF]/[0.02] blur-3xl" />

        <BookOpen className="absolute top-14 left-[12%] h-11 w-11 rotate-6 stroke-[1.25] text-white/[0.07]" />
        <Calendar className="absolute top-36 right-[10%] h-9 w-9 -rotate-6 stroke-[1.25] text-white/[0.06]" />
        <Timer className="absolute bottom-24 left-[8%] h-10 w-10 -rotate-12 stroke-[1.25] text-white/[0.06]" />
        <TrendingUp className="absolute bottom-32 right-[14%] h-10 w-10 rotate-12 stroke-[1.25] text-white/[0.06]" />
        <Glasses className="absolute top-[30%] right-[22%] h-8 w-8 rotate-12 stroke-[1.25] text-white/[0.05]" />
        <Trophy className="absolute top-[62%] left-[20%] h-9 w-9 -rotate-6 stroke-[1.25] text-white/[0.05]" />
        <Pencil className="absolute top-[18%] left-[32%] h-7 w-7 rotate-45 stroke-[1.25] text-white/[0.05]" />
        <GraduationCap className="absolute bottom-[14%] right-[30%] h-8 w-8 -rotate-6 stroke-[1.25] text-white/[0.05]" />
        <Clock className="absolute top-[70%] left-[38%] h-7 w-7 rotate-12 stroke-[1.25] text-white/[0.04]" />
      </div>

      {/* Layer 1: Centered Auth Card */}
      <div className="relative z-10 my-auto w-full max-w-[460px] rounded-2xl border border-[#2a2e35] bg-[#12151c]/95 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-9">
        {/* Brand Header */}
        <div className="mb-7 flex items-center">
          <Logo variant="horizontal" size="sm" themeMode="dark" />
        </div>

        {/* Form Header */}
        <div className="mb-6 space-y-1.5 text-left">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Olá,
            <br />
            bem-vindo de volta
          </h2>
          <p className="text-sm font-normal text-[#718096]">Entre para continuar seus estudos.</p>
        </div>

        {/* Unauthorized Domain Helper Notification */}
        {unauthorizedDomainInfo && (
          <div className="mb-6 space-y-3 rounded-2xl border border-[#F4B544]/30 bg-gradient-to-b from-amber-500/10 to-amber-950/20 p-4 text-xs text-[#F4B544] shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F4B544]" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-[#F4B544]">
                    Domínio não autorizado no Firebase
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnauthorizedDomainInfo(null)}
                    className="cursor-pointer p-0.5 text-[11px] text-[#F4B544]/70 transition-colors hover:text-[#F4B544]"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-[#F4B544]/90">
                  Este ambiente de prévia ainda não está autorizado no Firebase. Adicione o domínio abaixo em{" "}
                  <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
                </p>
              </div>
            </div>

            {/* Copy Domain Box */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#F4B544]/20 bg-black/40 px-3 py-2 font-mono text-[11px] text-zinc-300">
              <span className="select-all truncate font-semibold text-zinc-200">
                {unauthorizedDomainInfo.domain || (typeof window !== "undefined" ? window.location.hostname : "")}
              </span>
              <button
                type="button"
                onClick={() => {
                  const hostToCopy =
                    unauthorizedDomainInfo.domain || (typeof window !== "undefined" ? window.location.hostname : "");
                  navigator.clipboard.writeText(hostToCopy);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2500);
                }}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[#527DFF]/20 px-2.5 py-1 text-[11px] font-semibold text-[#F4B544] transition-colors hover:bg-[#527DFF]/30"
              >
                {copiedDomain ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#2BBF8A]" />
                    <span className="text-[#2BBF8A]">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar domínio</span>
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 rounded-lg bg-black/20 p-2.5 text-[11px] text-zinc-300">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#F4B544]">Como liberar no Firebase Console:</p>
              <ol className="list-inside list-decimal space-y-0.5 text-[10.5px] text-zinc-400">
                <li>
                  Acesse o <span className="font-medium text-white">Firebase Console</span> (projeto nexo-web-d7401)
                </li>
                <li>
                  Vá em <span className="font-medium text-white">Authentication</span> &gt; aba{" "}
                  <span className="font-medium text-white">Settings</span>
                </li>
                <li>
                  Em <span className="font-medium text-white">Authorized domains</span>, clique em{" "}
                  <span className="font-medium text-white">Add domain</span> e cole o domínio
                </li>
              </ol>
              <p className="border-t border-white/5 pt-1 text-[10px] text-zinc-400">
                Para testes completos de autenticação com domínios já liberados, utilize{" "}
                <span className="font-medium text-zinc-300">nexosestudo.app</span> ou{" "}
                <span className="font-medium text-zinc-300">nexo-web-d7401.web.app</span>.
              </p>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#F4B544]/25 bg-[#527DFF]/10 p-3.5 text-xs text-[#F4B544]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F4B544]" />
            <div className="flex-1 space-y-1.5">
              <p className="font-medium text-[#F4B544]">{error}</p>
              {error.includes("Google") && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading}
                  className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#527DFF] px-3 py-1.5 text-xs font-semibold text-[#0d0f12] transition-colors hover:bg-[#FBBF24]"
                >
                  <span>Entrar com Conta Google</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-[#718096]">
              E-mail
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="voce@exemplo.com"
                className="h-[50px] w-full rounded-xl border border-[#2a2e35] bg-[#111B2D] pl-10 pr-4 text-sm text-white transition-colors placeholder:text-[#718096]/50 focus:border-[#7DA2FF] focus:outline-none focus:ring-1 focus:ring-[#7DA2FF]/30"
              />
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]/60" />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-medium text-[#718096]">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="cursor-pointer text-xs text-[#718096] transition-colors hover:text-[#F4B544]"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Mínimo de 8 caracteres"
                className="h-[50px] w-full rounded-xl border border-[#2a2e35] bg-[#111B2D] pl-10 pr-11 text-sm text-white transition-colors placeholder:text-[#718096]/50 focus:border-[#7DA2FF] focus:outline-none focus:ring-1 focus:ring-[#7DA2FF]/30"
              />
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]/60" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-[#718096]/60 transition-colors hover:text-[#718096]"
                aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember email */}
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs font-medium text-[#718096]">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-[#2a2e35] bg-[#111B2D] accent-[#527DFF]"
            />
            Lembrar meu e-mail
          </label>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#527DFF] text-sm font-bold text-[#0d0f12] transition-all duration-150 hover:bg-[#FBBF24] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              <span>{isLoading ? "Validando credenciais..." : "Entrar"}</span>
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {/* Card Footer */}
        <div className="mt-8 border-t border-white/5 pt-4 text-center text-[11px] text-[#718096]/70">
          © 2026 NEXO. Todos os direitos reservados.
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  );
};
