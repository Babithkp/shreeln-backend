import express from "express";import { createBillWriteOff, createFMWriteOff, deleteBillWriteOff, deleteFmWriteOff, filterWriteOff, getAllWriteOff } from "../controller/writeoff";

const writeOffRouter = express.Router();

writeOffRouter.post("/FMwriteOff/create", createFMWriteOff); 
writeOffRouter.post("/BillwriteOff/create", createBillWriteOff); 
writeOffRouter.get("/writeOff/getAll", getAllWriteOff);
writeOffRouter.delete("/FMwriteOff/delete/:id", deleteFmWriteOff);
writeOffRouter.post("/BillwriteOff/delete", deleteBillWriteOff);
writeOffRouter.post("/writeOff/filter", filterWriteOff);

export default writeOffRouter;
