# SILATORJANA

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-40.3%25-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Dart-33.4%25-0175C2?style=flat-square&logo=dart" alt="Dart">
  <img src="https://img.shields.io/badge/PHP-10.5%25-777BB4?style=flat-square&logo=php" alt="PHP">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square&logo=opensource" alt="License">
  <img src="https://img.shields.io/github/stars/UDIN-COY/SILATORJANA?style=flat-square&logo=github" alt="Stars">
</div>

<div align="center">
  <p><strong>A comprehensive full-stack web and mobile application project combining modern frontend technologies with robust backend infrastructure.</strong></p>
</div>

---

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_description_24px.svg" width="24" alt="Description"> Overview

SILATORJANA adalah proyek multi-platform yang memanfaatkan teknologi terkini di bidang pengembangan web dan mobile. Proyek ini mengintegrasikan React, TypeScript, Flutter/Dart dengan layanan backend Laravel untuk menciptakan pengalaman pengguna yang seamless.

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_dashboard_24px.svg" width="24" alt="Tech Stack"> Tech Stack

### Frontend
| Teknologi | Deskripsi |
|-----------|-----------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20" alt="TypeScript"> TypeScript | Type-safe JavaScript untuk aplikasi web |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20" alt="React"> React | UI library untuk interface yang interaktif |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="20" alt="Vite"> Vite | Build tool ultra-cepat untuk development |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="20" alt="HTML"> HTML | Markup untuk struktur web |

### Mobile
| Teknologi | Deskripsi |
|-----------|-----------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" width="20" alt="Dart"> Dart | Bahasa pemrograman untuk Flutter |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" width="20" alt="Flutter"> Flutter | Framework cross-platform mobile development |

### Backend
| Teknologi | Deskripsi |
|-----------|-----------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" width="20" alt="PHP"> PHP | Bahasa server-side untuk API |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg" width="20" alt="Laravel"> Laravel | Framework PHP yang powerful |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" width="20" alt="MySQL"> MySQL | Database management system |

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_lightbulb_24px.svg" width="24" alt="Features"> Fitur Utama

<table>
  <tr>
    <td width="50%">
      <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_language_24px.svg" width="20" alt="Web">
      <strong> Modern Web Interface</strong>
      <br>Built dengan React + TypeScript + Vite untuk performa optimal
    </td>
    <td width="50%">
      <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/hardware/svg/production/ic_phone_android_24px.svg" width="20" alt="Mobile">
      <strong> Mobile Application</strong>
      <br>Flutter-based cross-platform app menggunakan Dart
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_api_24px.svg" width="20" alt="API">
      <strong> RESTful API</strong>
      <br>Backend Laravel dengan comprehensive API endpoints
    </td>
    <td width="50%">
      <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_security_24px.svg" width="20" alt="Security">
      <strong> Production Ready</strong>
      <br>Optimized build pipeline dengan multiple merge strategies
    </td>
  </tr>
</table>

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_trending_up_24px.svg" width="24" alt="Getting Started"> Getting Started

### <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_done_all_24px.svg" width="20" alt="Prerequisites"> Prerequisites

- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="16" alt="Node"> Node.js 16+ (untuk frontend)
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" width="16" alt="PHP"> PHP 8.0+ (untuk Laravel backend)
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" width="16" alt="Flutter"> Flutter SDK (untuk mobile development)
- <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/composer/composer-original.svg" width="16" alt="Composer"> Composer (PHP dependency manager)

### <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_download_24px.svg" width="20" alt="Installation"> Instalasi

#### Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build untuk production
npm run build
```

#### Backend Setup
```bash
# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate
```

#### Mobile Setup
```bash
# Get Flutter dependencies
flutter pub get

# Run pada emulator/device
flutter run

# Build APK
flutter build apk
```

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/file/svg/production/ic_folder_24px.svg" width="24" alt="Structure"> Struktur Project

```
SILATORJANA/
├── frontend/                # React + TypeScript web app
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── mobile/                  # Flutter mobile application
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
├── backend/                 # Laravel API server
│   ├── app/
│   ├── routes/
│   ├── config/
│   └── composer.json
├── docs/                    # Documentation
└── README.md
```

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_git_fork_24px.svg" width="24" alt="Workflow"> Development Workflow

1. <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/content/svg/production/ic_create_24px.svg" width="16" alt="Fork"> Fork repository
2. <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/content/svg/production/ic_link_24px.svg" width="16" alt="Branch"> Buat feature branch (`git checkout -b feature/amazing-feature`)
3. <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/content/svg/production/ic_save_24px.svg" width="16" alt="Commit"> Commit perubahan (`git commit -m 'Add amazing feature'`)
4. <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/content/svg/production/ic_send_24px.svg" width="16" alt="Push"> Push ke branch (`git push origin feature/amazing-feature`)
5. <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_assignment_24px.svg" width="16" alt="PR"> Buka Pull Request

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_bar_chart_24px.svg" width="24" alt="Statistics"> Repository Statistics

### Komposisi Bahasa Pemrograman
```
TypeScript  ████████████████████░░░░░░░░░░░░░░░  40.3%
Dart        ███████████████░░░░░░░░░░░░░░░░░░░░░  33.4%
PHP         █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  10.5%
HTML        ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  6.6%
Blade       ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  3.4%
Shell       █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1.8%
Other       ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  4.0%
```

### Topics & Tags
`android` • `android-application` • `dart` • `flutter` • `laravel` • `laravel-framework` • `react` • `react-router-dom` • `tsx` • `typescript` • `vite` • `webapp`

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_assignment_24px.svg" width="24" alt="License"> License

Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_favorite_24px.svg" width="24" alt="Contributing"> Contributing

Kontribusi sangat diterima! Silakan buat Pull Request untuk fitur atau bug fixes.

### Kontribusi Workflow
1. Baca dokumentasi proyek
2. Setup environment lokal
3. Buat branch feature Anda
4. Pastikan code mengikuti style guide
5. Submit pull request dengan deskripsi yang jelas

## <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_help_24px.svg" width="24" alt="Support"> Support

Untuk bantuan, silakan buka [issue](https://github.com/UDIN-COY/SILATORJANA/issues) di GitHub repository.

---

<div align="center">
  <p>
    <strong>Dibuat dengan</strong> 
    <img src="https://cdn.jsdelivr.net/gh/google/material-design-icons/action/svg/production/ic_favorite_24px.svg" width="16" alt="Love">
    <strong>oleh UDIN-COY</strong>
  </p>
  <p>
    <img src="https://img.shields.io/github/last-commit/UDIN-COY/SILATORJANA?style=flat-square&logo=github" alt="Last Commit">
    <img src="https://img.shields.io/github/repo-size/UDIN-COY/SILATORJANA?style=flat-square&logo=github" alt="Repo Size">
  </p>
</div>
