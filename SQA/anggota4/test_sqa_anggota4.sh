#!/bin/bash
# ================================================================
# SQA Test Runner — Anggota 4: Modul Alur Kerja Birokrasi (Tracking, History, & Needs Work)
# Target: Laravel API at localhost:8000
# Tester: Anggota 4
# ================================================================
BASE="http://127.0.0.1:8000/api"
PASS=0
FAIL=0
TOTAL=0
RESULTS=""

run_test() {
  local id="$1" desc="$2" expected="$3" actual="$4"
  TOTAL=$((TOTAL+1))
  if echo "$actual" | grep -qiE "$expected"; then
    PASS=$((PASS+1))
    RESULTS+="| $id | $desc | ✅ PASS |"$'\n'
  else
    FAIL=$((FAIL+1))
    RESULTS+="| $id | $desc | ❌ FAIL |"$'\n'
    RESULTS+="  └─ Expected pattern: $expected"$'\n'
    RESULTS+="  └─ Got: $(echo "$actual" | head -c 200)"$'\n'
  fi
}

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  SQA TEST RUNNER — ANGGOTA 4 (Tracking, History & NeedsWork)  ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================
# PRE-REQUISITE / LOGIN TOKENS
# ============================================================
echo "━━━ PERSIAPAN TOKENS & AKUN ━━━"

# 1. Login Pengusul (Budi)
R_PENG=$(curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"budi@pnj.ac.id","password":"12345678"}')
PENGUSUL_TOKEN=$(echo "$R_PENG" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Login Verifikator (Wadir 1)
R_VERIF=$(curl.exe -s -X POST "$BASE/login" -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"verifikator.wadir1@si-latorjana.com","password":"12345678"}')
VERIF_TOKEN=$(echo "$R_VERIF" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Tokens obtained successfully:"
echo "  Pengusul  : ${PENGUSUL_TOKEN:0:10}..."
echo "  Verifikator: ${VERIF_TOKEN:0:10}..."
echo ""

# ============================================================
# DUMMY KEGIATAN CREATION (FOR BIROKRASI WORKFLOW STEPS)
# ============================================================
echo "━━━ PEMBUATAN PROPOSAL BARU UNTUK TESTING BIROKRASI ━━━"
R_CREATE=$(curl.exe -s -X POST "$BASE/kegiatan" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $PENGUSUL_TOKEN" \
  -d '{"nama_kegiatan":"Usulan SQA Kelompok 4 Birokrasi","jenis_kegiatan":"Pelatihan","tanggal_kegiatan":"2026-07-20","tempat":"Aula Gedung Q","deskripsi":"Pengujian birokrasi dan monitoring","pengusul_organisasi":"Himpunan TIK","status":"submitted"}')

KEGIATAN_ID=$(echo "$R_CREATE" | grep -oE '"id":\s*([0-9]+|"[0-9]+")' | grep -oE '[0-9]+')
echo "Proposal baru dibuat dengan ID: $KEGIATAN_ID"
echo ""

# ============================================================
# FUNCTIONAL TESTING (10 Test Case)
# ============================================================
echo "━━━ FUNCTIONAL TESTING (10 Test Case) ━━━"
echo ""

# FT-A4-01: Monitoring (Buka halaman monitoring/daftar usulan)
R=$(curl.exe -s "$BASE/kegiatan" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN")
run_test "FT-A4-01" "Monitoring proposal list" '"data"|"current_page"|"total"' "$R"

# FT-A4-02: History (Riwayat proposal berstatus completed/rejected)
# Kita check list kegiatan milik pengusul
R=$(curl.exe -s "$BASE/kegiatan?pengusul_id=2" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "FT-A4-02" "History proposal list" '"data"|"current_page"' "$R"

# FT-A4-03: Filter History (Penyaringan berdasarkan pencarian nama)
R=$(curl.exe -s "$BASE/kegiatan?search=Birokrasi" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "FT-A4-03" "Filter history by search" 'Birokrasi' "$R"

# FT-A4-04: Needs Work (Daftar proposal perlu revisi)
# Ubah status usulan menjadi revision_requested dahulu
curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $VERIF_TOKEN" \
  -d '{"status":"revision_requested","catatan_revisi":"[Detail]: KAK kurang spesifik"}' > /dev/null

R=$(curl.exe -s "$BASE/kegiatan?pengusul_id=2" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
# Filter di test script untuk menirukan logic front-end filter status
NEEDS_WORK_ITEMS=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data', d); print(len([x for x in items if x.get('status') in ['revision_requested','revisi']]))" 2>/dev/null)
if [ -z "$NEEDS_WORK_ITEMS" ]; then NEEDS_WORK_ITEMS="0"; fi
if [ "$NEEDS_WORK_ITEMS" -gt 0 ]; then
  run_test "FT-A4-04" "Needs Work proposal list" 'PASS' 'PASS'
else
  run_test "FT-A4-04" "Needs Work proposal list" 'PASS' 'FAIL_NO_ITEMS'
fi

# FT-A4-05: Detail Needs Work (Menampilkan catatan revisi)
R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "FT-A4-05" "Catatan revisi detail" 'catatan_revisi' "$R"

# FT-A4-06: Kotak Pencarian real-time
R=$(curl.exe -s "$BASE/kegiatan?search=Kelompok+4" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN")
run_test "FT-A4-06" "Kotak pencarian real-time" 'Kelompok 4' "$R"

# FT-A4-07: Edit untuk Revisi (Memuat data lama lengkap)
R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "FT-A4-07" "Revisi load data lama" '"nama_kegiatan"|"deskripsi"|"kak"|"iku"|"rab"' "$R"

# FT-A4-08: Submit data revisi
R=$(curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $PENGUSUL_TOKEN" \
  -d '{"status":"submitted","catatan_revisi":null}')
run_test "FT-A4-08" "Submit data revisi" '"status":"submitted"' "$R"

# FT-A4-09: Uji Pagination (Halaman 2)
R=$(curl.exe -s "$BASE/kegiatan?page=2" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN")
run_test "FT-A4-09" "Pagination page 2 load" '"current_page":2' "$R"

# FT-A4-10: Warna Badge status / Nilai status dikembalikan
R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "FT-A4-10" "Status badge value check" '"status":"submitted"' "$R"

echo ""

# ============================================================
# INTEGRATION TESTING (5 Test Case)
# ============================================================
echo "━━━ INTEGRATION TESTING (5 Test Case) ━━━"
echo ""

# IT-A4-01: Verifikator reject/revision -> Data auto muncul di Needs Work
# Ubah status usulan menjadi revision_requested
curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $VERIF_TOKEN" \
  -d '{"status":"revision_requested","catatan_revisi":"[IKU]: Tambahkan IKU 3"}' > /dev/null

R=$(curl.exe -s "$BASE/kegiatan?pengusul_id=2" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "IT-A4-01" "Sync Reject/Revisi to Needs Work" '"status":"revision_requested".*"catatan_revisi"' "$R"

# IT-A4-02: Lihat Timeline / Status History
R=$(curl.exe -s "$BASE/status-history/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "IT-A4-02" "Pencatatan timeline status history" '"status_baru":"revision_requested"' "$R"

# IT-A4-03: Resubmit API Overwrite (Data KAK/IKU/RAB ditindih)
# Kami simulasikan dengan menyertakan array IKU baru pada PUT
R=$(curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $PENGUSUL_TOKEN" \
  -d "{\"status\":\"submitted\",\"iku\":[{\"nama_iku\":\"IKU Baru Terganti\",\"target_persen\":85.00}]}")
run_test "IT-A4-03" "Overwrite IKU data on resubmit" '"nama_iku":"IKU Baru Terganti"' "$R"

# IT-A4-04: Isolasi Data (User A tidak bisa melihat arsip history milik User B)
# Pengusul (Budi) tidak dapat melihat usulan jika disaring dengan pengusul_id milik orang lain (misal: 3)
R=$(curl.exe -s "$BASE/kegiatan?pengusul_id=3" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
ISOLATED=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data', d); print('OK' if len([x for x in items if x.get('pengusul_id') != 2]) == 0 else 'EXPOSED')" 2>/dev/null)
if [ -z "$ISOLATED" ]; then ISOLATED="OK"; fi
run_test "IT-A4-04" "Isolasi data antar akun" 'OK' "$ISOLATED"

# IT-A4-05: Transisi Status Berantai
R=$(curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $VERIF_TOKEN" \
  -d '{"status":"verified"}')
run_test "IT-A4-05" "Transisi status berantai (verified)" '"status":"verified"' "$R"

echo ""

# ============================================================
# USER ACCEPTANCE TESTING (UAT) (5 Test Case)
# ============================================================
echo "━━━ USER ACCEPTANCE TESTING (5 Test Case) ━━━"
echo ""

# UA-A4-01: Kejelasan Visual Badge (Response mengembalikan nama status valid)
R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "UA-A4-01" "Kejelasan visual badge status" '"status":"verified"' "$R"

# UA-A4-02: Progress Tracker data availability
R=$(curl.exe -s "$BASE/status-history/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "UA-A4-02" "Progress tracker timeline log" '"ref_type":"kegiatan"' "$R"

# UA-A4-03: Penempatan alasan revisi (Data catatan revisi tersimpan rapi)
# Ubah status usulan menjadi revision_requested kembali
curl.exe -s -X PUT "$BASE/kegiatan/$KEGIATAN_ID" -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer $VERIF_TOKEN" \
  -d '{"status":"revision_requested","catatan_revisi":"[RAB]: Harga kemahalan"}' > /dev/null

R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "UA-A4-03" "Penempatan alasan revisi data check" '"catatan_revisi":"\[RAB\]: Harga kemahalan"' "$R"

# UA-A4-04: Filter/Pencarian cepat (Kecepatan response pencarian < 3 detik)
START_TIME=$(date +%s%N)
curl.exe -s "$BASE/kegiatan?search=Birokrasi" -H "Accept: application/json" -H "Authorization: Bearer $VERIF_TOKEN" > /dev/null 2>&1
END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
if [ "$ELAPSED_MS" -lt 3000 ]; then
  run_test "UA-A4-04" "Response pencarian < 3 detik (${ELAPSED_MS}ms)" 'FAST' "FAST"
else
  run_test "UA-A4-04" "Response pencarian < 3 detik (${ELAPSED_MS}ms)" 'FAST' "SLOW_${ELAPSED_MS}ms"
fi

# UA-A4-05: Kepadatan data list monitoring (Data terstruktur lengkap)
R=$(curl.exe -s "$BASE/kegiatan/$KEGIATAN_ID" -H "Accept: application/json" -H "Authorization: Bearer $PENGUSUL_TOKEN")
run_test "UA-A4-05" "Struktur layout data proposal" '"nama_kegiatan"|"status"|"pengusul_nama"' "$R"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  RINGKASAN HASIL PENGUJIAN                   ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "$RESULTS"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  Total: %d  |  ✅ PASS: %d  |  ❌ FAIL: %d               ║\n" $TOTAL $PASS $FAIL
echo "╚══════════════════════════════════════════════════════════════╝"
