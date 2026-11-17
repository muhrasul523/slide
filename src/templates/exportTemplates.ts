export const CODE_GS_TEMPLATE = `/**
 * Wadah Slide Studio — Google Apps Script Backend (Code.gs)
 * Arsitektur:
 * - Halaman Utama Publik (/): Menampilkan 1 file slide aktif (read-only) + kode akses publik.
 * - Halaman Admin (/admin): Mengelola seluruh daftar slide, memilih 1 slide aktif, & kode akses admin.
 *
 * Struktur Tab Google Sheets:
 * 1. "Config": active_slide_id, brand_name, public_is_protected, public_access_code,
 *    admin_is_protected, admin_access_code.
 * 2. "Daftar_Slide": Daftar file slide (slide_id, sheet_name, deck_title, subjudul, export_filename, periode_label).
 * 3. "Slide 1", "Slide 2", dst.: Data & rumus otomatis per file slide.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wadah Slide')
    .addItem('1. Setup Database Awal (Config + Daftar_Slide + Slide 1)', 'setupDatabaseAwal')
    .addItem('2. + Tambah File Slide Baru (Tanpa Ubah Sheet Lama)', 'tambahDatabaseSlideBaru')
    .addToUi();
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName('Config');
    var listSheet = ss.getSheetByName('Daftar_Slide');

    if (!configSheet || !listSheet) {
      return createJsonResponse({
        ok: false,
        error: 'Tab "Config" atau "Daftar_Slide" belum tersedia. Jalankan setupDatabaseAwal().'
      });
    }

    var config = parseGlobalConfig(configSheet);
    var decks = parseDaftarSlide(listSheet);
    var mode = (e && e.parameter && e.parameter.mode) ? String(e.parameter.mode).trim().toLowerCase() : 'public';
    var submittedCode = (e && e.parameter && e.parameter.code) ? String(e.parameter.code).trim() : '';

    // =========================================================================
    // MODE ADMIN (/admin)
    // =========================================================================
    if (mode === 'admin') {
      var publicAdminConfig = {
        active_slide_id: config.active_slide_id,
        brand_name: config.brand_name,
        public_is_protected: config.public_is_protected,
        admin_is_protected: config.admin_is_protected
      };

      if (config.admin_is_protected) {
        if (!submittedCode) {
          return createJsonResponse({
            ok: true,
            mode: 'admin',
            locked: true,
            config: publicAdminConfig
          });
        }
        if (submittedCode !== config.admin_access_code) {
          return createJsonResponse({
            ok: false,
            mode: 'admin',
            locked: true,
            error: 'Kode akses Admin tidak sesuai.',
            config: publicAdminConfig
          });
        }
      }

      var slidesMap = {};
      for (var i = 0; i < decks.length; i++) {
        var sSheet = ss.getSheetByName(decks[i].sheet_name);
        if (sSheet) {
          slidesMap[decks[i].slide_id] = parseKafalahSheet(sSheet, decks[i].slide_id);
        }
      }

      return createJsonResponse({
        ok: true,
        mode: 'admin',
        locked: false,
        config: publicAdminConfig,
        decks: decks,
        slides_data: slidesMap
      });
    }

    // =========================================================================
    // MODE PUBLIK (/) — Hanya menampilkan 1 file slide yang aktif
    // =========================================================================
    var activeDeck = null;
    for (var j = 0; j < decks.length; j++) {
      if (String(decks[j].slide_id) === String(config.active_slide_id)) {
        activeDeck = decks[j];
        break;
      }
    }
    if (!activeDeck && decks.length > 0) {
      activeDeck = decks[0];
    }

    if (config.public_is_protected) {
      if (!submittedCode) {
        return createJsonResponse({
          ok: true,
          mode: 'public',
          locked: true,
          brand_name: config.brand_name,
          public_is_protected: true,
          active_deck: activeDeck
        });
      }
      if (submittedCode !== config.public_access_code) {
        return createJsonResponse({
          ok: false,
          mode: 'public',
          locked: true,
          error: 'Kode akses presentasi tidak sesuai.',
          brand_name: config.brand_name,
          public_is_protected: true,
          active_deck: activeDeck
        });
      }
    }

    if (!activeDeck) {
      return createJsonResponse({
        ok: false,
        mode: 'public',
        locked: false,
        brand_name: config.brand_name,
        public_is_protected: config.public_is_protected,
        error: 'Belum ada file slide aktif di Daftar_Slide.'
      });
    }

    var activeSheet = ss.getSheetByName(activeDeck.sheet_name);
    var activeData = activeSheet ? parseKafalahSheet(activeSheet, activeDeck.slide_id) : null;

    return createJsonResponse({
      ok: true,
      mode: 'public',
      locked: false,
      brand_name: config.brand_name,
      public_is_protected: config.public_is_protected,
      active_deck: activeDeck,
      data: activeData
    });
  } catch (err) {
    return createJsonResponse({
      ok: false,
      error: 'Kesalahan Apps Script: ' + err.message
    });
  }
}

function parseGlobalConfig(sheet) {
  var rows = sheet.getDataRange().getValues();
  var map = {};
  for (var r = 0; r < rows.length; r++) {
    var k = String(rows[r][0] || '').trim().toLowerCase();
    if (!k || k === 'parameter') continue;
    map[k] = rows[r][1];
  }
  function toBool(v) {
    var s = String(v || '').trim().toLowerCase();
    return v === true || s === 'true' || s === 'ya' || s === '1';
  }
  return {
    active_slide_id: String(map.active_slide_id || '1').trim(),
    brand_name: String(map.brand_name || 'Wadah Digital').trim(),
    public_is_protected: toBool(map.public_is_protected),
    public_access_code: String(map.public_access_code || '').trim(),
    admin_is_protected: toBool(map.admin_is_protected),
    admin_access_code: String(map.admin_access_code || '').trim()
  };
}

function parseDaftarSlide(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (!rows || rows.length < 2) return [];
  var headers = rows[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var list = [];
  for (var r = 1; r < rows.length; r++) {
    if (!rows[r][0]) continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = rows[r][c];
    }
    list.push({
      slide_id: String(obj.slide_id || r).trim(),
      sheet_name: String(obj.sheet_name || ('Slide ' + r)).trim(),
      deck_title: String(obj.deck_title || ('Presentasi Slide ' + r)).trim(),
      subjudul: String(obj.subjudul || '').trim(),
      export_filename: String(obj.export_filename || ('Presentasi_Slide_' + r)).trim(),
      periode_label: String(obj.periode_label || '').trim()
    });
  }
  return list;
}

function parseKafalahSheet(sheet, slideId) {
  var rows = sheet.getDataRange().getValues();
  var map = {};
  for (var r = 0; r < rows.length; r++) {
    var key = String(rows[r][0] || '').trim().toLowerCase();
    if (!key || key === 'parameter') continue;
    map[key] = rows[r][1];
  }

  function toNum(v, fallback) {
    if (typeof v === 'number') return v;
    var cleaned = String(v || '').replace(/[^0-9.-]/g, '');
    var n = parseFloat(cleaned);
    return isNaN(n) ? fallback : n;
  }

  function toStr(v, fallback) {
    var s = String(v === undefined || v === null ? '' : v).trim();
    return s || fallback;
  }

  var rawPoin = toStr(map.analisis_poin, '');
  var poinList = rawPoin
    ? rawPoin.split(/\\r?\\n/).map(function (l) { return l.replace(/^[-•*]\\s*/, '').trim(); }).filter(Boolean)
    : [];

  return {
    slide_id: String(slideId),
    judul_cover: toStr(map.judul_cover, 'Laporan Progres Pencairan & Analisis Kafalah Dai'),
    subjudul_cover: toStr(map.subjudul_cover, ''),
    catatan_cover: toStr(map.catatan_cover, 'Presentasi Resmi · slide.wadahdigital.my.id'),
    juli: {
      bulan: toStr(map.juli_label, 'Kafalah Juli'),
      total: toNum(map.juli_total, 0),
      tersalurkan: toNum(map.juli_tersalurkan, 0),
      keterangan: toStr(map.juli_keterangan, 'Semua Dai Lama')
    },
    agustus: {
      bulan: toStr(map.agustus_label, 'Kafalah Agustus'),
      total: toNum(map.agustus_total, 0),
      tersalurkan: toNum(map.agustus_tersalurkan, 0),
      keterangan: toStr(map.agustus_keterangan, 'Semua Dai Lama')
    },
    september: {
      bulan: toStr(map.september_label, 'Kafalah September'),
      total: toNum(map.september_total, 0),
      tersalurkan: toNum(map.september_tersalurkan, 0),
      keterangan: toStr(map.september_keterangan, 'Semua Dai Lama')
    },
    oktober: {
      total_dai_lama: toNum(map.okt_lama_total, 0),
      total_dai_baru: toNum(map.okt_baru_total, 0),
      tersalurkan_dai_lama: toNum(map.okt_lama_tersalurkan, 0),
      tersalurkan_dai_baru: toNum(map.okt_baru_tersalurkan, 0)
    },
    kumulatif: {
      judul_periode: toStr(map.kumulatif_judul, 'Update Kafalah Kumulatif'),
      total_kebutuhan: toNum(map.kumulatif_kebutuhan, 0),
      total_dana_masuk: toNum(map.kumulatif_masuk, 0)
    },
    analisis: {
      judul: toStr(map.analisis_judul, 'Analisis Kebutuhan Bulanan vs Dana Masuk'),
      subjudul: toStr(map.analisis_subjudul, ''),
      gambar_url: toStr(map.analisis_gambar_url, ''),
      ringkasan_utama: toStr(map.analisis_ringkasan, ''),
      poin_analisis: poinList
    },
    judul_penutup: toStr(map.judul_penutup, 'Penutup & Kesimpulan'),
    kalimat_penutup: toStr(map.kalimat_penutup, ''),
    catatan_kaki: toStr(map.catatan_kaki, 'Wadah Digital'),
    tema: {
      warna_latar_awal: toStr(map.warna_latar_awal, '#F8FAFC'),
      warna_latar_akhir: toStr(map.warna_latar_akhir, '#E6EEF8'),
      warna_teks: toStr(map.warna_teks, '#0F172A'),
      warna_aksen: toStr(map.warna_aksen, '#1D4ED8')
    }
  };
}

/**
 * 1. SETUP DATABASE AWAL (Config + Daftar_Slide + Slide 1)
 */
function setupDatabaseAwal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config', 0);
    configSheet.getRange(1, 1, 7, 3).setValues([
      ['Parameter', 'Nilai', 'Keterangan'],
      ['active_slide_id', '1', 'Hanya 1 slide yang aktif ditampilkan di halaman utama /'],
      ['brand_name', 'Wadah Digital', 'Nama brand utama'],
      ['public_is_protected', false, 'TRUE = halaman utama publik meminta kode akses'],
      ['public_access_code', 'WADAH2026', 'Kode akses halaman utama (/)'],
      ['admin_is_protected', true, 'TRUE = halaman /admin meminta kode akses'],
      ['admin_access_code', 'ADMIN2026', 'Kode akses halaman admin (/admin)']
    ]);
    configSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
    configSheet.setFrozenRows(1);
    configSheet.autoResizeColumns(1, 3);
  }

  var listSheet = ss.getSheetByName('Daftar_Slide');
  if (!listSheet) {
    listSheet = ss.insertSheet('Daftar_Slide', 1);
    listSheet.getRange(1, 1, 2, 6).setValues([
      ['slide_id', 'sheet_name', 'deck_title', 'subjudul', 'export_filename', 'periode_label'],
      ['1', 'Slide 1', 'Laporan Progres Pencairan & Analisis Kafalah Dai', 'Progres Pencairan Juli–Oktober, Total Tunggakan, Tanggungan Bulanan, dan Rekapitulasi Dana Masuk.', 'Laporan_Kafalah_Dai_Slide_1', 'Juli – Oktober · 7 Halaman']
    ]);
    listSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
    listSheet.setFrozenRows(1);
    listSheet.autoResizeColumns(1, 6);
  }

  var slide1 = ss.getSheetByName('Slide 1');
  if (!slide1) {
    slide1 = ss.insertSheet('Slide 1', 2);
    isiTemplateDataSlide(slide1, 1, true);
  }
}

/**
 * 2. TAMBAH FILE SLIDE BARU (NON-DESTRUKTIF)
 * Menambahkan tab "Slide N" baru dan baris di "Daftar_Slide" tanpa mengubah sheet lama.
 */
function tambahDatabaseSlideBaru() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var listSheet = ss.getSheetByName('Daftar_Slide');

  if (!listSheet) {
    setupDatabaseAwal();
    return;
  }

  var rows = listSheet.getDataRange().getValues();
  var maxId = 0;
  for (var r = 1; r < rows.length; r++) {
    var n = parseInt(rows[r][0], 10);
    if (!isNaN(n) && n > maxId) maxId = n;
  }

  var nextId = maxId + 1;
  var newSheetName = 'Slide ' + nextId;
  while (ss.getSheetByName(newSheetName)) {
    nextId++;
    newSheetName = 'Slide ' + nextId;
  }

  listSheet.appendRow([
    String(nextId),
    newSheetName,
    'Laporan Presentasi Slide ' + nextId,
    'Draft file presentasi baru pada tab ' + newSheetName,
    'Laporan_Presentasi_Slide_' + nextId,
    'Periode Baru · 7 Halaman'
  ]);

  var newSheet = ss.insertSheet(newSheetName, ss.getSheets().length);
  isiTemplateDataSlide(newSheet, nextId, false);
}

function isiTemplateDataSlide(sheet, slideNumber, isSlide1Sample) {
  var rows = [
    ['Parameter', 'Nilai', 'Catatan / Rumus Otomatis'],
    ['judul_cover', isSlide1Sample ? 'Laporan Progres Pencairan & Analisis Kebutuhan Kafalah Dai' : ('Laporan Presentasi Dinamis — Slide ' + slideNumber), 'Halaman 1: Judul Utama'],
    ['subjudul_cover', 'Evaluasi menyeluruh realisasi penyaluran kafalah dai lama dan dai baru periode Juli hingga Oktober, beserta proyeksi tanggungan berjalan.', 'Halaman 1: Subjudul'],
    ['catatan_cover', 'Presentasi Resmi · slide.wadahdigital.my.id', 'Halaman 1: Catatan'],
    ['juli_label', 'Kafalah Juli', 'Halaman 2: Label Juli'],
    ['juli_keterangan', 'Semua Dai Lama', 'Kategori penerima'],
    ['juli_total', isSlide1Sample ? 447430000 : 0, 'Total kebutuhan Juli'],
    ['juli_tersalurkan', isSlide1Sample ? 447430000 : 0, 'Sudah tersalurkan Juli'],
    ['juli_sisa_auto', '=B7-B8', 'Otomatis: Sisa Juli'],
    ['juli_persen_auto', '=IF(B7>0,B8/B7,0)', 'Otomatis: % Tersalurkan Juli'],
    ['agustus_label', 'Kafalah Agustus', 'Halaman 2: Label Agustus'],
    ['agustus_keterangan', 'Semua Dai Lama', 'Kategori penerima'],
    ['agustus_total', isSlide1Sample ? 444800000 : 0, 'Total kebutuhan Agustus'],
    ['agustus_tersalurkan', isSlide1Sample ? 444800000 : 0, 'Sudah tersalurkan Agustus'],
    ['agustus_sisa_auto', '=B13-B14', 'Otomatis: Sisa Agustus'],
    ['agustus_persen_auto', '=IF(B13>0,B14/B13,0)', 'Otomatis: % Tersalurkan Agustus'],
    ['september_label', 'Kafalah September', 'Halaman 2: Label September'],
    ['september_keterangan', 'Semua Dai Lama', 'Kategori penerima'],
    ['september_total', isSlide1Sample ? 412578000 : 0, 'Total kebutuhan September'],
    ['september_tersalurkan', isSlide1Sample ? 412578000 : 0, 'Sudah tersalurkan September'],
    ['september_sisa_auto', '=B19-B20', 'Otomatis: Sisa September'],
    ['september_persen_auto', '=IF(B19>0,B20/B19,0)', 'Otomatis: % Tersalurkan September'],
    ['okt_lama_total', isSlide1Sample ? 192097000 : 0, 'Halaman 2 & 4: Total Oktober Dai Lama'],
    ['okt_baru_total', isSlide1Sample ? 289050000 : 0, 'Halaman 2 & 4: Total Oktober Dai Baru'],
    ['okt_lama_tersalurkan', 0, 'Sudah tersalurkan Oktober Dai Lama'],
    ['okt_baru_tersalurkan', isSlide1Sample ? 71508500 : 0, 'Sudah tersalurkan Oktober Dai Baru'],
    ['okt_lama_sisa_auto', '=B23-B25', 'Otomatis: Sisa Oktober Dai Lama'],
    ['okt_baru_sisa_auto', '=B24-B26', 'Otomatis: Sisa Oktober Dai Baru'],
    ['total_tunggakan_juli_okt_auto', '=B9+B15+B21+B27+B28', 'Halaman 3: Total Tunggakan Belum Terbayarkan Juli–Okt'],
    ['total_tanggungan_okt_auto', '=B23+B24', 'Halaman 4: Total Tanggungan Per Bulan Oktober'],
    ['kumulatif_judul', 'Update Kafalah Kumulatif (Sesuai Tabel Rekapitulasi)', 'Halaman 5: Judul Kumulatif'],
    ['kumulatif_kebutuhan', isSlide1Sample ? 5790835000 : 0, 'Total kebutuhan kumulatif'],
    ['kumulatif_masuk', isSlide1Sample ? 4117250000 : 0, 'Total dana masuk kumulatif'],
    ['kumulatif_sisa_auto', '=B32-B33', 'Otomatis: Sisa Kumulatif'],
    ['analisis_judul', 'Analisis Kebutuhan Bulanan vs Dana Masuk', 'Halaman 6: Judul Analisis'],
    ['analisis_subjudul', 'Rangkuman perbandingan kebutuhan kafalah dan realisasi dana masuk berdasarkan tabel rekapitulasi 14 periode.', 'Halaman 6: Subjudul'],
    ['analisis_gambar_url', '', 'Opsional: URL gambar tabel rekapitulasi'],
    ['analisis_ringkasan', 'Dari total kebutuhan Rp5,79 miliar (14 entri bulan), dana masuk mencapai Rp4,12 miliar (71,10%) sehingga masih terdapat kekurangan kumulatif Rp1,67 miliar (28,90%). Beban kebutuhan aktif berkisar Rp412,58 juta hingga Rp480,48 juta per bulan seiring penambahan jumlah dai hingga 353 dai pada Oktober.', 'Halaman 6: Ringkasan utama'],
    ['analisis_poin', 'Hanya 2 bulan aktif mencatat surplus dana masuk: Januari (+Rp82.811.000) dan Maret (+Rp320.360.000), sedangkan 10 bulan berjalan lainnya mengalami defisit.\\nDefisit bulanan terbesar terjadi pada Desember (Rp401.507.000) dan Agustus (Rp319.800.000).\\nLonjakan penerima pada Oktober menjadi 353 dai mendorong kebutuhan bulan tersebut ke Rp480.482.000.\\nTerdapat dana masuk awal periode berikutnya Rp185.000.000 berstatus surplus untuk menutup tunggakan berjalan.', 'Halaman 6: Poin analisis'],
    ['judul_penutup', 'Sinergi Berkelanjutan untuk Ketahanan Kafalah Dai', 'Halaman 7: Judul Penutup'],
    ['kalimat_penutup', 'Dengan percepatan penghimpunan dana untuk menutup tunggakan Rp409.638.500 pada periode Oktober serta efisiensi alokasi bagi 353 dai aktif, stabilitas penyaluran kafalah bulan berikutnya dapat terjaga secara optimal.', 'Halaman 7: Kalimat Penutup'],
    ['catatan_kaki', 'Wadah Digital · Disajikan dari Google Sheets Terintegrasi', 'Footer seluruh halaman'],
    ['warna_latar_awal', '#F8FAFC', 'Warna hex gradasi awal'],
    ['warna_latar_akhir', '#E6EEF8', 'Warna hex gradasi akhir'],
    ['warna_teks', '#0F172A', 'Warna hex teks utama'],
    ['warna_aksen', '#1D4ED8', 'Warna hex aksen']
  ];

  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 3);
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GITHUB_404_HTML_TEMPLATE = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Mengarahkan ke Wadah Slide...</title>
  <script>
    (function () {
      var path = window.location.pathname;
      sessionStorage.setItem('wadah_redirect_path', path + window.location.search + window.location.hash);
      window.location.replace('/');
    })();
  </script>
</head>
<body></body>
</html>
`;

export const STANDALONE_ADMIN_REDIRECT_TEMPLATE = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Wadah Slide Admin</title>
  <script>
    sessionStorage.setItem('wadah_redirect_path', '/admin');
    window.location.replace('/');
  </script>
</head>
<body></body>
</html>
`;

export const STANDALONE_INDEX_HTML_TEMPLATE = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wadah Slide — slide.wadahdigital.my.id</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>

  <style>
    :root {
      --font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-heading: 'Headwood', 'Fraunces', Georgia, serif;
      --text-primary: #0f172a;
      --text-muted: #475569;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-body);
      color: var(--text-primary);
      min-height: 100vh;
      background:
        radial-gradient(1100px 580px at 8% -10%, rgba(219, 234, 254, 0.85), transparent 60%),
        radial-gradient(900px 520px at 94% 4%, rgba(224, 231, 255, 0.72), transparent 58%),
        #f5f7fb;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }

    .app-header {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
      padding: 0.9rem 1.75rem;
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(226, 232, 240, 0.85);
    }

    .brand {
      font-family: var(--font-heading);
      font-size: 1.2rem; font-weight: 700;
      white-space: nowrap;
    }

    .toolbar-actions { display: flex; align-items: center; gap: 0.625rem; flex-shrink: 0; }

    .btn {
      font-family: var(--font-body); font-size: 0.8125rem; font-weight: 600;
      padding: 0.55rem 1rem; border-radius: 0.75rem;
      border: 1px solid rgba(203, 213, 225, 0.9);
      background: rgba(255, 255, 255, 0.88); color: var(--text-primary);
      cursor: pointer; white-space: nowrap;
      transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), background-color 160ms ease;
    }
    .btn:hover:not(:disabled) { background: #ffffff; transform: translateY(-1px); }
    .btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary { background: #0f172a; color: #ffffff; border-color: #0f172a; }
    .btn-primary:hover:not(:disabled) { background: #1e293b; }

    .main-container {
      flex: 1; width: 100%; max-width: 1180px;
      margin: 0 auto; padding: 1.75rem 1.5rem 2.5rem;
      display: flex; flex-direction: column; gap: 1.25rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(22px) saturate(180%);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.78);
      border-radius: 1.25rem; padding: 1.5rem;
      box-shadow: 0 20px 50px -24px rgba(15, 23, 42, 0.14);
    }

    .stage-wrapper {
      position: relative; width: 100%; aspect-ratio: 16 / 9;
      border-radius: 1.25rem; overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 28px 60px -24px rgba(15, 23, 42, 0.22);
      background: #ffffff;
    }
    .stage-wrapper:fullscreen { border-radius: 0; border: none; width: 100vw; height: 100vh; }

    .slide-surface {
      width: 100%; height: 100%; padding: clamp(1.5rem, 3.8vw, 3.2rem);
      display: flex; flex-direction: column; justify-content: space-between;
      overflow-y: auto;
    }

    .slide-heading {
      font-family: var(--font-heading);
      font-size: clamp(1.4rem, 2.8vw, 2.5rem);
      font-weight: 700; line-height: 1.16; letter-spacing: -0.02em;
      text-wrap: balance;
    }

    .kpi-grid { display: grid; gap: 0.85rem; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-top: 1.1rem; }
    .kpi-box {
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(255, 255, 255, 0.65);
      border-radius: 0.9rem; padding: 0.9rem 1rem;
    }
    .kpi-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted); }
    .kpi-value { font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums; margin-top: 0.25rem; }
    .kpi-sub { font-size: 0.72rem; margin-top: 0.2rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }

    table.data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.82rem; }
    table.data-table th, table.data-table td {
      padding: 0.65rem 0.75rem; border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      font-variant-numeric: tabular-nums;
    }
    table.data-table th { text-align: left; font-size: 0.72rem; color: var(--text-muted); font-weight: 700; }
    table.data-table td.num, table.data-table th.num { text-align: right; }

    .controls-bar {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 0.85rem 1.25rem; border-radius: 1rem;
      background: rgba(255, 255, 255, 0.78); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.75);
    }

    .thumbs-strip { display: flex; gap: 0.625rem; overflow-x: auto; padding-bottom: 0.25rem; }
    .thumb-btn {
      flex: 0 0 auto; min-width: 155px; padding: 0.6rem 0.85rem; border-radius: 0.75rem;
      border: 1px solid rgba(203, 213, 225, 0.85); background: rgba(255, 255, 255, 0.72);
      text-align: left; cursor: pointer;
    }
    .thumb-btn.active { border-color: #1d4ed8; background: #ffffff; }

    .overlay-backdrop {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(18px);
      display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }
    .overlay-card {
      width: 100%; max-width: 420px; background: rgba(255, 255, 255, 0.94);
      border-radius: 1.25rem; padding: 2rem; box-shadow: 0 28px 60px -20px rgba(15, 23, 42, 0.35);
    }
    .input-field {
      width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem;
      border: 1px solid #cbd5e1; margin: 1rem 0 0.75rem; font-family: var(--font-body);
    }
    .hidden { display: none !important; }
    .print-deck { display: none; }

    @page { size: A4 landscape; margin: 0; }
    @media print {
      body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .app-header, .main-container, .overlay-backdrop, footer { display: none !important; }
      .print-deck { display: block !important; }
      .print-page {
        width: 297mm; height: 210mm; padding: 16mm 22mm;
        display: flex; flex-direction: column; justify-content: space-between;
        page-break-after: always; break-after: page; overflow: hidden;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
      .print-page:last-child { page-break-after: auto; break-after: auto; }
    }
  </style>
</head>
<body>
  <header class="app-header">
    <span class="brand" id="brandName">Wadah Digital</span>
    <div style="font-size: 0.85rem; color: #475569; font-weight: 500;" id="headerTitle">Memuat presentasi...</div>
    <div class="toolbar-actions" id="toolbarActions">
      <button class="btn hidden" id="btnFullscreen" type="button">Layar Penuh</button>
      <button class="btn hidden" id="btnPdf" type="button">Unduh PDF</button>
      <button class="btn btn-primary hidden" id="btnPptx" type="button">Unduh PPTX</button>
      <button class="btn hidden" id="btnBackPublic" type="button">Lihat Publik (/)</button>
    </div>
  </header>

  <main class="main-container" id="appRoot">
    <div class="glass-card">Memuat presentasi aktif...</div>
  </main>

  <footer style="max-width:1180px;width:100%;margin:0 auto;padding:1rem 1.5rem 1.75rem;font-size:0.75rem;color:#64748b;display:flex;justify-content:space-between;align-items:center;">
    <span>slide.wadahdigital.my.id</span>
    <a href="/admin" id="adminLink" style="color:#475569;text-decoration:none;font-weight:600;">Admin</a>
  </footer>

  <div class="overlay-backdrop hidden" id="lockOverlay">
    <form class="overlay-card" id="lockForm">
      <h2 id="lockTitle" style="font-family: var(--font-heading); font-size: 1.4rem;">Presentasi Terproteksi</h2>
      <p id="lockDesc" style="font-size: 0.85rem; color: #475569; margin-top: 0.4rem;">Masukkan kode akses untuk melanjutkan.</p>
      <input class="input-field" id="accessCodeInput" type="password" placeholder="Masukkan kode akses" required />
      <p id="lockError" class="hidden" style="color: #dc2626; font-size: 0.8rem; margin-bottom: 0.75rem;"></p>
      <button class="btn btn-primary" style="width: 100%; padding: 0.75rem;" type="submit">Buka</button>
    </form>
  </div>

  <section class="print-deck" id="printDeck"></section>

  <script>
    // Ganti URL di bawah ini dengan URL Web App Google Apps Script Anda
    const GAS_WEBAPP_URL = 'PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_ANDA_DI_SINI';

    (function () {
      var saved = sessionStorage.getItem('wadah_redirect_path');
      if (saved) {
        sessionStorage.removeItem('wadah_redirect_path');
        window.history.replaceState(null, '', saved);
      }
    })();

    const state = {
      isAdmin: false,
      brandName: 'Wadah Digital',
      activeDeck: null,
      data: null,
      adminDecks: [],
      adminConfig: null,
      pageIndex: 0
    };

    const el = {
      appRoot: document.getElementById('appRoot'),
      brandName: document.getElementById('brandName'),
      headerTitle: document.getElementById('headerTitle'),
      btnFullscreen: document.getElementById('btnFullscreen'),
      btnPdf: document.getElementById('btnPdf'),
      btnPptx: document.getElementById('btnPptx'),
      btnBackPublic: document.getElementById('btnBackPublic'),
      adminLink: document.getElementById('adminLink'),
      lockOverlay: document.getElementById('lockOverlay'),
      lockTitle: document.getElementById('lockTitle'),
      lockDesc: document.getElementById('lockDesc'),
      lockForm: document.getElementById('lockForm'),
      accessCodeInput: document.getElementById('accessCodeInput'),
      lockError: document.getElementById('lockError'),
      printDeck: document.getElementById('printDeck')
    };

    function checkIsAdminRoute() {
      var p = window.location.pathname.replace(/^\\/+|\\/+$/g, '').toLowerCase();
      return p === 'admin' || p.indexOf('admin/') === 0;
    }

    function fmtRp(n) { return 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID'); }
    function fmtPct(part, total) {
      if (!total || total <= 0) return '0%';
      var pct = (part / total) * 100;
      return pct.toLocaleString('id-ID', { minimumFractionDigits: pct % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 }) + '%';
    }
    function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    function computeMetrics(d) {
      function row(bulan, kat, total, tersalurkan) {
        var t = Math.max(0, Number(total) || 0);
        var s = Math.max(0, Math.min(t, Number(tersalurkan) || 0));
        return { bulan: bulan, kat: kat, total: t, tersalurkan: s, sisa: t - s };
      }
      var juli = row(d.juli.bulan, d.juli.keterangan, d.juli.total, d.juli.tersalurkan);
      var agus = row(d.agustus.bulan, d.agustus.keterangan, d.agustus.total, d.agustus.tersalurkan);
      var sept = row(d.september.bulan, d.september.keterangan, d.september.total, d.september.tersalurkan);
      var oktLama = row('Oktober', 'Dai Lama', d.oktober.total_dai_lama, d.oktober.tersalurkan_dai_lama);
      var oktBaru = row('Oktober', 'Dai Baru', d.oktober.total_dai_baru, d.oktober.tersalurkan_dai_baru);

      var totKebJuliOkt = juli.total + agus.total + sept.total + oktLama.total + oktBaru.total;
      var totSalurJuliOkt = juli.tersalurkan + agus.tersalurkan + sept.tersalurkan + oktLama.tersalurkan + oktBaru.tersalurkan;
      var totTunggakan = Math.max(0, totKebJuliOkt - totSalurJuliOkt);
      var totTanggunganOkt = oktLama.total + oktBaru.total;
      var kumSisa = Math.max(0, d.kumulatif.total_kebutuhan - d.kumulatif.total_dana_masuk);

      return {
        rows: [juli, agus, sept, oktLama, oktBaru],
        oktLama: oktLama, oktBaru: oktBaru,
        totKebJuliOkt: totKebJuliOkt, totSalurJuliOkt: totSalurJuliOkt,
        totTunggakan: totTunggakan, totTanggunganOkt: totTanggunganOkt, kumSisa: kumSisa
      };
    }

    async function loadApp(code) {
      state.isAdmin = checkIsAdminRoute();
      if (!GAS_WEBAPP_URL || GAS_WEBAPP_URL.indexOf('PASTE_URL') === 0) {
        el.appRoot.innerHTML = '<div class="glass-card"><strong>Konfigurasi Awal:</strong> Isi <code>GAS_WEBAPP_URL</code> pada <code>index.html</code> dengan URL Web App Google Apps Script Anda.</div>';
        return;
      }

      var mode = state.isAdmin ? 'admin' : 'public';
      var url = GAS_WEBAPP_URL + (GAS_WEBAPP_URL.indexOf('?') > -1 ? '&' : '?') + 'mode=' + mode;
      if (code) url += '&code=' + encodeURIComponent(code);

      var res = await fetch(url);
      var json = await res.json();

      if (json.locked) {
        el.lockTitle.textContent = state.isAdmin ? 'Akses Halaman Admin' : 'Presentasi Terproteksi';
        el.lockDesc.textContent = state.isAdmin
          ? 'Masukkan kode akses Admin yang terdaftar di tab Config Google Sheet.'
          : 'Masukkan kode akses untuk membuka presentasi ini.';
        el.lockOverlay.classList.remove('hidden');
        if (json.error) {
          el.lockError.textContent = json.error;
          el.lockError.classList.remove('hidden');
        } else {
          el.lockError.classList.add('hidden');
        }
        return;
      }

      el.lockOverlay.classList.add('hidden');

      if (state.isAdmin) {
        [el.btnFullscreen, el.btnPdf, el.btnPptx].forEach(function (b) { b.classList.add('hidden'); });
        el.btnBackPublic.classList.remove('hidden');
        state.adminConfig = json.config;
        state.adminDecks = json.decks || [];
        el.brandName.textContent = json.config.brand_name + ' Admin';
        el.headerTitle.textContent = 'Panel Admin · Google Sheets';
        renderAdmin();
        return;
      }

      el.btnBackPublic.classList.add('hidden');
      [el.btnFullscreen, el.btnPdf, el.btnPptx].forEach(function (b) { b.classList.remove('hidden'); });
      state.brandName = json.brand_name || 'Wadah Digital';
      state.activeDeck = json.active_deck;
      state.data = json.data;
      state.pageIndex = 0;

      el.brandName.textContent = state.brandName;
      el.headerTitle.textContent = state.activeDeck ? state.activeDeck.deck_title : 'Presentasi';
      document.title = (state.activeDeck ? state.activeDeck.deck_title : 'Presentasi') + ' — ' + state.brandName;
      renderPublicViewer();
      renderPrintPages();
    }

    function renderAdmin() {
      var cards = state.adminDecks.map(function (d) {
        var isActive = String(d.slide_id) === String(state.adminConfig.active_slide_id);
        return (
          '<div class="glass-card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">' +
            '<div>' +
              '<div style="font-size:0.75rem;color:#475569;">' + esc(d.sheet_name) + ' &middot; ' + (isActive ? '<strong style="color:#047857;">Sedang Aktif di Halaman Utama (/)</strong>' : 'Draft') + '</div>' +
              '<h3 style="font-family:var(--font-heading);font-size:1.15rem;margin-top:0.25rem;">' + esc(d.deck_title) + '</h3>' +
              '<p style="font-size:0.8rem;color:#64748b;margin-top:0.2rem;">Ekspor: ' + esc(d.export_filename) + '.pptx</p>' +
            '</div>' +
          '</div>'
        );
      }).join('');

      el.appRoot.innerHTML =
        '<div class="glass-card">' +
          '<h1 class="slide-heading">Halaman Admin (/admin)</h1>' +
          '<p style="font-size:0.875rem;color:#475569;margin-top:0.5rem;line-height:1.55;">' +
            'Pengelolaan data slide, pemilihan <strong>1 slide aktif</strong> (<code>active_slide_id</code>), penambahan sheet baru (<code>tambahDatabaseSlideBaru</code>), dan pengaturan kode akses Publik/Admin dilakukan langsung melalui Google Sheet Anda pada tab <strong>Config</strong>, <strong>Daftar_Slide</strong>, dan tab masing-masing slide.' +
          '</p>' +
        '</div>' +
        '<div style="display:grid;gap:1rem;">' + cards + '</div>';
    }

    function buildPageMarkup(pageIdx) {
      var d = state.data;
      var m = computeMetrics(d);
      var accent = d.tema.warna_aksen || '#1D4ED8';
      var header = '<div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:600;opacity:0.78;"><span>' + esc(state.brandName) + ' &middot; ' + esc(state.activeDeck.sheet_name) + '</span><span style="font-variant-numeric:tabular-nums;">' + String(pageIdx + 1).padStart(2, '0') + ' / 07</span></div>';
      var footer = '<div style="display:flex;justify-content:space-between;border-top:1px solid rgba(148,163,184,0.3);padding-top:0.75rem;font-size:0.75rem;opacity:0.75;"><span>' + esc(d.catatan_kaki) + '</span><span>' + esc(state.activeDeck.deck_title) + '</span></div>';

      var body = '';
      if (pageIdx === 0) {
        body = '<div style="margin:auto 0;"><div style="width:3rem;height:4px;border-radius:99px;background:' + esc(accent) + ';margin-bottom:1.25rem;"></div><h1 class="slide-heading" style="font-size:clamp(1.8rem,3.6vw,3rem);">' + esc(d.judul_cover) + '</h1><p style="margin-top:0.9rem;font-size:clamp(0.95rem,1.4vw,1.15rem);opacity:0.84;max-width:62ch;line-height:1.6;">' + esc(d.subjudul_cover) + '</p><p style="margin-top:1.75rem;font-size:0.82rem;font-weight:600;color:' + esc(accent) + ';">' + esc(d.catatan_cover) + '</p></div>';
      } else if (pageIdx === 1) {
        var trs = m.rows.map(function (r) {
          return '<tr><td><strong>' + esc(r.bulan) + '</strong> (' + esc(r.kat) + ')</td><td class="num">' + fmtRp(r.total) + '</td><td class="num" style="color:#047857;">' + fmtRp(r.tersalurkan) + ' (' + fmtPct(r.tersalurkan, r.total) + ')</td><td class="num" style="color:' + (r.sisa > 0 ? '#b91c1c' : 'inherit') + ';">' + fmtRp(r.sisa) + ' (' + fmtPct(r.sisa, r.total) + ')</td></tr>';
        }).join('');
        body = '<div style="margin:auto 0;"><h2 class="slide-heading">Progres Pencairan Kafalah Dai Lama &amp; Dai Baru</h2><table class="data-table"><thead><tr><th>Periode / Kategori</th><th class="num">Total</th><th class="num">Tersalurkan</th><th class="num">Sisa</th></tr></thead><tbody>' + trs + '</tbody></table></div>';
      } else if (pageIdx === 2) {
        body = '<div style="margin:auto 0;"><h2 class="slide-heading">Total Tunggakan Belum Terbayarkan (Juli – Oktober)</h2><div class="kpi-grid"><div class="kpi-box"><div class="kpi-label">Total Tunggakan Belum Terbayarkan</div><div class="kpi-value" style="color:#b91c1c;">' + fmtRp(m.totTunggakan) + '</div><div class="kpi-sub">' + fmtPct(m.totTunggakan, m.totKebJuliOkt) + ' dari total kebutuhan</div></div><div class="kpi-box"><div class="kpi-label">Total Tersalurkan (Juli–Okt)</div><div class="kpi-value" style="color:#047857;">' + fmtRp(m.totSalurJuliOkt) + '</div><div class="kpi-sub">' + fmtPct(m.totSalurJuliOkt, m.totKebJuliOkt) + ' terealisasi</div></div><div class="kpi-box"><div class="kpi-label">Total Kebutuhan (Juli–Okt)</div><div class="kpi-value">' + fmtRp(m.totKebJuliOkt) + '</div><div class="kpi-sub">Akumulasi 4 bulan berjalan</div></div></div></div>';
      } else if (pageIdx === 3) {
        body = '<div style="margin:auto 0;"><h2 class="slide-heading">Total Tanggungan Kafalah Dai Sekarang per Bulan (Oktober)</h2><div class="kpi-grid"><div class="kpi-box"><div class="kpi-label">Dai Lama</div><div class="kpi-value">' + fmtRp(m.oktLama.total) + '</div><div class="kpi-sub">' + fmtPct(m.oktLama.total, m.totTanggunganOkt) + ' dari beban bulanan</div></div><div class="kpi-box"><div class="kpi-label">Dai Baru</div><div class="kpi-value">' + fmtRp(m.oktBaru.total) + '</div><div class="kpi-sub">' + fmtPct(m.oktBaru.total, m.totTanggunganOkt) + ' dari beban bulanan</div></div><div class="kpi-box"><div class="kpi-label">Total Tanggungan per Bulan</div><div class="kpi-value" style="color:' + esc(accent) + ';">' + fmtRp(m.totTanggunganOkt) + '</div><div class="kpi-sub">Sisa belum cair bulan ini: ' + fmtRp(m.oktLama.sisa + m.oktBaru.sisa) + '</div></div></div></div>';
      } else if (pageIdx === 4) {
        body = '<div style="margin:auto 0;"><h2 class="slide-heading">' + esc(d.kumulatif.judul_periode) + '</h2><div class="kpi-grid"><div class="kpi-box"><div class="kpi-label">Total Kebutuhan</div><div class="kpi-value">' + fmtRp(d.kumulatif.total_kebutuhan) + '</div><div class="kpi-sub">100% kebutuhan kumulatif</div></div><div class="kpi-box"><div class="kpi-label">Total Dana Masuk</div><div class="kpi-value" style="color:#047857;">' + fmtRp(d.kumulatif.total_dana_masuk) + '</div><div class="kpi-sub">' + fmtPct(d.kumulatif.total_dana_masuk, d.kumulatif.total_kebutuhan) + ' terpenuhi</div></div><div class="kpi-box"><div class="kpi-label">Total Sisa Kekurangan</div><div class="kpi-value" style="color:#b91c1c;">' + fmtRp(m.kumSisa) + '</div><div class="kpi-sub">' + fmtPct(m.kumSisa, d.kumulatif.total_kebutuhan) + ' belum tertutup</div></div></div></div>';
      } else if (pageIdx === 5) {
        var pts = (d.analisis.poin_analisis || []).map(function (p) { return '<li style="margin-bottom:0.45rem;">' + esc(p) + '</li>'; }).join('');
        body = '<div style="margin:auto 0;"><h2 class="slide-heading">' + esc(d.analisis.judul) + '</h2><p style="margin-top:0.6rem;font-size:0.9rem;line-height:1.55;font-weight:500;">' + esc(d.analisis.ringkasan_utama) + '</p><ul style="margin-top:0.85rem;padding-left:1.1rem;font-size:0.84rem;line-height:1.5;">' + pts + '</ul></div>';
      } else {
        body = '<div style="margin:auto 0;"><div style="width:3rem;height:4px;border-radius:99px;background:' + esc(accent) + ';margin-bottom:1.25rem;"></div><h2 class="slide-heading" style="font-size:clamp(1.7rem,3.2vw,2.6rem);">' + esc(d.judul_penutup) + '</h2><p style="margin-top:0.95rem;font-size:1rem;line-height:1.65;max-width:64ch;opacity:0.86;">' + esc(d.kalimat_penutup) + '</p></div>';
      }

      return header + body + footer;
    }

    function renderPublicViewer() {
      var d = state.data;
      var labels = ['Sampul', 'Progres Juli–Okt', 'Tunggakan Juli–Okt', 'Tanggungan Oktober', 'Update Kumulatif', 'Analisis Rekap', 'Penutup'];
      var thumbs = labels.map(function (lbl, idx) {
        return '<button class="thumb-btn' + (idx === state.pageIndex ? ' active' : '') + '" type="button" onclick="goPage(' + idx + ')"><div style="font-size:0.7rem;color:#64748b;font-variant-numeric:tabular-nums;">Halaman ' + (idx + 1) + '</div><div style="font-size:0.78rem;font-weight:600;margin-top:0.15rem;">' + esc(lbl) + '</div></button>';
      }).join('');

      el.appRoot.innerHTML =
        '<div class="stage-wrapper" id="stageWrapper"><article class="slide-surface" style="background:linear-gradient(135deg,' + esc(d.tema.warna_latar_awal) + ' 0%,' + esc(d.tema.warna_latar_akhir) + ' 100%);color:' + esc(d.tema.warna_teks) + ';">' + buildPageMarkup(state.pageIndex) + '</article></div>' +
        '<div class="controls-bar"><div style="display:flex;align-items:center;gap:0.6rem;"><button class="btn" type="button" ' + (state.pageIndex === 0 ? 'disabled' : '') + ' onclick="goPage(' + (state.pageIndex - 1) + ')">Sebelumnya</button><span style="font-weight:600;font-size:0.85rem;font-variant-numeric:tabular-nums;padding:0 0.5rem;">' + String(state.pageIndex + 1).padStart(2, '0') + ' / 07</span><button class="btn" type="button" ' + (state.pageIndex >= 6 ? 'disabled' : '') + ' onclick="goPage(' + (state.pageIndex + 1) + ')">Berikutnya</button></div><div style="font-size:0.78rem;color:#64748b;">Geser layar atau gunakan tombol panah kiri/kanan</div></div>' +
        '<div class="thumbs-strip">' + thumbs + '</div>';
    }

    function renderPrintPages() {
      var d = state.data;
      var html = '';
      for (var i = 0; i < 7; i++) {
        html += '<div class="print-page" style="background:linear-gradient(135deg,' + esc(d.tema.warna_latar_awal) + ' 0%,' + esc(d.tema.warna_latar_akhir) + ' 100%);color:' + esc(d.tema.warna_teks) + ';">' + buildPageMarkup(i) + '</div>';
      }
      el.printDeck.innerHTML = html;
    }

    window.goPage = function (idx) {
      if (idx < 0 || idx > 6) return;
      state.pageIndex = idx;
      renderPublicViewer();
    };

    el.adminLink.addEventListener('click', function (e) {
      e.preventDefault();
      window.history.pushState(null, '', '/admin');
      loadApp();
    });

    el.btnBackPublic.addEventListener('click', function () {
      window.history.pushState(null, '', '/');
      loadApp();
    });

    el.btnFullscreen.addEventListener('click', function () {
      var st = document.getElementById('stageWrapper');
      if (!st) return;
      if (!document.fullscreenElement) st.requestFullscreen().catch(function () {});
      else document.exitFullscreen().catch(function () {});
    });

    el.btnPdf.addEventListener('click', function () {
      var prev = document.title;
      if (state.activeDeck && state.activeDeck.export_filename) document.title = state.activeDeck.export_filename;
      window.print();
      setTimeout(function () { document.title = prev; }, 500);
    });

    el.btnPptx.addEventListener('click', async function () {
      if (!state.data || typeof PptxGenJS === 'undefined') return;
      var pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.title = state.activeDeck.deck_title;
      var d = state.data;
      var m = computeMetrics(d);

      var s1 = pptx.addSlide();
      s1.addText(d.judul_cover, { x: 0.7, y: 1.8, w: 11.8, h: 1.5, fontFace: 'Georgia', fontSize: 32, bold: true });
      s1.addText(d.subjudul_cover, { x: 0.7, y: 3.5, w: 11.2, h: 1.0, fontFace: 'Montserrat', fontSize: 15 });

      var s2 = pptx.addSlide();
      s2.addText('Progres Pencairan Kafalah Juli–Oktober', { x: 0.7, y: 0.7, w: 11.8, h: 0.6, fontFace: 'Georgia', fontSize: 22, bold: true });
      s2.addTable(
        [['Periode', 'Total', 'Tersalurkan', 'Sisa']].concat(
          m.rows.map(function (r) { return [r.bulan + ' (' + r.kat + ')', fmtRp(r.total), fmtRp(r.tersalurkan) + ' (' + fmtPct(r.tersalurkan, r.total) + ')', fmtRp(r.sisa) + ' (' + fmtPct(r.sisa, r.total) + ')']; })
        ),
        { x: 0.7, y: 1.5, w: 11.9, fontFace: 'Montserrat', fontSize: 11 }
      );

      var s3 = pptx.addSlide();
      s3.addText('Total Tunggakan Belum Terbayarkan (Juli–Oktober)', { x: 0.7, y: 0.8, w: 11.8, h: 0.7, fontFace: 'Georgia', fontSize: 24, bold: true });
      s3.addText('Total Tunggakan: ' + fmtRp(m.totTunggakan) + ' (' + fmtPct(m.totTunggakan, m.totKebJuliOkt) + ')', { x: 0.7, y: 2.0, w: 11.8, h: 1.0, fontFace: 'Montserrat', fontSize: 24, bold: true, color: 'B91C1C' });

      var s4 = pptx.addSlide();
      s4.addText('Total Tanggungan Kafalah per Bulan (Oktober)', { x: 0.7, y: 0.8, w: 11.8, h: 0.7, fontFace: 'Georgia', fontSize: 24, bold: true });
      s4.addText('Dai Lama: ' + fmtRp(m.oktLama.total) + '\\nDai Baru: ' + fmtRp(m.oktBaru.total) + '\\nTotal: ' + fmtRp(m.totTanggunganOkt), { x: 0.7, y: 2.0, w: 11.8, h: 2.5, fontFace: 'Montserrat', fontSize: 18 });

      var s5 = pptx.addSlide();
      s5.addText(d.kumulatif.judul_periode, { x: 0.7, y: 0.8, w: 11.8, h: 0.7, fontFace: 'Georgia', fontSize: 24, bold: true });
      s5.addText('Kebutuhan: ' + fmtRp(d.kumulatif.total_kebutuhan) + '\\nDana Masuk: ' + fmtRp(d.kumulatif.total_dana_masuk) + '\\nSisa: ' + fmtRp(m.kumSisa), { x: 0.7, y: 2.0, w: 11.8, h: 2.5, fontFace: 'Montserrat', fontSize: 18 });

      var s6 = pptx.addSlide();
      s6.addText(d.analisis.judul, { x: 0.7, y: 0.8, w: 11.8, h: 0.7, fontFace: 'Georgia', fontSize: 24, bold: true });
      s6.addText(d.analisis.ringkasan_utama + '\\n\\n' + (d.analisis.poin_analisis || []).join('\\n• '), { x: 0.7, y: 1.7, w: 11.8, h: 4.5, fontFace: 'Montserrat', fontSize: 13 });

      var s7 = pptx.addSlide();
      s7.addText(d.judul_penutup, { x: 0.7, y: 1.8, w: 11.8, h: 1.0, fontFace: 'Georgia', fontSize: 28, bold: true });
      s7.addText(d.kalimat_penutup, { x: 0.7, y: 3.1, w: 11.5, h: 2.0, fontFace: 'Montserrat', fontSize: 15 });

      var base = (state.activeDeck.export_filename || 'Presentasi_Wadah_Digital').replace(/\\.pptx$/i, '').trim();
      await pptx.writeFile({ fileName: base + '.pptx' });
    });

    el.lockForm.addEventListener('submit', function (e) {
      e.preventDefault();
      loadApp(el.accessCodeInput.value.trim());
    });

    document.addEventListener('keydown', function (e) {
      if (state.isAdmin || !state.data || !el.lockOverlay.classList.contains('hidden')) return;
      if (e.key === 'ArrowRight') window.goPage(state.pageIndex + 1);
      if (e.key === 'ArrowLeft') window.goPage(state.pageIndex - 1);
    });

    window.addEventListener('popstate', function () { loadApp(); });
    loadApp();
  </script>
</body>
</html>
`;
