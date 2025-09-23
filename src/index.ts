import express from "express";
import cors from "cors";
import adminRouter from "./router/admin";
import branchRouter from "./router/branch";
import dotenv from "dotenv";
import multer from "multer";
import parnterRouter from "./router/partner";
import { sendFMEmail, sendLREmail } from "./controller/shipment";
import shipmentRouter from "./router/shipment";
import billingRouter from "./router/billing";
import { sendBillEmail } from "./controller/billing";
import settingsRouter from "./router/settings";
import { lorryReceiptsFileUpload } from "./controller/fileUpload";
import podRouter from "./router/pod";
import expensesRouter from "./router/expenses";
import cron from "node-cron";
import { checkPaymentForStatusChange } from "./controller/pod";
import { createAdmin } from "./controller/admin";
import writeOffRouter from "./router/writeoff";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1", adminRouter);
app.use("/api/v1", branchRouter);
app.use("/api/v1", parnterRouter);
app.use("/api/v1", shipmentRouter);
app.use("/api/v1", billingRouter);
app.use("/api/v1", settingsRouter);
app.use("/api/v1", podRouter);
app.use("/api/v1", expensesRouter);
app.use("/api/v1", writeOffRouter);

app.post("/api/v1/sendLREmail/:email", upload.any(), sendLREmail);
app.post("/api/v1/sendFMEmail/:email", upload.any(), sendFMEmail);
app.post("/api/v1/sendBillEmail/:email", upload.any(), sendBillEmail);
app.post("/api/v1/lorryReceiptsUpload", upload.any(), lorryReceiptsFileUpload);
// createAdmin()




cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running FM status checker at midnight...");
  await checkPaymentForStatusChange();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
