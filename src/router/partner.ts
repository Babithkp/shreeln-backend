import express from "express";
import {
  createVehicle,
  createVendor,
  deleteVehicle,
  deleteVendor,
  filterBillLRByClient,
  filterBillLRByClientForBranch,
  filterClientByName,
  filterFMLRByVendor,
  filterFMLRByVendorForBranch,
  filterLRForClient,
  filterLRForClientForBranch,
  filterVendorByName,
  getAllVehicles,
  getAllVendors,
  getBillLRForClient,
  getClientForPage,
  getVehicleById,
  getVendorForPage,
  updateVehicleDetails,
  updateVendorDetails,
} from "../controller/partner";
const parnterRouter = express.Router();

parnterRouter.get("/partner/getAllvendors", getAllVendors);
parnterRouter.post("/partner/createVendor", createVendor);
parnterRouter.post("/partner/createVehicle", createVehicle);
parnterRouter.get("/partner/getVehicles", getAllVehicles);
parnterRouter.patch("/partner/updateVendor/:id", updateVendorDetails);
parnterRouter.delete("/partner/deleteVendor/:id", deleteVendor);
parnterRouter.patch("/partner/updateVehicle/:id", updateVehicleDetails);
parnterRouter.delete("/partner/deleteVehicle/:id", deleteVehicle);
parnterRouter.post("/partner/getVehicleById/:id", getVehicleById);
parnterRouter.post("/partner/getBillLRForClient", getBillLRForClient);
parnterRouter.post(
  "/partner/filterFMLRByVendor/:branchId",
  filterFMLRByVendorForBranch
);
parnterRouter.post(
  "/partner/filterBillLRByClientForBranch/:branchId",
  filterBillLRByClientForBranch
);
parnterRouter.post("/partner/filterFMLRByVendor", filterFMLRByVendor);
parnterRouter.post("/partner/filterBillLRByClient", filterBillLRByClient);
parnterRouter.post("/partner/filterLRForClient", filterLRForClient);
parnterRouter.post("/partner/filterLRForClientForBranch/:branchId", filterLRForClientForBranch);

parnterRouter.get("/partner/getVendorForPage", getVendorForPage);
parnterRouter.get("/partner/filterVendorByName/:name", filterVendorByName);
parnterRouter.get("/partner/getClientForPage", getClientForPage);
parnterRouter.get("/partner/filterClientByName/:name", filterClientByName);

export default parnterRouter;
