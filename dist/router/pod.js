"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pod_1 = require("../controller/pod");
const podRouter = express_1.default.Router();
podRouter.post("/pod/createPOD", pod_1.createPOD);
podRouter.get("/pod/getAllPODs", pod_1.getAllPODs);
podRouter.delete("/pod/deletePOD/:id", pod_1.deletePOD);
podRouter.patch("/pod/updatePOD/:id", pod_1.updatePODDetails);
podRouter.patch("/pod/updatePODByNotification/:id", pod_1.updatePODByNotification);
podRouter.delete("/pod/deletePODByNotification/:id", pod_1.deletePODByNotification);
exports.default = podRouter;
