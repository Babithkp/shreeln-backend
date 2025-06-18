import express from "express";
import {
  createBankDetails,
  createCompanyProfile,
  createGeneralSettings,
  getBankDetails,
  getCompanyProfile,
  getGeneralSettings,
  updateBankDetails,
  updateCompanyProfile,
  updateGeneralSettings,
} from "../controller/settings";

const settingsRouter = express.Router();

settingsRouter.post("/settings/createCompanyProfile", createCompanyProfile);
settingsRouter.get("/settings/getCompanyProfile", getCompanyProfile);
settingsRouter.patch(
  "/settings/updateCompanyProfile/:id",
  updateCompanyProfile
);
settingsRouter.post("/settings/createGeneralSettings", createGeneralSettings);
settingsRouter.get("/settings/getGeneralSettings", getGeneralSettings);
settingsRouter.patch(
  "/settings/updateGeneralSettings/:id",
  updateGeneralSettings
);
settingsRouter.post("/settings/createBankDetails", createBankDetails);
settingsRouter.get("/settings/getBankDetails", getBankDetails);
settingsRouter.patch("/settings/updateBankDetails/:id", updateBankDetails);

export default settingsRouter;
