import React from 'react';
import { KafalahDeckData, PortalDeckEntry } from '../types/presentation';
import { computeKafalahMetrics, formatPercent, formatRupiah } from '../utils/calculations';
import { DonutChart, MonthlyRekapChart, ProgressBarChart } from './SlideCharts';

interface PrintDeckProps {
  brandName: string;
  deck: PortalDeckEntry;
  data: KafalahDeckData;
}

export const PrintDeck: React.FC<PrintDeckProps> = ({ brandName, deck, data }) => {
  const metrics = computeKafalahMetrics(data);
  const bgGradient = `linear-gradient(135deg, ${data.tema.warna_latar_awal || '#F8FAFC'} 0%, ${data.tema.warna_latar_akhir || '#E6EEF8'} 100%)`;
  const textColor = data.tema.warna_teks || '#0F172A';

  const PageFrame = ({
    pageNum,
    label,
    children,
  }: {
    pageNum: number;
    label: string;
    children: React.ReactNode;
  }) => (
    <div
      className="print-slide-page"
      style={{ background: bgGradient, color: textColor }}
    >
      <div className="flex items-center justify-between text-xs font-semibold opacity-80">
        <span>
          {brandName} · {deck.sheet_name} · {label}
        </span>
        <span className="tabular-nums">{String(pageNum).padStart(2, '0')} / 07</span>
      </div>
      <div className="my-auto">{children}</div>
      <div className="flex items-center justify-between border-t border-current/20 pt-3 text-xs opacity-75">
        <span>{data.catatan_kaki}</span>
        <span>{deck.deck_title}</span>
      </div>
    </div>
  );

  const allProgressRows = [...metrics.rows_progres, metrics.okt_lama, metrics.okt_baru];
  const julSepTotal =
    metrics.rows_progres[0].total +
    metrics.rows_progres[1].total +
    metrics.rows_progres[2].total;

  return (
    <section className="print-deck hidden" aria-hidden="true">
      <PageFrame pageNum={1} label="Sampul">
        <div className="grid grid-cols-12 items-center gap-6">
          <div className="col-span-7 space-y-4">
            <p className="text-xs font-bold text-blue-700">
              📊 Laporan Penyaluran &amp; Analisis Dana Kafalah
            </p>
            <h2 className="font-display-headwood text-4xl font-bold leading-tight">
              {data.judul_cover}
            </h2>
            <p className="text-sm leading-relaxed opacity-85">{data.subjudul_cover}</p>
          </div>
          <div className="col-span-5 grid gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4">
              <p className="text-xs font-bold text-emerald-700">✅ Realisasi Juli – September</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{formatRupiah(julSepTotal)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4">
              <p className="text-xs font-bold text-amber-800">⏳ Progres Oktober Berjalan</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {formatPercent(metrics.okt_gabungan.tersalurkan, metrics.okt_gabungan.total)} Tercapai
              </p>
            </div>
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNum={2} label="Progres Pencairan Juli–Oktober">
        <h2 className="font-display-headwood text-2xl font-bold mb-4">
          📊 Progres Pencairan Kafalah Dai Lama &amp; Dai Baru
        </h2>
        <div className="grid grid-cols-12 gap-4 items-stretch">
          <div className="col-span-7 rounded-xl border border-slate-300 bg-white/85 overflow-hidden">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                  <th className="p-2.5 text-left">Periode · Kategori</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-right">Tersalurkan</th>
                  <th className="p-2.5 text-right">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allProgressRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium">
                      {row.sisa === 0 ? '✅' : row.tersalurkan > 0 ? '🟡' : '🔴'} {row.bulan} · {row.kategori}
                    </td>
                    <td className="p-2.5 text-right tabular-nums font-semibold">
                      {formatRupiah(row.total)}
                    </td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-700 font-semibold">
                      {formatRupiah(row.tersalurkan)} ({formatPercent(row.tersalurkan, row.total)})
                    </td>
                    <td className="p-2.5 text-right tabular-nums text-rose-700 font-semibold">
                      {formatRupiah(row.sisa)} ({formatPercent(row.sisa, row.total)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-span-5">
            <ProgressBarChart rows={allProgressRows} />
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNum={3} label="Total Tunggakan Juli–Oktober">
        <h2 className="font-display-headwood text-2xl font-bold mb-4">
          🚨 Total Tunggakan Belum Terbayarkan (Juli – Oktober)
        </h2>
        <div className="grid grid-cols-12 gap-4 items-stretch">
          <div className="col-span-7 grid gap-3">
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-5">
              <p className="text-xs font-bold text-rose-700">🚨 Total Tunggakan Belum Terbayarkan</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-rose-700">
                {formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-4">
                <p className="text-xs font-bold text-emerald-700">💚 Tersalurkan</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-800">
                  {formatRupiah(metrics.tunggakan_juli_okt.total_tersalurkan)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-300 bg-blue-50/90 p-4">
                <p className="text-xs font-bold text-blue-800">📋 Total Kebutuhan</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(metrics.tunggakan_juli_okt.total_kebutuhan)}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-5">
            <DonutChart
              title="🎯 Proporsi Realisasi"
              centerValue={formatPercent(
                metrics.tunggakan_juli_okt.total_tersalurkan,
                metrics.tunggakan_juli_okt.total_kebutuhan
              )}
              centerLabel="Tersalurkan"
              primaryPct={metrics.tunggakan_juli_okt.persen_tersalurkan}
              primaryColor="#10B981"
              secondaryColor="#FDA4AF"
              legend={[
                {
                  label: 'Tersalurkan',
                  value: formatRupiah(metrics.tunggakan_juli_okt.total_tersalurkan),
                  color: '#10B981',
                },
                {
                  label: 'Tunggakan',
                  value: formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan),
                  color: '#FDA4AF',
                },
              ]}
            />
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNum={4} label="Tanggungan Per Bulan Oktober">
        <h2 className="font-display-headwood text-2xl font-bold mb-4">
          💼 Total Tanggungan Kafalah Dai Sekarang per Bulan (Oktober)
        </h2>
        <div className="grid grid-cols-12 gap-4 items-stretch">
          <div className="col-span-7 grid gap-3">
            <div className="rounded-xl bg-blue-700 p-5 text-white">
              <p className="text-xs font-semibold text-blue-100">💼 Total Tanggungan per Bulan</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {formatRupiah(metrics.tanggungan_per_bulan.total)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 p-4">
                <p className="text-xs font-bold text-indigo-800">🕌 Dai Lama</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(metrics.tanggungan_per_bulan.dai_lama)}
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4">
                <p className="text-xs font-bold text-sky-800">🌱 Dai Baru</p>
                <p className="mt-1 text-xl font-bold tabular-nums">
                  {formatRupiah(metrics.tanggungan_per_bulan.dai_baru)}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-5">
            <DonutChart
              title="⚖️ Komposisi Beban Bulanan"
              centerValue={formatPercent(
                metrics.tanggungan_per_bulan.dai_baru,
                metrics.tanggungan_per_bulan.total
              )}
              centerLabel="Dai Baru"
              primaryPct={metrics.tanggungan_per_bulan.persen_dai_baru}
              primaryColor="#2563EB"
              secondaryColor="#818CF8"
              legend={[
                {
                  label: 'Dai Baru',
                  value: formatRupiah(metrics.tanggungan_per_bulan.dai_baru),
                  color: '#2563EB',
                },
                {
                  label: 'Dai Lama',
                  value: formatRupiah(metrics.tanggungan_per_bulan.dai_lama),
                  color: '#818CF8',
                },
              ]}
            />
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNum={5} label="Update Kumulatif">
        <h2 className="font-display-headwood text-2xl font-bold mb-4">
          💰 {data.kumulatif.judul_periode}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-300 bg-white/85 p-5">
            <p className="text-xs font-bold text-slate-600">📘 Total Kebutuhan</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatRupiah(metrics.kumulatif.total_kebutuhan)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 p-5">
            <p className="text-xs font-bold text-emerald-700">💚 Total Dana Masuk</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
              {formatRupiah(metrics.kumulatif.total_dana_masuk)}
            </p>
            <p className="mt-1 text-xs tabular-nums">
              {formatPercent(
                metrics.kumulatif.total_dana_masuk,
                metrics.kumulatif.total_kebutuhan
              )}
            </p>
          </div>
          <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-5">
            <p className="text-xs font-bold text-rose-700">📌 Total Sisa</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-rose-700">
              {formatRupiah(metrics.kumulatif.total_sisa)}
            </p>
            <p className="mt-1 text-xs tabular-nums">
              {formatPercent(
                metrics.kumulatif.total_sisa,
                metrics.kumulatif.total_kebutuhan
              )}
            </p>
          </div>
        </div>
      </PageFrame>

      <PageFrame pageNum={6} label="Analisis Rekapitulasi">
        <h2 className="font-display-headwood text-2xl font-bold mb-2">
          📈 {data.analisis.judul}
        </h2>
        <p className="text-xs font-medium leading-relaxed mb-3">
          {data.analisis.ringkasan_utama}
        </p>
        <MonthlyRekapChart />
        <ul className="mt-3 grid grid-cols-2 gap-2 text-[11px] leading-snug">
          {data.analisis.poin_analisis.map((pt, idx) => (
            <li key={idx} className="rounded-lg border border-slate-200 bg-white/80 p-2.5">
              • {pt}
            </li>
          ))}
        </ul>
      </PageFrame>

      <PageFrame pageNum={7} label="Penutup">
        <div className="grid grid-cols-12 items-center gap-6">
          <div className="col-span-7 space-y-3">
            <p className="text-xs font-bold text-blue-700">🤝 Penutup &amp; Kesimpulan</p>
            <h2 className="font-display-headwood text-3xl font-bold">{data.judul_penutup}</h2>
            <p className="text-sm leading-relaxed opacity-85">{data.kalimat_penutup}</p>
          </div>
          <div className="col-span-5 grid gap-2.5 text-xs">
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5">
              <p className="font-bold text-rose-700">1️⃣ Prioritas Tunggakan Oktober</p>
              <p className="mt-1 tabular-nums">{formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5">
              <p className="font-bold text-blue-800">2️⃣ Stabilitas 353 Dai Aktif</p>
              <p className="mt-1 tabular-nums">{formatRupiah(metrics.tanggungan_per_bulan.total)} / bulan</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5">
              <p className="font-bold text-emerald-700">3️⃣ Akselerasi Penghimpunan</p>
              <p className="mt-1 tabular-nums">Target gap {formatRupiah(metrics.kumulatif.total_sisa)}</p>
            </div>
          </div>
        </div>
      </PageFrame>
    </section>
  );
};
