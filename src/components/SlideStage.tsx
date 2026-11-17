import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  Lock,
  ImageOff,
} from 'lucide-react';
import { KafalahDeckData, PortalDeckEntry } from '../types/presentation';
import { computeKafalahMetrics, formatPercent, formatRupiah } from '../utils/calculations';
import { PORTAL_DOMAIN } from '../data/defaultPortal';
import { DonutChart, MonthlyRekapChart, ProgressBarChart } from './SlideCharts';

interface SlideStageProps {
  brandName: string;
  deck: PortalDeckEntry;
  data: KafalahDeckData;
  pageIndex: number;
  onPageChange: (index: number) => void;
  onExportPdf: () => void;
  onExportPptx: () => void;
  isExportingPptx: boolean;
  isProtected: boolean;
  onLockPresentation?: () => void;
}

const PAGE_LABELS = [
  '🏠 Sampul',
  '📊 Progres Juli–Okt',
  '🚨 Tunggakan Juli–Okt',
  '💼 Tanggungan Oktober',
  '💰 Update Kumulatif',
  '📈 Analisis Rekap',
  '🤝 Penutup',
];

export const SlideStage: React.FC<SlideStageProps> = ({
  brandName,
  deck,
  data,
  pageIndex,
  onPageChange,
  onExportPdf,
  onExportPptx,
  isExportingPptx,
  isProtected,
  onLockPresentation,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const totalPages = PAGE_LABELS.length;
  const metrics = computeKafalahMetrics(data);
  const accent = data.tema.warna_aksen || '#1D4ED8';
  const bgGradient = `linear-gradient(135deg, ${data.tema.warna_latar_awal || '#F8FAFC'} 0%, ${data.tema.warna_latar_akhir || '#E6EEF8'} 100%)`;

  const goPrev = () => {
    if (pageIndex > 0) onPageChange(pageIndex - 1);
  };

  const goNext = () => {
    if (pageIndex < totalPages - 1) onPageChange(pageIndex + 1);
  };

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await stageRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Abaikan jika browser membatasi Fullscreen API
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (pageIndex < totalPages - 1) onPageChange(pageIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pageIndex > 0) onPageChange(pageIndex - 1);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pageIndex, totalPages, onPageChange]);

  const renderPageContent = () => {
    // Halaman 1: Cover Seimbang 2 Kolom dengan Snapshot Kartu Berwarna
    if (pageIndex === 0) {
      const julSepTotal =
        metrics.rows_progres[0].total +
        metrics.rows_progres[1].total +
        metrics.rows_progres[2].total;

      return (
        <div className="my-auto grid h-full items-center gap-6 lg:grid-cols-12 py-2">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-blue-700">
              <span>📊</span>
              <span>Laporan Penyaluran &amp; Analisis Dana Kafalah</span>
            </div>
            <h2 className="font-display-headwood text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl lg:text-[2.6rem]">
              {data.judul_cover}
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-slate-700 sm:text-sm lg:text-base">
              {data.subjudul_cover}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
              <span>🌐 {PORTAL_DOMAIN}</span>
              <span aria-hidden="true">·</span>
              <span>📑 {totalPages} Halaman Ringkas</span>
            </div>
          </div>

          <div className="lg:col-span-5 grid gap-3">
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white/90 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-emerald-700">
                ✅ Realisasi Juli – September
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-900">
                {formatRupiah(julSepTotal)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-emerald-700">
                100% tersalurkan seluruhnya untuk Dai Lama
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 to-white/90 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-amber-800">
                ⏳ Progres Oktober Berjalan
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                {formatPercent(
                  metrics.okt_gabungan.tersalurkan,
                  metrics.okt_gabungan.total
                )}{' '}
                <span className="text-sm font-semibold text-slate-600">Tercapai</span>
              </p>
              <p className="mt-0.5 text-[11px] font-medium tabular-nums text-rose-700">
                Sisa belum cair: {formatRupiah(metrics.okt_gabungan.sisa)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/95 to-white/90 p-4 shadow-xs">
              <p className="text-[11px] font-bold text-blue-800">
                👥 Cakupan Dai &amp; Akumulasi
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-blue-950">
                353 Dai Aktif (Oktober)
              </p>
              <p className="mt-0.5 text-[11px] font-medium tabular-nums text-slate-600">
                Dana masuk kumulatif {formatPercent(metrics.kumulatif.total_dana_masuk, metrics.kumulatif.total_kebutuhan)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Halaman 2: Progres Pencairan Juli–Oktober + Grafik Batang Perbandingan
    if (pageIndex === 1) {
      const allProgressRows = [
        ...metrics.rows_progres,
        metrics.okt_lama,
        metrics.okt_baru,
      ];

      return (
        <div className="my-auto flex h-full flex-col justify-center gap-3.5 py-1">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display-headwood text-lg font-bold leading-tight sm:text-2xl lg:text-[1.7rem]">
                📊 Progres Pencairan Kafalah Dai Lama &amp; Dai Baru
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-600 sm:text-xs">
                Juli–September telah lunas 100%, sedangkan Oktober masih menyisakan alokasi Dai Lama &amp; Dai Baru.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/85 shadow-xs">
              <table className="w-full h-full border-collapse text-left text-[11px] sm:text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-bold text-slate-600">
                    <th className="px-3.5 py-2.5">Periode · Kategori</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-right">Tersalurkan</th>
                    <th className="px-3.5 py-2.5 text-right">Sisa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {allProgressRows.map((row, i) => {
                    const isLunas = row.sisa === 0;
                    return (
                      <tr key={i} className={isLunas ? 'bg-emerald-50/25' : 'bg-rose-50/25'}>
                        <td className="px-3.5 py-2.5 font-medium text-slate-900">
                          <span className="mr-1.5">{isLunas ? '✅' : row.tersalurkan > 0 ? '🟡' : '🔴'}</span>
                          <span className="font-semibold">{row.bulan}</span>
                          <span className="text-slate-500"> · {row.kategori}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                          {formatRupiah(row.total)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                          <div>{formatRupiah(row.tersalurkan)}</div>
                          <div className="text-[10px] text-emerald-600">
                            {formatPercent(row.tersalurkan, row.total)}
                          </div>
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-right font-semibold tabular-nums ${
                            row.sisa > 0 ? 'text-rose-700' : 'text-slate-500'
                          }`}
                        >
                          <div>{formatRupiah(row.sisa)}</div>
                          <div className="text-[10px] opacity-85">
                            {formatPercent(row.sisa, row.total)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-5">
              <ProgressBarChart rows={allProgressRows} />
            </div>
          </div>
        </div>
      );
    }

    // Halaman 3: Total Tunggakan Juli - Oktober + Donut Chart Proporsi
    if (pageIndex === 2) {
      const t = metrics.tunggakan_juli_okt;
      return (
        <div className="my-auto flex h-full flex-col justify-center gap-4 py-1">
          <div>
            <h2 className="font-display-headwood text-lg font-bold leading-tight sm:text-2xl lg:text-3xl">
              🚨 Total Tunggakan Belum Terbayarkan (Juli – Oktober)
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Akumulasi kewajiban yang masih harus diselesaikan dari total kebutuhan 4 bulan berjalan.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/60 p-5 shadow-xs">
                <p className="text-xs font-bold text-rose-700">
                  🚨 Total Tunggakan Belum Terbayarkan
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-2xl font-bold tabular-nums text-rose-700 sm:text-4xl">
                    {formatRupiah(t.total_tunggakan)}
                  </p>
                  <span className="text-sm font-bold tabular-nums text-rose-600">
                    {formatPercent(t.total_tunggakan, t.total_kebutuhan)} dari kebutuhan
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-4">
                  <p className="text-xs font-bold text-emerald-700">💚 Sudah Tersalurkan</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-emerald-800 sm:text-2xl">
                    {formatRupiah(t.total_tersalurkan)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium tabular-nums text-emerald-700">
                    {formatPercent(t.total_tersalurkan, t.total_kebutuhan)} terealisasi
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-white p-4">
                  <p className="text-xs font-bold text-blue-800">📋 Total Kebutuhan Juli–Okt</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {formatRupiah(t.total_kebutuhan)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    Gabungan 4 bulan penuh
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-xs text-slate-700">
                <span className="font-bold text-slate-900">📌 Rincian:</span> Juli–September{' '}
                <span className="font-semibold text-emerald-700">Rp0 (Lunas)</span> · Okt Dai Lama{' '}
                <span className="font-semibold tabular-nums text-rose-700">
                  {formatRupiah(metrics.okt_lama.sisa)}
                </span>{' '}
                · Okt Dai Baru{' '}
                <span className="font-semibold tabular-nums text-rose-700">
                  {formatRupiah(metrics.okt_baru.sisa)}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <DonutChart
                title="🎯 Proporsi Realisasi Juli – Oktober"
                centerValue={formatPercent(t.total_tersalurkan, t.total_kebutuhan)}
                centerLabel="Tersalurkan"
                primaryPct={t.persen_tersalurkan}
                primaryColor="#10B981"
                secondaryColor="#FDA4AF"
                legend={[
                  {
                    label: 'Tersalurkan',
                    value: formatRupiah(t.total_tersalurkan),
                    color: '#10B981',
                  },
                  {
                    label: 'Tunggakan Sisa',
                    value: formatRupiah(t.total_tunggakan),
                    color: '#FDA4AF',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      );
    }

    // Halaman 4: Total Tanggungan per Bulan (Oktober) + Donut Komposisi Dai Lama vs Baru
    if (pageIndex === 3) {
      const tb = metrics.tanggungan_per_bulan;
      return (
        <div className="my-auto flex h-full flex-col justify-center gap-4 py-1">
          <div>
            <h2 className="font-display-headwood text-lg font-bold leading-tight sm:text-2xl lg:text-3xl">
              💼 Total Tanggungan Kafalah Dai Sekarang per Bulan (Oktober)
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Komposisi beban kewajiban bulanan aktif antara Dai Lama dan Dai Baru pada periode Oktober.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-sm">
                <p className="text-xs font-semibold text-blue-100">
                  💼 Total Tanggungan Aktif per Bulan (Oktober)
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-2xl font-bold tabular-nums sm:text-4xl">
                    {formatRupiah(tb.total)}
                  </p>
                  <span className="text-xs font-semibold text-blue-100 tabular-nums">
                    Sisa belum cair: {formatRupiah(tb.sisa_berjalan_okt)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-4">
                  <p className="text-xs font-bold text-indigo-800">🕌 Dai Lama</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {formatRupiah(tb.dai_lama)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium tabular-nums text-indigo-700">
                    Porsi {formatPercent(tb.dai_lama, tb.total)} dari beban bulanan
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/90 to-white p-4">
                  <p className="text-xs font-bold text-sky-800">🌱 Dai Baru</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                    {formatRupiah(tb.dai_baru)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium tabular-nums text-sky-700">
                    Porsi {formatPercent(tb.dai_baru, tb.total)} dari beban bulanan
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white/80 px-4 py-3 text-xs text-slate-700">
                <span className="font-bold text-slate-900">💡 Catatan:</span> Penambahan Dai Baru mendominasi{' '}
                <span className="font-semibold text-blue-700 tabular-nums">
                  {formatPercent(tb.dai_baru, tb.total)}
                </span>{' '}
                total kebutuhan bulanan Oktober saat ini.
              </div>
            </div>

            <div className="lg:col-span-5">
              <DonutChart
                title="⚖️ Komposisi Beban Bulanan Oktober"
                centerValue={formatPercent(tb.dai_baru, tb.total)}
                centerLabel="Porsi Dai Baru"
                primaryPct={tb.persen_dai_baru}
                primaryColor="#2563EB"
                secondaryColor="#818CF8"
                legend={[
                  {
                    label: 'Dai Baru (60,08%)',
                    value: formatRupiah(tb.dai_baru),
                    color: '#2563EB',
                  },
                  {
                    label: 'Dai Lama (39,92%)',
                    value: formatRupiah(tb.dai_lama),
                    color: '#818CF8',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      );
    }

    // Halaman 5: Update Kafalah Kumulatif dengan Kartu Berwarna & Grafik Gap
    if (pageIndex === 4) {
      const k = metrics.kumulatif;
      return (
        <div className="my-auto flex h-full flex-col justify-center gap-4 py-1">
          <div>
            <h2 className="font-display-headwood text-lg font-bold leading-tight sm:text-2xl lg:text-3xl">
              💰 {data.kumulatif.judul_periode}
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Gambaran keseluruhan kebutuhan dana kumulatif terhadap realisasi dana masuk yang berhasil dihimpun.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-xs">
              <p className="text-xs font-bold text-slate-600">📘 Total Kebutuhan</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 sm:text-[1.75rem]">
                {formatRupiah(k.total_kebutuhan)}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">100% Target Kumulatif</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xs">
              <p className="text-xs font-bold text-emerald-700">💚 Total Dana Masuk</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700 sm:text-[1.75rem]">
                {formatRupiah(k.total_dana_masuk)}
              </p>
              <p className="mt-1 text-xs font-semibold tabular-nums text-emerald-700">
                {formatPercent(k.total_dana_masuk, k.total_kebutuhan)} terpenuhi
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-xs">
              <p className="text-xs font-bold text-rose-700">📌 Total Sisa Kekurangan</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700 sm:text-[1.75rem]">
                {formatRupiah(k.total_sisa)}
              </p>
              <p className="mt-1 text-xs font-semibold tabular-nums text-rose-700">
                {formatPercent(k.total_sisa, k.total_kebutuhan)} belum tertutup
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white/85 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>📊 Grafik Rasio Pemenuhan Dana Kumulatif</span>
              <span className="tabular-nums text-emerald-700">
                {formatPercent(k.total_dana_masuk, k.total_kebutuhan)} Tercapai
              </span>
            </div>
            <div className="h-5 w-full overflow-hidden rounded-full bg-rose-100 p-0.5 flex">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                style={{ width: `${Math.min(100, k.persen_terpenuhi)}%` }}
              />
            </div>
            <div className="grid gap-3 pt-1 text-xs text-slate-600 sm:grid-cols-3">
              <div>
                <span className="font-semibold text-slate-900">✅ Terpenuhi:</span>{' '}
                {formatRupiah(k.total_dana_masuk)}
              </div>
              <div>
                <span className="font-semibold text-slate-900">⏳ Selisih Gap:</span>{' '}
                {formatRupiah(k.total_sisa)}
              </div>
              <div>
                <span className="font-semibold text-slate-900">🎯 Fokus:</span> Tutup defisit{' '}
                {formatPercent(k.total_sisa, k.total_kebutuhan)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Halaman 6: Analisis Kebutuhan Bulanan vs Dana Masuk + Mini Chart + Gambar Rekap
    if (pageIndex === 5) {
      const pointIcons = ['🟢', '🔻', '👥', '💡'];
      return (
        <div className="my-auto grid h-full items-center gap-4 lg:grid-cols-12 py-1">
          <div className="lg:col-span-7 flex flex-col justify-between gap-2.5">
            <div>
              <h2 className="font-display-headwood text-lg font-bold leading-tight sm:text-2xl">
                📈 {data.analisis.judul}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed font-medium text-slate-800 sm:text-xs">
                {data.analisis.ringkasan_utama}
              </p>
            </div>

            <MonthlyRekapChart />

            <div className="grid gap-2 sm:grid-cols-2">
              {data.analisis.poin_analisis.map((pt, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white/80 p-2.5 text-[11px] leading-snug text-slate-700"
                >
                  <span className="mr-1.5">{pointIcons[idx % pointIcons.length]}</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 h-full flex flex-col justify-center">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-sm">
              {data.analisis.gambar_url && !imgFailed ? (
                <img
                  src={data.analisis.gambar_url}
                  alt="Tabel Rekapitulasi Kebutuhan Dana dan Dana Masuk Kafalah"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="max-h-[240px] sm:max-h-[280px] lg:max-h-[340px] w-full rounded-xl object-contain bg-slate-50"
                />
              ) : (
                <div className="flex h-52 flex-col items-center justify-center rounded-xl bg-slate-100 p-4 text-center text-slate-500">
                  <ImageOff className="h-6 w-6 mb-2" aria-hidden="true" />
                  <p className="text-xs font-medium">Gambar Tabel Rekapitulasi</p>
                </div>
              )}
              <p className="mt-1.5 text-center text-[10px] font-semibold text-slate-500">
                📑 Tabel Rekapitulasi 14 Bulan (Total Rp5,79 M vs Masuk Rp4,12 M)
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Halaman 7: Penutup & 3 Langkah Tindak Lanjut Seimbang
    return (
      <div className="my-auto grid h-full items-center gap-6 lg:grid-cols-12 py-2">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700">
            <span>🤝</span>
            <span>Penutup &amp; Kesimpulan</span>
          </div>
          <h2 className="font-display-headwood text-2xl font-bold leading-tight text-balance sm:text-3xl lg:text-4xl">
            {data.judul_penutup}
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-slate-700 sm:text-sm lg:text-base">
            {data.kalimat_penutup}
          </p>
        </div>

        <div className="lg:col-span-5 grid gap-3">
          <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/90 to-white p-4">
            <p className="text-xs font-bold text-rose-700">
              1️⃣ Prioritas Tunggakan Oktober
            </p>
            <p className="mt-1 text-xs text-slate-700 tabular-nums">
              Menyelesaikan sisa penyaluran sebesar{' '}
              <span className="font-bold text-rose-700">
                {formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan)}
              </span>{' '}
              bagi Dai Lama &amp; Dai Baru.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/90 to-white p-4">
            <p className="text-xs font-bold text-blue-800">
              2️⃣ Stabilitas 353 Dai Aktif
            </p>
            <p className="mt-1 text-xs text-slate-700 tabular-nums">
              Menjaga kesiapan kebutuhan rutin bulanan sebesar{' '}
              <span className="font-bold text-slate-900">
                {formatRupiah(metrics.tanggungan_per_bulan.total)}
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-4">
            <p className="text-xs font-bold text-emerald-700">
              3️⃣ Akselerasi Penghimpunan Dana
            </p>
            <p className="mt-1 text-xs text-slate-700 tabular-nums">
              Menutup selisih kumulatif{' '}
              <span className="font-bold text-emerald-800">
                {formatRupiah(metrics.kumulatif.total_sisa)}
              </span>{' '}
              melalui sinergi program donatur.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Judul & Aksi Viewer Publik */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="font-code-mono truncate">{PORTAL_DOMAIN}</span>
            <span aria-hidden="true">·</span>
            <span>{deck.sheet_name}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{totalPages} Halaman (16:9)</span>
          </div>
          <h1 className="font-display-headwood mt-1 text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
            {deck.deck_title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isProtected && onLockPresentation && (
            <button
              type="button"
              onClick={onLockPresentation}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer whitespace-nowrap"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Kunci</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-white cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Unduh PDF</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/85 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:bg-white cursor-pointer whitespace-nowrap"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Layar Penuh</span>
          </button>
        </div>
      </div>

      {/* Fixed 16:9 Landscape Presentation Frame */}
      <div
        ref={stageRef}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0].screenX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = e.changedTouches[0].screenX - touchStartX.current;
          if (diff < -45) goNext();
          if (diff > 45) goPrev();
          touchStartX.current = null;
        }}
        className={`relative w-full overflow-hidden border border-white/80 shadow-[0_28px_60px_-24px_rgba(15,23,42,0.22)] ${
          isFullscreen
            ? 'h-screen w-screen rounded-none bg-slate-950'
            : 'aspect-video rounded-2xl'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={`${deck.slide_id}-page-${pageIndex}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: bgGradient,
              color: data.tema.warna_teks || '#0F172A',
            }}
            className={`flex h-full w-full flex-col justify-between overflow-y-auto ${
              isFullscreen ? 'p-8 sm:p-12 lg:p-16' : 'p-5 sm:p-7 lg:p-9'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold tracking-wide opacity-80 shrink-0">
              <span>
                {brandName} · {deck.sheet_name} · {PAGE_LABELS[pageIndex]}
              </span>
              <span className="tabular-nums">
                {String(pageIndex + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-0">
              {renderPageContent()}
            </div>

            <div className="flex items-center justify-between border-t border-current/15 pt-2 text-[11px] opacity-75 shrink-0">
              <span className="truncate">{data.catatan_kaki}</span>
              <span className="hidden sm:inline truncate">{deck.deck_title}</span>
            </div>
          </motion.article>
        </AnimatePresence>

        {isFullscreen && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/25 bg-slate-900/75 px-4 py-2 text-white backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={goPrev}
              disabled={pageIndex === 0}
              aria-label="Halaman sebelumnya"
              className="rounded-lg p-2 hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold tabular-nums">
              {String(pageIndex + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={pageIndex >= totalPages - 1}
              aria-label="Halaman berikutnya"
              className="rounded-lg p-2 hover:bg-white/15 disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="mx-1 h-4 w-px bg-white/20" aria-hidden="true" />
            <button
              type="button"
              onClick={onExportPptx}
              disabled={isExportingPptx}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-white/15 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PPTX</span>
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-white/15 cursor-pointer"
            >
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="apple-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Sebelumnya</span>
          </button>

          <span className="px-3 text-sm font-semibold text-slate-800 tabular-nums">
            {String(pageIndex + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={goNext}
            disabled={pageIndex >= totalPages - 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Geser layar atau gunakan tombol panah kiri/kanan · Tekan F untuk layar penuh
        </p>
      </div>

      {/* Thumbnail Halaman */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {PAGE_LABELS.map((label, idx) => {
          const isActive = idx === pageIndex;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPageChange(idx)}
              className={`min-w-[165px] shrink-0 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 bg-white shadow-md shadow-blue-900/5'
                  : 'border-slate-200/80 bg-white/65 hover:bg-white/90'
              }`}
            >
              <p className="text-[11px] font-semibold text-slate-500 tabular-nums">
                Halaman {idx + 1}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900 truncate">
                {label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
