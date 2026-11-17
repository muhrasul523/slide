import { GlobalConfig, KafalahDeckData, PortalDeckEntry } from '../types/presentation';

export const PORTAL_DOMAIN = 'slide.wadahdigital.my.id';
export const REKAP_IMAGE_PATH = `${import.meta.env.BASE_URL}assets/aistudio/IMG-20261117-WA0001_6ebb01a8.jpg`;

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  active_slide_id: '1',
  brand_name: 'Wadah Digital',
  public_is_protected: false,
  public_access_code: 'WADAH2026',
  admin_is_protected: true,
  admin_access_code: 'ADMIN2026',
};

export const DEFAULT_PORTAL_DECKS: PortalDeckEntry[] = [
  {
    slide_id: '1',
    sheet_name: 'Slide 1',
    deck_title: 'Laporan Progres Pencairan & Analisis Kafalah Dai',
    subjudul:
      'Progres Pencairan Juli–Oktober, Total Tunggakan, Tanggungan Bulanan, dan Rekapitulasi Dana Masuk.',
    export_filename: 'Laporan_Kafalah_Dai_Slide_1',
    periode_label: 'Juli – Oktober · 7 Halaman',
  },
];

export const DEFAULT_SLIDE1_DATA: KafalahDeckData = {
  slide_id: '1',
  judul_cover: 'Laporan Progres Pencairan & Analisis Kebutuhan Kafalah Dai',
  subjudul_cover:
    'Evaluasi menyeluruh realisasi penyaluran kafalah dai lama dan dai baru periode Juli hingga Oktober, beserta proyeksi tanggungan berjalan.',
  catatan_cover: 'Presentasi Resmi · slide.wadahdigital.my.id',
  juli: {
    bulan: 'Kafalah Juli',
    total: 447430000,
    tersalurkan: 447430000,
    keterangan: 'Semua Dai Lama',
  },
  agustus: {
    bulan: 'Kafalah Agustus',
    total: 444800000,
    tersalurkan: 444800000,
    keterangan: 'Semua Dai Lama',
  },
  september: {
    bulan: 'Kafalah September',
    total: 412578000,
    tersalurkan: 412578000,
    keterangan: 'Semua Dai Lama',
  },
  oktober: {
    total_dai_lama: 192097000,
    total_dai_baru: 289050000,
    tersalurkan_dai_lama: 0,
    tersalurkan_dai_baru: 71508500,
  },
  kumulatif: {
    judul_periode: 'Update Kafalah Kumulatif (Sesuai Tabel Rekapitulasi)',
    total_kebutuhan: 5790835000,
    total_dana_masuk: 4117250000,
  },
  analisis: {
    judul: 'Analisis Kebutuhan Bulanan vs Dana Masuk',
    subjudul:
      'Rangkuman perbandingan kebutuhan kafalah dan realisasi dana masuk berdasarkan tabel rekapitulasi 14 periode.',
    gambar_url: REKAP_IMAGE_PATH,
    ringkasan_utama:
      'Dari total kebutuhan Rp5,79 miliar (14 entri bulan), dana masuk mencapai Rp4,12 miliar (71,10%) sehingga masih terdapat kekurangan kumulatif Rp1,67 miliar (28,90%). Beban kebutuhan aktif berkisar Rp412,58 juta hingga Rp480,48 juta per bulan seiring penambahan jumlah dai hingga 353 dai pada Oktober.',
    poin_analisis: [
      'Hanya 2 bulan aktif mencatat surplus dana masuk: Januari (+Rp82.811.000) dan Maret (+Rp320.360.000), sedangkan 10 bulan berjalan lainnya mengalami defisit.',
      'Defisit bulanan terbesar terjadi pada Desember (Rp401.507.000) dan Agustus (Rp319.800.000) akibat penerimaan dana masuk jauh di bawah kebutuhan 227–249 dai.',
      'Lonjakan jumlah penerima pada Oktober menjadi 353 dai mendorong kebutuhan bulan tersebut naik ke Rp480.482.000, dengan dana masuk Rp315.000.000 (sisa Rp165.482.000).',
      'Terdapat dana masuk awal periode berikutnya sebesar Rp185.000.000 yang berstatus surplus untuk membantu menutup tunggakan berjalan.',
    ],
  },
  judul_penutup: 'Sinergi Berkelanjutan untuk Ketahanan Kafalah Dai',
  kalimat_penutup:
    'Dengan percepatan penghimpunan dana untuk menutup tunggakan Rp409.638.500 pada periode Oktober serta efisiensi alokasi bagi 353 dai aktif, stabilitas penyaluran kafalah bulan berikutnya dapat terjaga secara optimal.',
  catatan_kaki: 'Wadah Digital · Disajikan dari Google Sheets Terintegrasi',
  tema: {
    warna_latar_awal: '#F8FAFC',
    warna_latar_akhir: '#E6EEF8',
    warna_teks: '#0F172A',
    warna_aksen: '#1D4ED8',
  },
};

export function createNewDeckTemplate(nextId: string): {
  portalEntry: PortalDeckEntry;
  deckData: KafalahDeckData;
} {
  const portalEntry: PortalDeckEntry = {
    slide_id: nextId,
    sheet_name: `Slide ${nextId}`,
    deck_title: `Laporan Presentasi Slide ${nextId}`,
    subjudul:
      'Draft data presentasi baru yang siap diisi dan diaktifkan melalui halaman Admin.',
    export_filename: `Laporan_Kafalah_Slide_${nextId}`,
    periode_label: 'Periode Baru · 7 Halaman',
  };

  const deckData: KafalahDeckData = {
    ...DEFAULT_SLIDE1_DATA,
    slide_id: nextId,
    judul_cover: `Laporan Presentasi Dinamis — Slide ${nextId}`,
    subjudul_cover:
      'Data pada file slide ini berdiri di sheet terpisah tanpa mengubah data Slide 1 sebelumnya.',
    catatan_cover: `Presentasi Resmi · ${PORTAL_DOMAIN}`,
  };

  return { portalEntry, deckData };
}
