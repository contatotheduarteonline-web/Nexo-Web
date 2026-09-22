import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../brand/Logo";

interface CadastroViewProps {
  onGoToLogin: () => void;
}

export const CadastroView: React.FC<CadastroViewProps> = ({ onGoToLogin }) => {
  const { signupWithEmail, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Formato de e-mail inválido. Verifique o endereço digitado.");
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    try {
      const res = await signupWithEmail(cleanName, cleanEmail, cleanPassword);
      if (!res.success) {
        setError(res.error || "Não foi possível processar o cadastro. Tente novamente.");
        return;
      }
      // On success with Firebase Auth, the user is authenticated directly
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setError(err?.message || "Falha na comunicação com o servidor.");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#0F172A] text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-300">
      {/* Desktop Split Layout: Institutional side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-zinc-800/80 bg-gradient-to-b from-[#121620] via-[#0F172A] to-[#0F172A] p-14 relative overflow-hidden">
        {/* Central Logo & Message */}
        <div className="my-auto max-w-lg space-y-6">
          <Logo variant="full" size="hero" />

          <div className="space-y-3">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Crie sua Conta no NEXO
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Cadastre suas informações para iniciar seu plano de preparação de alto rendimento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-200 shadow-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-[#F59E0B] border border-amber-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span>Acesso a ciclos de estudos, editais e simulados</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-200 shadow-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/15 text-[#F59E0B] border border-amber-500/30">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <span>Acompanhamento métrico individualizado de desempenho</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/60 pt-6">
          <span>Disciplina • Foco • Alta Performance</span>
          <span className="text-amber-500/80 font-mono text-[11px] font-bold">NEXO v3.0</span>
        </div>
      </div>

      {/* Right side: Registration Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-[#0F172A]">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-2">
            <Logo variant="full" size="lg" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white">
                Criar Conta
              </h2>
              <p className="text-xs text-zinc-400">
                Preencha seus dados para criar sua conta de acesso.
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToLogin}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-200 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 transition focus:border-[#F59E0B] focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="seu.email@exemplo.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 transition focus:border-[#F59E0B] focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-10 text-xs text-white placeholder:text-zinc-500 transition focus:border-[#F59E0B] focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Repita a senha"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-3 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 transition focus:border-[#F59E0B] focus:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] py-3.5 text-xs font-bold text-white transition hover:from-[#D97706] hover:to-[#F59E0B] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-amber-500/25 mt-5 cursor-pointer"
            >
              <span>{isLoading ? "Criando conta..." : "Criar Minha Conta"}</span>
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-400">
            <span>Já possui uma conta? </span>
            <button
              type="button"
              onClick={onGoToLogin}
              className="font-semibold text-[#F59E0B] hover:text-[#FBBF24] transition underline-offset-4 hover:underline cursor-pointer"
            >
              Fazer login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

