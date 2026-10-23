'use client';

import { useState } from 'react';
import { Play, Clock, FileText, Info } from 'lucide-react';

interface ConfigFormProps {
  baseName: string;
  setBaseName: (v: string) => void;
  splitInterval: number; // seconds
  setSplitInterval: (v: number) => void;
  videoDuration: number;
  totalParts: number;
  onSplit: () => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '30 s',  value: 30   },
  { label: '1 min', value: 60   },
  { label: '2 min', value: 120  },
  { label: '5 min', value: 300  },
  { label: '10 min',value: 600  },
  { label: '15 min',value: 900  },
  { label: '30 min',value: 1800 },
];

function fmtDur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function ConfigForm({
  baseName, setBaseName,
  splitInterval, setSplitInterval,
  videoDuration, totalParts,
  onSplit, disabled,
}: ConfigFormProps) {
  const [activePreset, setActivePreset] = useState<number | null>(120);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');

  const pickPreset = (v: number) => {
    setActivePreset(v);
    setSplitInterval(v);
    setCustomMin('');
    setCustomSec('');
  };

  const onCustomMin = (v: string) => {
    setCustomMin(v); setCustomSec(''); setActivePreset(null);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setSplitInterval(Math.round(n * 60));
  };

  const onCustomSec = (v: string) => {
    setCustomSec(v); setCustomMin(''); setActivePreset(null);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) setSplitInterval(Math.round(n));
  };

  const lastPartSec  = videoDuration - (totalParts - 1) * splitInterval;
  const tooManyParts = totalParts > 500;
  const isValid      = baseName.trim().length > 0 && splitInterval > 0 && !tooManyParts && totalParts > 0;

  /* ── Input base styles following Apple HIG text-field guidance ── */
  const inputCls = [
    'w-full bg-[#2C2C2E] border border-white/[0.12] rounded-[10px]',
    'px-3.5 py-2.5 text-[15px] text-white placeholder-[rgba(235,235,245,0.3)]',
    'focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/70 focus:border-transparent',
    'disabled:opacity-40 transition-all duration-150 tracking-[-0.004em]',
  ].join(' ');

  return (
    /* HIG: Layout — grouped card with frosted glass & subtle glow */
    <div className="glow-card rounded-[24px] overflow-hidden">

      {/* Section header — HIG: Typography — secondary label, uppercase spaced */}
      <div className="px-6 pt-5 pb-0">
        <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)] uppercase tracking-[0.08em]">
          Configuration
        </p>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Base name ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
            <FileText className="w-3.5 h-3.5" />
            Base File Name
          </label>
          <input
            type="text"
            value={baseName}
            onChange={e => setBaseName(e.target.value)}
            placeholder="e.g. Podcast_Ep1"
            disabled={disabled}
            className={inputCls}
            aria-label="Base file name"
          />
          {baseName.trim() && (
            /* HIG: Feedback — inline, not in alerts */
            <p className="text-[12px] text-[rgba(235,235,245,0.35)] pl-0.5 font-mono">
              → {baseName.trim()}_Part_01.ext, _Part_02.ext …
            </p>
          )}
        </div>

        {/* ── Split Interval ────────────────────────────────────── */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[13px] font-medium text-[rgba(235,235,245,0.6)]">
            <Clock className="w-3.5 h-3.5" />
            Split Interval
          </label>

          {/* Preset pills — HIG: Controls ≥44pt tap; segmented-style */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => pickPreset(p.value)}
                disabled={disabled}
                className={[
                  'px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150',
                  'min-h-[36px] disabled:opacity-40',
                  activePreset === p.value
                    ? 'bg-[#0A84FF] text-white shadow-apple-sm'
                    : 'bg-[#2C2C2E] text-[rgba(235,235,245,0.7)] hover:bg-[#3A3A3C] hover:text-white',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[rgba(235,235,245,0.35)]">Custom minutes</label>
              <input
                type="number" min="0.1" step="0.5"
                value={customMin}
                onChange={e => onCustomMin(e.target.value)}
                placeholder="e.g. 2.5"
                disabled={disabled}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[rgba(235,235,245,0.35)]">Custom seconds</label>
              <input
                type="number" min="1" step="1"
                value={customSec}
                onChange={e => onCustomSec(e.target.value)}
                placeholder="e.g. 45"
                disabled={disabled}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── Live preview calculation ─────────────────────────── */}
        {totalParts > 0 && splitInterval > 0 && (
          <div className={[
            'rounded-[12px] px-4 py-3.5 flex items-start gap-3',
            tooManyParts
              ? 'bg-[#FF453A]/10 border border-[#FF453A]/30'
              : 'bg-[#0A84FF]/8 border border-[#0A84FF]/20',
          ].join(' ')}>
            <Info className={`w-4 h-4 mt-0.5 shrink-0 ${tooManyParts ? 'text-[#FF453A]' : 'text-[#0A84FF]'}`} />
            <p className={`text-[14px] leading-relaxed tracking-[-0.004em] ${tooManyParts ? 'text-[#FF453A]' : 'text-[rgba(235,235,245,0.8)]'}`}>
              {tooManyParts
                ? `Too many parts (${totalParts}). Choose a larger interval.`
                : <>
                    Your <strong className="text-white">{fmtDur(videoDuration)}</strong> video will be split into{' '}
                    <strong className="text-white">{totalParts} part{totalParts !== 1 ? 's' : ''}</strong> of{' '}
                    <strong className="text-white">{fmtDur(splitInterval)}</strong> each
                    {totalParts > 1 && lastPartSec < splitInterval && (
                      <span className="text-[rgba(235,235,245,0.5)]"> (last: {fmtDur(lastPartSec)})</span>
                    )}.
                  </>
              }
            </p>
          </div>
        )}

        {/* ── Split button — HIG: prominent style for primary action with crazy glow ── */}
        <button
          onClick={onSplit}
          disabled={disabled || !isValid}
          className={[
            'w-full flex items-center justify-center gap-2.5 py-4 rounded-[14px]',
            'text-[17px] font-semibold tracking-[-0.015em] transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:ring-offset-2 focus:ring-offset-[#1C1C1E]',
            isValid && !disabled
              ? 'bg-gradient-to-r from-[#0A84FF] via-[#5E5CE6] to-[#0A84FF] bg-[length:200%_auto] hover:bg-right active:scale-[0.985] text-white shadow-[0_0_25px_rgba(10,132,255,0.4)]'
              : 'bg-[#2C2C2E]/60 text-[rgba(235,235,245,0.3)] cursor-not-allowed border border-white/[0.05]',
          ].join(' ')}
        >
          <Play className="w-4.5 h-4.5" fill={isValid && !disabled ? 'white' : 'rgba(235,235,245,0.3)'} strokeWidth={0} />
          Split Video Losslessly
        </button>

      </div>
    </div>
  );
}
