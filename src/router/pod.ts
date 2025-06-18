import express from "express";
import { createPOD, deletePOD, deletePODByNotification, getAllPODs, updatePODByNotification, updatePODDetails } from "../controller/pod";

const podRouter = express.Router();

podRouter.post("/pod/createPOD", createPOD);
podRouter.get("/pod/getAllPODs", getAllPODs);
podRouter.delete("/pod/deletePOD/:id", deletePOD);
podRouter.patch("/pod/updatePOD/:id", updatePODDetails);
podRouter.patch("/pod/updatePODByNotification/:id", updatePODByNotification);
podRouter.delete("/pod/deletePODByNotification/:id", deletePODByNotification);

export default podRouter;