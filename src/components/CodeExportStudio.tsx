import React, { useState } from 'react';
import { Copy, Check, Download, CheckCircle2 } from 'lucide-react';
import { CODE_GS_TEMPLATE } from '../templates/exportTemplates';

export const CodeExportStudio: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_GS_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Abaikan jika clipboard dibatasi
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([CODE_GS_TEMPLATE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="apple-glass rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="font-display-headwood text-xl font-bold text-slate-900">
              Siap Deploy ke GitHub Pages via GitHub Actions (Cara 1)
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Repositori ini sudah dilengkapi <span className="font-code-mono">.github/workflows/deploy.yml</span> (otomatis menjalankan <span className="font-code-mono">npm install</span> &amp; <span className="font-code-mono">npm run build</span>), <span className="font-code-mono">dist/admin/index.html</span>, serta <span className="font-code-mono">public/404.html</span> agar <span className="font-code-mono">slide.wadahdigital.my.id</span> dan <span className="font-code-mono">/admin</span> tidak layar putih atau 404.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-blue-700">01. Aktifkan GitHub Actions</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Di repositori GitHub, buka <span className="font-semibold">Settings &gt; Pages &gt; Build and deployment &gt; Source</span> lalu pilih <span className="font-semibold">GitHub Actions</span>.
            </p>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-blue-700">02. Custom Domain</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Pada bagian <span className="font-semibold">Custom domain</span>, masukkan <span className="font-code-mono">slide.wadahdigital.my.id</span> dan centang <span className="font-semibold">Enforce HTTPS</span>.
            </p>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-blue-700">03. Pasang Code.gs</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Salin <span className="font-code-mono">Code.gs</span> di bawah ke Apps Script Google Sheet Anda, jalankan <span className="font-code-mono">setupDatabaseAwal()</span>, lalu terbitkan sebagai Web App.
            </p>
          </div>
        </div>
      </section>

      <section className="apple-glass rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-4">
          <span className="text-sm font-semibold text-slate-900">
            Code.gs — Backend Google Apps Script
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Code.gs</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Unduh Code.gs</span>
            </button>
          </div>
        </div>

        <div className="max-h-[540px] overflow-auto bg-slate-950 p-6 text-slate-100">
          <pre className="font-code-mono text-xs leading-relaxed">
            <code>{CODE_GS_TEMPLATE}</code>
          </pre>
        </div>
      </section>
    </div>
  );
};
