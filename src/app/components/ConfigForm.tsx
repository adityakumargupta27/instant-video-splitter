'use client';

import { useState } from 'react';
import { Play, Clock, FileText, Info, Image as ImageIcon, X, Sparkles } from 'lucide-react';

interface ConfigFormProps {
  templateTitle: string;
  setTemplateTitle: (v: string) => void;
  templateFile: File | null;
  setTemplateFile: (f: File | null) => void;
  splitInterval: number; // seconds
  setSplitInterval: (v: number) => void;
  videoDuration: number;
  totalParts: number;
  onSplit: () => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '30 s',          value: 30,   sub: 'Quick' },
  { label: '60 s (1 min)',  value: 60,   sub: 'Reels' },
  { label: '90 s (1.5 m)',  value: 90,   sub: 'Max Reel' },
  { label: '2 min',         value: 120,  sub: 'Standard' },
  { label: '3 min',         value: 180,  sub: 'Story' },
  { label: '5 min',         value: 300,  sub: 'Long' },
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
  templateTitle, setTemplateTitle,
  templateFile, setTemplateFile,
  splitInterval, setSplitInterval,
  videoDuration, totalParts,
  onSplit, disabled,
}: ConfigFormProps) {
  const [activePreset, setActivePreset] = useState<number | null>(60);
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

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setTemplateFile(f);
    e.target.value = '';
  };

  const lastPartSec  = videoDuration - (totalParts - 1) * splitInterval;
  const tooManyParts = totalParts > 500;
  const isValid      = splitInterval > 0 && !tooManyParts && totalParts > 0;

  /* ── Input base styles ── */
  const inputCls = [
    'w-full bg-[#2C2C2E]/80 border border-white/[0.12] rounded-[12px]',
    'px-4 py-3 text-[15px] text-white placeholder-[rgba(235,235,245,0.35)]',
    'focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/70 focus:border-transparent',
    'disabled:opacity-40 transition-all duration-150 tracking-[-0.004em]',
  ].join(' ');

  const previewTitle1 = templateTitle.trim() ? `Part 1 - ${templateTitle.trim()}` : 'Part 1';
  const previewTitle2 = templateTitle.trim() ? `Part 2 - ${templateTitle.trim()}` : 'Part 2';

  return (
    <div className="glow-card rounded-[24px] overflow-hidden">

      {/* Section header */}
      <div className="px-6 pt-5 pb-0 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)] uppercase tracking-[0.08em]">
          Split & Template Configuration
        </p>
        <span className="text-[11px] text-[#30D158] font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Zero Quality Loss
        </span>
      </div>

      <div className="p-6 space-y-6">

        {/* ── 1. Template / Topic Name (Optional) ─────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(235,235,245,0.9)]">
              <FileText className="w-4 h-4 text-[#0A84FF]" />
              Template / Topic Title
            </label>
            <span className="text-[12px] text-[rgba(235,235,245,0.4)]">Optional</span>
          </div>

          <input
            type="text"
            value={templateTitle}
            onChange={e => setTemplateTitle(e.target.value)}
            placeholder="e.g. The Secret Behind X (leave blank for Part 1, Part 2...)"
            disabled={disabled}
            className={inputCls}
            aria-label="Template / Topic Title"
          />

          {/* Live Naming Preview */}
          <div className="p-3 rounded-[10px] bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-[13px]">
            <span className="text-[rgba(235,235,245,0.4)] font-mono text-[11px] uppercase tracking-wider shrink-0">Output:</span>
            <span className="text-[#0A84FF] font-medium truncate">{previewTitle1}.mp4</span>
            <span className="text-[rgba(235,235,245,0.3)]">,</span>
            <span className="text-[#5E5CE6] font-medium truncate">{previewTitle2}.mp4</span>
            <span className="text-[rgba(235,235,245,0.3)]">…</span>
          </div>
        </div>

        {/* ── 2. Attach Template Graphic / Overlay (Optional) ────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(235,235,245,0.9)]">
              <ImageIcon className="w-4 h-4 text-[#BF5AF2]" />
              Attach Template Graphic / Thumbnail
            </label>
            <span className="text-[12px] text-[rgba(235,235,245,0.4)]">Optional</span>
          </div>

          {templateFile ? (
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#BF5AF2]/10 border border-[#BF5AF2]/30">
              <div className="flex items-center gap-2.5 truncate">
                <ImageIcon className="w-4 h-4 text-[#BF5AF2] shrink-0" />
                <span className="text-[14px] text-white font-medium truncate">{templateFile.name}</span>
                <span className="text-[12px] text-[rgba(235,235,245,0.4)] shrink-0">
                  ({(templateFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTemplateFile(null)}
                className="text-[rgba(235,235,245,0.5)] hover:text-white p-1 rounded-md transition-colors"
                title="Remove template"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25 cursor-pointer transition-all">
              <ImageIcon className="w-4 h-4 text-[rgba(235,235,245,0.4)]" />
              <span className="text-[13px] text-[rgba(235,235,245,0.6)]">
                Click to attach template banner, frame or overlay (PNG, JPG, MP4)
              </span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleTemplateFileChange}
                disabled={disabled}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* ── 3. Split Interval (Duration per part) ───────────────── */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[14px] font-semibold text-[rgba(235,235,245,0.9)]">
            <Clock className="w-4 h-4 text-[#FF9F0A]" />
            Split Duration per Part
          </label>

          {/* Preset pills tailored for Reels / Shorts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => pickPreset(p.value)}
                disabled={disabled}
                className={[
                  'flex flex-col items-center justify-center p-2.5 rounded-[12px] transition-all duration-150',
                  'border min-h-[50px] disabled:opacity-40',
                  activePreset === p.value
                    ? 'bg-[#0A84FF] border-[#0A84FF] text-white shadow-[0_0_15px_rgba(10,132,255,0.35)]'
                    : 'bg-[#2C2C2E]/60 border-white/[0.08] text-[rgba(235,235,245,0.75)] hover:bg-[#3A3A3C] hover:text-white',
                ].join(' ')}
              >
                <span className="text-[13px] font-semibold">{p.label}</span>
                <span className="text-[10px] opacity-75">{p.sub}</span>
              </button>
            ))}
          </div>

          {/* Custom inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[rgba(235,235,245,0.4)]">Custom minutes</label>
              <input
                type="number" min="0.1" step="0.5"
                value={customMin}
                onChange={e => onCustomMin(e.target.value)}
                placeholder="e.g. 1.5"
                disabled={disabled}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[rgba(235,235,245,0.4)]">Custom seconds</label>
              <input
                type="number" min="1" step="1"
                value={customSec}
                onChange={e => onCustomSec(e.target.value)}
                placeholder="e.g. 75"
                disabled={disabled}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* ── 4. Live calculation preview ────────────────────────── */}
        {totalParts > 0 && splitInterval > 0 && (
          <div className={[
            'rounded-[14px] p-4 flex items-start gap-3',
            tooManyParts
              ? 'bg-[#FF453A]/10 border border-[#FF453A]/30'
              : 'bg-[#0A84FF]/10 border border-[#0A84FF]/25',
          ].join(' ')}>
            <Info className={`w-4 h-4 mt-0.5 shrink-0 ${tooManyParts ? 'text-[#FF453A]' : 'text-[#0A84FF]'}`} />
            <p className={`text-[14px] leading-relaxed tracking-[-0.004em] ${tooManyParts ? 'text-[#FF453A]' : 'text-[rgba(235,235,245,0.85)]'}`}>
              {tooManyParts
                ? `Too many parts (${totalParts}). Choose a larger interval.`
                : <>
                    Your <strong className="text-white">{fmtDur(videoDuration)}</strong> video will be sliced into{' '}
                    <strong className="text-white">{totalParts} part{totalParts !== 1 ? 's' : ''}</strong> of{' '}
                    <strong className="text-white">{fmtDur(splitInterval)}</strong> each
                    {totalParts > 1 && lastPartSec < splitInterval && (
                      <span className="text-[rgba(235,235,245,0.5)]"> (last: {fmtDur(lastPartSec)})</span>
                    )}. Original aspect ratio and 100% quality preserved!
                  </>
              }
            </p>
          </div>
        )}

        {/* ── 5. Split Button ────────────────────────────────────── */}
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
