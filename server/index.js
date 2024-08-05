const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const recordsRouter = require("../routes/records.routes");

const PORT = process.env.SERVER_PORT;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: "*" }));

app.get("/", (_, res) => res.send("Hello, World!"));

app.use("/records", recordsRouter);

exports.initServer = () => {
  app.listen(PORT, () => console.log(`⚡️ Server listening on PORT:${PORT}`));
};
