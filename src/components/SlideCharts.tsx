import React from 'react';
import { ComputedMonthRow } from '../types/presentation';
import { formatPercent, formatRupiah } from '../utils/calculations';

export const ProgressBarChart: React.FC<{
  rows: ComputedMonthRow[];
}> = ({ rows }) => {
  const maxVal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-indigo-200/70 bg-white/80 p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-900">
          📊 Grafik Realisasi vs Sisa
        </p>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-emerald-500" />
            Tersalurkan
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-rose-500" />
            Sisa
          </span>
        </div>
      </div>

      <div className="my-auto space-y-2.5 pt-2">
        {rows.map((r, i) => {
          const totalWidthPct = (r.total / maxVal) * 100;
          const paidShare = r.total > 0 ? (r.tersalurkan / r.total) * 100 : 0;
          const label =
            r.bulan === 'Oktober' ? `Okt · ${r.kategori}` : r.bulan.replace('Kafalah ', '');

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>{label}</span>
                <span className="tabular-nums text-slate-500">
                  {formatPercent(r.tersalurkan, r.total)} cair
                </span>
              </div>
              <div className="h-4 w-full rounded-md bg-slate-100 overflow-hidden p-0.5">
                <div
                  className="flex h-full overflow-hidden rounded-sm transition-all"
                  style={{ width: `${Math.max(4, totalWidthPct)}%` }}
                >
                  {paidShare > 0 && (
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${paidShare}%` }}
                    />
                  )}
                  {paidShare < 100 && (
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${100 - paidShare}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-medium text-slate-500">
        Skala batang proporsional terhadap total kebutuhan tiap kategori.
      </p>
    </div>
  );
};

export const DonutChart: React.FC<{
  title: string;
  centerValue: string;
  centerLabel: string;
  primaryPct: number;
  primaryColor: string;
  secondaryColor: string;
  legend: { label: string; value: string; color: string }[];
}> = ({
  title,
  centerValue,
  centerLabel,
  primaryPct,
  primaryColor,
  secondaryColor,
  legend,
}) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, primaryPct));
  const strokeDash = (clamped / 100) * circumference;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-xs">
      <p className="text-xs font-bold text-slate-900">{title}</p>

      <div className="my-auto flex items-center justify-center py-2">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="14"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={primaryColor}
              strokeWidth="14"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tabular-nums text-slate-900">
              {centerValue}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {centerLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-slate-200/70 pt-2.5">
        {legend.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-[11px] font-medium"
          >
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const REKAP_14_BULAN = [
  { bln: 'Okt25', keb: 313.7, msk: 0 },
  { bln: 'Nov', keb: 477.4, msk: 260 },
  { bln: 'Des', keb: 461.5, msk: 60 },
  { bln: 'Jan', keb: 478.7, msk: 561.5 },
  { bln: 'Feb', keb: 465.3, msk: 300 },
  { bln: 'Mar', keb: 429.6, msk: 750 },
  { bln: 'Apr', keb: 459.4, msk: 450 },
  { bln: 'Mei', keb: 467.6, msk: 310 },
  { bln: 'Jun', keb: 452.4, msk: 320 },
  { bln: 'Jul', keb: 447.4, msk: 240 },
  { bln: 'Agt', keb: 444.8, msk: 125 },
  { bln: 'Sep', keb: 412.6, msk: 240.8 },
  { bln: 'Okt', keb: 480.5, msk: 315 },
  { bln: 'Nov26', keb: 0, msk: 185 },
];

export const MonthlyRekapChart: React.FC = () => {
  const maxY = 760;

  return (
    <div className="rounded-xl border border-blue-200/75 bg-white/85 p-3 shadow-xs">
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold">
        <span className="text-slate-800">📈 Perbandingan 14 Periode (Juta Rp)</span>
        <div className="flex items-center gap-2.5 text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-slate-400" />
            Kebutuhan
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-blue-600" />
            Dana Masuk
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-xs bg-emerald-500" />
            Surplus
          </span>
        </div>
      </div>

      <div className="flex h-20 items-end justify-between gap-1 pt-1">
        {REKAP_14_BULAN.map((d, idx) => {
          const kebH = Math.round((d.keb / maxY) * 100);
          const mskH = Math.round((d.msk / maxY) * 100);
          const isSurplus = d.msk > d.keb;
          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
              <div className="flex w-full items-end justify-center gap-[2px] h-full">
                <div
                  className="w-1.5 rounded-t-xs bg-slate-300"
                  style={{ height: `${Math.max(2, kebH)}%` }}
                  title={`${d.bln} Kebutuhan: ${formatRupiah(d.keb * 1000000)}`}
                />
                <div
                  className={`w-1.5 rounded-t-xs ${
                    isSurplus ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ height: `${Math.max(2, mskH)}%` }}
                  title={`${d.bln} Masuk: ${formatRupiah(d.msk * 1000000)}`}
                />
              </div>
              <span className="text-[8px] font-medium text-slate-500 leading-none">
                {d.bln}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
