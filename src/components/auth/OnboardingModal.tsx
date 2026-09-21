import React from "react";
import { CheckCircle2, ArrowRight, Shield, Target, BookOpen, Layers, Play } from "lucide-react";
import { Logo } from "../brand/Logo";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: "1",
      title: "Criar seu Plano",
      desc: "Defina seu objetivo e concurso alvo para direcionar seus estudos.",
      icon: Target,
    },
    {
      num: "2",
      title: "Importar / Vincular Edital",
      desc: "Conteúdo programático completo e verticalizado por tópicos.",
      icon: BookOpen,
    },
    {
      num: "3",
      title: "Configurar Disciplinas & Pesos",
      desc: "Defina sua nota atual de domínio e a relevância na prova.",
      icon: Layers,
    },
    {
      num: "4",
      title: "Montar Planejamento",
      desc: "Escolha entre Ciclo Contínuo Inteligente ou Quadro Semanal Fixo.",
      icon: Shield,
    },
    {
      num: "5",
      title: "Iniciar Primeiro Estudo",
      desc: "Cronômetro com registro automático de horas líquidas e questões.",
      icon: Play,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-[#292929] bg-[#0F172A] p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <Logo variant="compact" size="md" />

          <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#249D84]">
            NEXO &bull; BOAS-VINDAS
          </span>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Bem-vindo à sua Preparação de Alto Rendimento
          </h2>

          <p className="mt-2 max-w-md text-xs text-[#A6A6A6]">
            Sua aprovação começa com método, disciplina e métricas reais. Veja o fluxo da sua preparação:
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className="mt-6 space-y-3">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="flex items-center gap-3.5 rounded-2xl border border-[#292929] bg-[#1E293B]/70 p-3.5 transition hover:border-[#249D84]/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B0F17] text-xs font-black text-[#249D84] border border-[#292929]">
                  {s.num}
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-[#A6A6A6]">
                    {s.desc}
                  </p>
                </div>

                <Icon className="h-4 w-4 text-[#6B6B6B]" />
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#292929] pt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#A6A6A6] hover:text-white"
          >
            Explorar plataforma primeiro
          </button>

          <button
            type="button"
            onClick={() => {
              onStart();
              onClose();
            }}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 text-xs font-black uppercase tracking-wider text-[#111111] transition hover:bg-[#E8E8E8] active:scale-98 shadow-md"
          >
            <span>Começar Preparação</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
