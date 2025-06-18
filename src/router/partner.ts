import express from "express";import {
  createVehicle,
  createVendor,
  deleteVehicle,
  deleteVendor,
  filterBillByClient,
  filterFMByVendor,
  getAllVehicles,
  getAllVendors,
  getVehicleById,
  updateVehicleDetails,
  updateVendorDetails,
} from "../controller/partner";
const parnterRouter = express.Router();

parnterRouter.get("/getAllvendors", getAllVendors);
parnterRouter.post("/createVendor", createVendor);
parnterRouter.post("/createVehicle", createVehicle);
parnterRouter.get("/getVehicles", getAllVehicles);
parnterRouter.patch("/updateVendor/:id", updateVendorDetails);
parnterRouter.delete("/deleteVendor/:id", deleteVendor);
parnterRouter.patch("/updateVehicle/:id", updateVehicleDetails);
parnterRouter.delete("/deleteVehicle/:id", deleteVehicle);
parnterRouter.post("/getVehicleById/:id", getVehicleById);
parnterRouter.post("/filterBillByClient", filterBillByClient);
parnterRouter.post("/filterFMByVendor", filterFMByVendor);

export default parnterRouter;
