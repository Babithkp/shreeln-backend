import express from "express";import {
  addPaymentRecordToFM,
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
const shipmentRouter = express.Router();

shipmentRouter.post("/createLR", createLR);
shipmentRouter.get("/getLR", getLRData);
shipmentRouter.delete("/deleteLR/:id", deleteLR);
shipmentRouter.patch("/updateLR/:id", updateLR);
shipmentRouter.post("/createFM", createFM);
shipmentRouter.get("/getFM", getFMData);
shipmentRouter.delete("/deleteFM/:id", deleteFM);
shipmentRouter.patch("/updateFM", updateFM);
shipmentRouter.get("/getLRByLrNumber/:lrNumber", getLRByLrNumber);
shipmentRouter.patch("/addPaymentRecordToFM/:IDNumber", addPaymentRecordToFM);
shipmentRouter.delete("/deletePaymentRecordFromFM/:IDNumber/:id", deletePaymentRecordFromFM);
shipmentRouter.post("/filterFMBymonth", filterFMBymonth);
shipmentRouter.post("/filterFMBymonthForBranch/:branchId", filterFMBymonthForBranch);
shipmentRouter.post("/checkPaymentForStatusChange", checkPaymentForStatusChange);
shipmentRouter.get("/getFMByBranchId/:branchId", getFMByBranchId);
shipmentRouter.get("/getLRByBranchId/:branchId", getLRByBranchId);
shipmentRouter.patch("/updateLRByNotification", updateLRByNotification);
shipmentRouter.patch("/updateFMByNotification/:id", updateFMByNotification);
shipmentRouter.delete("/deleteFMByNotification/:id", deleteFMByNotification);
shipmentRouter.post("/deleteLRByNotification", deleteLRByNotification);
shipmentRouter.patch("/updateRecordPaymentByNotification/:id/:LRnumber", updateRecordPaymentByNotification);
shipmentRouter.delete("/deleteFMRecordByNotification/:id/:IDNumber", deleteFMRecordByNotification);
shipmentRouter.get("/filterLRDetails/:text", filterLRDetails);
shipmentRouter.get("/filterLRDetailsForBranch/:branchId/:text", filterLRDetailsForBranch);
shipmentRouter.get("/getLRByPage", getLRByPage);
shipmentRouter.get("/getLRByPageForBranch", getLRByPageForBranch);
shipmentRouter.get("/getFMByPage", getFMByPage);
shipmentRouter.get("/getFMByPageForBranch", getFMByPageForBranch);
shipmentRouter.get("/filterFMDetails/:text", filterFMDetails);
shipmentRouter.get("/filterFMDetailsForBranch/:branchId/:text", filterFMDetailsForBranch);

export default shipmentRouter;
