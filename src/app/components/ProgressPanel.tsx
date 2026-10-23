'use client';

import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ProcessingState } from '../page';

interface ProgressPanelProps {
  processing: ProcessingState;
}

export default function ProgressPanel({ processing }: ProgressPanelProps) {
  const { status, currentPart, totalParts, message, progress } = processing;
  const isDone  = status === 'done';
  const isError = status === 'error';
  const isActive = !isDone && !isError;

  return (
    /* HIG: Progress — determinate when possible; card with frosted glow */
    <div className={[
      'glow-card rounded-[24px] p-6 space-y-4 transition-all duration-300',
      isDone  ? 'border-[#30D158]/40 shadow-[0_0_30px_rgba(48,209,88,0.15)]' :
      isError ? 'border-[#FF453A]/40 shadow-[0_0_30px_rgba(255,69,58,0.15)]' :
                '',
    ].join(' ')}>

      {/* Status row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isDone  && <CheckCircle className="w-5 h-5 text-[#30D158] shrink-0" />}
          {isError && <AlertCircle className="w-5 h-5 text-[#FF453A] shrink-0" />}
          {isActive && (
            <Loader2 className="w-5 h-5 text-[#0A84FF] shrink-0 animate-spin" />
          )}
          <p className={[
            'text-[15px] font-medium truncate tracking-[-0.004em]',
            isDone  ? 'text-[#30D158]' :
            isError ? 'text-[#FF453A]' :
                      'text-white',
          ].join(' ')}>
            {message}
          </p>
        </div>
        {/* Part counter */}
        {isActive && totalParts > 0 && (
          <span className="text-[13px] text-[rgba(235,235,245,0.4)] tabular-nums shrink-0">
            {currentPart}&thinsp;/&thinsp;{totalParts}
          </span>
        )}
        {isDone && (
          <span className="text-[13px] text-[#30D158] font-medium shrink-0">100%</span>
        )}
      </div>

      {/* Progress bar — HIG: Motion — purposeful, brief */}
      <div className="h-[3px] bg-[#2C2C2E] rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500 ease-out',
            isDone  ? 'bg-[#30D158]' :
            isError ? 'bg-[#FF453A]' :
                      'progress-active',
          ].join(' ')}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step dot indicators (only when multi-part and processing) */}
      {isActive && totalParts > 1 && totalParts <= 60 && (
        <div className="flex gap-1 flex-wrap pt-0.5">
          {Array.from({ length: totalParts }).map((_, i) => (
            <div
              key={i}
              className={[
                'h-[3px] flex-1 min-w-[6px] max-w-[20px] rounded-full transition-all duration-300',
                i < currentPart - 1
                  ? 'bg-[#0A84FF]'
                  : i === currentPart - 1
                  ? 'bg-[#0A84FF]/50 animate-pulse'
                  : 'bg-[#3A3A3C]',
              ].join(' ')}
            />
          ))}
        </div>
      )}

      {/* Large-batch text fallback */}
      {isActive && totalParts > 60 && (
        <p className="text-[12px] text-[rgba(235,235,245,0.35)]">
          Processing {totalParts} parts — this may take a moment.
        </p>
      )}
    </div>
  );
}
