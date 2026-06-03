/**
 * Seeder Script: Buat dummy kegiatan untuk Pengusul MESIN & TIK
 * 
 * Generates per pengusul:
 *  - 2x revision_requested (revisi)
 *  - 2x rejected (ditolak)
 *  - 2x verified (acc verifikator)
 *  - 2x approved_wadir (acc wadir)
 *  - 2x funds_disbursed (sampai bendahara / dana cair)
 * 
 * Run: npx tsx scripts/seed-dummy.ts
 */

const ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '69fd6737000dbdd02a67';
const DB_ID = '69fd691800237a6aaa72';
const API_KEY = 'standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550';

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
};

// ============================================================
// Appwrite REST helpers
// ============================================================
async function listDocuments(collectionId: string) {
  const url = `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`listDocuments ${collectionId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function createDocument(collectionId: string, data: Record<string, any>) {
  const url = `${ENDPOINT}/databases/${DB_ID}/collections/${collectionId}/documents`;
  const body = JSON.stringify({ documentId: 'unique()', data });
  const res = await fetch(url, { method: 'POST', headers, body });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`createDocument ${collectionId}: ${res.status} ${errText}`);
  }
  return res.json();
}

// ============================================================
// Lookup user by email
// ============================================================
async function findUserByEmail(email: string) {
  const data = await listDocuments('users');
  return data.documents?.find((u: any) => u.email === email) || null;
}

// ============================================================
// STEP 1: Discover actual schema by reading existing documents
// ============================================================
async function discoverSchema() {
  console.log('🔍 Discovering Appwrite schema from existing data...\n');

  // Sample one document from each collection to see real field names
  for (const col of ['kegiatan', 'kak', 'rab', 'iku']) {
    try {
      const data = await listDocuments(col);
      if (data.documents?.length > 0) {
        const doc = data.documents[0];
        const fields = Object.keys(doc).filter(k => !k.startsWith('$'));
        console.log(`  📋 ${col}: ${fields.join(', ')}`);
      } else {
        console.log(`  📋 ${col}: (empty collection)`);
      }
    } catch (e: any) {
      console.log(`  ⚠️ ${col}: ${e.message}`);
    }
  }
  console.log('');
}

// ============================================================
// Dummy data templates
// ============================================================
interface SeedEntry {
  status: string;
  suffix: string;
}

const SEED_STATUSES: SeedEntry[] = [
  { status: 'revision_requested', suffix: 'Revisi A' },
  { status: 'revision_requested', suffix: 'Revisi B' },
  { status: 'rejected', suffix: 'Tolak A' },
  { status: 'rejected', suffix: 'Tolak B' },
  { status: 'verified', suffix: 'Acc Verif A' },
  { status: 'verified', suffix: 'Acc Verif B' },
  { status: 'approved_wadir', suffix: 'Acc Wadir A' },
  { status: 'approved_wadir', suffix: 'Acc Wadir B' },
  { status: 'funds_disbursed', suffix: 'Dana Cair A' },
  { status: 'funds_disbursed', suffix: 'Dana Cair B' },
];

const KEGIATAN_NAMES: Record<string, string[]> = {
  mesin: [
    'Workshop Pemeliharaan Mesin CNC',
    'Seminar Teknologi Otomasi Industri',
    'Pelatihan Solidworks CAD/CAM',
    'Lomba Inovasi Teknik Mesin',
    'Studi Banding Pabrik Manufaktur',
    'Sertifikasi Welding International',
    'Kunjungan Industri PT Astra',
    'Pelatihan K3 Bengkel Mesin',
    'Kompetisi Robot Nasional',
    'FGD Kurikulum Merdeka Belajar Mesin',
  ],
  tik: [
    'Hackathon Web Development 2026',
    'Workshop Cybersecurity Awareness',
    'Bootcamp Flutter & Dart',
    'Seminar Cloud Computing AWS',
    'Pelatihan DevOps CI/CD',
    'Lomba UI/UX Design Nasional',
    'Studi Banding Startup Digital',
    'Sertifikasi CompTIA Network+',
    'Workshop Machine Learning Python',
    'FGD Transformasi Digital Kampus',
  ],
};

const KAK_TEMPLATES = [
  {
    gambaran_umum: 'Kegiatan ini bertujuan untuk meningkatkan kompetensi mahasiswa melalui pelatihan praktis dan pemaparan dari praktisi industri.',
    penerima_manfaat: 'Mahasiswa aktif semester 3-6, dosen, dan staf jurusan',
    strategi_pencapaian: 'Kolaborasi dengan industri, pendampingan intensif, evaluasi berkala',
    metode_pelaksanaan: 'Tatap muka dengan pendekatan hands-on learning & project-based',
    tahapan_pelaksanaan: 'Persiapan (2 minggu) → Pelaksanaan (3 hari) → Evaluasi (1 minggu)',
  },
  {
    gambaran_umum: 'Penyelenggaraan seminar nasional untuk memperluas wawasan dan jejaring akademik serta industri.',
    penerima_manfaat: 'Seluruh civitas akademika Politeknik Negeri Jakarta',
    strategi_pencapaian: 'Mengundang pembicara kunci dari industri dan akademisi terkemuka',
    metode_pelaksanaan: 'Hybrid (luring & daring via Zoom), panel diskusi, dan networking session',
    tahapan_pelaksanaan: 'Perencanaan (1 bulan) → Promosi (2 minggu) → Pelaksanaan (1 hari) → Laporan (2 minggu)',
  },
];

// ============================================================
// Smart field builder: only include fields that exist
// ============================================================
async function buildKegiatanData(
  namaKegiatan: string,
  status: string,
  user: any,
  dateStr: string,
  deskripsi: string,
  idx: number,
  schemaFields: string[]
) {
  // Core fields that definitely exist
  const data: Record<string, any> = {
    nama_kegiatan: namaKegiatan,
    status: status,
  };

  // Conditionally add fields only if they exist in schema
  const maybeAdd = (field: string, value: any) => {
    if (schemaFields.length === 0 || schemaFields.includes(field)) {
      data[field] = value;
    }
  };

  maybeAdd('deskripsi', deskripsi);
  maybeAdd('jenis_kegiatan', idx % 2 === 0 ? 'Seminar' : 'Pelatihan');
  maybeAdd('tanggal_kegiatan', dateStr);
  maybeAdd('tempat', idx % 3 === 0 ? 'Aula Gedung A PNJ' : idx % 3 === 1 ? 'Lab Komputer Lt. 3' : 'Gedung Workshop');
  maybeAdd('pengusul_id', parseInt(user.$id || user.user_id || '1', 10));
  maybeAdd('pengusul_organisasi', user.jurusan || user.nama_jurusan || '');
  maybeAdd('verifikator_target', 'wadir1');

  if (user.jurusan_id) {
    maybeAdd('jurusan_id', typeof user.jurusan_id === 'string' ? parseInt(user.jurusan_id, 10) || 0 : user.jurusan_id);
  }

  return data;
}

// ============================================================
// Main seed function
// ============================================================
async function main() {
  console.log('🌱 Si-LATORJANA Dummy Seeder');
  console.log('============================\n');

  // Step 0: Discover schema
  await discoverSchema();

  // Step 1: Get actual field names from existing docs
  let kegiatanFields: string[] = [];
  let rabFields: string[] = [];
  try {
    const kgDocs = await listDocuments('kegiatan');
    if (kgDocs.documents?.length > 0) {
      kegiatanFields = Object.keys(kgDocs.documents[0]).filter(k => !k.startsWith('$'));
    }
  } catch {}
  try {
    const rabDocs = await listDocuments('rab');
    if (rabDocs.documents?.length > 0) {
      rabFields = Object.keys(rabDocs.documents[0]).filter(k => !k.startsWith('$'));
    }
  } catch {}

  console.log(`📊 Kegiatan fields detected: ${kegiatanFields.length > 0 ? kegiatanFields.join(', ') : '(using defaults)'}`);
  console.log(`📊 RAB fields detected: ${rabFields.length > 0 ? rabFields.join(', ') : '(using defaults)'}\n`);

  // Step 2: Find user accounts
  const mesinUser = await findUserByEmail('mesin@si-latorjana.com');
  const tikUser = await findUserByEmail('tik@si-latorjana.com');

  if (!mesinUser) { console.error('❌ User mesin@si-latorjana.com tidak ditemukan!'); process.exit(1); }
  if (!tikUser) { console.error('❌ User tik@si-latorjana.com tidak ditemukan!'); process.exit(1); }

  console.log(`✅ Mesin User: ${mesinUser.nama} (${mesinUser.$id})`);
  console.log(`✅ TIK User:   ${tikUser.nama} (${tikUser.$id})\n`);

  const users = [
    { user: mesinUser, jurusan: 'mesin', nama_jurusan: 'Teknik Mesin' },
    { user: tikUser, jurusan: 'tik', nama_jurusan: 'Teknik Informatika & Komputer' },
  ];

  let totalCreated = 0;

  for (const { user, jurusan, nama_jurusan } of users) {
    console.log(`\n📂 Membuat data untuk ${user.nama} (${nama_jurusan}):`);
    console.log('─'.repeat(50));

    const names = KEGIATAN_NAMES[jurusan];

    for (let i = 0; i < SEED_STATUSES.length; i++) {
      const { status, suffix } = SEED_STATUSES[i];
      const namaKegiatan = `${names[i]} [${suffix}]`;
      const kakTemplate = KAK_TEMPLATES[i % KAK_TEMPLATES.length];

      const daysAgo = Math.floor(Math.random() * 60) + 5;
      const dateStr = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];

      try {
        // 1. Create kegiatan (schema-safe)
        const kegiatanData = await buildKegiatanData(namaKegiatan, status, user, dateStr, kakTemplate.gambaran_umum, i, kegiatanFields);
        const kegiatanDoc = await createDocument('kegiatan', kegiatanData);
        const kegId = kegiatanDoc.$id;

        // 2. Create KAK
        const kakData: Record<string, any> = { kegiatan_id: kegId };
        kakData.gambaran_umum = kakTemplate.gambaran_umum;
        kakData.penerima_manfaat = kakTemplate.penerima_manfaat;
        kakData.strategi_pencapaian = kakTemplate.strategi_pencapaian;
        kakData.metode_pelaksanaan = kakTemplate.metode_pelaksanaan;
        kakData.tahapan_pelaksanaan = kakTemplate.tahapan_pelaksanaan;
        kakData.kurun_waktu_mulai = dateStr;
        kakData.kurun_waktu_selesai = new Date(Date.now() - (daysAgo - 7) * 86400000).toISOString().split('T')[0];

        try {
          await createDocument('kak', kakData);
        } catch (kakErr: any) {
          console.log(`    ⚠️ KAK skip: ${kakErr.message.substring(0, 80)}`);
        }

        // 3. Create RAB items (schema-adaptive)
        const rabTemplates = [
          { kategori: 'barang', uraian: 'ATK & Bahan Habis Pakai', volume: 1, harga_satuan: 350000 },
          { kategori: 'barang', uraian: 'Spanduk & Banner', volume: 2, harga_satuan: 150000 },
          { kategori: 'jasa', uraian: 'Honorarium Narasumber', volume: 6, harga_satuan: 500000 },
          { kategori: 'konsumsi', uraian: 'Konsumsi Peserta', volume: 50, harga_satuan: 35000 },
          { kategori: 'perjalanan', uraian: 'Transportasi Lokal', volume: 2, harga_satuan: 200000 },
        ];

        const rabCount = 3 + Math.floor(Math.random() * 3);
        for (let r = 0; r < rabCount && r < rabTemplates.length; r++) {
          const tmpl = rabTemplates[r];
          
          // Build RAB data based on detected schema
          const rabData: Record<string, any> = { kegiatan_id: kegId };
          
          if (rabFields.length > 0) {
            // Use detected fields
            if (rabFields.includes('kategori')) rabData.kategori = tmpl.kategori;
            if (rabFields.includes('uraian')) rabData.uraian = tmpl.uraian;
            // Try both volume and qty1
            if (rabFields.includes('volume')) rabData.volume = tmpl.volume;
            if (rabFields.includes('qty1')) rabData.qty1 = tmpl.volume;
            if (rabFields.includes('satuan1')) rabData.satuan1 = 'unit';
            if (rabFields.includes('satuan')) rabData.satuan = 'unit';
            if (rabFields.includes('harga_satuan')) rabData.harga_satuan = tmpl.harga_satuan;
            if (rabFields.includes('total')) rabData.total = tmpl.volume * tmpl.harga_satuan;
          } else {
            // Fallback: minimal safe fields
            rabData.kategori = tmpl.kategori;
            rabData.uraian = tmpl.uraian;
            rabData.volume = tmpl.volume;
            rabData.harga_satuan = tmpl.harga_satuan;
          }

          try {
            await createDocument('rab', rabData);
          } catch (rabErr: any) {
            console.log(`    ⚠️ RAB skip: ${rabErr.message.substring(0, 80)}`);
            break; // Stop trying RAB if first one fails
          }
        }

        const statusEmoji: Record<string, string> = {
          revision_requested: '🟡', rejected: '🔴', verified: '🔵',
          approved_wadir: '🟢', funds_disbursed: '💰',
        };

        console.log(`  ${statusEmoji[status] || '⚪'} ${namaKegiatan} → ${status}`);
        totalCreated++;

        // Small delay
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        console.error(`  ❌ GAGAL: ${namaKegiatan} → ${err.message.substring(0, 120)}`);
      }
    }
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Seeder selesai! Total ${totalCreated} kegiatan dummy berhasil dibuat.`);
  console.log(`   Masing-masing pengusul: 2 revisi, 2 tolak, 2 acc verif, 2 acc wadir, 2 dana cair`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
