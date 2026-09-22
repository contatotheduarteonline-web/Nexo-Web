import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface RegisterFormProps {
  onGoToLogin?: () => void;
}

const inputClass =
  "h-[50px] w-full rounded-xl border border-[#2a2e35] bg-[#1b1e24] pl-10 pr-4 text-sm text-white placeholder:text-[#a0a0a0]/50 transition-colors focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30 focus:outline-none";

/**
 * Registration form rendered in-place inside the login layout
 * when the "Cadastrar" tab is active.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ onGoToLogin }) => {
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
      setError("A senha deve conter o mínimo de 6 caracteres.");
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
    <>
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="font-medium text-amber-200 leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reg-name" className="block text-xs font-medium text-[#a0a0a0] mb-1.5">
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
              className={inputClass}
            />
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]/60 pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-medium text-[#a0a0a0] mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="voce@exemplo.com"
              className={inputClass}
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]/60 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-[#a0a0a0] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Mínimo de 8 caracteres"
                className={`${inputClass} pr-11`}
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]/60 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0a0a0]/60 hover:text-[#a0a0a0] transition-colors p-1 cursor-pointer"
                aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-xs font-medium text-[#a0a0a0] mb-1.5">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Repita a senha"
                className={inputClass}
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0a0a0]/60 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] hover:bg-[#ffb04d] text-sm font-bold text-[#0d0f12] transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <span>{isLoading ? "Criando conta..." : "Criar Minha Conta"}</span>
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {onGoToLogin && (
        <p className="mt-8 text-center text-xs text-[#a0a0a0]">
          Já possui uma conta?{" "}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-semibold text-[#F59E0B] hover:text-[#ffb04d] transition-colors cursor-pointer underline-offset-4 hover:underline"
          >
            Fazer login
          </button>
        </p>
      )}
    </>
  );
};
