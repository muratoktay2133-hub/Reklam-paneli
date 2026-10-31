const http = require("http");
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

const PORT = process.env.PORT || 3000;
const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const ADMIN_KEY = process.env.ADMIN_KEY;

const pending = new Map();
const accounts = new Map();

function reply(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;

      if (body.length > 10000) {
        reject(new Error("İstek çok büyük"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Geçersiz JSON"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;

  if (req.method === "GET" && path === "/health") {
    return reply(res, 200, {
      status: "ok",
      server: "Bulut Telegram Paneli",
      telegram_api_configured: Boolean(API_ID && API_HASH)
    });
  }

  if (!ADMIN_KEY || req.headers["x-admin-key"] !== ADMIN_KEY) {
    return reply(res, 401, {
      error: "Yetkisiz erişim"
    });
  }

  if (req.method === "GET" && path === "/accounts") {
    return reply(res, 200, {
      accounts: Array.from(accounts.keys())
    });
  }

  if (req.method === "POST" && path === "/auth/start") {
    try {
      if (!API_ID || !API_HASH) {
        throw new Error("Telegram API ayarları eksik");
      }

      const { phone } = await readBody(req);

      if (!/^\+[1-9]\d{7,14}$/.test(phone || "")) {
        throw new Error("Telefon numarası geçersiz");
      }

      const client = new TelegramClient(
        new StringSession(""),
        API_ID,
        API_HASH,
        { connectionRetries: 5 }
      );

      await client.connect();

      const result = await client.sendCode(
        { apiId: API_ID, apiHash: API_HASH },
        phone
      );

      if (pending.has(phone)) {
        await pending.get(phone).client.disconnect();
      }

      pending.set(phone, {
        client,
        phoneCodeHash: result.phoneCodeHash
      });

      return reply(res, 200, {
        success: true,
        message: "Telegram doğrulama kodu istendi"
      });
    } catch (err) {
      return reply(res, 400, {
        error: err.message
      });
    }
  }

  if (req.method === "POST" && path === "/auth/verify") {
    try {
      const { phone, code } = await readBody(req);
      const login = pending.get(phone);

      if (!login) {
        throw new Error("Önce doğrulama kodu isteyin");
      }

      await login.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: login.phoneCodeHash,
          phoneCode: String(code)
        })
      );

      accounts.set(phone, login.client);
      pending.delete(phone);

      return reply(res, 200, {
        success: true,
        message: "Telegram hesabı bağlandı"
      });
    } catch (err) {
      return reply(res, 400, {
        error: err.message
      });
    }
  }

  return reply(res, 404, {
    error: "Adres bulunamadı"
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bulut Telegram sunucusu ${PORT} portunda`);
});
