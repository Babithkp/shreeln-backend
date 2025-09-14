import express from "express";
import {
  branchLogin,
  createNotification,
  deleteBranch,
  deleteClient,
  filterBranchBymonth,
  getAllBranchDetails,
  getBranchNotifications,
  updateBranchDetails,
  updateclientDetails,
  createNotificationForBranch,
  getRecentPaymentsForPage,
  filterRecordPaymentByName,
  getRecentPaymentsForBranchPage,
  filterRecordPaymentByNameForBranch,
  getAllRecordPayment,
  getAllStatements,
  GetRecentTransactions,
} from "../controller/branch";

const branchRouter = express.Router();

branchRouter.post("/branch/login", branchLogin);
branchRouter.get("/branch", getAllBranchDetails);
branchRouter.post("/updateBranch", updateBranchDetails);
branchRouter.delete("/deleteBranch/:id", deleteBranch);
branchRouter.patch("/updateClient/:id", updateclientDetails);
branchRouter.delete("/deleteClient/:id", deleteClient);
branchRouter.get("/getAllRecordPayment", getAllRecordPayment);
branchRouter.get("/GetRecentTransactions", GetRecentTransactions);
branchRouter.post("/filterBranchBymonth", filterBranchBymonth);
branchRouter.post("/createNotification", createNotification);
branchRouter.get("/getBranchNotifications/:branchId", getBranchNotifications);
branchRouter.post("/createNotificationForBranch", createNotificationForBranch);
branchRouter.get("/getAllRecordPaymentForPage", getRecentPaymentsForPage);
branchRouter.get(
  "/getAllRecordPaymentForBranchPage",
  getRecentPaymentsForBranchPage
);
branchRouter.get("/filterRecordPaymentByName/:name", filterRecordPaymentByName);
branchRouter.get(
  "/filterRecordPaymentByNameForBranch/:name/:branchId",
  filterRecordPaymentByNameForBranch
);
branchRouter.get("/getStatementsToExport/:date", getAllStatements);


export default branchRouter;
