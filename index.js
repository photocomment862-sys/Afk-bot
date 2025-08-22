// Basit, sağlam AFK bot (cracked). Railway / lokal fark etmez.
// Ortam değişkenleri (Railway Variables veya .env):
// HOST (zorunlu), USERNAME (zorunlu), PORT (opsiyonel, varsayılan 25565), VERSION (opsiyonel)

const mineflayer = require('mineflayer');

const CFG = {
  host: process.env.HOST,
  port: parseInt(process.env.PORT || '25565', 10),
  username: process.env.USERNAME, // cracked: sadece nick
  version: process.env.VERSION || false // sürümü otomatik seçsin
};

if (!CFG.host || !CFG.username) {
  console.error('HATA: HOST ve USERNAME zorunlu. Railway -> Variables kısmına ekle.');
  process.exit(1);
}

let reconnectTimer = null;
let attempt = 0;

function createBot() {
  const bot = mineflayer.createBot({
    host: CFG.host,
    port: CFG.port,
    username: CFG.username,
    version: CFG.version
  });

  bot.once('login', () => {
    attempt = 0;
    console.log(`[OK] Giriş yapıldı: ${CFG.username} @ ${CFG.host}:${CFG.port}`);
  });

  // Basit anti-AFK döngüsü: ara ara zıpla, kol salla, biraz bakış açısını oynat
  let afkInterval = null;
  bot.once('spawn', () => {
    console.log('[SPAWN] Bot dünyaya girdi.');

    // Yarım saniyelik kısa hareketler / kol sallama
    afkInterval = setInterval(() => {
      try {
        if (!bot.entity) return;
        // Rastgele bak
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * 0.5;
        bot.look(yaw, pitch, true);

        // Kısa zıpla
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 200);

        // Kol sallama
        bot.swingArm('right');
      } catch (e) {
        console.log('AFK döngüsü hatası:', e?.message);
      }
    }, 15_000); // 15 sn’de bir
  });

  // Ölünce otomatik respawn (birçok sunucuda kendi kendine olur; yine de tetikleyelim)
  bot.on('death', () => {
    console.log('[INFO] Bot öldü, respawn bekleniyor...');
    // mineflayer genelde otomatik respawn yapar; bazı sunucular "Respawn" butonu ister.
    // Eğer gerekliyse komut/tuş gerekebilir; çoğu cracked sunucuda bu şekilde yeterli.
  });

  bot.on('kicked', (reason) => {
    console.log('[KICKED]', reason);
  });

  bot.on('end', () => {
    console.log('[END] Bağlantı koptu. Yeniden bağlanılacak.');
    if (afkInterval) clearInterval(afkInterval);
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log('[ERROR]', err?.message || err);
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  attempt += 1;
  // basit geri çekilme (max 60 sn)
  const delay = Math.min(60_000, 5_000 * attempt);
  console.log(`[RECONNECT] ${delay / 1000} sn sonra tekrar denenecek (attempt ${attempt}).`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, delay);
}

// ilk başlatma
createBot();