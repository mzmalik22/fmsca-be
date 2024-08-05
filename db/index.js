// getting-started.js
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.DB_CONN_URL);
}

exports.initDb = () =>
  main()
    .then(() => console.log("DB Connected"))
    .catch((err) => console.log(err));
