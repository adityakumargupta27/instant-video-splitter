'use client';

import { useCallback, useState } from 'react';
import { Upload, Film, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { VideoInfo } from '../page';

interface DropZoneProps {
  onVideoLoaded: (info: VideoInfo) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/x-matroska',
  'video/webm', 'video/avi', 'video/x-msvideo',
]);
const ACCEPTED_EXTS  = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
const MAX_BYTES      = 4 * 1024 * 1024 * 1024; // 4 GB

function fmtSize(bytes: number) {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576)    return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url   = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror          = () => { URL.revokeObjectURL(url); reject(new Error('Cannot read metadata')); };
    video.src = url;
  });
}

export default function DropZone({ onVideoLoaded, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isReading,  setIsReading]  = useState(false);

  const processFile = useCallback(async (file: File) => {
    const ext     = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValid = ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTS.includes(ext);
    if (!isValid) {
      toast.error(`Unsupported format. Use: ${ACCEPTED_EXTS.join(', ')}`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`File too large (max 4 GB). This file is ${fmtSize(file.size)}.`);
      return;
    }
    setIsReading(true);
    try {
      const duration = await getVideoDuration(file);
      if (!isFinite(duration) || duration <= 0) {
        toast.error('Could not read video duration — file may be corrupted.');
        return;
      }
      onVideoLoaded({ file, duration, name: file.name, size: file.size });
    } catch {
      toast.error('Failed to read video file. It may be unsupported or corrupted.');
    } finally {
      setIsReading(false);
    }
  }, [onVideoLoaded]);

  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (disabled || isReading) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [disabled, isReading, processFile]);

  const onDragOver  = useCallback((e: React.DragEvent) => {
    e.preventDefault(); if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return (
    /* HIG: Controls — 44×44pt minimum tap target; full-area label covers that */
    <label
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={[
        'relative flex flex-col items-center justify-center w-full min-h-[290px]',
        'rounded-[24px] border-2 border-dashed cursor-pointer select-none',
        'backdrop-blur-xl transition-all duration-300 group',
        isDragging
          ? 'border-[#0A84FF] bg-[#0A84FF]/12 scale-[1.015] shadow-[0_0_40px_rgba(10,132,255,0.25)]'
          : 'border-white/[0.12] bg-[#16161A]/70 hover:border-white/25 hover:bg-[#1C1C22]/85 shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
        (disabled || isReading) ? 'opacity-50 pointer-events-none' : '',
      ].join(' ')}
    >
      <input
        type="file"
        accept={ACCEPTED_EXTS.join(',')}
        onChange={onChange}
        disabled={disabled || isReading}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        aria-label="Select video file"
      />

      <div className="flex flex-col items-center gap-4 p-10 text-center pointer-events-none">
        {isReading ? (
          <>
            {/* HIG: Progress — determinate where possible; spinner for quick ops */}
            <div className="w-16 h-16 rounded-[20px] bg-[#2C2C2E]/80 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
              <div className="w-7 h-7 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[17px] font-medium text-[rgba(235,235,245,0.85)] tracking-[-0.004em]">
              Reading video metadata…
            </p>
          </>
        ) : (
          <>
            {/* Icon — HIG: Craft — icon matches weight of adjacent text */}
            <div className={[
              'w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-300',
              isDragging
                ? 'bg-gradient-to-tr from-[#0A84FF] to-[#5E5CE6] scale-110 shadow-[0_0_30px_rgba(10,132,255,0.5)]'
                : 'bg-white/[0.05] border border-white/[0.08] group-hover:border-white/20 group-hover:bg-white/[0.08] group-hover:scale-105 shadow-inner',
            ].join(' ')}>
              {isDragging
                ? <Film   className="w-8 h-8 text-white animate-pulse" strokeWidth={1.8} />
                : <Upload className="w-8 h-8 text-[rgba(235,235,245,0.6)] group-hover:text-white transition-colors" strokeWidth={1.8} />
              }
            </div>

            {/* Primary label — HIG: Writing — say what happens */}
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.015em] text-white">
                {isDragging ? 'Drop to load instantly' : 'Drop your video here'}
              </p>
              <p className="text-[15px] text-[rgba(235,235,245,0.5)] mt-1.5 tracking-[-0.004em]">
                or <span className="text-[#0A84FF] font-medium underline underline-offset-4 decoration-[#0A84FF]/40 group-hover:decoration-[#0A84FF]">browse local files</span>
              </p>
            </div>

            {/* Meta tags pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[rgba(235,235,245,0.5)]">MP4</span>
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[rgba(235,235,245,0.5)]">MOV</span>
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[rgba(235,235,245,0.5)]">MKV</span>
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[rgba(235,235,245,0.5)]">WebM</span>
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158]">Up to 4GB</span>
            </div>
          </>
        )}
      </div>
    </label>
  );
}
