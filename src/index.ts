import express from "express";import cors from "cors";
import adminRouter from "./router/admin";
import branchRouter from "./router/branch";
import dotenv from "dotenv";
import multer from "multer";
import parnterRouter from "./router/partner";
import { sendFMEmail, sendLREmail } from "./controller/shipment";
import shipmentRouter from "./router/shipment";
import billingRouter from "./router/billing";
import {
  sendBillEmail,
  updateBillRecordByNotification,
} from "./controller/billing";
import settingsRouter from "./router/settings";
import { lorryReceiptsFileUpload } from "./controller/fileUpload";
import podRouter from "./router/pod";
import expensesRouter from "./router/expenses";
import cron from "node-cron";
import { checkPaymentForStatusChange } from "./controller/pod";
import { createAdmin } from "./controller/admin";
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

app.post("/api/v1/sendLREmail/:email", upload.any(), sendLREmail);
app.post("/api/v1/sendFMEmail/:email", upload.any(), sendFMEmail);
app.post("/api/v1/sendBillEmail/:email", upload.any(), sendBillEmail);
app.post("/api/v1/lorryReceiptsUpload", upload.any(), lorryReceiptsFileUpload);
// createAdmin()

const getBranchDetails = async () => {
  const AllBranches = await prisma.branches.findMany({
    select: {
      branchName: true,
      bill: {
        select: {
          total: true,
          PaymentRecords: {
            select: {
              amount: true,
            },
          },
        },
      },
    },
  });

  for (let branch of AllBranches) {
    const totalPaidAmount = branch.bill.reduce((billAcc, bill) => {
      const billTotal = bill.PaymentRecords.reduce((payAcc, payment) => {
        return payAcc + parseFloat(payment.amount || "0");
      }, 0);
      return billAcc + billTotal;
    }, 0);

    const totalBillAmount = branch.bill.reduce(
      (billAcc, bill) => (billAcc += bill.total),
      0
    );

    console.log(
      `Branch ${branch.branchName} → Total Paid: ${totalPaidAmount} → Total Bill: ${totalBillAmount}`
    );
  }
};

// getBranchDetails()

const getVendorsDetails = async () => {
  const AllVendors = await prisma.vendors.findMany({
    select: {
      name: true,
      FM: {
        include: {
          PaymentRecords: {
            select: {
              amount: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  let totalPaid = 0;
  let totalFM = 0;
  let totalPaidAmount = 0;
  for (let vendor of AllVendors) {
    totalPaidAmount += vendor.FM.reduce((acc, data) => {
      return acc + parseFloat(data.outStandingBalance || "0");
    }, 0);

    totalFM += vendor.FM.reduce(
      (acc, data) =>
        (acc +=
          parseFloat(data.hire || "0") +
          parseFloat(data.detentionCharges || "0") +
          parseFloat(data.rtoCharges || "0") +
          parseFloat(data.otherCharges || "0") -
          parseFloat(data.tds || "0")),
      0
    );

    totalPaid += vendor.FM.reduce(
      (acc, data) =>
        (acc += data.PaymentRecords.reduce((payAcc, payment) => {
          return payAcc + parseFloat(payment.amount || "0");
        }, 0)),
      0
    );

  }
  console.log(
    ` Total Pending: ${totalPaidAmount} → Total FM: ${totalFM} → Total Paid: ${totalPaid}`
  );
};
// getVendorsDetails();

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running FM status checker at midnight...");
  await checkPaymentForStatusChange();
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
