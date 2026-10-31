const http = require("http");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const PORT = process.env.PORT || 3000;

const API_ID = process.env.TELEGRAM_API_ID;
const API_HASH = process.env.TELEGRAM_API_HASH;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });

  if (req.url === "/health") {
    return res.end(JSON.stringify({
      status: "ok",
      server: "Bulut Telegram Paneli",
      telegram_api_configured: Boolean(API_ID && API_HASH)
    }));
  }

  if (req.url === "/accounts") {
    return res.end(JSON.stringify({
      accounts: [],
      message: "Telegram hesap baglantisi henuz kurulmadı."
    }));
  }

  res.end(JSON.stringify({
    status: "ok",
    message: "Bulut Telegram sunucusu calisiyor",
    panel: "Bulut Reklam Paneli",
    telegram_api_configured: Boolean(API_ID && API_HASH)
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bulut Telegram sunucusu ${PORT} portunda calisiyor`);
});
