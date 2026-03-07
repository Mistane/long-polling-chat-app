const http = require("http");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const port = 3000;

function readFirstLine(filePath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity, // Handle both \r\n and \n line endings
    });

    rl.on("line", (line) => {
      // This event is emitted once for each line
      rl.close(); // Close the interface and stop reading
      resolve(line);
    });

    rl.on("close", () => {
      // This event is emitted after rl.close() is called
      // If we are here and the promise hasn't been resolved, it means the file was empty
      // or we are done processing.
    });

    rl.on("error", (err) => {
      reject(err);
    });
  });
}
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

const clients = new Map();
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

  //----------------------------
  let filePath;
  if (method === "GET" && pathname === "/messages") {
    // retrieve message route

    //check new messages in log, if yes retrieved immidiately
    //-----------------------------

    const timeoutId = setTimeout(() => {
      clients.delete(UID);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: null }));
    }, 30000);

    const UID = req.headers["uid"];
    const roomId = req.headers["roomid"];

    clients.set(UID, { timeoutId, roomId, client: res });
  } else if (method === "POST" && pathname === "/users/login") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      body = JSON.parse(body);
      const { username, password } = body;
      console.log(username, password);
      let UID = "";

      const database = await db.generateDb();
      for (const user of database) {
        // Check if info matched
        if (user.username === username && user.password === password) {
          UID = user.UID;
          break;
        }
      }
      if (UID !== "") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ msg: "Login success", UID, username }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ msg: "Wrong username or password" }));
      }
    });
  } else if (method === "GET" && pathname === "/users") {
    const UID = req.headers["uid"];
    const database = await db.generateDb();
    const users = [];
    for (const user of database) {
      if (user.UID != UID)
        users.push({ UID: user.UID, username: user.username });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  } else if (method === "POST" && pathname === "/users/register") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      body = JSON.parse(body);
      const { username, password } = body;
      const filePath = path.join(__dirname, "database", "registration.txt");

      fs.appendFile(
        filePath,
        `username:${username}/password:${password}\n`,
        (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ msg: "Register success" }));
          }
        },
      );
    });
  } else if (method === "POST" && pathname === "/messages") {
    console.log("Ok gui roi do");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      body = JSON.parse(body);
      //store messageLog into folder
      const { message, UID, roomId, timestamp } = body;
      const filePath = path.join(__dirname, "messagesLog", `${roomId}.txt`);

      fs.appendFile(
        filePath,
        `${UID}-${message}-${roomId}-${timestamp}\n`,
        (err) => {
          if (err) {
            console.error("Error writing file:", err);
            return;
          } else {
            console.log("Message inserted into db!");
            for (const [key, value] of clients) {
              //Check if roomId match and also if user is in the room
              if (roomId === value.roomId) {
                value.client.end(JSON.stringify(body));
                clearTimeout(value.timeoutId);
                clients.delete(key);
              }
            }
            res.end(JSON.stringify({ message: "Message sent" }));
          }
        },
      );
    });
  } else if (method === "GET" && pathname === "/chat") {
    const roomId = req.headers["roomid"];
    //Check if room exist

    //-------------------

    const filePath = path.join(__dirname, "messagesLog", `${roomId}.txt`);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ msg: "Couldnt find the requested room" }));
      } else {
        data = data.toString();
        //remove the first line

        const messageList = data.split("\n");
        messageList.shift();
        messageList.pop();
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify(`${messageList.join("///")}`)); // /// is for separating messages lol assuming that no one would ever type 3 / in a row
      }
    });
  } else if (method === "POST" && pathname === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", async () => {
      body = JSON.parse(body);
      let roomId = "";
      const { IDList } = body;
      const testFolder = "./messagesLog/";
      const files = await fs.readdirSync(testFolder);
      if (IDList.length == 2) {
        //CHeck if room already exist
        let cnt = 0; //Count number of existing room
        await (async function () {
          for (const file of files) {
            if (file.charAt(0) === "f") {
              cnt++;
              const firstLine = await readFirstLine(`./messagesLog/${file}`);
              const listId = firstLine.split("-");
              let mp = new Map();
              IDList.forEach((id) => {
                mp.set(parseInt(id), 1);
              });

              listId.forEach((id) => {
                if (mp.get(parseInt(id)) === 1) {
                  mp.set(parseInt(id), 2);
                }
              });

              let check = IDList.every((id) => mp.get(parseInt(id)) === 2);
              if (check) {
                roomId = file.slice(0, -4);
                // res.writeHead(200, { "Content-Type": "application/json" });
                // res.end(JSON.stringify(roomId));
              }
            }
          }
          return;
        })();
        if (roomId == "") {
          cnt++;
          roomId = `f${cnt}`;
          //No matched room so create a new one
          const filePath = path.join(__dirname, "messagesLog", `${roomId}.txt`);
          fs.appendFile(filePath, `${IDList.join("-")}\n`, (err) => {
            if (err) {
              console.error("Error writing file:", err);
              return;
            } else {
              console.log("Created a new room!");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(roomId));
            }
          });
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(roomId));
        }
      } else {
        //CHeck if room already exist
        let cnt = 0; //Count number of existing room
        await (async function () {
          for (const file of files) {
            if (file.charAt(0) === "g") {
              cnt++;
              const firstLine = await readFirstLine(`./messagesLog/${file}`);
              const listId = firstLine.split("-");

              // if 2 lengths isnt the same skip this file
              if (listId.length !== IDList) continue;

              let mp = new Map();
              IDList.forEach((id) => {
                mp.set(parseInt(id), 1);
              });

              listId.forEach((id) => {
                if (mp.get(parseInt(id)) === 1) {
                  mp.set(parseInt(id), 2);
                }
              });

              let check = IDList.every((id) => mp.get(parseInt(id)) === 2);
              if (check) {
                roomId = file.slice(0, -4);
                // res.writeHead(200, { "Content-Type": "application/json" });
                // res.end(JSON.stringify(roomId));
              }
            }
          }
          return;
        })();
        if (roomId == "") {
          cnt++;
          roomId = `f${cnt}`;
          //No matched room so create a new one
          const filePath = path.join(__dirname, "messagesLog", `${roomId}.txt`);
          fs.appendFile(filePath, `${IDList.join("-")}\n`, (err) => {
            if (err) {
              console.error("Error writing file:", err);
              return;
            } else {
              console.log("Created a new room!");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(roomId));
            }
          });
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(roomId));
        }
        roomId += "g";
      }
      console.log("roomId cuoi cung : ", roomId);
    });
  } else {
    //Handling static files
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
  }
});

server.listen(port, "localhost", () => {
  console.log(`Server running at http://localhost:${port}`);
});
