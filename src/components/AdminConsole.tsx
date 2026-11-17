import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Link2,
  RefreshCw,
  Plus,
  Radio,
  Lock,
} from 'lucide-react';
import { GlobalConfig, KafalahDeckData, PortalDeckEntry } from '../types/presentation';
import { AdminSubTab } from './TopBar';
import { CodeExportStudio } from './CodeExportStudio';
import { computeKafalahMetrics, formatPercent, formatRupiah } from '../utils/calculations';
import { PORTAL_DOMAIN } from '../data/defaultPortal';

interface AdminConsoleProps {
  subTab: AdminSubTab;
  globalConfig: GlobalConfig;
  onGlobalConfigChange: (next: GlobalConfig) => void;
  decks: PortalDeckEntry[];
  editingSlideId: string;
  onSelectEditingSlideId: (slideId: string) => void;
  onSetActivePublicSlide: (slideId: string) => void;
  onAddNewDeck: () => void;
  editingDeck: PortalDeckEntry;
  onDeckMetaChange: (next: PortalDeckEntry) => void;
  editingData: KafalahDeckData;
  onDeckDataChange: (next: KafalahDeckData) => void;
  gasUrl: string;
  onConnectGas: (url: string) => Promise<void>;
  onResetDemo: () => void;
  isLoadingGas: boolean;
  gasMessage: { type: 'success' | 'error'; text: string } | null;
  isLiveConnected: boolean;
  onLockAdmin?: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  subTab,
  globalConfig,
  onGlobalConfigChange,
  decks,
  editingSlideId,
  onSelectEditingSlideId,
  onSetActivePublicSlide,
  onAddNewDeck,
  editingDeck,
  onDeckMetaChange,
  editingData,
  onDeckDataChange,
  gasUrl,
  onConnectGas,
  onResetDemo,
  isLoadingGas,
  gasMessage,
  isLiveConnected,
  onLockAdmin,
}) => {
  const [urlInput, setUrlInput] = useState(gasUrl);
  const metrics = computeKafalahMetrics(editingData);

  const toNumber = (val: string) => {
    const num = Number(val.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(num) ? Math.max(0, num) : 0;
  };

  if (subTab === 'deploy') {
    return <CodeExportStudio />;
  }

  if (subTab === 'settings') {
    return (
      <div className="space-y-6">
        {/* Koneksi Google Apps Script */}
        <section className="apple-glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display-headwood text-xl font-bold text-slate-900">
                Koneksi Google Apps Script
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tempel URL Web App <span className="font-code-mono text-xs">Code.gs</span> untuk menyinkronkan tab <span className="font-semibold">Config</span>, <span className="font-semibold">Daftar_Slide</span>, dan seluruh sheet slide.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {globalConfig.admin_is_protected && onLockAdmin && (
                <button
                  type="button"
                  onClick={onLockAdmin}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Kunci Admin</span>
                </button>
              )}
              {isLiveConnected && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    onResetDemo();
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Kembali ke Data Contoh
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onConnectGas(urlInput.trim());
            }}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full rounded-xl border border-slate-300 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoadingGas || !urlInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-45 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingGas ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{isLoadingGas ? 'Menghubungkan...' : 'Muat dari Sheet'}</span>
            </button>
          </form>

          {gasMessage && (
            <div
              role="status"
              className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium ${
                gasMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                  : 'border-red-200 bg-red-50/90 text-red-700'
              }`}
            >
              {gasMessage.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{gasMessage.text}</span>
            </div>
          )}
        </section>

        {/* Pengaturan Global & Keamanan (Tab Config) */}
        <section className="apple-glass rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display-headwood text-lg font-bold text-slate-900">
              Tab Config — Keamanan Akses &amp; Identitas
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Kode akses halaman publik ({PORTAL_DOMAIN}) dan halaman admin ({PORTAL_DOMAIN}/admin) diatur terpisah pada tab Config Google Sheet.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Nama Brand Utama (brand_name)
              </label>
              <input
                type="text"
                value={globalConfig.brand_name}
                onChange={(e) =>
                  onGlobalConfigChange({ ...globalConfig, brand_name: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Slide Aktif di Halaman Utama (active_slide_id)
              </label>
              <select
                value={globalConfig.active_slide_id}
                onChange={(e) => onSetActivePublicSlide(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm text-slate-900"
              >
                {decks.map((d) => (
                  <option key={d.slide_id} value={d.slide_id}>
                    {d.sheet_name} — {d.deck_title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Proteksi Publik */}
            <div className="rounded-xl border border-slate-200/90 bg-white/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Proteksi Halaman Publik (/)
                  </p>
                  <p className="text-xs text-slate-500">
                    public_is_protected · Untuk pengunjung {PORTAL_DOMAIN}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={globalConfig.public_is_protected}
                  onClick={() =>
                    onGlobalConfigChange({
                      ...globalConfig,
                      public_is_protected: !globalConfig.public_is_protected,
                    })
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                    globalConfig.public_is_protected ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      globalConfig.public_is_protected ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Kode Akses Publik (public_access_code)
                </label>
                <input
                  type="text"
                  disabled={isLiveConnected}
                  value={globalConfig.public_access_code}
                  onChange={(e) =>
                    onGlobalConfigChange({
                      ...globalConfig,
                      public_access_code: e.target.value,
                    })
                  }
                  className="font-code-mono w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Proteksi Admin */}
            <div className="rounded-xl border border-slate-200/90 bg-white/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Proteksi Halaman Admin (/admin)
                  </p>
                  <p className="text-xs text-slate-500">
                    admin_is_protected · Khusus pengelola {PORTAL_DOMAIN}/admin
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={globalConfig.admin_is_protected}
                  onClick={() =>
                    onGlobalConfigChange({
                      ...globalConfig,
                      admin_is_protected: !globalConfig.admin_is_protected,
                    })
                  }
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                    globalConfig.admin_is_protected ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      globalConfig.admin_is_protected ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Kode Akses Admin (admin_access_code)
                </label>
                <input
                  type="text"
                  disabled={isLiveConnected}
                  value={globalConfig.admin_access_code}
                  onChange={(e) =>
                    onGlobalConfigChange({
                      ...globalConfig,
                      admin_access_code: e.target.value,
                    })
                  }
                  className="font-code-mono w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // SubTab: Kelola Slide (Daftar File Slide + Pilih 1 Aktif + Edit Data Slide)
  return (
    <div className="space-y-6">
      {/* Daftar File Slide (Hanya 1 Boleh Aktif) */}
      <section className="apple-glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display-headwood text-xl font-bold text-slate-900">
              Daftar File Slide (Maksimal 1 Slide Aktif di Halaman Utama)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Pilih file slide mana yang ditampilkan ke publik pada <span className="font-code-mono">{PORTAL_DOMAIN}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddNewDeck}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tambah File Slide Baru</span>
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => {
            const isPublicActive = d.slide_id === globalConfig.active_slide_id;
            const isEditing = d.slide_id === editingSlideId;

            return (
              <div
                key={d.slide_id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isEditing
                    ? 'border-blue-600 bg-white shadow-sm'
                    : 'border-slate-200/90 bg-white/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-medium">
                    <span className="text-slate-500">{d.sheet_name}</span>
                    {isPublicActive ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Aktif di Publik</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Draft</span>
                    )}
                  </div>
                  <h3 className="font-display-headwood mt-2 text-base font-bold text-slate-900 line-clamp-2">
                    {d.deck_title}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">
                    File ekspor: {d.export_filename}.pptx
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-slate-200/75 pt-3">
                  <button
                    type="button"
                    onClick={() => onSetActivePublicSlide(d.slide_id)}
                    disabled={isPublicActive}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isPublicActive
                        ? 'bg-emerald-50 text-emerald-800 cursor-default'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isPublicActive ? 'Sedang Aktif' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectEditingSlideId(d.slide_id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      isEditing
                        ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isEditing ? 'Sedang Diedit' : 'Edit Data'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Editor Data Slide Terpilih */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="apple-glass rounded-2xl p-6 lg:col-span-4 space-y-4">
          <div>
            <h3 className="font-display-headwood text-lg font-bold text-slate-900">
              Metadata {editingDeck.sheet_name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Baris di tab Daftar_Slide Google Sheet.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Judul Presentasi (deck_title)
            </label>
            <input
              type="text"
              value={editingDeck.deck_title}
              onChange={(e) =>
                onDeckMetaChange({ ...editingDeck, deck_title: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Nama File Ekspor (export_filename)
            </label>
            <input
              type="text"
              value={editingDeck.export_filename}
              onChange={(e) =>
                onDeckMetaChange({ ...editingDeck, export_filename: e.target.value })
              }
              className="font-code-mono w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
            <p className="font-semibold text-slate-900">Ringkasan Hitung Otomatis:</p>
            <div className="flex justify-between tabular-nums text-slate-600">
              <span>Tunggakan Juli–Okt:</span>
              <span className="font-semibold text-red-700">
                {formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan)}
              </span>
            </div>
            <div className="flex justify-between tabular-nums text-slate-600">
              <span>Tanggungan Okt / Bulan:</span>
              <span className="font-semibold text-slate-900">
                {formatRupiah(metrics.tanggungan_per_bulan.total)}
              </span>
            </div>
            <div className="flex justify-between tabular-nums text-slate-600">
              <span>Sisa Kumulatif:</span>
              <span className="font-semibold text-red-700">
                {formatRupiah(metrics.kumulatif.total_sisa)} ({formatPercent(metrics.kumulatif.total_sisa, metrics.kumulatif.total_kebutuhan)})
              </span>
            </div>
          </div>
        </section>

        <section className="apple-glass rounded-2xl p-6 lg:col-span-8 space-y-5">
          <div>
            <h3 className="font-display-headwood text-lg font-bold text-slate-900">
              Data Halaman {editingDeck.sheet_name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Setiap perubahan nominal otomatis memperbarui persentase, sisa, tunggakan, dan tanggungan bulanan.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-200/80 pt-4">
            <p className="text-xs font-semibold text-blue-700">Halaman 1 · Sampul</p>
            <input
              type="text"
              value={editingData.judul_cover}
              onChange={(e) =>
                onDeckDataChange({ ...editingData, judul_cover: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-medium text-slate-900"
            />
            <textarea
              rows={2}
              value={editingData.subjudul_cover}
              onChange={(e) =>
                onDeckDataChange({ ...editingData, subjudul_cover: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="space-y-4 border-t border-slate-200/80 pt-4">
            <p className="text-xs font-semibold text-blue-700">
              Halaman 2–4 · Pencairan Juli – Oktober
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['juli', 'Juli (Semua Dai Lama)'],
                  ['agustus', 'Agustus (Semua Dai Lama)'],
                  ['september', 'September (Semua Dai Lama)'],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200/90 bg-white/65 p-3 space-y-2"
                >
                  <p className="text-xs font-semibold text-slate-800">{label}</p>
                  <div>
                    <label className="block text-[11px] text-slate-500">Total (Rp)</label>
                    <input
                      type="number"
                      value={editingData[key].total}
                      onChange={(e) =>
                        onDeckDataChange({
                          ...editingData,
                          [key]: {
                            ...editingData[key],
                            total: toNumber(e.target.value),
                          },
                        })
                      }
                      className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Tersalurkan (Rp)</label>
                    <input
                      type="number"
                      value={editingData[key].tersalurkan}
                      onChange={(e) =>
                        onDeckDataChange({
                          ...editingData,
                          [key]: {
                            ...editingData[key],
                            tersalurkan: toNumber(e.target.value),
                          },
                        })
                      }
                      className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white/65 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-800">
                Kafalah Oktober (Dai Lama &amp; Dai Baru)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] text-slate-500">Total Dai Lama (Rp)</label>
                  <input
                    type="number"
                    value={editingData.oktober.total_dai_lama}
                    onChange={(e) =>
                      onDeckDataChange({
                        ...editingData,
                        oktober: {
                          ...editingData.oktober,
                          total_dai_lama: toNumber(e.target.value),
                        },
                      })
                    }
                    className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Tersalurkan Dai Lama (Rp)</label>
                  <input
                    type="number"
                    value={editingData.oktober.tersalurkan_dai_lama}
                    onChange={(e) =>
                      onDeckDataChange({
                        ...editingData,
                        oktober: {
                          ...editingData.oktober,
                          tersalurkan_dai_lama: toNumber(e.target.value),
                        },
                      })
                    }
                    className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Total Dai Baru (Rp)</label>
                  <input
                    type="number"
                    value={editingData.oktober.total_dai_baru}
                    onChange={(e) =>
                      onDeckDataChange({
                        ...editingData,
                        oktober: {
                          ...editingData.oktober,
                          total_dai_baru: toNumber(e.target.value),
                        },
                      })
                    }
                    className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500">Tersalurkan Dai Baru (Rp)</label>
                  <input
                    type="number"
                    value={editingData.oktober.tersalurkan_dai_baru}
                    onChange={(e) =>
                      onDeckDataChange({
                        ...editingData,
                        oktober: {
                          ...editingData.oktober,
                          tersalurkan_dai_baru: toNumber(e.target.value),
                        },
                      })
                    }
                    className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200/80 pt-4">
            <p className="text-xs font-semibold text-blue-700">Halaman 5 · Update Kumulatif</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] text-slate-500">Total Kebutuhan (Rp)</label>
                <input
                  type="number"
                  value={editingData.kumulatif.total_kebutuhan}
                  onChange={(e) =>
                    onDeckDataChange({
                      ...editingData,
                      kumulatif: {
                        ...editingData.kumulatif,
                        total_kebutuhan: toNumber(e.target.value),
                      },
                    })
                  }
                  className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500">Total Dana Masuk (Rp)</label>
                <input
                  type="number"
                  value={editingData.kumulatif.total_dana_masuk}
                  onChange={(e) =>
                    onDeckDataChange({
                      ...editingData,
                      kumulatif: {
                        ...editingData.kumulatif,
                        total_dana_masuk: toNumber(e.target.value),
                      },
                    })
                  }
                  className="font-code-mono mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200/80 pt-4">
            <p className="text-xs font-semibold text-blue-700">Halaman 6–7 · Analisis &amp; Penutup</p>
            <textarea
              rows={2}
              value={editingData.analisis.ringkasan_utama}
              onChange={(e) =>
                onDeckDataChange({
                  ...editingData,
                  analisis: { ...editingData.analisis, ringkasan_utama: e.target.value },
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs text-slate-900"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={editingData.judul_penutup}
                onChange={(e) =>
                  onDeckDataChange({ ...editingData, judul_penutup: e.target.value })
                }
                placeholder="Judul Penutup"
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-900"
              />
              <input
                type="text"
                value={editingData.kalimat_penutup}
                onChange={(e) =>
                  onDeckDataChange({ ...editingData, kalimat_penutup: e.target.value })
                }
                placeholder="Kalimat Penutup"
                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs text-slate-900"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
