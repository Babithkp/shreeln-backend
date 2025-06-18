import express from "express";
import { addPaymentRecordToBill, checkBillExists, createBill, deleteBill, deleteBillByNotification, deleteBillRecordByNotification, deletePaymentRecordFromBill, filterBillBymonth, getBillByBranchId, getBillDetails, updateBillByNotification, updateBillDetails, updateBillRecordByNotification } from "../controller/billing";

const billingRouter = express.Router();

billingRouter.post("/billing/createBill", createBill);
billingRouter.get("/billing/getBillDetails", getBillDetails);
billingRouter.delete("/billing/deleteBill/:id", deleteBill);
billingRouter.patch("/billing/updateBillDetails/:id", updateBillDetails);
billingRouter.post("/billing/addPaymentRecordToBill", addPaymentRecordToBill);
billingRouter.delete("/billing/deletePaymentRecordFromBill/:id", deletePaymentRecordFromBill);
billingRouter.post("/billing/checkBillExists", checkBillExists);
billingRouter.post("/billing/sendBillEmail", filterBillBymonth);
billingRouter.get("/billing/getBillByBranchId/:branchId", getBillByBranchId);
billingRouter.patch("/billing/updateBillByNotification", updateBillByNotification);
billingRouter.post("/billing/deleteBillByNotification", deleteBillByNotification);
billingRouter.patch("/billing/updateBillRecordByNotification", updateBillRecordByNotification);
billingRouter.delete("/billing/deleteBillRecordByNotification/:id", deleteBillRecordByNotification);


export default billingRouter;