const RecordsController = require("../controllers/records.controller");
const recordsRouter = require("express").Router();

recordsRouter.get("/", RecordsController.getAll);

module.exports = recordsRouter;
