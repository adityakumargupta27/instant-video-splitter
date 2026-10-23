'use client';

import { Upload, Sliders, Send, Check } from 'lucide-react';

interface StepNavigatorProps {
  currentStep: 1 | 2 | 3;
}

export default function StepNavigator({ currentStep }: StepNavigatorProps) {
  const steps = [
    { num: 1, label: 'Upload Video', icon: Upload, hint: 'Drop up to 4GB source' },
    { num: 2, label: 'Configure', icon: Sliders, hint: 'Title, duration & captions' },
    { num: 3, label: 'Split & Post', icon: Send, hint: 'Download or Batch to Instagram' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex items-center justify-between p-1.5 rounded-[16px] bg-[#16161A]/70 border border-white/[0.08] backdrop-blur-xl">
        {steps.map((s, idx) => {
          const isDone = currentStep > s.num;
          const isActive = currentStep === s.num;
          const Icon = s.icon;

          return (
            <div key={s.num} className="flex-1 flex items-center">
              <div
                className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-[12px] transition-all duration-200 ${
                  isActive
                    ? 'bg-[#0A84FF]/12 border border-[#0A84FF]/30'
                    : isDone
                    ? 'opacity-80'
                    : 'opacity-40'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                    isDone
                      ? 'bg-[#30D158] text-black'
                      : isActive
                      ? 'bg-[#0A84FF] text-white shadow-[0_0_10px_rgba(10,132,255,0.5)]'
                      : 'bg-[#2C2C2E] text-[rgba(235,235,245,0.4)]'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>

                <div className="min-w-0 hidden sm:block">
                  <p className={`text-[12px] font-semibold truncate leading-tight ${isActive ? 'text-[#0A84FF]' : 'text-white'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-[rgba(235,235,245,0.4)] truncate">
                    {s.hint}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="w-4 h-[1px] bg-white/[0.1] mx-1 shrink-0 hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
