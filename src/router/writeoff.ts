import express from "express";import { createBillWriteOff, createFMWriteOff, deleteBillWriteOff, deleteFmWriteOff, filterWriteOff, getAllWriteOff } from "../controller/writeoff";

import { invalidateDashboardOnSuccess } from "../controller/utils/redis";

const writeOffRouter = express.Router();

writeOffRouter.post("/FMwriteOff/create", invalidateDashboardOnSuccess, createFMWriteOff); 
writeOffRouter.post("/BillwriteOff/create", invalidateDashboardOnSuccess, createBillWriteOff); 
writeOffRouter.get("/writeOff/getAll", getAllWriteOff);
writeOffRouter.delete("/FMwriteOff/delete/:id", invalidateDashboardOnSuccess, deleteFmWriteOff);
writeOffRouter.post("/BillwriteOff/delete", invalidateDashboardOnSuccess, deleteBillWriteOff);
writeOffRouter.post("/writeOff/filter", filterWriteOff);

export default writeOffRouter;
