import express from "express";
import { addPaymentRecordToBill, checkBillExists, createBill, createBillsupplementary, deleteBill, deleteBillByNotification, deleteBillRecordByNotification, deletePaymentRecordFromBill, filterBillBymonth, filterBillBymonthForBranch, filterBillData, filterBillDetailsForBranch, getBillByBranchId, getBillByPage, getBillByPageForBranch, getBillDetails, sendBillEmail, updateBillByNotification, updateBillDetails, updateBillRecordByNotification } from "../controller/billing";

const billingRouter = express.Router();

billingRouter.post("/billing/createBill", createBill);
billingRouter.post("/billing/createBillsupplementary", createBillsupplementary);
billingRouter.get("/billing/getBillDetails", getBillDetails);
billingRouter.delete("/billing/deleteBill/:id", deleteBill);
billingRouter.patch("/billing/updateBillDetails/:id", updateBillDetails);
billingRouter.post("/billing/addPaymentRecordToBill", addPaymentRecordToBill);
billingRouter.delete("/billing/deletePaymentRecordFromBill/:id", deletePaymentRecordFromBill);
billingRouter.post("/billing/checkBillExists", checkBillExists);
billingRouter.post("/billing/sendBillEmail/:email", sendBillEmail);
billingRouter.post("/billing/filterBillBymonth", filterBillBymonth);
billingRouter.post("/billing/filterBillBymonthForBranch/:branchId", filterBillBymonthForBranch);

billingRouter.get("/billing/getBillByBranchId/:branchId", getBillByBranchId);
billingRouter.patch("/billing/updateBillByNotification", updateBillByNotification);
billingRouter.post("/billing/deleteBillByNotification", deleteBillByNotification);
billingRouter.patch("/billing/updateBillRecordByNotification", updateBillRecordByNotification);
billingRouter.delete("/billing/deleteBillRecordByNotification/:id", deleteBillRecordByNotification);
billingRouter.get("/billing/getBillByPage", getBillByPage);
billingRouter.get("/billing/getBillByPageForBranch", getBillByPageForBranch);
billingRouter.get("/billing/filterBillData/:text", filterBillData);
billingRouter.get("/billing/filterBillDetailsForBranch/:branchId/:text", filterBillDetailsForBranch);

export default billingRouter;