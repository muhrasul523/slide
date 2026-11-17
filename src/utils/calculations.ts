import {
  ComputedKafalahMetrics,
  ComputedMonthRow,
  KafalahDeckData,
} from '../types/presentation';

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return 'Rp' + safe.toLocaleString('id-ID');
}

export function formatPercent(part: number, total: number): string {
  if (!total || total <= 0) return '0%';
  const pct = (part / total) * 100;
  return (
    pct.toLocaleString('id-ID', {
      minimumFractionDigits: pct % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }) + '%'
  );
}

function buildRow(
  bulan: string,
  kategori: string,
  total: number,
  tersalurkan: number
): ComputedMonthRow {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeTersalurkan = Math.max(0, Math.min(safeTotal, Number(tersalurkan) || 0));
  const sisa = Math.max(0, safeTotal - safeTersalurkan);
  const persen_tersalurkan = safeTotal > 0 ? (safeTersalurkan / safeTotal) * 100 : 0;
  const persen_sisa = safeTotal > 0 ? (sisa / safeTotal) * 100 : 0;

  return {
    bulan,
    kategori,
    total: safeTotal,
    tersalurkan: safeTersalurkan,
    sisa,
    persen_tersalurkan,
    persen_sisa,
  };
}

export function computeKafalahMetrics(data: KafalahDeckData): ComputedKafalahMetrics {
  const juliRow = buildRow(
    data.juli.bulan,
    data.juli.keterangan,
    data.juli.total,
    data.juli.tersalurkan
  );
  const agustusRow = buildRow(
    data.agustus.bulan,
    data.agustus.keterangan,
    data.agustus.total,
    data.agustus.tersalurkan
  );
  const septemberRow = buildRow(
    data.september.bulan,
    data.september.keterangan,
    data.september.total,
    data.september.tersalurkan
  );

  const oktLama = buildRow(
    'Oktober',
    'Dai Lama',
    data.oktober.total_dai_lama,
    data.oktober.tersalurkan_dai_lama
  );
  const oktBaru = buildRow(
    'Oktober',
    'Dai Baru',
    data.oktober.total_dai_baru,
    data.oktober.tersalurkan_dai_baru
  );
  const oktGabungan = buildRow(
    'Oktober',
    'Total Gabungan',
    oktLama.total + oktBaru.total,
    oktLama.tersalurkan + oktBaru.tersalurkan
  );

  const totalKebutuhanJuliOkt =
    juliRow.total + agustusRow.total + septemberRow.total + oktGabungan.total;
  const totalTersalurkanJuliOkt =
    juliRow.tersalurkan +
    agustusRow.tersalurkan +
    septemberRow.tersalurkan +
    oktGabungan.tersalurkan;
  const totalTunggakanJuliOkt = Math.max(
    0,
    totalKebutuhanJuliOkt - totalTersalurkanJuliOkt
  );

  const tanggunganTotal = oktLama.total + oktBaru.total;

  const kumTotal = Math.max(0, Number(data.kumulatif.total_kebutuhan) || 0);
  const kumMasuk = Math.max(0, Number(data.kumulatif.total_dana_masuk) || 0);
  const kumSisa = Math.max(0, kumTotal - kumMasuk);

  return {
    rows_progres: [juliRow, agustusRow, septemberRow],
    okt_lama: oktLama,
    okt_baru: oktBaru,
    okt_gabungan: oktGabungan,
    tunggakan_juli_okt: {
      total_kebutuhan: totalKebutuhanJuliOkt,
      total_tersalurkan: totalTersalurkanJuliOkt,
      total_tunggakan: totalTunggakanJuliOkt,
      persen_tersalurkan:
        totalKebutuhanJuliOkt > 0
          ? (totalTersalurkanJuliOkt / totalKebutuhanJuliOkt) * 100
          : 0,
      persen_tunggakan:
        totalKebutuhanJuliOkt > 0
          ? (totalTunggakanJuliOkt / totalKebutuhanJuliOkt) * 100
          : 0,
    },
    tanggungan_per_bulan: {
      dai_lama: oktLama.total,
      dai_baru: oktBaru.total,
      total: tanggunganTotal,
      persen_dai_lama: tanggunganTotal > 0 ? (oktLama.total / tanggunganTotal) * 100 : 0,
      persen_dai_baru: tanggunganTotal > 0 ? (oktBaru.total / tanggunganTotal) * 100 : 0,
      sisa_berjalan_okt: oktGabungan.sisa,
    },
    kumulatif: {
      total_kebutuhan: kumTotal,
      total_dana_masuk: kumMasuk,
      total_sisa: kumSisa,
      persen_terpenuhi: kumTotal > 0 ? (kumMasuk / kumTotal) * 100 : 0,
      persen_sisa: kumTotal > 0 ? (kumSisa / kumTotal) * 100 : 0,
    },
  };
}
