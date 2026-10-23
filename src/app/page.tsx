'use client';

import { useState, useCallback, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { Scissors, Zap, Lock } from 'lucide-react';
import DropZone from './components/DropZone';
import ConfigForm from './components/ConfigForm';
import ProgressPanel from './components/ProgressPanel';
import OutputPanel from './components/OutputPanel';

/* ─── Shared types ──────────────────────────────────────────────── */
export interface VideoInfo {
  file: File;
  duration: number;   // seconds
  name: string;
  size: number;       // bytes
}

export interface SplitPart {
  name: string;
  title: string;
  caption: string;
  blob: Blob;
  size: number;
  index: number;
  url: string;
}

export type ProcessingStatus = 'idle' | 'loading-ffmpeg' | 'processing' | 'done' | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  currentPart: number;
  totalParts: number;
  message: string;
  progress: number; // 0–100
}

/* ─── Helpers ───────────────────────────────────────────────────── */
function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    avi: 'video/avi',
  };
  return map[ext.toLowerCase()] ?? 'video/mp4';
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function Home() {
  const [videoInfo, setVideoInfo]         = useState<VideoInfo | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateFile, setTemplateFile]   = useState<File | null>(null);
  const [splitInterval, setSplitInterval] = useState(60); // default 60s (ideal for Instagram Reels)
  const [parts, setParts]                 = useState<SplitPart[]>([]);
  const [processing, setProcessing]       = useState<ProcessingState>({
    status: 'idle', currentPart: 0, totalParts: 0, message: '', progress: 0,
  });

  const ffmpegRef = useRef<FFmpeg | null>(null);
  const abortRef  = useRef(false);

  /* ── Video loaded callback ─────────────────────────────────────── */
  const handleVideoLoaded = useCallback((info: VideoInfo) => {
    setVideoInfo(info);
    setParts([]);
    setProcessing({ status: 'idle', currentPart: 0, totalParts: 0, message: '', progress: 0 });
  }, []);

  /* ── Lazy-load FFmpeg WASM ─────────────────────────────────────── */
  const loadFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg  = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  /* ── Main split handler ────────────────────────────────────────── */
  const handleSplit = async () => {
    if (!videoInfo) return;
    if (splitInterval <= 0) { toast.error('Split interval must be > 0.'); return; }

    abortRef.current = false;
    setParts([]);

    const ext        = (videoInfo.file.name.split('.').pop() ?? 'mp4').toLowerCase();
    const totalParts = Math.ceil(videoInfo.duration / splitInterval);
    const hasCustomTitle = templateTitle.trim().length > 0;
    const cleanTitle = templateTitle.trim();
    const safeTitle  = cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      /* 1. Load engine */
      setProcessing({ status: 'loading-ffmpeg', currentPart: 0, totalParts, message: 'Loading FFmpeg engine…', progress: 0 });
      const ffmpeg = await loadFFmpeg();

      /* 2. Write input into virtual FS */
      setProcessing(p => ({ ...p, status: 'processing', message: 'Buffering video…', progress: 3 }));
      await ffmpeg.writeFile(`input.${ext}`, await fetchFile(videoInfo.file));

      const newParts: SplitPart[] = [];

      /* 3. Export each part with stream-copy (100% Lossless, exact aspect ratio preserved) */
      for (let i = 0; i < totalParts; i++) {
        if (abortRef.current) break;

        const partNumber = i + 1;
        const partTitle  = hasCustomTitle 
          ? `Part ${partNumber} - ${cleanTitle}` 
          : `Part ${partNumber}`;

        const outputName = hasCustomTitle 
          ? `Part_${partNumber}_${safeTitle}.${ext}` 
          : `Part_${partNumber}.${ext}`;

        const caption = hasCustomTitle 
          ? `${partTitle}\n\nSplit in original 100% lossless quality with Instant Video Splitter 🎬\n#reels #part${partNumber} #instagram #video`
          : `Part ${partNumber}\n\nSplit in original 100% lossless quality with Instant Video Splitter 🎬\n#reels #part${partNumber} #instagram #video`;

        const startTime  = i * splitInterval;
        const duration   = Math.min(splitInterval, videoInfo.duration - startTime);

        setProcessing({
          status: 'processing',
          currentPart: partNumber,
          totalParts,
          message: `Exporting ${partTitle} (${partNumber}/${totalParts})…`,
          progress: Math.round(3 + (i / totalParts) * 94),
        });

        // Exact original stream copy — preserving resolution, aspect ratio & bitrate!
        await ffmpeg.exec([
          '-ss',   String(startTime),
          '-i',    `input.${ext}`,
          '-t',    String(duration),
          '-c',    'copy',
          '-avoid_negative_ts', 'make_zero',
          '-map_metadata', '0',
          outputName,
        ]);

        const data  = await ffmpeg.readFile(outputName);
        const blob  = new Blob([data as unknown as ArrayBuffer], { type: getMimeType(ext) });
        const url   = URL.createObjectURL(blob);
        const part: SplitPart = { 
          name: outputName, 
          title: partTitle,
          caption,
          blob, 
          size: blob.size, 
          index: partNumber, 
          url 
        };

        newParts.push(part);
        setParts([...newParts]);
        await ffmpeg.deleteFile(outputName);
      }

      await ffmpeg.deleteFile(`input.${ext}`);

      if (!abortRef.current) {
        setProcessing({ status: 'done', currentPart: totalParts, totalParts, message: `${totalParts} part${totalParts !== 1 ? 's' : ''} ready to download & post!`, progress: 100 });
        toast.success(`Split into ${totalParts} parts successfully!`);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setProcessing(p => ({ ...p, status: 'error', message: msg }));
      toast.error(`Processing failed: ${msg}`);
    }
  };

  /* ── Download all as ZIP ───────────────────────────────────────── */
  const handleDownloadAll = async () => {
    if (!parts.length) return;
    const tid = toast.loading('Creating ZIP archive…');
    try {
      const zip = new JSZip();
      parts.forEach(p => zip.file(p.name, p.blob));
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a   = document.createElement('a');
      a.href = url; 
      a.download = templateTitle.trim() 
        ? `${templateTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_all_parts.zip`
        : 'split_video_all_parts.zip'; 
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP downloaded!', { id: tid });
    } catch { toast.error('Failed to create ZIP.', { id: tid }); }
  };

  /* ── Reset ─────────────────────────────────────────────────────── */
  const handleReset = () => {
    abortRef.current = true;
    parts.forEach(p => URL.revokeObjectURL(p.url));
    setVideoInfo(null);
    setTemplateTitle('');
    setTemplateFile(null);
    setSplitInterval(60);
    setParts([]);
    setProcessing({ status: 'idle', currentPart: 0, totalParts: 0, message: '', progress: 0 });
  };

  const isProcessing = processing.status === 'loading-ffmpeg' || processing.status === 'processing';
  const totalParts   = videoInfo ? Math.ceil(videoInfo.duration / splitInterval) : 0;
  const showConfig   = !!videoInfo && (processing.status === 'idle' || processing.status === 'error');
  const showProgress = !!videoInfo && processing.status !== 'idle';

  return (
    <main className="min-h-screen bg-cosmic text-white relative overflow-hidden selection:bg-[#0A84FF]/30">

      {/* ── Crazy Ambient Background Lights & Grid ───────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {/* Subtle Tech Grid Pattern */}
        <div className="absolute inset-0 tech-grid opacity-35" />

        {/* Floating Glowing Aurora Orbs */}
        <div className="absolute -top-[18%] left-[20%] w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-[#5E5CE6]/35 to-[#0A84FF]/30 blur-[120px] animate-orb-1" />
        <div className="absolute top-[35%] -right-[15%] w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-[#BF5AF2]/25 to-[#0A84FF]/20 blur-[130px] animate-orb-2" />
        <div className="absolute top-[65%] -left-[10%] w-[480px] h-[480px] rounded-full bg-gradient-to-r from-[#0A84FF]/20 to-[#30D158]/15 blur-[120px] animate-orb-3" />

        {/* Central ambient spotlight cone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#0A84FF]/15 via-[#5E5CE6]/5 to-transparent blur-[80px]" />
      </div>

      {/* ── Header (glass nav bar — HIG: Liquid Glass on functional layer) */}
      <header className="glass border-b border-white/[0.08] sticky top-0 z-20 transition-all">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)]">
              <Scissors className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[17px] tracking-[-0.015em] bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Instant Video Splitter
            </span>
          </div>
          {/* HIG: Simplicity — secondary meta info as quiet labels */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-[rgba(235,235,245,0.6)] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <Zap className="w-3 h-3 text-[#FF9F0A]" />
              In-browser WASM
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-[rgba(235,235,245,0.6)] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
              <Lock className="w-3 h-3 text-[#30D158]" />
              Zero quality loss
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ─────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 pt-8 pb-24 space-y-6 relative z-10">

        {/* Hero — only shown before file is loaded */}
        {!videoInfo && (
          <div className="text-center space-y-4 pt-6 pb-4 animate-fade-up">
            {/* Glowing pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/30 text-[#0A84FF] text-[12px] font-medium tracking-wide shadow-[0_0_20px_rgba(10,132,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
              Lossless Stream Copy Engine (-c copy)
            </div>

            {/* HIG: Typography — display text with tight tracking */}
            <h1 className="text-display text-[36px] sm:text-[46px] leading-[1.1] font-bold bg-gradient-to-b from-white via-white/95 to-white/50 bg-clip-text text-transparent drop-shadow-sm">
              Split large videos instantly.<br />
              <span className="bg-gradient-to-r from-[#0A84FF] via-[#5E5CE6] to-[#BF5AF2] bg-clip-text text-transparent">
                Zero upload. Zero loss.
              </span>
            </h1>
            <p className="text-[16px] sm:text-[17px] text-[rgba(235,235,245,0.65)] leading-relaxed max-w-lg mx-auto tracking-[-0.004em]">
              Drag & drop files up to 3-4GB. The video is sliced in seconds directly inside your browser with original bitrate and resolution untouched.
            </p>
          </div>
        )}

        {/* Drop Zone */}
        {!videoInfo && (
          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <DropZone onVideoLoaded={handleVideoLoaded} disabled={isProcessing} />
          </div>
        )}

        {/* After file selected — file pill, config, progress, output */}
        {videoInfo && (
          <div className="space-y-4">
            <VideoInfoCard videoInfo={videoInfo} onRemove={handleReset} disabled={isProcessing} />
            {showConfig && (
              <div className="animate-scale-in">
                <ConfigForm
                  templateTitle={templateTitle}
                  setTemplateTitle={setTemplateTitle}
                  templateFile={templateFile}
                  setTemplateFile={setTemplateFile}
                  splitInterval={splitInterval}
                  setSplitInterval={setSplitInterval}
                  videoDuration={videoInfo.duration}
                  totalParts={totalParts}
                  onSplit={handleSplit}
                  disabled={isProcessing}
                />
              </div>
            )}
            {showProgress && (
              <div className="animate-scale-in">
                <ProgressPanel processing={processing} />
              </div>
            )}
            {parts.length > 0 && (
              <div className="animate-fade-up">
                <OutputPanel
                  parts={parts}
                  templateTitle={templateTitle}
                  onDownloadAll={handleDownloadAll}
                  onReset={handleReset}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-5">
        <p className="text-center text-[13px] text-[rgba(235,235,245,0.3)] tracking-[0.006em]">
          All processing happens locally in your browser. No files ever leave your device.
        </p>
      </footer>
    </main>
  );
}

/* ─── Video Info Card (inline, small — HIG: Simplicity) ─────────── */
function VideoInfoCard({
  videoInfo, onRemove, disabled,
}: { videoInfo: VideoInfo; onRemove: () => void; disabled: boolean }) {
  const { name, size, duration } = videoInfo;
  const gb = (size / 1073741824).toFixed(2);
  const mb = (size / 1048576).toFixed(1);
  const sizeStr = size >= 1073741824 ? `${gb} GB` : `${mb} MB`;

  const h = Math.floor(duration / 3600);
  const m = Math.floor((duration % 3600) / 60);
  const s = Math.floor(duration % 60);
  const durStr = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  return (
    <div className="animate-scale-in flex items-center gap-3 glow-card rounded-[18px] px-4 py-3.5">
      {/* Icon */}
      <div className="w-10 h-10 rounded-[12px] bg-[#0A84FF]/20 border border-[#0A84FF]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(10,132,255,0.25)]">
        <Scissors className="w-4.5 h-4.5 text-[#0A84FF]" strokeWidth={2} />
      </div>
      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate tracking-[-0.004em] text-white">{name}</p>
        <p className="text-[13px] text-[rgba(235,235,245,0.55)] mt-0.5 tracking-[0]">
          {sizeStr} · {durStr}
        </p>
      </div>
      {/* Remove — HIG: Agency — always provide a way out */}
      <button
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove video"
        className="text-[13px] text-[rgba(235,235,245,0.5)] hover:text-[#FF453A] hover:bg-[#FF453A]/10 px-2.5 py-1.5 rounded-[8px] transition-all duration-150 disabled:opacity-30"
      >
        Remove
      </button>
    </div>
  );
}
