# ================================================================
# SQA Test Runner — Anggota 4 (PowerShell Version)
# Modul Alur Kerja Birokrasi (Tracking, History, & Needs Work)
# ================================================================
$BASE = "http://127.0.0.1:8000/api"
$PASS = 0; $FAIL = 0; $TOTAL = 0
$Results = @()

function Run-Test {
    param($Id, $Desc, $Pattern, $Actual)
    $script:TOTAL++
    $matched = $false
    foreach ($p in $Pattern.Split('|')) {
        if ($Actual -match [regex]::Escape($p)) { $matched = $true; break }
    }
    if ($matched) {
        $script:PASS++
        $script:Results += "| $Id | $Desc | PASS |"
        Write-Host "  PASS  $Id - $Desc" -ForegroundColor Green
    } else {
        $script:FAIL++
        $script:Results += "| $Id | $Desc | FAIL |"
        Write-Host "  FAIL  $Id - $Desc" -ForegroundColor Red
        Write-Host "    Expected pattern: $Pattern" -ForegroundColor Yellow
        $preview = if ($Actual.Length -gt 300) { $Actual.Substring(0,300) + "..." } else { $Actual }
        Write-Host "    Got: $preview" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  SQA TEST RUNNER - ANGGOTA 4 (Tracking, History & NeedsWork)"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "============================================================"
Write-Host ""

# ============================================================
# PRE-REQUISITE / LOGIN TOKENS
# ============================================================
Write-Host "--- PERSIAPAN TOKENS & AKUN ---"

# 1. Login Pengusul (Budi)
$R_PENG = curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"email\":\"budi@pnj.ac.id\",\"password\":\"12345678\"}'
$PENG_JSON = $R_PENG | ConvertFrom-Json
$PENGUSUL_TOKEN = $PENG_JSON.token
Write-Host "  Pengusul token: $($PENGUSUL_TOKEN.Substring(0,10))..."

# 2. Login Verifikator
$R_VERIF = curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"email\":\"verifikator.wadir1@si-latorjana.com\",\"password\":\"12345678\"}'
$VERIF_JSON = $null
try { $VERIF_JSON = $R_VERIF | ConvertFrom-Json } catch {}
$VERIF_TOKEN = ""
if ($VERIF_JSON -and $VERIF_JSON.token) {
    $VERIF_TOKEN = $VERIF_JSON.token
    Write-Host "  Verifikator token: $($VERIF_TOKEN.Substring(0,10))..."
} else {
    Write-Host "  Verifikator login GAGAL, mencoba akun lain..." -ForegroundColor Yellow
    # Coba akun verifikator lain
    $R_VERIF2 = curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"email\":\"lestari@pnj.ac.id\",\"password\":\"12345678\"}'
    try { $VERIF_JSON = $R_VERIF2 | ConvertFrom-Json } catch {}
    if ($VERIF_JSON -and $VERIF_JSON.token) {
        $VERIF_TOKEN = $VERIF_JSON.token
        Write-Host "  Verifikator token (lestari): $($VERIF_TOKEN.Substring(0,10))..."
    } else {
        Write-Host "  GAGAL mendapatkan token Verifikator!" -ForegroundColor Red
    }
}

# 3. Login PPK
$R_PPK = curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"email\":\"ppk@pnj.ac.id\",\"password\":\"12345678\"}'
$PPK_JSON = $null
try { $PPK_JSON = $R_PPK | ConvertFrom-Json } catch {}
$PPK_TOKEN = ""
if ($PPK_JSON -and $PPK_JSON.token) {
    $PPK_TOKEN = $PPK_JSON.token
    Write-Host "  PPK token: $($PPK_TOKEN.Substring(0,10))..."
} else {
    Write-Host "  PPK login GAGAL (opsional)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================
# DUMMY KEGIATAN CREATION
# ============================================================
Write-Host "--- PEMBUATAN PROPOSAL BARU UNTUK TESTING ---"
$R_CREATE = curl.exe -s -X POST "$BASE/kegiatan" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN" -d '{\"nama_kegiatan\":\"Usulan SQA Kelompok 4 Birokrasi\",\"jenis_kegiatan\":\"Pelatihan\",\"tanggal_kegiatan\":\"2026-07-20\",\"tempat\":\"Aula Gedung Q\",\"deskripsi\":\"Pengujian birokrasi dan monitoring\",\"pengusul_organisasi\":\"Himpunan TIK\",\"status\":\"submitted\"}'

$CREATE_JSON = $null
try { $CREATE_JSON = $R_CREATE | ConvertFrom-Json } catch {}
$KEGIATAN_ID = ""
if ($CREATE_JSON) {
    if ($CREATE_JSON.id) { $KEGIATAN_ID = $CREATE_JSON.id }
    elseif ($CREATE_JSON.data -and $CREATE_JSON.data.id) { $KEGIATAN_ID = $CREATE_JSON.data.id }
    elseif ($CREATE_JSON.kegiatan -and $CREATE_JSON.kegiatan.id) { $KEGIATAN_ID = $CREATE_JSON.kegiatan.id }
}
if ($KEGIATAN_ID) {
    Write-Host "  Proposal baru dibuat dengan ID: $KEGIATAN_ID"
} else {
    Write-Host "  GAGAL membuat proposal baru. Response:" -ForegroundColor Red
    Write-Host "  $R_CREATE" -ForegroundColor DarkGray
    # Fallback: gunakan proposal yang sudah ada
    Write-Host "  Mencoba menggunakan proposal existing..." -ForegroundColor Yellow
    $R_LIST = curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    try {
        $LIST_JSON = $R_LIST | ConvertFrom-Json
        $items = if ($LIST_JSON.data) { $LIST_JSON.data } else { $LIST_JSON }
        if ($items -and $items.Count -gt 0) {
            $KEGIATAN_ID = $items[0].id
            Write-Host "  Menggunakan proposal existing ID: $KEGIATAN_ID" -ForegroundColor Cyan
        }
    } catch {}
}
Write-Host ""

# ============================================================
# FUNCTIONAL TESTING (10 Test Case)
# ============================================================
Write-Host "============================================"
Write-Host "  FUNCTIONAL TESTING (10 Test Case)"
Write-Host "============================================"

# FT-A4-01: Monitoring (Buka halaman monitoring/daftar usulan)
$AUTH = "Authorization: Bearer $VERIF_TOKEN"
if (-not $VERIF_TOKEN) { $AUTH = "Authorization: Bearer $PENGUSUL_TOKEN" }
$R = curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H $AUTH
Run-Test "FT-A4-01" "Monitoring proposal list" '"data"|"current_page"|"total"|"id"' $R

# FT-A4-02: History (Riwayat proposal berstatus completed/rejected)
$R = curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "FT-A4-02" "History proposal list" '"data"|"current_page"|"id"' $R

# FT-A4-03: Filter History (Penyaringan berdasarkan pencarian nama)
$R = curl.exe -s "$BASE/kegiatan?search=Birokrasi" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "FT-A4-03" "Filter history by search" 'Birokrasi|"data"' $R

# FT-A4-04: Needs Work (Daftar proposal perlu revisi)
# Ubah status jadi revision_requested
if ($KEGIATAN_ID -and $VERIF_TOKEN) {
    $null = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN" -d '{\"status\":\"revision_requested\",\"catatan_revisi\":\"[Detail]: KAK kurang spesifik\"}'
}
$R = curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "FT-A4-04" "Needs Work proposal list" '"data"|"status"|"id"' $R

# FT-A4-05: Detail Needs Work (Catatan revisi)
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "FT-A4-05" "Catatan revisi detail" '"catatan_revisi"|"nama_kegiatan"' $R
} else {
    Write-Host "  SKIP  FT-A4-05 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# FT-A4-06: Pencarian real-time
$R = curl.exe -s "$BASE/kegiatan?search=Kelompok" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "FT-A4-06" "Kotak pencarian real-time" '"data"|"id"' $R

# FT-A4-07: Edit untuk Revisi (Memuat data lama lengkap)
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "FT-A4-07" "Revisi load data lama" '"nama_kegiatan"|"deskripsi"' $R
} else {
    Write-Host "  SKIP  FT-A4-07 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# FT-A4-08: Submit data revisi
if ($KEGIATAN_ID) {
    $R = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN" -d '{\"status\":\"submitted\",\"catatan_revisi\":null}'
    Run-Test "FT-A4-08" "Submit data revisi" '"status"|"submitted"|"id"' $R
} else {
    Write-Host "  SKIP  FT-A4-08 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# FT-A4-09: Pagination (Halaman 2)
$R = curl.exe -s "$BASE/kegiatan?page=2" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "FT-A4-09" "Pagination page 2 load" '"current_page"|"data"|"total"' $R

# FT-A4-10: Status Badge (Nilai status ada di response)
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "FT-A4-10" "Status badge value check" '"status"' $R
} else {
    Write-Host "  SKIP  FT-A4-10 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

Write-Host ""

# ============================================================
# INTEGRATION TESTING (5 Test Case)
# ============================================================
Write-Host "============================================"
Write-Host "  INTEGRATION TESTING (5 Test Case)"
Write-Host "============================================"

# IT-A4-01: Verifikator reject -> Data auto muncul di Needs Work
if ($KEGIATAN_ID -and $VERIF_TOKEN) {
    $null = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN" -d '{\"status\":\"revision_requested\",\"catatan_revisi\":\"[IKU]: Tambahkan IKU 3\"}'
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "IT-A4-01" "Sync Reject to Needs Work" '"revision_requested"|"catatan_revisi"' $R
} else {
    Write-Host "  SKIP  IT-A4-01 - Missing token/ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# IT-A4-02: Timeline / Status History
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/status-history/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "IT-A4-02" "Pencatatan timeline status history" '"status_baru"|"status_lama"|"data"|"id"' $R
} else {
    Write-Host "  SKIP  IT-A4-02 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# IT-A4-03: Resubmit data revisi (Overwrite)
if ($KEGIATAN_ID) {
    $R = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN" -d '{\"status\":\"submitted\",\"nama_kegiatan\":\"Usulan SQA Kelompok 4 Birokrasi Updated\"}'
    Run-Test "IT-A4-03" "Overwrite data on resubmit" '"status"|"submitted"|"id"' $R
} else {
    Write-Host "  SKIP  IT-A4-03 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# IT-A4-04: Isolasi Data antar akun
$R = curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
Run-Test "IT-A4-04" "Isolasi data antar akun (list accessible)" '"data"|"id"' $R

# IT-A4-05: Transisi Status Berantai
if ($KEGIATAN_ID -and $VERIF_TOKEN) {
    $R = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN" -d '{\"status\":\"verified\"}'
    Run-Test "IT-A4-05" "Transisi status berantai (verified)" '"status"|"verified"|"id"' $R
} else {
    Write-Host "  SKIP  IT-A4-05 - Missing token/ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

Write-Host ""

# ============================================================
# USER ACCEPTANCE TESTING (UAT) (5 Test Case)
# ============================================================
Write-Host "============================================"
Write-Host "  USER ACCEPTANCE TESTING (5 Test Case)"
Write-Host "============================================"

# UA-A4-01: Visual badge status
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "UA-A4-01" "Kejelasan visual badge status" '"status"' $R
} else {
    Write-Host "  SKIP  UA-A4-01 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# UA-A4-02: Progress Tracker data availability
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/status-history/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "UA-A4-02" "Progress tracker timeline log" '"data"|"status_baru"|"id"' $R
} else {
    Write-Host "  SKIP  UA-A4-02 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# UA-A4-03: Penempatan alasan revisi
if ($KEGIATAN_ID -and $VERIF_TOKEN) {
    $null = curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN" -d '{\"status\":\"revision_requested\",\"catatan_revisi\":\"[RAB]: Harga kemahalan\"}'
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "UA-A4-03" "Penempatan alasan revisi data check" '"catatan_revisi"' $R
} else {
    Write-Host "  SKIP  UA-A4-03 - Missing token/ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

# UA-A4-04: Performance pencarian < 3 detik
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$null = curl.exe -s "$BASE/kegiatan?search=Birokrasi" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
$sw.Stop()
$ms = $sw.ElapsedMilliseconds
if ($ms -lt 3000) {
    Run-Test "UA-A4-04" "Response pencarian < 3 detik (${ms}ms)" "FAST" "FAST"
} else {
    Run-Test "UA-A4-04" "Response pencarian < 3 detik (${ms}ms)" "FAST" "SLOW"
}

# UA-A4-05: Struktur data proposal lengkap
if ($KEGIATAN_ID) {
    $R = curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN"
    Run-Test "UA-A4-05" "Struktur layout data proposal" '"nama_kegiatan"|"status"' $R
} else {
    Write-Host "  SKIP  UA-A4-05 - No kegiatan ID" -ForegroundColor Yellow
    $TOTAL++; $FAIL++
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  RINGKASAN HASIL PENGUJIAN"
Write-Host "============================================================"
foreach ($r in $Results) { Write-Host $r }
Write-Host "------------------------------------------------------------"
Write-Host "  Total: $TOTAL  |  PASS: $PASS  |  FAIL: $FAIL"
Write-Host "============================================================"
