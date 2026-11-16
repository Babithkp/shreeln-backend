"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const writeoff_1 = require("../controller/writeoff");
const redis_1 = require("../controller/utils/redis");
const writeOffRouter = express_1.default.Router();
writeOffRouter.post("/FMwriteOff/create", redis_1.invalidateDashboardOnSuccess, writeoff_1.createFMWriteOff);
writeOffRouter.post("/BillwriteOff/create", redis_1.invalidateDashboardOnSuccess, writeoff_1.createBillWriteOff);
writeOffRouter.get("/writeOff/getAll", writeoff_1.getAllWriteOff);
writeOffRouter.delete("/FMwriteOff/delete/:id", redis_1.invalidateDashboardOnSuccess, writeoff_1.deleteFmWriteOff);
writeOffRouter.post("/BillwriteOff/delete", redis_1.invalidateDashboardOnSuccess, writeoff_1.deleteBillWriteOff);
writeOffRouter.post("/writeOff/filter", writeoff_1.filterWriteOff);
exports.default = writeOffRouter;
