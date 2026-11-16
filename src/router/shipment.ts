import express from "express";import {
  addPaymentRecordToFM,
    createBulkPayment,
    createFM,
  createLR,
  deleteFM,
  deleteFMByNotification,
  deleteFMRecordByNotification,
  deleteLR,
  deleteLRByNotification,
  deletePaymentRecordFromFM,
  filterFMBymonth,
  filterFMBymonthForBranch,
  filterFMDetails,
  filterFMDetailsForBranch,
  filterLRDetails,
  filterLRDetailsForBranch,
  getFMByBranchId,
  getFMByPage,
  getFMByPageForBranch,
  getFMData,
  getLRByBranchId,
  getLRByLrNumber,
  getLRByPage,
  getLRByPageForBranch,
  getLRData,
  updateFM,
  updateFMByNotification,
  updateLR,
  updateLRByNotification,
  updateRecordPaymentByNotification,
} from "../controller/shipment";
import { checkPaymentForStatusChange } from "../controller/pod";
import { invalidateDashboardOnSuccess } from "../controller/utils/redis";
const shipmentRouter = express.Router();


shipmentRouter.post("/createLR", invalidateDashboardOnSuccess, createLR);
shipmentRouter.get("/getLR", getLRData);
shipmentRouter.delete("/deleteLR/:id", invalidateDashboardOnSuccess, deleteLR);
shipmentRouter.patch("/updateLR/:id", invalidateDashboardOnSuccess, updateLR);
shipmentRouter.post("/createFM", invalidateDashboardOnSuccess, createFM);
shipmentRouter.get("/getFM", getFMData);
shipmentRouter.delete("/deleteFM/:id", invalidateDashboardOnSuccess, deleteFM);
shipmentRouter.patch("/updateFM", invalidateDashboardOnSuccess, updateFM);
shipmentRouter.get("/getLRByLrNumber/:lrNumber", getLRByLrNumber);
shipmentRouter.patch("/addPaymentRecordToFM/:IDNumber", invalidateDashboardOnSuccess, addPaymentRecordToFM);
shipmentRouter.delete("/deletePaymentRecordFromFM/:IDNumber/:id", invalidateDashboardOnSuccess, deletePaymentRecordFromFM);
shipmentRouter.post("/filterFMBymonth", filterFMBymonth);
shipmentRouter.post("/filterFMBymonthForBranch/:branchId", filterFMBymonthForBranch);
shipmentRouter.post("/checkPaymentForStatusChange", checkPaymentForStatusChange);
shipmentRouter.get("/getFMByBranchId/:branchId", getFMByBranchId);
shipmentRouter.get("/getLRByBranchId/:branchId", getLRByBranchId);
shipmentRouter.patch("/updateLRByNotification", invalidateDashboardOnSuccess, updateLRByNotification);
shipmentRouter.patch("/updateFMByNotification/:id", invalidateDashboardOnSuccess, updateFMByNotification);
shipmentRouter.delete("/deleteFMByNotification/:id", invalidateDashboardOnSuccess, deleteFMByNotification);
shipmentRouter.post("/deleteLRByNotification", invalidateDashboardOnSuccess, deleteLRByNotification);
shipmentRouter.patch("/updateRecordPaymentByNotification/:id/:LRnumber", invalidateDashboardOnSuccess, updateRecordPaymentByNotification);
shipmentRouter.delete("/deleteFMRecordByNotification/:id/:IDNumber", invalidateDashboardOnSuccess, deleteFMRecordByNotification);
shipmentRouter.get("/filterLRDetails/:text", filterLRDetails);
shipmentRouter.get("/filterLRDetailsForBranch/:branchId/:text", filterLRDetailsForBranch);
shipmentRouter.get("/getLRByPage", getLRByPage);
shipmentRouter.get("/getLRByPageForBranch", getLRByPageForBranch);
shipmentRouter.get("/getFMByPage", getFMByPage);
shipmentRouter.get("/getFMByPageForBranch", getFMByPageForBranch);
shipmentRouter.get("/filterFMDetails/:text", filterFMDetails);
shipmentRouter.get("/filterFMDetailsForBranch/:branchId/:text", filterFMDetailsForBranch);
shipmentRouter.post("/createBulkPayment", invalidateDashboardOnSuccess, createBulkPayment);

export default shipmentRouter;
