/**
 * @module locales/id
 * @description Indonesian locale strings for the bot.
 */

export default Object.freeze({
  // General
  welcome: '👋 Selamat datang, {name}!\n\nSaya adalah template bot Telegram yang siap produksi. Gunakan /help untuk melihat perintah yang tersedia.',
  help: '📚 *Perintah yang Tersedia*\n\n' +
    '/start \\- Mulai bot dan lihat pesan selamat datang\n' +
    '/help \\- Tampilkan pesan bantuan ini\n' +
    '/settings \\- Konfigurasi preferensi Anda\n\n' +
    '_Dibangun dengan framework grammY_ 🤖',
  unknownCommand: '❓ Perintah tidak dikenal. Gunakan /help untuk melihat perintah yang tersedia.',

  // Settings
  settingsTitle: '⚙️ *Pengaturan*\n\nPilih opsi di bawah untuk mengkonfigurasi:',
  settingsLanguage: '🌐 Bahasa',
  settingsNotifications: '🔔 Notifikasi',
  settingsBack: '◀️ Kembali',
  settingsUpdated: '✅ Pengaturan berhasil diperbarui!',
  languageChanged: '🌐 Bahasa diubah ke Bahasa Indonesia.',

  // Rate Limiting
  rateLimited: '⏳ Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.',

  // Errors
  errorGeneral: '❌ Terjadi kesalahan. Silakan coba lagi nanti.',
  errorMaintenance: '🔧 Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.',
});
