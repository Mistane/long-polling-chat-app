const http = require("http");
const fs = require("fs");
const path = require("path");
const port = 3000;

const db = require("./database/user.database.js");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Set CORS headers (for development)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  //Handling static files
  if (method === "GET") {
    let filePath;
    if (pathname === "/") {
      filePath = path.join(__dirname, "index.html");
    } else {
      filePath = path.join(__dirname, pathname);
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("404 Not Found");
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    });
  } else if (method === "POST") {
    // Login route
    if (pathname === "/users/login") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        body = JSON.parse(body);
        const username = body["username"];
        const password = body["password"];
        let UID = "";

        const database = await db.generateDb();
        console.log("Database : ", database);
        for (const user of database) {
          // Check if info matched
          if (user.username === username && user.password === password) {
            UID = user.UID;
            break;
          }
        }
        if (UID !== "") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ msg: "Login received", UID }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ msg: "Wrong username or password" }));
        }
      });
    }

    //Register Route
    if (pathname === "/users/register") {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        body = JSON.parse(body);
        console.log(body);
        const username = body["username"];
        const password = body["password"];
        const filePath = path.join(__dirname, "database", "registration.txt");

        fs.appendFile(
          filePath,
          `username:${username}/password:${password}\n`,
          (err) => {
            if (err) {
              console.error("Error writing file:", err);
              return;
            } else {
              console.log("no err");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ msg: "Register success" }));
            }
          },
        );
      });
    }
  }
});

server.listen(port, "localhost", () => {
  console.log(`Server running at http://localhost:${port}`);
});
