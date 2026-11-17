import React, { useState } from 'react';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';

interface AccessLockModalProps {
  title: string;
  subtitle: string;
  description: string;
  errorMessage: string | null;
  isVerifying: boolean;
  onSubmitCode: (code: string) => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const AccessLockModal: React.FC<AccessLockModalProps> = ({
  title,
  subtitle,
  description,
  errorMessage,
  isVerifying,
  onSubmitCode,
  secondaryAction,
}) => {
  const [codeInput, setCodeInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    onSubmitCode(codeInput.trim());
  };

  return (
    <div className="apple-glass mx-auto my-10 max-w-md rounded-2xl p-8">
      <div className="mb-5 flex items-center gap-3 text-slate-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Lock className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{subtitle}</p>
          <h2 className="font-display-headwood text-lg font-bold text-slate-900 truncate">
            {title}
          </h2>
        </div>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-slate-600">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="access-code-input"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Kode Akses
          </label>
          <input
            id="access-code-input"
            type="password"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Masukkan kode akses"
            autoComplete="off"
            required
            className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isVerifying || !codeInput.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
        >
          <span>{isVerifying ? 'Memverifikasi...' : 'Lanjutkan'}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

      {secondaryAction && (
        <div className="mt-5 border-t border-slate-200/80 pt-4 text-center">
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        </div>
      )}
    </div>
  );
};
