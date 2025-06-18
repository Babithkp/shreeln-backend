import express from "express";import {
  branchLogin,
  createNotification,
  deleteBranch,
  deleteClient,
  filterBranchBymonth,
  filterRecordPayment,
  getAllBranchDetails,
  getBranchNotifications,
  getAllRecortPayment,
  updateBranchDetails,
  updateclientDetails,
  createNotificationForBranch,

} from "../controller/branch";
import { updateBillRecordByNotification } from "../controller/billing";

const branchRouter = express.Router();

branchRouter.post("/branch/login", branchLogin);
branchRouter.get("/branch", getAllBranchDetails);
branchRouter.post("/updateBranch", updateBranchDetails);
branchRouter.delete("/deleteBranch/:id", deleteBranch);
branchRouter.patch("/updateClient/:id", updateclientDetails);
branchRouter.delete("/deleteClient/:id", deleteClient);
branchRouter.get("/getAllRecordPayment", getAllRecortPayment);
branchRouter.post("/filterRecordPayment", filterRecordPayment);
branchRouter.post("/filterBranchBymonth", filterBranchBymonth);
branchRouter.post("/createNotification", createNotification);
branchRouter.get("/getBranchNotifications/:branchId", getBranchNotifications);
branchRouter.post("/createNotificationForBranch", createNotificationForBranch);

export default branchRouter;
