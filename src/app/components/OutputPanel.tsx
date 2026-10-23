'use client';

import { Download, Archive, RotateCcw, FileVideo } from 'lucide-react';
import { SplitPart } from '../page';

interface OutputPanelProps {
  parts: SplitPart[];
  baseName: string;
  onDownloadAll: () => void;
  onReset: () => void;
}

function fmtSize(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function OutputPanel({ parts, baseName, onDownloadAll, onReset }: OutputPanelProps) {
  const totalSize = parts.reduce((acc, p) => acc + p.size, 0);

  const downloadPart = (part: SplitPart) => {
    const a = document.createElement('a');
    a.href = part.url; a.download = part.name; a.click();
  };

  return (
    /* HIG: Lists & Tables — grouped list with frosted glass & glow */
    <div className="glow-card rounded-[24px] overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4.5 flex items-center justify-between border-b border-white/[0.08]">
        <div>
          <p className="text-[16px] font-semibold tracking-[-0.004em] text-white">Ready to Download</p>
          {/* HIG: Secondary label */}
          <p className="text-[13px] text-[rgba(235,235,245,0.55)] mt-0.5">
            {parts.length} part{parts.length !== 1 ? 's' : ''} · {fmtSize(totalSize)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Start Over — HIG: Agency — way out */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[13px] text-[rgba(235,235,245,0.5)]
              hover:text-white px-3 py-2 rounded-[10px] hover:bg-white/[0.08]
              transition-all duration-150 min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over
          </button>
          {/* Download all — prominent action */}
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-white
              bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6] hover:brightness-110 shadow-[0_0_18px_rgba(10,132,255,0.35)]
              px-4 py-2 rounded-[10px] transition-all duration-150 min-h-[36px] active:scale-95"
          >
            <Archive className="w-3.5 h-3.5" />
            Download All (.zip)
          </button>
        </div>
      </div>

      {/* ── Parts list ──────────────────────────────────────────── */}
      <div className="divide-y divide-white/[0.06]">
        {parts.map((part, idx) => (
          <div
            key={part.index}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors duration-100 group"
            style={{ animationDelay: `${idx * 0.04}s` }}
          >
            {/* Part number badge */}
            <div className="w-8 h-8 rounded-[8px] bg-[#2C2C2E] flex items-center justify-center shrink-0 group-hover:bg-[#3A3A3C] transition-colors">
              <span className="text-[12px] font-semibold text-[rgba(235,235,245,0.5)] tabular-nums">
                {String(part.index).padStart(2, '0')}
              </span>
            </div>

            {/* File icon */}
            <FileVideo className="w-4 h-4 text-[rgba(235,235,245,0.35)] shrink-0" strokeWidth={1.5} />

            {/* Name + size */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium truncate tracking-[-0.004em]">{part.name}</p>
              <p className="text-[12px] text-[rgba(235,235,245,0.4)]">{fmtSize(part.size)}</p>
            </div>

            {/* Download — HIG: Primary action per row */}
            <button
              onClick={() => downloadPart(part)}
              aria-label={`Download ${part.name}`}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#0A84FF]
                bg-[#0A84FF]/10 hover:bg-[#0A84FF]/20 px-3.5 py-2 rounded-[8px]
                transition-all duration-150 shrink-0 min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
