import React from "react";
import {
  Calendar,
  BookOpen,
  Timer,
  TrendingUp,
  Laptop,
  Pencil,
} from "lucide-react";

export const OnboardingWatermarkBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none opacity-[0.06]"
    >
      {/* Discreet Typography Watermarks along edges */}
      <div className="absolute -top-10 -left-10 text-[130px] font-black tracking-[0.25em] text-white rotate-[-12deg] select-none">
        NEXO
      </div>
      <div className="absolute top-[35%] -left-12 text-[110px] font-black tracking-[0.25em] text-white rotate-[-90deg] select-none">
        NEXO
      </div>
      <div className="absolute -bottom-8 -right-8 text-[140px] font-black tracking-[0.25em] text-white rotate-[-15deg] select-none">
        NEXO
      </div>
      <div className="absolute top-[8%] -right-10 text-[100px] font-black tracking-[0.25em] text-[#FF6B00] rotate-[15deg] select-none">
        NEXO
      </div>

      {/* Discrete Educational Watermark Icons */}
      <Calendar className="absolute top-[14%] left-[12%] w-24 h-24 text-white stroke-[1.2]" />
      <BookOpen className="absolute bottom-[16%] left-[8%] w-28 h-28 text-white stroke-[1.2]" />
      <Timer className="absolute top-[22%] right-[12%] w-24 h-24 text-white stroke-[1.2]" />
      <TrendingUp className="absolute bottom-[18%] right-[10%] w-28 h-28 text-white stroke-[1.2]" />
      <Laptop className="absolute top-[68%] left-[22%] w-20 h-20 text-white stroke-[1.2]" />
      <Pencil className="absolute top-[58%] right-[20%] w-20 h-20 text-white stroke-[1.2] rotate-45" />

      {/* NEXO Geometric Symbols */}
      <div className="absolute top-[48%] left-[6%] w-20 h-20 rounded-2xl border-2 border-white/60 flex items-center justify-center rotate-12">
        <span className="font-black text-3xl text-white">N</span>
      </div>
      <div className="absolute top-[18%] right-[28%] w-16 h-16 rounded-2xl border-2 border-[#FF6B00]/70 flex items-center justify-center -rotate-6">
        <span className="font-black text-2xl text-[#FF6B00]">N</span>
      </div>

      {/* Subtle geometric circles */}
      <div className="absolute -top-32 left-1/3 w-[450px] h-[450px] rounded-full border border-white/20" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full border border-[#FF6B00]/20" />
    </div>
  );
};
