import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  Timer,
  TrendingUp,
  Glasses,
  Laptop,
  Trophy,
  Pencil,
  GraduationCap,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

interface LoginViewProps {
  onGoToCadastro?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGoToCadastro }) => {
  const { loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const res = await loginWithEmail(cleanEmail, cleanPassword);
    if (!res.success) {
      setError(res.error || "Credenciais não autorizadas. Verifique seus dados de acesso.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0B0E14] text-zinc-100 antialiased selection:bg-[#FF6B00]/30 selection:text-orange-200 lg:h-screen lg:overflow-hidden relative">
      {/* Desktop Left Institutional Section (52%) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between border-r border-zinc-800/40 bg-gradient-to-br from-[#11151F] via-[#0E121B] to-[#0A0D13] p-10 xl:p-14 2xl:p-16 relative overflow-y-auto overflow-x-hidden">
        {/* Layer 0: Decorative Watermark Background */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          {/* Subtle warm ambient glows */}
          <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#FF6B00]/[0.025] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#FF6B00]/[0.02] blur-3xl" />

          {/* Large NEXO Wordmark Watermark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 select-none pointer-events-none leading-none">
            <span className="text-[140px] xl:text-[180px] font-black tracking-[0.22em] text-white/[0.035] uppercase -rotate-12 block select-none">
              NEXO
            </span>
          </div>

          {/* Brand Symbol Watermark (lower left) */}
          <div className="absolute -left-12 -bottom-12 opacity-[0.04] pointer-events-none select-none">
            <Logo variant="symbol" size="hero" />
          </div>

          {/* Outline Study Icons (Watermark line art: 7% - 10% opacity, stroke-[1.25]) */}
          {/* Top-Right: Book */}
          <BookOpen className="absolute top-12 right-14 h-11 w-11 text-white/[0.09] stroke-[1.25] rotate-6" />
          {/* Upper-Right: Calendar */}
          <Calendar className="absolute top-36 right-8 h-9 w-9 text-white/[0.08] stroke-[1.25] -rotate-6" />
          {/* Mid-Left: Timer / Chronometer */}
          <Timer className="absolute top-[46%] left-10 h-10 w-10 text-white/[0.09] stroke-[1.25] -rotate-12" />
          {/* Mid-Right: Performance Chart */}
          <TrendingUp className="absolute top-[58%] right-14 h-10 w-10 text-white/[0.09] stroke-[1.25] rotate-12" />
          {/* Lower-Left: Glasses */}
          <Glasses className="absolute bottom-32 left-16 h-8 w-8 text-white/[0.08] stroke-[1.25] rotate-12" />
          {/* Lower-Center: Trophy */}
          <Trophy className="absolute bottom-16 right-28 h-10 w-10 text-white/[0.09] stroke-[1.25] -rotate-6" />
          {/* Bottom-Right: Pencil */}
          <Pencil className="absolute bottom-8 right-10 h-7 w-7 text-white/[0.07] stroke-[1.25] rotate-45" />
        </div>

        {/* Top Logo (Foreground: z-10) */}
        <div className="relative z-10 flex items-center">
          <div className="inline-flex items-center gap-3">
            <Logo variant="symbol" size="sm" />
            <div className="flex flex-col justify-center">
              <span className="text-base font-black tracking-[0.16em] text-white leading-tight">
                NEXO
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6B00] mt-0.5">
                Plataforma de Estudos
              </span>
            </div>
          </div>
        </div>

        {/* Central Presentation (Foreground: z-10) */}
        <div className="relative z-10 my-auto max-w-[460px] space-y-7 py-8">
          <div className="space-y-3">
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Planeje seus estudos, organize seu conteúdo e acompanhe sua evolução.
            </h1>
            <p className="text-sm text-zinc-400 font-normal leading-relaxed">
              Uma plataforma completa para organizar sua preparação, acompanhar seu desempenho e evoluir com consistência.
            </p>
          </div>

          {/* 3 Compact Benefit Items */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-[#121620]/50 px-3.5 py-2.5 text-xs text-zinc-200 transition-colors hover:border-zinc-700/60 hover:bg-[#141A26]">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FF6B00]/10 text-[#FF6B00]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Planejamento personalizado</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-[#121620]/50 px-3.5 py-2.5 text-xs text-zinc-200 transition-colors hover:border-zinc-700/60 hover:bg-[#141A26]">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FF6B00]/10 text-[#FF6B00]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Controle de estudos e revisões</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-[#121620]/50 px-3.5 py-2.5 text-xs text-zinc-200 transition-colors hover:border-zinc-700/60 hover:bg-[#141A26]">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FF6B00]/10 text-[#FF6B00]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Edital e desempenho organizados</span>
            </div>
          </div>
        </div>

        {/* Footer (Foreground: z-10) */}
        <div className="relative z-10 text-xs text-zinc-500/80 font-normal pt-4">
          © 2026 NEXO. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Side: Clean Login Form (48% on desktop) */}
      <div className="flex w-full lg:w-[48%] flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 h-full overflow-y-auto overflow-x-hidden bg-[#0B0E14] relative">
        {/* Layer 0: Subtle Watermark Background for Right Side (discreet 5% - 7% opacity, perimeter only) */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          {/* Soft ambient depth glow */}
          <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-[#FF6B00]/[0.015] blur-3xl" />

          {/* Subtle Wordmark Watermark on right edge */}
          <div className="hidden lg:block absolute -right-6 bottom-16 select-none pointer-events-none leading-none">
            <span className="text-[90px] xl:text-[110px] font-black tracking-[0.25em] text-white/[0.02] uppercase rotate-6 block select-none">
              NEXO
            </span>
          </div>

          {/* Outline Study Icons - Perimeter Placement only (leaves center form 100% clean) */}
          {/* Top-Right: Laptop */}
          <Laptop className="absolute top-8 right-8 sm:top-10 sm:right-12 h-9 w-9 text-white/[0.06] stroke-[1.25] -rotate-6" />
          {/* Top-Left: Clock (Desktop only) */}
          <Clock className="hidden lg:block absolute top-12 left-10 h-8 w-8 text-white/[0.06] stroke-[1.25] rotate-12" />
          {/* Mid-Right Edge: Graduation Cap (Desktop only) */}
          <GraduationCap className="hidden lg:block absolute top-1/2 right-6 -translate-y-1/2 h-10 w-10 text-white/[0.05] stroke-[1.25] rotate-6" />
          {/* Bottom-Right: Book (Desktop + Mobile corner) */}
          <BookOpen className="absolute bottom-8 right-8 sm:bottom-10 sm:right-12 h-8 w-8 text-white/[0.06] stroke-[1.25] rotate-12" />
          {/* Bottom-Left: Pencil (Desktop + Mobile corner) */}
          <Pencil className="absolute bottom-10 left-8 sm:bottom-12 sm:left-12 h-7 w-7 text-white/[0.05] stroke-[1.25] -rotate-12" />
          {/* Mobile Top-Left subtle Trophy */}
          <Trophy className="lg:hidden absolute top-6 left-6 h-7 w-7 text-white/[0.05] stroke-[1.25] -rotate-6" />
        </div>

        {/* Foreground Form (Foreground: z-10) */}
        <div className="w-full max-w-[430px] my-auto relative z-10">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="inline-flex items-center gap-3">
              <Logo variant="symbol" size="sm" />
              <div className="flex flex-col text-left">
                <span className="text-lg font-black tracking-[0.18em] text-white leading-none">
                  NEXO
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#FF6B00] mt-0.5">
                  Plataforma de Estudos
                </span>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8 space-y-1.5 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Entrar no NEXO
            </h2>
            <p className="text-sm text-zinc-400 font-normal">
              Continue sua preparação de onde parou.
            </p>
          </div>

          {/* Unauthorized Domain Helper Notification */}
          {unauthorizedDomainInfo && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-amber-950/20 p-4 text-xs text-amber-200 shadow-lg space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-100 text-xs tracking-wide uppercase">
                      Domínio não autorizado no Firebase
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnauthorizedDomainInfo(null)}
                      className="text-amber-400/70 hover:text-amber-200 transition-colors p-0.5 text-[11px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Este ambiente de prévia ainda não está autorizado no Firebase.
                    Adicione o domínio abaixo em <strong>Authentication &gt; Settings &gt; Authorized domains</strong>.
                  </p>
                </div>
              </div>

              {/* Copy Domain Box */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-black/40 px-3 py-2 text-[11px] font-mono text-zinc-300">
                <span className="truncate select-all font-semibold text-zinc-200">
                  {unauthorizedDomainInfo.domain || (typeof window !== "undefined" ? window.location.hostname : "")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const hostToCopy = unauthorizedDomainInfo.domain || (typeof window !== "undefined" ? window.location.hostname : "");
                    navigator.clipboard.writeText(hostToCopy);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2500);
                  }}
                  className="flex items-center gap-1.5 shrink-0 rounded-md bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-200 transition-colors cursor-pointer"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado!</span>
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
              <div className="rounded-lg bg-black/20 p-2.5 space-y-1.5 text-[11px] text-zinc-300">
                <p className="font-semibold text-amber-300 text-[10px] uppercase tracking-wider">Como liberar no Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-zinc-400">
                  <li>Acesse o <span className="text-white font-medium">Firebase Console</span> (projeto nexo-web-d7401)</li>
                  <li>Vá em <span className="text-white font-medium">Authentication</span> &gt; aba <span className="text-white font-medium">Settings</span></li>
                  <li>Em <span className="text-white font-medium">Authorized domains</span>, clique em <span className="text-white font-medium">Add domain</span> e cole o domínio</li>
                </ol>
                <p className="text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                  Para testes completos de autenticação com domínios já liberados, utilize <span className="text-zinc-300 font-medium">nexosestudo.app</span> ou <span className="text-zinc-300 font-medium">nexo-web-d7401.web.app</span>.
                </p>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-medium text-amber-200">{error}</p>
                {error.includes("Google") && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || isGoogleLoading}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-[#FF6B00] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FF7A1A] transition-colors cursor-pointer"
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
              <label htmlFor="login-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
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
                  placeholder="seu.email@exemplo.com"
                  className="h-[50px] w-full rounded-xl border border-zinc-800 bg-[#121620] pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/30 focus:outline-none"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-zinc-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-zinc-400 hover:text-[#FF6B00] transition-colors cursor-pointer"
                >
                  Esqueci minha senha
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
                  placeholder="••••••••"
                  className="h-[50px] w-full rounded-xl border border-zinc-800 bg-[#121620] pl-10 pr-11 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/30 focus:outline-none"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A1A] text-sm font-semibold text-white transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span>{isLoading ? "Validando credenciais..." : "Acessar NEXO"}</span>
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-zinc-800/80"></div>
            <span className="absolute bg-[#0B0E14] px-3 text-xs text-zinc-500 font-normal">
              ou continue com
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-[#121620] hover:bg-[#161B26] hover:border-zinc-700 text-sm font-medium text-zinc-200 transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isGoogleLoading ? "Conectando ao Google..." : "Continuar com Google"}</span>
          </button>

          {/* Registration Link */}
          {onGoToCadastro && (
            <p className="mt-8 text-center text-xs text-zinc-400">
              Ainda não tem acesso?{" "}
              <button
                type="button"
                onClick={onGoToCadastro}
                className="font-semibold text-[#FF6B00] hover:text-[#FF8533] transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Criar conta
              </button>
            </p>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
