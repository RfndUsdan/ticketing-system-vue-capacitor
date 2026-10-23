<!-- =========================================================================
     APA KABAR · Tugas 1 · Analisis Kebutuhan & Karakteristik Perangkat Bergerak
     Format : Markdown + HTML/CSS inline (optimal di VS Code/ekspor HTML;
              konten tetap terbaca jika renderer membersihkan CSS)
     Palet  : Navy #14213D · Blue #2563EB · Teal #0F766E · Amber #D97706
     ========================================================================= -->

<style>
  /* Lapisan penyempurnaan. Tampilan dasar memakai inline style agar tetap
     rapi pada renderer yang membersihkan blok style. */
  .ak-lift { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
  .ak-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 30px -22px rgba(15,23,42,.5); border-color: #BFDBFE !important; }
  .ak-toc a { transition: border-color .16s ease, background .16s ease, transform .16s ease; }
  .ak-toc a:hover { border-color: #BFDBFE !important; background: #F8FAFC !important; transform: translateY(-2px); }
  .ak-h2 { scroll-margin-top: 24px; }
  @media (max-width: 640px) {
    .ak-hero { padding: 28px 16px 24px !important; }
    .ak-h2 { font-size: 1.25em !important; }
  }
  @media print {
    .ak-lift:hover, .ak-toc a:hover { transform: none; box-shadow: none; }
  }
  /* === Penyesuaian untuk hasil ekspor HTML (ID #preview-content) === */
  #preview-content { color: #334155; line-height: 1.75; }
  #preview-content h1, #preview-content h2, #preview-content h3 { color: #14213D; }
  #preview-content h3 {
    position: relative;
    margin-top: 2em;
    padding-left: 14px;
    border-left: 4px solid #2563EB;
    font-size: 1.06em;
  }
  #preview-content a { color: #1D4ED8; }
  #preview-content [id] { scroll-margin-top: 20px; }

  /* Tabel */
  #preview-content .table-wrap {
    margin: 18px 0;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: #FFFFFF;
  }
  #preview-content .table-wrap table {
    display: table;
    width: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    border-collapse: separate;
    border-spacing: 0;
    overflow: visible;
    table-layout: auto;
    background: #FFFFFF;
  }
  #preview-content .table-wrap th,
  #preview-content .table-wrap td {
    border: 0;
    border-top: 1px solid #E2E8F0;
    padding: 11px 14px;
    vertical-align: top;
  }
  #preview-content .table-wrap thead th {
    border-top: 0;
    background: #F1F5F9;
    color: #14213D;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  #preview-content .table-wrap tbody tr:nth-child(even) { background: #FCFDFE; }
  #preview-content .table-wrap tbody tr:hover { background: #EFF6FF; }
  #preview-content .table-wrap tbody td:first-child { color: #14213D; font-weight: 600; }

  /* Diagram: ukuran dibatasi agar flowchart tidak terlalu besar */
  .mermaid-diagram,
  #preview-content .mermaid-diagram {
    width: auto !important;
    margin: 22px auto !important;
    text-align: center;
  }
  .mermaid-diagram svg,
  #preview-content .mermaid-diagram svg,
  pre.mermaid svg {
    width: 470px !important;
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0 auto !important;
  }
  pre.mermaid { margin: 0 auto; }

  /* Checklist */
  #preview-content input[type="checkbox"] {
    width: 15px;
    height: 15px;
    margin-right: 6px;
    vertical-align: -2px;
    accent-color: #2563EB;
  }
  #preview-content li:has(> input[type="checkbox"]) {
    list-style: none;
    margin-left: -1.1em;
  }

  @media (max-width: 720px) {
    #preview-content .table-wrap { border-radius: 10px; }
    #preview-content .table-wrap table { min-width: 560px; }
    #preview-content .table-wrap th,
    #preview-content .table-wrap td { padding: 9px 11px; font-size: 13px; }
    .mermaid-diagram svg,
    #preview-content .mermaid-diagram svg,
    pre.mermaid svg { width: 100% !important; }
  }

  @media print {
    #preview-content .table-wrap { border-radius: 0; overflow: visible; }
    #preview-content .table-wrap table { min-width: 0; }
  }
</style>

<div class="ak-hero" style="margin: 0 0 4px; padding: 42px 28px 34px; text-align: center; border: 1px solid #E2E8F0; border-radius: 20px; background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); box-shadow: 0 26px 50px -42px rgba(15,23,42,.6);">

  <p style="margin: 0 0 20px;">
    <img src="logo.png" alt="Logo Apa Kabar" width="150" style="border-radius: 16px;" />
  </p>

  <p style="margin: 0 0 18px; font-size: 11px; font-weight: 800; letter-spacing: .18em; color: #2563EB;">
    DOKUMEN SPESIFIKASI KEBUTUHAN &amp; TARGET APLIKASI
  </p>

  <h1 style="margin: 0; padding: 0; border: 0; font-size: 2.6em; line-height: 1.1; letter-spacing: -.02em; color: #14213D;">
    Apa Kabar
  </h1>

  <p style="margin: 14px 0 6px; font-size: 1.15em; font-weight: 600; color: #334155;">
    Aplikasi Pelaporan Kerusakan Barang &amp; Fasilitas
  </p>

  <p style="margin: 0; font-size: .98em; color: #64748B;">
    Analisis Kebutuhan Pengguna &amp; Karakteristik Perangkat Bergerak
  </p>

  <p style="margin: 22px 0 0; line-height: 2;">
    <span style="display: inline-block; padding: 5px 12px; border: 1px solid #BFDBFE; border-radius: 999px; background: #EFF6FF; color: #1D4ED8; font-size: 10.5px; font-weight: 800; letter-spacing: .1em;">PEMROGRAMAN BERGERAK</span>
    <span style="display: inline-block; padding: 5px 12px; border: 1px solid #E2E8F0; border-radius: 999px; background: #FFFFFF; color: #475569; font-size: 10.5px; font-weight: 800; letter-spacing: .1em;">TUGAS 1</span>
    <span style="display: inline-block; padding: 5px 12px; border: 1px solid #E2E8F0; border-radius: 999px; background: #FFFFFF; color: #475569; font-size: 10.5px; font-weight: 800; letter-spacing: .1em;">TA 2026/2027</span>
  </p>

</div>

<div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0 0;">

  <div class="ak-lift" style="flex: 1 1 180px; padding: 14px 16px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
    <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #94A3B8;">Mata Kuliah</p>
    <p style="margin: 0; font-weight: 700; color: #14213D;">Pemrograman Bergerak</p>
  </div>

  <div class="ak-lift" style="flex: 1 1 220px; padding: 14px 16px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
    <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #94A3B8;">Nama Mahasiswa</p>
    <p style="margin: 0; font-weight: 700; color: #14213D;">Rifandi Usdan Fanani Putra</p>
  </div>

  <div class="ak-lift" style="flex: 1 1 140px; padding: 14px 16px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
    <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #94A3B8;">NIM</p>
    <p style="margin: 0; font-weight: 700; color: #14213D; font-variant-numeric: tabular-nums;">2305101086</p>
  </div>

  <div class="ak-lift" style="flex: 1 1 260px; padding: 14px 16px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
    <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #94A3B8;">Program Studi / Institusi</p>
    <p style="margin: 0; font-weight: 700; color: #14213D;">Teknik Informatika / Universitas PGRI Madiun</p>
  </div>

</div>

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #FDE68A; border-left: 4px solid #D97706; border-radius: 0 12px 12px 0; background: #FFFBEB;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">⚠️</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #B45309;">Validitas data</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Dokumen ini merupakan analisis awal berdasarkan fungsi dan arsitektur proyek. Belum ada data wawancara atau observasi lapangan yang diberikan. Pernyataan tentang kondisi proses manual ditandai sebagai hipotesis dan perlu divalidasi.</p>
  </div>
</div>

### Isi dokumen

<div class="ak-toc" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; margin: 14px 0 0;">

  <a href="#s01" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">01</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Ringkasan Eksekutif</span>
  </a>

  <a href="#s02" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">02</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Latar Belakang &amp; Masalah</span>
  </a>

  <a href="#s03" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">03</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Sistem yang Berjalan</span>
  </a>

  <a href="#s04" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">04</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Sistem yang Ditawarkan</span>
  </a>

  <a href="#s05" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">05</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Kebutuhan Pengguna</span>
  </a>

  <a href="#s06" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">06</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Karakteristik Perangkat</span>
  </a>

  <a href="#s07" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">07</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Spesifikasi Pengembang</span>
  </a>

  <a href="#s08" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">08</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Target &amp; Pengujian</span>
  </a>

  <a href="#s09" style="flex: 1 1 220px; display: block; padding: 12px 14px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; text-decoration: none; color: #14213D;">
    <span style="display: block; font-size: 10px; font-weight: 800; letter-spacing: .14em; color: #2563EB;">09</span>
    <span style="display: block; margin-top: 2px; font-size: 13.5px; font-weight: 600;">Kesimpulan &amp; Referensi</span>
  </a>

</div>

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s01"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">01</span>
  <span>Ringkasan Eksekutif</span>
</h2>

### Mengapa Apa Kabar relevan sebagai solusi mobile?

Apa Kabar merupakan aplikasi ticketing untuk membantu pengguna menyampaikan laporan kerusakan barang atau fasilitas, melampirkan bukti foto, serta memantau perkembangan laporan. Dari sisi pengelola, sistem membantu petugas menerima, memeriksa, dan memperbarui status tiket secara lebih terpusat.

Proyek yang menjadi dasar dokumen ini menggunakan **Vue.js** untuk antarmuka, **Laravel 12** sebagai REST API, **MySQL/MariaDB** sebagai basis data, serta **Capacitor** untuk membungkus aplikasi menjadi aplikasi Android. Fokus dokumen adalah kebutuhan pengguna, alur kerja, karakteristik mobile, dan target yang dapat diuji.

### Tujuan dokumen

- Mengidentifikasi pengguna dan kebutuhan utama dalam proses pelaporan kerusakan.
- Membandingkan sistem yang berjalan dengan alur sistem yang ditawarkan.
- Menentukan dampak layar, kamera/galeri, konektivitas, dan keamanan perangkat bergerak.
- Menyusun spesifikasi pengembang serta target fungsional dan nonfungsional yang dapat diuji.

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 0 12px 12px 0; background: #EFF6FF;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">🎯</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #1D4ED8;">Ruang lingkup</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Autentikasi, pembuatan laporan, lampiran gambar, daftar/detail tiket, pemantauan status, serta peran pengelola sesuai implementasi yang benar-benar ada.</p>
  </div>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 14px; margin: 24px 0 0;">

  <div class="ak-lift" style="flex: 1 1 220px; padding: 18px 16px; border: 1px solid #DCE5F0; border-top: 4px solid #2563EB; border-radius: 12px; background: #F8FAFC;">
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #2563EB;">
      01 / LAPOR
    </p>
    <p style="margin: 0 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; color: #14213D;">
      Buat laporan terstruktur
    </p>
    <p style="margin: 0; font-size: 12.5px; line-height: 1.7; color: #475569;">
      Formulir membantu mengumpulkan detail dan bukti kerusakan.
    </p>
  </div>

  <div class="ak-lift" style="flex: 1 1 220px; padding: 18px 16px; border: 1px solid #DCE5F0; border-top: 4px solid #0F766E; border-radius: 12px; background: #F8FAFC;">
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #0F766E;">
      02 / KELOLA
    </p>
    <p style="margin: 0 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; color: #14213D;">
      Informasi tiket lebih terpusat
    </p>
    <p style="margin: 0; font-size: 12.5px; line-height: 1.7; color: #475569;">
      Data tiket dapat diperiksa sesuai hak akses.
    </p>
  </div>

  <div class="ak-lift" style="flex: 1 1 220px; padding: 18px 16px; border: 1px solid #DCE5F0; border-top: 4px solid #D97706; border-radius: 12px; background: #F8FAFC;">
    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #D97706;">
      03 / PANTAU
    </p>
    <p style="margin: 0 0 10px; font-size: 15px; font-weight: 700; line-height: 1.4; color: #14213D;">
      Cek perkembangan laporan
    </p>
    <p style="margin: 0; font-size: 12.5px; line-height: 1.7; color: #475569;">
      Pelapor melihat status terbaru dari backend.
    </p>
  </div>

</div>

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s02"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">02</span>
  <span>Latar Belakang &amp; Masalah</span>
</h2>

### Mendefinisikan masalah sebelum menentukan solusi

Kerusakan barang atau fasilitas membutuhkan proses pelaporan yang jelas agar informasi sampai kepada pihak yang bertanggung jawab dan dapat ditindaklanjuti. Jika laporan disampaikan secara lisan atau lewat pesan yang tersebar, informasi bisa tidak seragam, bukti kerusakan sulit dihimpun, dan pelapor belum tentu memiliki cara terstruktur untuk mengetahui perkembangan penanganan.

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 0 12px 12px 0; background: #EFF6FF;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">📌</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #1D4ED8;">Batasan analisis</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Pernyataan tersebut adalah konteks masalah yang perlu dikonfirmasi pada lingkungan penggunaan sebenarnya, bukan hasil observasi yang sudah terukur.</p>
  </div>
</div>

### Potensi masalah yang dianalisis

| Aspek | Potensi masalah | Dampak yang mungkin | Cara validasi |
|---|---|---|---|
| **Pelaporan** | Laporan berpotensi masuk lewat beberapa kanal atau lisan. | Informasi sulit ditelusuri dalam satu tempat. | Wawancara pelapor dan petugas; amati proses aktual. |
| **Kelengkapan** | Detail lokasi/kerusakan atau bukti foto mungkin tidak selalu ada. | Petugas perlu meminta klarifikasi tambahan. | Tinjau contoh laporan terdahulu dengan izin. |
| **Status tindak lanjut** | Pelapor mungkin belum dapat melihat status terkini secara mandiri. | Pertanyaan status berulang dapat terjadi. | Tanyakan bagaimana status dibagikan saat ini. |
| **Dokumentasi** | Riwayat laporan berpotensi tersebar pada catatan/pesan. | Rekap dan pencarian laporan lebih sulit. | Tinjau media pencatatan yang benar-benar digunakan. |

### Data temuan yang harus dikumpulkan

Agar tugas memenuhi unsur “data temuan”, lakukan wawancara singkat dengan calon pelapor dan petugas/pengelola. Catat tanggal, peran responden tanpa data sensitif, pertanyaan, jawaban ringkas, dan bukti proses yang diizinkan. Jangan menulis jumlah responden, persentase, atau kesimpulan kuantitatif sebelum data benar-benar diperoleh.

| Pertanyaan wawancara | Catatan jawaban |
|---|---|
| 1. Bagaimana laporan kerusakan disampaikan saat ini? | <span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1; margin-bottom: 6px;"></span><span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1;"></span> |
| 2. Informasi apa yang wajib disertakan? | <span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1; margin-bottom: 6px;"></span><span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1;"></span> |
| 3. Bagaimana pelapor mengetahui status laporan? | <span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1; margin-bottom: 6px;"></span><span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1;"></span> |
| 4. Apakah foto dari ponsel dibutuhkan? | <span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1; margin-bottom: 6px;"></span><span style="display: block; height: 18px; border-bottom: 1px dashed #CBD5E1;"></span> |

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s03"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">03</span>
  <span>Sistem yang Berjalan</span>
</h2>

### Hipotesis alur pelaporan sebelum aplikasi digunakan

Flowchart berikut adalah gambaran awal alur pelaporan manual/tersebar. Revisi setiap langkah berdasarkan praktik nyata di lingkungan kampus atau instansi tempat aplikasi akan digunakan.

<p class="ak-diagram" style="margin: 22px 0; text-align: center;">
  <img src="gambar/alur-pelaporan-manual.png" alt="Flowchart alur pelaporan manual sebelum aplikasi digunakan" width="520" style="max-width: 100%; height: auto; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF; padding: 10px;" />
</p>

### Pertanyaan analisis untuk memeriksa kelemahan alur

- Apakah laporan memiliki format informasi yang sama?
- Apakah pelapor menerima nomor atau bukti bahwa laporan sudah diterima?
- Apakah status dan riwayat dapat dilihat tanpa menghubungi petugas?
- Bagaimana foto disimpan dan siapa yang dapat mengaksesnya?
- Bagaimana petugas menentukan prioritas dan mencegah laporan ganda?

### Referensi pembanding

SP4N-LAPOR! merupakan contoh layanan pengaduan digital yang menyediakan kanal penyampaian laporan serta informasi tindak lanjut. Referensi ini digunakan sebagai pembanding pola layanan digital, bukan sebagai bukti bahwa proses di kampus memiliki prosedur yang sama.

- https://sp4n.lapor.go.id/
- https://lapor.go.id/faq

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s04"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">04</span>
  <span>Sistem yang Ditawarkan</span>
</h2>

### Pelaporan mobile dengan pencatatan dan pemantauan tiket

Apa Kabar ditawarkan sebagai aplikasi Android untuk mengirim laporan dan memantau perkembangannya. Petugas menggunakan antarmuka pengelolaan yang tersedia untuk memeriksa laporan dan memperbarui status sesuai hak akses.

<p class="ak-diagram" style="margin: 22px 0; text-align: center;">
  <img src="gambar/alur-pelaporan-aplikasi.png" alt="Flowchart alur pelaporan melalui aplikasi Apa Kabar" width="460" style="max-width: 100%; height: auto; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF; padding: 10px;" />
</p>

### Arsitektur solusi

<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 6px;">
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #BFDBFE; border-radius: 8px; background: #EFF6FF; color: #1D4ED8; font-size: 11.5px; font-weight: 700;">Vue.js</span>
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; color: #334155; font-size: 11.5px; font-weight: 700;">Vite</span>
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; color: #334155; font-size: 11.5px; font-weight: 700;">Capacitor Android</span>
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #FECACA; border-radius: 8px; background: #FEF2F2; color: #B91C1C; font-size: 11.5px; font-weight: 700;">Laravel 12</span>
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; color: #334155; font-size: 11.5px; font-weight: 700;">MySQL / MariaDB</span>
  <span style="display: inline-block; padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: #F8FAFC; color: #334155; font-size: 11.5px; font-weight: 700;">REST API + HTTPS</span>
</div>

| Lapisan | Komponen | Tanggung jawab |
|---|---|---|
| **Mobile UI** | Vue.js + Capacitor | Login, formulir laporan, daftar/detail tiket, dan interaksi pengguna. |
| **API** | Laravel 12 REST API | Autentikasi, validasi, proses bisnis, otorisasi, dan respons data. |
| **Database** | MySQL/MariaDB | Menyimpan akun, tiket, status, dan metadata lampiran. |
| **Berkas** | Storage gambar | Menyimpan foto secara persisten, idealnya pada layanan object storage atau disk yang sesuai. |

### Alur status tiket yang diusulkan

<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 16px 0 10px;">

  <span style="display: inline-block; padding: 8px 14px; border: 1px solid #FDE68A; border-radius: 999px; background: #FFFBEB; color: #B45309; font-size: 12px; font-weight: 700;">● Menunggu</span>
  <span style="color: #94A3B8;">→</span>
  <span style="display: inline-block; padding: 8px 14px; border: 1px solid #BFDBFE; border-radius: 999px; background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 700;">● Diverifikasi</span>
  <span style="color: #94A3B8;">→</span>
  <span style="display: inline-block; padding: 8px 14px; border: 1px solid #99F6E4; border-radius: 999px; background: #F0FDFA; color: #0F766E; font-size: 12px; font-weight: 700;">● Diproses</span>
  <span style="color: #94A3B8;">→</span>
  <span style="display: inline-block; padding: 8px 14px; border: 1px solid #BBF7D0; border-radius: 999px; background: #F0FDF4; color: #15803D; font-size: 12px; font-weight: 700;">● Selesai</span>
  <span style="color: #94A3B8;">/</span>
  <span style="display: inline-block; padding: 8px 14px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 12px; font-weight: 700;">● Ditolak</span>

</div>

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 0 12px 12px 0; background: #EFF6FF;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">ℹ️</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #1D4ED8;">Catatan</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Nama status di atas adalah usulan untuk menggambarkan alur. Sesuaikan dengan nilai enum/kolom status yang benar-benar ada pada repository sebelum dipakai sebagai spesifikasi final.</p>
  </div>
</div>

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s05"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">05</span>
  <span>Kebutuhan Pengguna</span>
</h2>

### Dari peran pengguna ke kebutuhan yang dapat diuji

| Pengguna | Tujuan | Kebutuhan utama |
|---|---|---|
| **Pelapor**<br /><span style="font-size: 12px; color: #64748B;">mahasiswa / pengguna fasilitas</span> | Melaporkan kerusakan dan mengetahui perkembangan. | Login; formulir yang mudah; unggah foto; daftar/detail tiket; status yang jelas. |
| **Petugas**<br /><span style="font-size: 12px; color: #64748B;">admin pengelola</span> | Memeriksa laporan dan mengatur tindak lanjut. | Melihat tiket dan lampiran; memperbarui status; mengelola data sesuai kewenangan. |

### Kebutuhan fungsional

| ID | Kebutuhan | Prioritas | Kriteria penerimaan awal |
|---|---|---|---|
| <span style="white-space: nowrap; font-weight: 700;">KF-01</span> | Login dan logout pengguna. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Kredensial valid membuka sesi; kredensial salah menghasilkan pesan yang jelas. |
| <span style="white-space: nowrap; font-weight: 700;">KF-02</span> | Membuat tiket/laporan. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Field wajib divalidasi; laporan yang berhasil tersimpan muncul pada daftar/detail. |
| <span style="white-space: nowrap; font-weight: 700;">KF-03</span> | Menambahkan foto bukti. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Jenis dan ukuran file divalidasi; foto dapat dilihat kembali setelah terkirim. |
| <span style="white-space: nowrap; font-weight: 700;">KF-04</span> | Melihat daftar dan detail tiket. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Data sesuai akun dan izin akses pengguna. |
| <span style="white-space: nowrap; font-weight: 700;">KF-05</span> | Memantau status tiket. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Status mengikuti nilai terakhir dari server. |
| <span style="white-space: nowrap; font-weight: 700;">KF-06</span> | Petugas meninjau tiket dan memperbarui status. | <span style="display: inline-block; padding: 3px 9px; border: 1px solid #FECACA; border-radius: 999px; background: #FEF2F2; color: #B91C1C; font-size: 10.5px; font-weight: 800;">TINGGI</span> | Perubahan tersimpan dan terlihat oleh pelapor yang berwenang. |

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s06"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">06</span>
  <span>Karakteristik Perangkat Bergerak</span>
</h2>

### Desain harus sesuai dengan cara orang menggunakan ponsel

Pelaporan bisa dilakukan langsung di lokasi kejadian. Karena itu, antarmuka perlu mudah digunakan pada layar berbeda dan tetap memberi umpan balik ketika jaringan lambat atau gagal. Panduan Android menekankan tata letak adaptif dan pemisahan tanggung jawab UI serta data [1][2].

| Karakteristik | Implikasi pada Apa Kabar | Kebutuhan desain / pengujian |
|---|---|---|
| **Layar dan ukuran beragam** | Formulir dan teks harus terbaca tanpa terpotong. | Uji beberapa ukuran layar; label jelas dan tombol mudah disentuh. |
| **Kamera dan galeri** | Pengguna memerlukan bukti visual kerusakan. | Uji izin akses, pemilihan gambar, preview, ukuran file, dan pesan gagal. |
| **Koneksi berubah-ubah** | Request API dapat gagal atau lambat. | Tampilkan loading/error; cegah submit ganda; sediakan coba lagi; konfirmasi sukses hanya setelah respons server. |
| **Siklus aplikasi** | OS dapat menghentikan proses aplikasi. | Muat ulang status dari API; jangan mengandalkan memori layar untuk data penting. |
| **Keamanan dan privasi** | Foto dan isi laporan dapat bersifat sensitif. | Gunakan HTTPS, otorisasi backend, hindari token di log, dan batasi akses file. |
| **Data dan baterai** | Foto besar bisa memperlambat unggahan. | Batasi ukuran foto dan hindari request berulang yang tidak perlu. |

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #FDE68A; border-left: 4px solid #D97706; border-radius: 0 12px 12px 0; background: #FFFBEB;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">⚠️</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #B45309;">Batasan yang perlu diverifikasi</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Capacitor membungkus frontend Vue menjadi aplikasi Android, tetapi kemampuan native tertentu tetap bergantung pada konfigurasi dan plugin. Notifikasi push, kamera native, atau mode offline tidak boleh dinyatakan sudah tersedia hanya karena perangkat Android mendukungnya.</p>
  </div>
</div>

### Prinsip UX: umpan balik tiga keadaan

Beri umpan balik yang jelas pada tiga keadaan utama: **sedang mengirim, berhasil terkirim, dan gagal terkirim**. Ini mengurangi kebingungan serta risiko pengiriman laporan berulang.

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 0;">

  <div style="flex: 1 1 180px; padding: 14px 16px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF;">
    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #1D4ED8;">SEDANG MENGIRIM</p>
    <p style="margin: 0; font-size: 12.5px; color: #475569; line-height: 1.6;">Tampilkan progres dan nonaktifkan tombol kirim.</p>
  </div>

  <div style="flex: 1 1 180px; padding: 14px 16px; border: 1px solid #BBF7D0; border-radius: 12px; background: #F0FDF4;">
    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #15803D;">BERHASIL TERKIRIM</p>
    <p style="margin: 0; font-size: 12.5px; color: #475569; line-height: 1.6;">Konfirmasi hanya setelah server merespons sukses.</p>
  </div>

  <div style="flex: 1 1 180px; padding: 14px 16px; border: 1px solid #FECACA; border-radius: 12px; background: #FEF2F2;">
    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #B91C1C;">GAGAL TERKIRIM</p>
    <p style="margin: 0; font-size: 12.5px; color: #475569; line-height: 1.6;">Jelaskan penyebab dan sediakan tombol coba lagi.</p>
  </div>

</div>

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s07"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">07</span>
  <span>Spesifikasi Pengembang</span>
</h2>

### Komponen teknis untuk membangun dan memelihara aplikasi

Spesifikasi pengembang merangkum kebutuhan perangkat lunak dan layanan yang digunakan untuk membangun, menjalankan, menguji, serta memelihara Apa Kabar.

| Komponen | Spesifikasi | Peran |
|---|---|---|
| **Frontend** | Vue.js + Vite | Membangun antarmuka dan mengirim request ke REST API. |
| **Mobile wrapper** | Capacitor Android | Mengemas frontend sebagai aplikasi Android untuk pengujian pada perangkat fisik. |
| **Backend** | Laravel 12 + PHP | Menangani autentikasi, validasi, proses tiket, dan respons API. |
| **Database** | MySQL/MariaDB | Menyimpan akun, tiket, status, dan metadata lampiran. |
| **Tools pengembangan** | VS Code, Node.js/npm, Composer, PHP, Android Studio, Git/GitHub | Mendukung build frontend/backend, pengujian Android, dan version control. |
| **Pengujian** | HP Android fisik + backend aktif | Menguji login, tiket, detail, status, gambar, jaringan, dan hak akses. |
| **Deployment** | API HTTPS + storage persisten | Memberi URL yang dapat diakses lintas jaringan; menjaga ketersediaan file gambar. |

### Prasyarat operasional

- Repository frontend/backend teridentifikasi dengan jelas dan rahasia tidak disimpan di Git.
- URL API dikelola melalui konfigurasi environment, bukan tersebar di banyak file.
- Skema database dapat direproduksi melalui migration dan memiliki backup sebelum perubahan data.
- Storage foto tetap tersedia setelah deployment ulang.
- Build Android diuji kembali setelah perubahan URL API atau konfigurasi Capacitor.

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s08"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">08</span>
  <span>Spesifikasi Target &amp; Pengujian</span>
</h2>

### Definisi keberhasilan yang bisa dibuktikan

| Target | Indikator berhasil | Cara verifikasi |
|---|---|---|
| **Pelaporan terstruktur** | Pengguna mengisi field wajib dan mengirim tiket dengan respons yang jelas. | Uji data valid/tidak valid dan cek data tersimpan. |
| **Lampiran bukti** | Foto dapat dilihat kembali setelah aplikasi ditutup dan dibuka. | Uji unggah, buka detail, restart aplikasi, cek persistence. |
| **Pelacakan status** | Daftar/detail menunjukkan status terbaru dari server. | Ubah status melalui peran petugas, lalu verifikasi dari akun pelapor. |
| **Kesesuaian mobile** | Layar tidak terpotong dan kontrol utama dapat digunakan. | Uji pada perangkat dengan ukuran layar yang tersedia. |
| **Koneksi dan error** | Kegagalan jaringan tidak menghasilkan konfirmasi sukses palsu. | Putuskan jaringan saat request, lalu pulihkan dan coba ulang. |
| **Keamanan akses** | Pengguna hanya mengakses data sesuai otorisasinya. | Uji token tidak valid dan akses ke tiket pengguna lain. |

### Target nonfungsional awal

| Aspek | Target |
|---|---|
| **Usability** | Alur membuat laporan singkat; instruksi dan validasi mudah dipahami. |
| **Reliability** | Status loading, sukses, dan gagal ditampilkan secara eksplisit. |
| **Security** | HTTPS pada produksi, validasi server-side, dan kontrol akses. |
| **Maintainability** | URL API dan rahasia dipisahkan dari source code. |

<div style="display: flex; gap: 12px; margin: 22px 0; padding: 15px 18px; border: 1px solid #BBF7D0; border-left: 4px solid #15803D; border-radius: 0 12px 12px 0; background: #F0FDF4;">
  <div style="flex: none; font-size: 16px; line-height: 1.5;">📝</div>
  <div style="min-width: 0;">
    <p style="margin: 0 0 4px; font-size: 10.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #15803D;">Lengkapi dengan data nyata</p>
    <p style="margin: 0; font-size: 14.5px; line-height: 1.7; color: #475569;">Tambahkan hasil wawancara/observasi aktual, tanggal, peran responden, dan ringkasan jawaban. Hindari nama lengkap atau informasi pribadi jika tidak diperlukan. Jika belum ada data, nyatakan bahwa validasi lapangan masih menjadi pekerjaan lanjutan.</p>
  </div>
</div>

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="s09"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #BFDBFE; border-radius: 12px; background: #EFF6FF; color: #2563EB; font-size: .72em; font-weight: 800; letter-spacing: .04em;">09</span>
  <span>Kesimpulan &amp; Referensi</span>
</h2>

### Kesimpulan

Apa Kabar relevan sebagai aplikasi bergerak karena proses pelaporan kerusakan dapat membutuhkan input dan bukti visual langsung dari lokasi. Solusi mobile berpotensi memusatkan data, mempermudah pelampiran bukti, dan membantu pelacakan status—dengan syarat kebutuhan ini divalidasi terhadap pengguna sebenarnya.

Keberhasilan tidak hanya ditentukan oleh tampilan Android. Backend perlu dapat diakses secara aman, otorisasi harus benar, dan foto laporan harus disimpan secara persisten. Pengujian pada perangkat nyata serta kondisi jaringan yang beragam merupakan bagian penting dari pemenuhan kebutuhan mobile.

<div style="margin: 26px 0; padding: 22px 24px; border: 1px solid #BFDBFE; border-left: 4px solid #2563EB; border-radius: 0 14px 14px 0; background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);">
  <p style="margin: 0; font-size: 15.5px; font-style: italic; line-height: 1.75; color: #14213D;">“Aplikasi mobile yang baik bukan hanya memindahkan formulir ke ponsel — aplikasi harus membantu pengguna mengirim informasi dengan jelas, aman, dan dapat ditindaklanjuti.”</p>
</div>

### Referensi

1. Android Developers. “Guide to app architecture.” https://developer.android.com/topic/architecture
2. Android Developers. “Adapt layouts.” https://developer.android.com/design/ui/mobile/guides/layout-and-content/adapt-layout
3. Android Developers. “Responsive and adaptive design with Views.” https://developer.android.com/develop/ui/views/layout/responsive-adaptive-design-with-views
4. SP4N-LAPOR! “Layanan Aspirasi dan Pengaduan Online Rakyat.” https://sp4n.lapor.go.id/
5. LAPOR! “Pertanyaan Seputar LAPOR!” https://lapor.go.id/faq
6. Laravel. “Laravel 12.x Documentation.” https://laravel.com/docs/12.x
7. Capacitor. “Documentation.” https://capacitorjs.com/docs

<hr class="ak-rule" style="border: 0; height: 1px; background: #E2E8F0; margin: 40px 0;" />

<a id="checklist"></a>

<h2 class="ak-h2" style="display: flex; align-items: center; gap: 14px; margin: 8px 0 22px; padding-bottom: 12px; border: 0; border-bottom: 2px solid #E2E8F0; font-size: 1.55em; color: #14213D;">
  <span style="display: inline-flex; align-items: center; justify-content: center; min-width: 46px; height: 46px; padding: 0 10px; border: 1px solid #FDE68A; border-radius: 12px; background: #FFFBEB; color: #B45309; font-size: .72em; font-weight: 800; letter-spacing: .04em;">✓</span>
  <span>Checklist sebelum pengumpulan</span>
</h2>

- [ ] Isi nama, NIM, mata kuliah, dan identitas kampus.
- [ ] Cocokkan flowchart dengan proses sebenarnya.
- [ ] Tambahkan data wawancara/observasi aktual.
- [ ] Verifikasi setiap fitur terhadap repository Apa Kabar.
- [ ] Konsisten menggunakan istilah pelapor, petugas, tiket, dan status.

<div style="margin: 36px 0 0; padding: 24px 20px; text-align: center; border: 1px solid #E2E8F0; border-radius: 16px; background: #F8FAFC;">

  <p style="margin: 0 0 6px; font-weight: 700; color: #14213D;">
    Apa Kabar · Dokumen Tugas 1
  </p>

  <p style="margin: 0; font-size: 12.5px; color: #64748B;">
    Pemrograman Bergerak · Teknik Informatika · Universitas PGRI Madiun · 2026/2027
  </p>

</div>
