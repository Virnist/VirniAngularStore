const fs = require('fs');
const path = require('path');

// Перевіряємо, чи є локальний файл .env (для твого комп'ютера).
// На GitHub файлу .env немає, бо там dotenv підтягне все з Infisical автоматично.
if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config();
}

const envDirectory = path.join(__dirname, 'src', 'environments');

// Якщо папки environments ще немає, створюємо її
if (!fs.existsSync(envDirectory)) {
  fs.mkdirSync(envDirectory, { recursive: true });
}

const targetPath = path.join(envDirectory, 'environment.ts');

// Формуємо вміст файлу Angular, підставляючи ключі з пам'яті (з .env або Infisical)
const envConfigFile = `export const environment = {
  production: false,
  tgToken: '${process.env.tgToken || ''}',
  tgChatId: '${process.env.tgChatId || ''}',
  youtubeApiKey: '${process.env.youtubeApiKey || ''}',
  youtubeChannelId: '${process.env.youtubeChannelId || ''}'
};
`;

// Записуємо готовий файл
fs.writeFileSync(targetPath, envConfigFile);
console.log(`✅ Робот set-env.js успішно створив файл environment.ts для Angular!`);