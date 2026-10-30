const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8"
  });

  res.end(JSON.stringify({
    status: "ok",
    message: "Bulut Telegram sunucusu calisiyor"
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Sunucu ${PORT} portunda baslatildi`);
});
