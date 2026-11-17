import PptxGenJS from 'pptxgenjs';
import { KafalahDeckData, PortalDeckEntry } from '../types/presentation';
import { computeKafalahMetrics, formatPercent, formatRupiah } from './calculations';

function normalizeHex(hex: string, fallback: string): string {
  const cleaned = (hex || '').trim().replace('#', '');
  if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^[0-9A-Fa-f]{3}$/.test(cleaned)) {
    return cleaned
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase();
  }
  return fallback;
}

export async function exportKafalahDeckToPptx(
  brandName: string,
  deck: PortalDeckEntry,
  data: KafalahDeckData
): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = brandName || 'Wadah Digital';
  pptx.title = deck.deck_title || data.judul_cover;

  const metrics = computeKafalahMetrics(data);
  const bgHex = normalizeHex(data.tema.warna_latar_awal, 'F8FAFC');
  const textHex = normalizeHex(data.tema.warna_teks, '0F172A');
  const accentHex = normalizeHex(data.tema.warna_aksen, '1D4ED8');
  const totalPages = 7;

  const addHeaderFooter = (s: PptxGenJS.Slide, pageNum: number, sectionLabel: string) => {
    s.background = { color: bgHex };
    s.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y: 0.42,
      w: 0.65,
      h: 0.06,
      fill: { color: accentHex },
      line: { width: 0 },
    });
    s.addText(`${brandName || 'Wadah Digital'}  ·  ${sectionLabel}`, {
      x: 0.7,
      y: 0.56,
      w: 9.5,
      h: 0.28,
      fontFace: 'Montserrat',
      fontSize: 10,
      color: accentHex,
      bold: true,
    });
    s.addText(`${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, {
      x: 11.2,
      y: 0.56,
      w: 1.4,
      h: 0.28,
      fontFace: 'Montserrat',
      fontSize: 10,
      color: textHex,
      align: 'right',
    });
    s.addShape(pptx.ShapeType.line, {
      x: 0.7,
      y: 6.72,
      w: 11.9,
      h: 0,
      line: { color: textHex, width: 0.5, transparency: 80 },
    });
    s.addText(data.catatan_kaki || deck.deck_title, {
      x: 0.7,
      y: 6.82,
      w: 11.9,
      h: 0.35,
      fontFace: 'Montserrat',
      fontSize: 9.5,
      color: textHex,
      transparency: 35,
    });
  };

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 1, deck.sheet_name);
    s.addText(data.judul_cover, {
      x: 0.7,
      y: 1.65,
      w: 11.8,
      h: 1.8,
      fontFace: 'Georgia',
      fontSize: 34,
      bold: true,
      color: textHex,
    });
    s.addText(data.subjudul_cover, {
      x: 0.7,
      y: 3.55,
      w: 11.2,
      h: 1.1,
      fontFace: 'Montserrat',
      fontSize: 15,
      color: textHex,
      transparency: 20,
    });
    s.addText(data.catatan_cover, {
      x: 0.7,
      y: 5.55,
      w: 11.2,
      h: 0.4,
      fontFace: 'Montserrat',
      fontSize: 11,
      bold: true,
      color: accentHex,
    });
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 2, 'Progres Pencairan Kafalah');
    s.addText('Progres Pencairan Kafalah Dai Lama & Dai Baru', {
      x: 0.7,
      y: 0.95,
      w: 11.9,
      h: 0.6,
      fontFace: 'Georgia',
      fontSize: 23,
      bold: true,
      color: textHex,
    });

    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Periode / Kategori', options: { bold: true, fill: { color: 'E2E8F0' }, color: textHex } },
        { text: 'Total Kebutuhan', options: { bold: true, fill: { color: 'E2E8F0' }, color: textHex, align: 'right' } },
        { text: 'Tersalurkan', options: { bold: true, fill: { color: 'E2E8F0' }, color: textHex, align: 'right' } },
        { text: 'Sisa', options: { bold: true, fill: { color: 'E2E8F0' }, color: textHex, align: 'right' } },
        { text: 'Realisasi', options: { bold: true, fill: { color: 'E2E8F0' }, color: textHex, align: 'right' } },
      ],
      ...metrics.rows_progres.map((row) => [
        { text: `${row.bulan} (${row.kategori})`, options: { color: textHex } },
        { text: formatRupiah(row.total), options: { color: textHex, align: 'right' as const } },
        { text: formatRupiah(row.tersalurkan), options: { color: '047857', align: 'right' as const } },
        { text: formatRupiah(row.sisa), options: { color: row.sisa > 0 ? 'B91C1C' : textHex, align: 'right' as const } },
        {
          text: `${formatPercent(row.tersalurkan, row.total)} / Sisa ${formatPercent(row.sisa, row.total)}`,
          options: { color: textHex, align: 'right' as const },
        },
      ]),
      [
        { text: 'Kafalah Oktober (Dai Lama)', options: { color: textHex } },
        { text: formatRupiah(metrics.okt_lama.total), options: { color: textHex, align: 'right' as const } },
        { text: formatRupiah(metrics.okt_lama.tersalurkan), options: { color: textHex, align: 'right' as const } },
        { text: formatRupiah(metrics.okt_lama.sisa), options: { color: 'B91C1C', bold: true, align: 'right' as const } },
        {
          text: `${formatPercent(metrics.okt_lama.tersalurkan, metrics.okt_lama.total)} / Sisa ${formatPercent(metrics.okt_lama.sisa, metrics.okt_lama.total)}`,
          options: { color: 'B91C1C', align: 'right' as const },
        },
      ],
      [
        { text: 'Kafalah Oktober (Dai Baru)', options: { color: textHex } },
        { text: formatRupiah(metrics.okt_baru.total), options: { color: textHex, align: 'right' as const } },
        { text: formatRupiah(metrics.okt_baru.tersalurkan), options: { color: '047857', align: 'right' as const } },
        { text: formatRupiah(metrics.okt_baru.sisa), options: { color: 'B91C1C', bold: true, align: 'right' as const } },
        {
          text: `${formatPercent(metrics.okt_baru.tersalurkan, metrics.okt_baru.total)} / Sisa ${formatPercent(metrics.okt_baru.sisa, metrics.okt_baru.total)}`,
          options: { color: textHex, align: 'right' as const },
        },
      ],
    ];

    s.addTable(tableRows, {
      x: 0.7,
      y: 1.75,
      w: 11.9,
      fontFace: 'Montserrat',
      fontSize: 11.5,
      border: { type: 'solid', pt: 0.6, color: 'CBD5E1' },
      rowH: 0.72,
      valign: 'middle',
    });
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 3, 'Total Tunggakan Juli – Oktober');
    s.addText('Total Tunggakan Belum Terbayarkan (Juli – Oktober)', {
      x: 0.7,
      y: 1.0,
      w: 11.9,
      h: 0.65,
      fontFace: 'Georgia',
      fontSize: 24,
      bold: true,
      color: textHex,
    });
    s.addText(
      [
        { text: 'Total Tunggakan Belum Terbayarkan:\n', options: { fontSize: 14, color: textHex, bold: true } },
        {
          text: `${formatRupiah(metrics.tunggakan_juli_okt.total_tunggakan)} (${formatPercent(metrics.tunggakan_juli_okt.total_tunggakan, metrics.tunggakan_juli_okt.total_kebutuhan)})\n\n`,
          options: { fontSize: 30, color: 'B91C1C', bold: true },
        },
        {
          text: `• Total Kebutuhan Juli–Oktober: ${formatRupiah(metrics.tunggakan_juli_okt.total_kebutuhan)}\n`,
          options: { fontSize: 15, color: textHex },
        },
        {
          text: `• Total Tersalurkan Juli–Oktober: ${formatRupiah(metrics.tunggakan_juli_okt.total_tersalurkan)} (${formatPercent(metrics.tunggakan_juli_okt.total_tersalurkan, metrics.tunggakan_juli_okt.total_kebutuhan)})\n`,
          options: { fontSize: 15, color: '047857' },
        },
        {
          text: `• Rincian Tunggakan: Juli–September Rp0 (lunas 100%), Oktober Dai Lama ${formatRupiah(metrics.okt_lama.sisa)}, Oktober Dai Baru ${formatRupiah(metrics.okt_baru.sisa)}`,
          options: { fontSize: 14, color: textHex },
        },
      ],
      { x: 0.7, y: 2.0, w: 11.8, h: 4.1, fontFace: 'Montserrat', valign: 'top' }
    );
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 4, 'Tanggungan Bulanan Kafalah');
    s.addText('Total Tanggungan Kafalah Dai Sekarang per Bulan (Oktober)', {
      x: 0.7,
      y: 1.0,
      w: 11.9,
      h: 0.65,
      fontFace: 'Georgia',
      fontSize: 24,
      bold: true,
      color: textHex,
    });
    s.addText(
      [
        { text: 'Total Tanggungan per Bulan:\n', options: { fontSize: 14, color: textHex, bold: true } },
        {
          text: `${formatRupiah(metrics.tanggungan_per_bulan.total)}\n\n`,
          options: { fontSize: 30, color: accentHex, bold: true },
        },
        {
          text: `• Dai Lama: ${formatRupiah(metrics.tanggungan_per_bulan.dai_lama)} (${formatPercent(metrics.tanggungan_per_bulan.dai_lama, metrics.tanggungan_per_bulan.total)})\n`,
          options: { fontSize: 16, color: textHex },
        },
        {
          text: `• Dai Baru: ${formatRupiah(metrics.tanggungan_per_bulan.dai_baru)} (${formatPercent(metrics.tanggungan_per_bulan.dai_baru, metrics.tanggungan_per_bulan.total)})\n`,
          options: { fontSize: 16, color: textHex },
        },
        {
          text: `• Sisa yang masih harus dipenuhi pada Oktober: ${formatRupiah(metrics.tanggungan_per_bulan.sisa_berjalan_okt)}`,
          options: { fontSize: 14, color: 'B91C1C' },
        },
      ],
      { x: 0.7, y: 2.0, w: 11.8, h: 4.1, fontFace: 'Montserrat', valign: 'top' }
    );
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 5, 'Update Kafalah Kumulatif');
    s.addText(data.kumulatif.judul_periode, {
      x: 0.7,
      y: 1.0,
      w: 11.9,
      h: 0.7,
      fontFace: 'Georgia',
      fontSize: 24,
      bold: true,
      color: textHex,
    });
    s.addText(
      [
        { text: `• Total Kebutuhan Dana: ${formatRupiah(metrics.kumulatif.total_kebutuhan)} (100%)\n`, options: { fontSize: 18, color: textHex, bold: true } },
        { text: `• Total Dana Masuk: ${formatRupiah(metrics.kumulatif.total_dana_masuk)} (${formatPercent(metrics.kumulatif.total_dana_masuk, metrics.kumulatif.total_kebutuhan)})\n`, options: { fontSize: 18, color: '047857', bold: true } },
        { text: `• Total Sisa Kekurangan: ${formatRupiah(metrics.kumulatif.total_sisa)} (${formatPercent(metrics.kumulatif.total_sisa, metrics.kumulatif.total_kebutuhan)})`, options: { fontSize: 18, color: 'B91C1C', bold: true } },
      ],
      { x: 0.7, y: 2.35, w: 11.8, h: 3.4, fontFace: 'Montserrat', paraSpaceAfter: 16, valign: 'top' }
    );
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 6, 'Analisis Rekapitulasi');
    s.addText(data.analisis.judul, {
      x: 0.7,
      y: 0.95,
      w: 11.9,
      h: 0.6,
      fontFace: 'Georgia',
      fontSize: 23,
      bold: true,
      color: textHex,
    });
    s.addText(data.analisis.ringkasan_utama, {
      x: 0.7,
      y: 1.65,
      w: 11.9,
      h: 1.15,
      fontFace: 'Montserrat',
      fontSize: 13.5,
      color: textHex,
      bold: true,
    });
    const bullets = data.analisis.poin_analisis.map((pt) => ({
      text: pt,
      options: {
        bullet: { code: '2022', color: accentHex },
        color: textHex,
        fontFace: 'Montserrat',
        fontSize: 13,
        paraSpaceAfter: 10,
      },
    }));
    s.addText(bullets, { x: 0.7, y: 2.95, w: 11.9, h: 3.5, valign: 'top' });
  }

  {
    const s = pptx.addSlide();
    addHeaderFooter(s, 7, 'Penutup & Kesimpulan');
    s.addText(data.judul_penutup, {
      x: 0.7,
      y: 1.8,
      w: 11.8,
      h: 1.3,
      fontFace: 'Georgia',
      fontSize: 30,
      bold: true,
      color: textHex,
    });
    s.addText(data.kalimat_penutup, {
      x: 0.7,
      y: 3.3,
      w: 11.5,
      h: 2.0,
      fontFace: 'Montserrat',
      fontSize: 16,
      color: textHex,
      transparency: 15,
    });
  }

  const safeBase = (deck.export_filename || `Slide_${deck.slide_id}`)
    .replace(/\.pptx$/i, '')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '_')
    .trim()
    .replace(/\s+/g, '_');

  const finalFilename = `${safeBase || 'Presentasi'}.pptx`;
  await pptx.writeFile({ fileName: finalFilename });
  return finalFilename;
}
