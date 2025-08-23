import express from "express";
import {
  adminLogin,
  changeAdminPassword,
  changeBranchPassword,
  createBranch,
  createClient,
  deleteNotification,
  fectchAdminData,
  getAllAdminNotifications,
  getAllClients,
  getBillId,
  getBrachersNames,
  getCreditId,
  getDashboardData,
  getDashboardDataForBranch,
  getExpenseId,
  getOtherSettings,
  updateNotification,
  updateOtherSettings,
} from "../controller/admin";

const adminRouter = express.Router();

adminRouter.post("/admin/login", adminLogin);
adminRouter.post("/admin/createBranch", createBranch);
adminRouter.get("/admin/getBranches", getBrachersNames);
adminRouter.post("/admin/changeBranchPassword", changeBranchPassword);
adminRouter.post("/admin/createClient", createClient);
adminRouter.get("/admin/getClients", getAllClients);
adminRouter.get("/admin/getAdminData", fectchAdminData);
adminRouter.get("/admin/getAllNotifications", getAllAdminNotifications);
adminRouter.delete("/admin/deleteNotification/:id", deleteNotification);
adminRouter.patch("/admin/updateNotification/:id/:status", updateNotification);
adminRouter.get("/admin/getExpenseId", getExpenseId);
adminRouter.get("/admin/getBillId", getBillId);
adminRouter.get("/admin/getCreditId", getCreditId);
adminRouter.get("/admin/getOtherSettings", getOtherSettings);
adminRouter.patch("/admin/updateOtherSettings", updateOtherSettings);
adminRouter.get("/admin/getDashboardData", getDashboardData);
adminRouter.get("/admin/getDashboardDataForBranch/:id", getDashboardDataForBranch);
adminRouter.patch("/admin/changeAdminPassword", changeAdminPassword);

export default adminRouter;
