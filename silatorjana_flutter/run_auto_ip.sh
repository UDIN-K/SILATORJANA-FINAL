#!/bin/bash

# Reset konfigurasi ngrok terlebih dahulu
sed -i -E "s|static const String _customBaseUrl = '.*';|static const String _customBaseUrl = '';|" lib/core/constants/api_config.dart

echo "🔍 Memeriksa apakah Ngrok sedang berjalan..."
# Mencoba mengambil URL ngrok dari API lokal ngrok (port 4040)
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | head -n 1 | grep -o 'https://.*')

if [ -n "$NGROK_URL" ]; then
    echo "🌐 Ngrok terdeteksi! Menggunakan URL: $NGROK_URL"
    sed -i -E "s|static const String _customBaseUrl = '.*';|static const String _customBaseUrl = '$NGROK_URL';|" lib/core/constants/api_config.dart
else
    # Jika tidak ada ngrok, gunakan IP lokal WiFi
    IP=$(ip -4 route get 8.8.8.8 | grep -oP 'src \K\S+')
    echo "📡 Ngrok tidak terdeteksi. Menggunakan IP WiFi Laptop: $IP"
    sed -i -E "s/static const String _physicalDeviceIp = '[0-9\.]+';/static const String _physicalDeviceIp = '$IP';/" lib/core/constants/api_config.dart
fi

echo "✅ Konfigurasi berhasil diupdate!"
echo "📱 Menjalankan aplikasi..."

# Jalankan flutter dengan meneruskan argumen apa pun (contoh: --release)
flutter run "$@"
