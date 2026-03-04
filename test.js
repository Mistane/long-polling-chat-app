//-------------testing file name---------------
const testFolder = "./messagesLog/";
const fs = require("fs");

fs.readdirSync(testFolder).forEach((file) => {
  // will also include directory names
  console.log(file);
  console.log(file.charAt(0));
});
