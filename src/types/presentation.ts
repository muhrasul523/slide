export interface GlobalConfig {
  active_slide_id: string;
  brand_name: string;
  public_is_protected: boolean;
  public_access_code: string;
  admin_is_protected: boolean;
  admin_access_code: string;
}

export interface PortalDeckEntry {
  slide_id: string;
  sheet_name: string;
  deck_title: string;
  subjudul: string;
  export_filename: string;
  periode_label: string;
}

export interface KafalahMonthSimple {
  bulan: string;
  total: number;
  tersalurkan: number;
  keterangan: string;
}

export interface KafalahOktoberData {
  total_dai_lama: number;
  total_dai_baru: number;
  tersalurkan_dai_lama: number;
  tersalurkan_dai_baru: number;
}

export interface KafalahKumulatifData {
  judul_periode: string;
  total_kebutuhan: number;
  total_dana_masuk: number;
}

export interface KafalahAnalisisData {
  judul: string;
  subjudul: string;
  gambar_url: string;
  ringkasan_utama: string;
  poin_analisis: string[];
}

export interface DeckThemeColors {
  warna_latar_awal: string;
  warna_latar_akhir: string;
  warna_teks: string;
  warna_aksen: string;
}

export interface KafalahDeckData {
  slide_id: string;
  judul_cover: string;
  subjudul_cover: string;
  catatan_cover: string;
  juli: KafalahMonthSimple;
  agustus: KafalahMonthSimple;
  september: KafalahMonthSimple;
  oktober: KafalahOktoberData;
  kumulatif: KafalahKumulatifData;
  analisis: KafalahAnalisisData;
  judul_penutup: string;
  kalimat_penutup: string;
  catatan_kaki: string;
  tema: DeckThemeColors;
}

export interface ComputedMonthRow {
  bulan: string;
  kategori: string;
  total: number;
  tersalurkan: number;
  sisa: number;
  persen_tersalurkan: number;
  persen_sisa: number;
}

export interface ComputedKafalahMetrics {
  rows_progres: ComputedMonthRow[];
  okt_lama: ComputedMonthRow;
  okt_baru: ComputedMonthRow;
  okt_gabungan: ComputedMonthRow;
  tunggakan_juli_okt: {
    total_kebutuhan: number;
    total_tersalurkan: number;
    total_tunggakan: number;
    persen_tersalurkan: number;
    persen_tunggakan: number;
  };
  tanggungan_per_bulan: {
    dai_lama: number;
    dai_baru: number;
    total: number;
    persen_dai_lama: number;
    persen_dai_baru: number;
    sisa_berjalan_okt: number;
  };
  kumulatif: {
    total_kebutuhan: number;
    total_dana_masuk: number;
    total_sisa: number;
    persen_terpenuhi: number;
    persen_sisa: number;
  };
}

export interface GasPublicResponse {
  ok: boolean;
  mode: 'public';
  locked: boolean;
  error?: string;
  brand_name: string;
  public_is_protected: boolean;
  active_deck?: PortalDeckEntry;
  data?: KafalahDeckData;
}

export interface GasAdminResponse {
  ok: boolean;
  mode: 'admin';
  locked: boolean;
  error?: string;
  config: Omit<GlobalConfig, 'public_access_code' | 'admin_access_code'>;
  decks?: PortalDeckEntry[];
  slides_data?: Record<string, KafalahDeckData>;
}
