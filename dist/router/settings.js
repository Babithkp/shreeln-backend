"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settings_1 = require("../controller/settings");
const settingsRouter = express_1.default.Router();
settingsRouter.post("/settings/createCompanyProfile", settings_1.createCompanyProfile);
settingsRouter.get("/settings/getCompanyProfile", settings_1.getCompanyProfile);
settingsRouter.patch("/settings/updateCompanyProfile/:id", settings_1.updateCompanyProfile);
settingsRouter.post("/settings/createGeneralSettings", settings_1.createGeneralSettings);
settingsRouter.get("/settings/getGeneralSettings", settings_1.getGeneralSettings);
settingsRouter.patch("/settings/updateGeneralSettings/:id", settings_1.updateGeneralSettings);
settingsRouter.post("/settings/createBankDetails", settings_1.createBankDetails);
settingsRouter.get("/settings/getBankDetails", settings_1.getBankDetails);
settingsRouter.patch("/settings/updateBankDetails/:id", settings_1.updateBankDetails);
exports.default = settingsRouter;
