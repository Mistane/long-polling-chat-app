const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "registration.txt");
const readableStream = fs.createReadStream(filePath, "utf8");

const generateDb = async () => {
  console.log("Ok vo");

  return new Promise((resolve, reject) => {
    let content = "";
    readableStream.on("data", (chunk) => {
      console.log("reading");
      content += chunk;
    });

    let users = [];
    // Listen for the end event
    readableStream.on("end", () => {
      console.log("Finished reading file.");
      content.split("\n").forEach((item, idx) => {
        if (item !== "") {
          const info = item.split("/");

          const object = {
            UID: idx + 1,
            [info[0].split(":")[0]]: info[0].split(":")[1],
            [info[1].split(":")[0]]: info[1].split(":")[1],
          };
          users.push(object);
        }
      });
      resolve(users);
    });
  });
};

module.exports = { generateDb };
