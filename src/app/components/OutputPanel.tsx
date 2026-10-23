'use client';

import { useState } from 'react';
import { Download, Archive, RotateCcw, FileVideo, Instagram, Copy, Check, ExternalLink, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SplitPart } from '../page';

interface OutputPanelProps {
  parts: SplitPart[];
  templateTitle: string;
  onDownloadAll: () => void;
  onReset: () => void;
}

function fmtSize(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function OutputPanel({ parts, templateTitle, onDownloadAll, onReset }: OutputPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customCaptions, setCustomCaptions] = useState<Record<number, string>>({});
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const totalSize = parts.reduce((acc, p) => acc + p.size, 0);

  const getEffectiveCaption = (part: SplitPart) => {
    return customCaptions[part.index] !== undefined 
      ? customCaptions[part.index] 
      : part.caption;
  };

  const downloadPart = (part: SplitPart) => {
    const a = document.createElement('a');
    a.href = part.url;
    a.download = part.name;
    a.click();
  };

  const copyCaption = async (part: SplitPart) => {
    const caption = getEffectiveCaption(part);
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedIndex(part.index);
      toast.success(`Copied caption for ${part.title}!`);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {
      toast.error('Failed to copy caption.');
    }
  };

  const shareToInstagram = async (part: SplitPart) => {
    const caption = getEffectiveCaption(part);

    // 1. Copy caption to clipboard automatically
    try {
      await navigator.clipboard.writeText(caption);
    } catch (e) {
      console.warn('Clipboard write error', e);
    }

    // 2. Check if native Web Share with files is supported (iOS Safari / Android Chrome / Mobile)
    const file = new File([part.blob], part.name, { type: part.blob.type || 'video/mp4' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: part.title,
          text: caption,
        });
        toast.success(`Opening Instagram for ${part.title}!`);
        return;
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return; // User cancelled
      }
    }

    // 3. Fallback for Desktop: Auto-download video + copy caption + open Instagram
    downloadPart(part);
    toast.success(
      `Caption copied! Downloaded "${part.name}". Opening Instagram — click '+' Create to post!`,
      { duration: 6000 }
    );

    // Open Instagram home
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 600);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="glow-card rounded-[24px] overflow-hidden space-y-0">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-4.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08]">
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.015em] text-white">
            Ready to Download & Share
          </p>
          <p className="text-[13px] text-[rgba(235,235,245,0.55)] mt-0.5">
            {parts.length} part{parts.length !== 1 ? 's' : ''} · {fmtSize(totalSize)} total · Original Quality Preserved
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Start Over */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-[13px] text-[rgba(235,235,245,0.5)]
              hover:text-white px-3 py-2 rounded-[10px] hover:bg-white/[0.08]
              transition-all duration-150 min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over
          </button>

          {/* Download all as zip */}
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-white
              bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12]
              px-3.5 py-2 rounded-[10px] transition-all duration-150 min-h-[36px] active:scale-95"
          >
            <Archive className="w-3.5 h-3.5" />
            Download All (.zip)
          </button>
        </div>
      </div>

      {/* ── Instagram Pro Tip Banner ────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#833AB4]/15 via-[#FD1D1D]/15 to-[#F77737]/15 border-b border-white/[0.06] px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#833AB4] to-[#F77737] flex items-center justify-center shrink-0">
            <Instagram className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-[13px] text-[rgba(235,235,245,0.85)] truncate">
            Click <strong className="text-white">Post to Instagram</strong> to download video, auto-copy caption & create Reel!
          </p>
        </div>
        <a
          href="https://www.instagram.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-medium text-[#F77737] hover:underline flex items-center gap-1 shrink-0"
        >
          Open Instagram <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* ── Parts list ──────────────────────────────────────────── */}
      <div className="divide-y divide-white/[0.06]">
        {parts.map((part) => {
          const currentCaption = getEffectiveCaption(part);
          const isExpanded = expandedIndex === part.index;

          return (
            <div key={part.index} className="px-6 py-4 hover:bg-white/[0.02] transition-colors duration-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left info: Badge + Title + Size */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-[10px] bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-[#0A84FF] tabular-nums">
                      {String(part.index).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-white truncate tracking-[-0.004em]">
                      {part.title}
                    </p>
                    <div className="flex items-center gap-2 text-[12px] text-[rgba(235,235,245,0.45)] mt-0.5">
                      <span>{fmtSize(part.size)}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] truncate">{part.name}</span>
                    </div>
                  </div>
                </div>

                {/* Right actions: Caption Toggle + Download + Post to Instagram */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* View/Edit Caption Toggle */}
                  <button
                    onClick={() => toggleExpand(part.index)}
                    className="flex items-center gap-1.5 text-[12px] text-[rgba(235,235,245,0.7)] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-2 rounded-[8px] transition-all min-h-[36px]"
                    title="View / Edit Caption"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Caption</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Copy Caption Quick Action */}
                  <button
                    onClick={() => copyCaption(part)}
                    title="Copy Instagram Caption"
                    className="flex items-center gap-1.5 text-[12px] text-[rgba(235,235,245,0.7)] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-2.5 py-2 rounded-[8px] transition-all min-h-[36px]"
                  >
                    {copiedIndex === part.index ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#30D158]" />
                        <span className="text-[#30D158]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Download Part */}
                  <button
                    onClick={() => downloadPart(part)}
                    aria-label={`Download ${part.name}`}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] px-3.5 py-2 rounded-[10px] transition-all duration-150 min-h-[36px]"
                  >
                    <Download className="w-3.5 h-3.5 text-[rgba(235,235,245,0.7)]" />
                    Download
                  </button>

                  {/* Post to Instagram */}
                  <button
                    onClick={() => shareToInstagram(part)}
                    aria-label={`Post ${part.title} to Instagram`}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:brightness-110 active:scale-95 shadow-[0_0_18px_rgba(253,29,29,0.35)] px-4 py-2 rounded-[10px] transition-all duration-150 min-h-[36px]"
                  >
                    <Instagram className="w-4 h-4 text-white" />
                    Post to Instagram
                  </button>
                </div>
              </div>

              {/* Expandable Caption Box */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2 animate-fade-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[rgba(235,235,245,0.5)]">
                      Caption for {part.title} (editable):
                    </span>
                    <button
                      onClick={() => copyCaption(part)}
                      className="text-[11px] text-[#0A84FF] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy this caption
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={currentCaption}
                    onChange={(e) => setCustomCaptions({ ...customCaptions, [part.index]: e.target.value })}
                    className="w-full bg-[#16161A] border border-white/[0.1] rounded-[10px] p-3 text-[13px] text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0A84FF] transition-all"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
