#!/bin/bash

# Dapatkan IP Address aktif laptop (WiFi/LAN) yang terhubung ke internet
IP=$(ip -4 route get 8.8.8.8 | grep -oP 'src \K\S+')

echo "🚀 Mendeteksi IP Laptop: $IP"
echo "🛠️  Mengupdate api_config.dart..."

# Gunakan sed untuk mereplace IP di api_config.dart secara dinamis
sed -i -E "s/static const String _physicalDeviceIp = '[0-9\.]+';/static const String _physicalDeviceIp = '$IP';/" lib/core/constants/api_config.dart

echo "✅ IP berhasil diupdate ke $IP"
echo "📱 Menjalankan aplikasi..."

# Jalankan flutter dengan meneruskan argumen apa pun (contoh: --release)
flutter run "$@"
