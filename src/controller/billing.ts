import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  billData,
  BillEmailBody,
  sendBillEmailToClient,
} from "./utils/billEmail";

const prisma = new PrismaClient();

export const checkBillExists = async (req: Request, res: Response) => {
  const { billNumber } = req.body;
  try {
    const bill = await prisma.bill.findUnique({
      where: {
        billNumber,
      },
    });
    if (bill) {
      res.status(200).json({
        message: "Bill Exists",
      });
    } else {
      res.status(201).json({
        message: "Bill Not Found",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createBill = async (req: Request, res: Response) => {
  const {
    billNumber,
    date,
    dueDate,
    clientId,
    hsnSacCode,
    placeOfSupply,
    state,
    statecode,
    lrData,
    igstRate,
    cgstRate,
    sgstRate,
    subTotal,
    total,
    totalInWords,
    unloading,
    hamali,
    extraKmWeight,
    detention,
    weightment,
    others,
    otherCharges,
    branchId,
    adminId,
  } = req.body;

  console.log(req.body);

  if (
    !billNumber ||
    !date ||
    !clientId ||
    !hsnSacCode ||
    !placeOfSupply ||
    !state ||
    !statecode ||
    !Array.isArray(lrData) ||
    lrData.length === 0 ||
    !subTotal ||
    !total ||
    !totalInWords
  ) {
    res.status(400).json({
      message: "Invalid Bill Details",
    });
    return;
  }

  try {
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });
    if (!client) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        date,
        dueDate,
        hsnSacCode,
        placeOfSupply,
        state,
        statecode,
        igstRate,
        cgstRate,
        sgstRate,
        subTotal,
        total,
        totalInWords,
        pendingAmount: subTotal,
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        clientId,
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
        ...(adminId ? { adminId } : {}),
        ...(branchId ? { branchesId: branchId } : {}),
      },
    });
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        pendingPayment: client.pendingPayment + subTotal,
      },
    });
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      res.status(400).json({
        message: "Invalid Admin Id",
      });
      return;
    }
    if (updatedClient?.pendingPayment > updatedClient?.creditLimit) {
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: bill.id,
          title: "Credit Limit",
          description: `The credit limit of INR ${
            updatedClient.creditLimit
          } for the client ${
            updatedClient.name
          } has reached. The current outstanding is INR ${updatedClient.pendingPayment.toFixed(
            2
          )}`,
          message: "",
          status: "one-time",
        },
      });
    }
    const billId = await prisma.admin.findFirst({
      select: {
        billId: true,
      },
    });

    if (billId) {
      await prisma.admin.update({
        where: {
          id: admin.id,
        },
        data: {
          billId: (parseFloat(billId.billId || "2800") + 1).toString(),
        },
      });
    }
    res.status(200).json({
      message: "Bill Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBillDetails = async (req: Request, res: Response) => {
  try {
    const billingData = await prisma.bill.findMany({
      include: {
        lrData: {
          include: {
            Vehicle: true,
          },
        },
        PaymentRecords: {
          orderBy: {
            date: "asc",
          },
        },
        Client: true,
        Branches:true,
        Admin:true
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    if (billingData) {
      res.status(200).json({
        message: "Bill Details",
        data: billingData,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteBill = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }
  try {
    const bill = await prisma.bill.findUnique({
      where: {
        id,
      },
    });
    if (bill) {
      await prisma.bill.delete({
        where: {
          id: bill.id,
        },
      });
      res.status(200).json({
        message: "Bill Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const sendBillEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  const billData = JSON.parse(req.body.billData);

  const subject = ` Billing summary for Shipment  - ${billData.billNumber}`;

  const bodyData: billData = {
    billNumber: billData.billNumber,
    mailBody: billData.mailBody,
    date: billData.date,
    dueDate: billData.dueDate,
    clientName: billData.clientName,
    clientAddress: billData.clientAddress,
    lrData: billData.lrData,
    total: billData.total,
  };

  try {
    let attachments: any[] = [];

    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      attachments = files.map((file: Express.Multer.File) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      }));
    }
    await sendBillEmailToClient(
      email,
      subject,
      BillEmailBody(bodyData),
      attachments
    );
    res.status(200).json({
      message: "Bill Email Sent",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateBillDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    billNumber,
    date,
    dueDate,
    hsnSacCode,
    placeOfSupply,
    state,
    statecode,
    lrData,
    igstRate,
    cgstRate,
    sgstRate,
    subTotal,
    total,
    totalInWords,
    unloading,
    hamali,
    extraKmWeight,
    detention,
    weightment,
    others,
    otherCharges,
  } = req.body;

  if (
    !billNumber ||
    !date ||
    !hsnSacCode ||
    !placeOfSupply ||
    !state ||
    !statecode ||
    !Array.isArray(lrData) ||
    lrData.length === 0 ||
    !subTotal ||
    !total ||
    !totalInWords
  ) {
    res.status(400).json({
      message: "Invalid Bill Details",
    });
    return;
  }
  try {
    const oldBill = await prisma.bill.findUnique({
      where: { id },
    });
    if (!oldBill) {
      res.status(400).json({
        message: "Bill not found",
      });
      return;
    }
    const bill = await prisma.bill.update({
      where: { id },
      data: {
        billNumber,
        date,
        dueDate,
        hsnSacCode,
        placeOfSupply,
        state,
        statecode,
        igstRate,
        cgstRate,
        sgstRate,
        subTotal,
        total,
        totalInWords,
        pendingAmount: subTotal,
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        lrData: {
          set: [],
        },
      },
    });

    await prisma.bill.update({
      where: { id },
      data: {
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
      },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
    });
    if (!client) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }
    const oldPendingAmount = client.pendingPayment - oldBill.subTotal;
    const updatedClient = await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        pendingPayment: oldPendingAmount + parseFloat(subTotal || "0"),
      },
    });
    if (updatedClient?.pendingPayment > updatedClient?.creditLimit) {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        res.status(400).json({
          message: "Invalid Admin Id",
        });
        return;
      }
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: bill.id,
          title: "Credit Limit",
          description: `The credit limit of INR ${updatedClient.creditLimit} for the client ${updatedClient.name} has reached. The current outstanding is INR ${updatedClient.pendingPayment}`,
          message: "",
          status: "one-time",
        },
      });
    }

    res.status(200).json({
      message: "Bill Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const addPaymentRecordToBill = async (req: Request, res: Response) => {
  const {
    date,
    customerName,
    amount,
    amountInWords,
    pendingAmount,
    transactionNumber,
    paymentMode,
    remarks,
    branchId,
    clientId,
    adminId,
    IDNumber,
    id,
  } = req.body;

  if (
    !IDNumber ||
    !date ||
    !customerName ||
    !amount ||
    !amountInWords ||
    !transactionNumber ||
    !paymentMode ||
    !remarks
  ) {
    res.status(400).json({ message: "Invalid Payment Record Details" });
    return;
  }

  try {
    const bill = await prisma.bill.findUnique({
      where: { billNumber: IDNumber },
    });

    if (!bill) {
      res.status(404).json({ message: "FM not found" });
      return;
    }
    if (id) {
      const existingRecord = await prisma.paymentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        res.status(404).json({ message: "Existing payment record not found" });
        return;
      }

      const prevAmount = parseFloat(existingRecord.amount || "0");
      const newAmount = parseFloat(amount || "0");
      const prevDate = new Date(existingRecord.date);
      const prevDiff = prevDate.getTime() - new Date(bill.createdAt).getTime();

      let oldBucket: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";
      if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
        oldBucket = "zeroToThirty";
      } else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
        oldBucket = "thirtyToSixty";
      } else {
        oldBucket = "sixtyPlus";
      }
      const oldOutStandingBalance = bill.pendingAmount;
      const oldAmount = Number(bill[oldBucket] || 0);
      const correctedOldAmount = oldAmount - prevAmount + newAmount;
      const newOutstanding = oldOutStandingBalance + prevAmount - newAmount;

      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          [oldBucket]: correctedOldAmount,
          pendingAmount: newOutstanding,
        },
      });
      await prisma.paymentRecord.update({
        where: { id },
        data: {
          IDNumber,
          date,
          customerName,
          amount,
          amountInWords,
          pendingAmount,
          transactionNumber,
          paymentMode,
          remarks,
        },
      });

      const client = await prisma.client.findUnique({
        where: {
          id: bill.clientId!,
        },
      });
      if (!client) return;
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment:
            client.pendingPayment -
            parseFloat(existingRecord.amount) +
            parseFloat(amount || "0"),
        },
      });
    } else {
      const oldPendingAmount = bill.pendingAmount;
      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          pendingAmount: oldPendingAmount - parseFloat(amount || "0"),
        },
      });
      const newRecord = await prisma.paymentRecord.create({
        data: {
          IDNumber,
          date,
          customerName,
          amount,
          amountInWords,
          pendingAmount: parseFloat(pendingAmount),
          transactionNumber,
          paymentMode,
          remarks,
          clientId,
          billId: bill.id,
          ...(adminId ? { adminId } : {}),
          ...(branchId ? { branchesId: branchId } : {}),
        },
      });
      const dateDiff =
        new Date(newRecord.date).getTime() - new Date(bill.createdAt).getTime();
      let settingTo: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";

      if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
        settingTo = "zeroToThirty";
      } else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
        settingTo = "thirtyToSixty";
      } else {
        settingTo = "sixtyPlus";
      }

      const updatedAmount =
        ((bill[settingTo] as number) || 0) + parseFloat(newRecord.amount);

      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          [settingTo]: updatedAmount,
          pendingAmount: parseFloat(pendingAmount),
        },
      });

      const client = await prisma.client.findUnique({
        where: {
          id: bill.clientId!,
        },
      });
      if (!client) return;
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment: client.pendingPayment + parseFloat(amount || "0"),
        },
      });
    }

    res.status(200).json({ message: "Payment Record Added" });
  } catch (error) {
    console.error("Error adding payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
    return;
  }
};

export const deletePaymentRecordFromBill = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Invalid Payment Record Id" });
    return;
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });

    if (!paymentRecord || !paymentRecord.IDNumber) {
      res.status(404).json({ message: "Payment Record not found" });
      return;
    }

    const bill = await prisma.bill.findUnique({
      where: { billNumber: paymentRecord.IDNumber },
    });

    if (!bill) {
      res.status(404).json({ message: "Bill not found" });
      return;
    }

    // 1. Determine which bucket this record belongs to
    const recordDate = new Date(paymentRecord.date);
    const billCreatedAt = new Date(bill.createdAt);
    const diff = recordDate.getTime() - billCreatedAt.getTime();

    let bucket: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";

    if (diff < 30 * 24 * 60 * 60 * 1000) {
      bucket = "zeroToThirty";
    } else if (diff < 60 * 24 * 60 * 60 * 1000) {
      bucket = "thirtyToSixty";
    } else {
      bucket = "sixtyPlus";
    }

    // 2. Adjust bucket and pendingAmount
    const bucketAmount = Number(bill[bucket] || 0);
    const amountToSubtract = parseFloat(paymentRecord.amount || "0");
    const correctedBucketAmount = bucketAmount - amountToSubtract;
    const updatedPending = bill.pendingAmount + amountToSubtract;

    // 3. Update bill
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        [bucket]: correctedBucketAmount,
        pendingAmount: updatedPending,
      },
    });

    // 4. Delete payment record
    await prisma.paymentRecord.delete({
      where: { id: paymentRecord.id },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
    });
    if (!client) return;
    await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        pendingPayment:
          client.pendingPayment - parseFloat(paymentRecord.amount || "0"),
      },
    });

    res.status(200).json({ message: "Payment Record Deleted" });
  } catch (error) {
    console.error("Error deleting payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const filterBillBymonth = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ message: "Invalid Date Range" });
    return;
  }
  try {
    const bills = await prisma.bill.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        PaymentRecords: true,
      },
    });
    if (bills) {
      res.status(200).json({
        message: "Bill Details",
        data: bills,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBillByBranchId = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  if (!branchId) {
    res.status(400).json({
      message: "Invalid Branch Id",
    });
    return;
  }
  try {
    const bills = await prisma.bill.findMany({
      where: {
        branchesId: branchId,
      },
      include: {
        PaymentRecords: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    if (bills) {
      res.status(200).json({
        message: "Bill Details",
        data: bills,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateBillByNotification = async (req: Request, res: Response) => {
  const { billId } = req.body;
  const {
    billNumber,
    date,
    dueDate,
    hsnSacCode,
    placeOfSupply,
    state,
    statecode,
    lrData,
    igstRate,
    cgstRate,
    sgstRate,
    subTotal,
    total,
    totalInWords,
    unloading,
    hamali,
    extraKmWeight,
    detention,
    weightment,
    others,
    otherCharges,
  } = req.body.data;

  if (
    !billNumber ||
    !date ||
    !hsnSacCode ||
    !placeOfSupply ||
    !state ||
    !statecode ||
    !Array.isArray(lrData) ||
    lrData.length === 0 ||
    !subTotal ||
    !total ||
    !totalInWords
  ) {
    res.status(400).json({
      message: "Invalid Bill Details",
    });
    return;
  }
  try {
    const bill = await prisma.bill.update({
      where: { billNumber: billId },
      data: {
        billNumber,
        date,
        dueDate,
        hsnSacCode,
        placeOfSupply,
        state,
        statecode,
        igstRate,
        cgstRate,
        sgstRate,
        subTotal,
        total,
        totalInWords,
        pendingAmount: total,
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        lrData: {
          set: [],
        },
      },
    });

    await prisma.bill.update({
      where: { billNumber: billId },
      data: {
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
      },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
    });
    if (!client) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }
    const oldPendingAmount = bill.pendingAmount - bill.total;
    const updatedClient = await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        pendingPayment: oldPendingAmount - parseFloat(total || "0"),
      },
    });
    if (updatedClient?.pendingPayment > updatedClient?.creditLimit) {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        res.status(400).json({
          message: "Invalid Admin Id",
        });
        return;
      }
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: bill.id,
          title: "Credit Limit",
          description: `The credit limit of INR ${updatedClient.creditLimit} for the client ${updatedClient.name} has reached. The current outstanding is INR ${updatedClient.pendingPayment}`,
          message: "",
          status: "one-time",
        },
      });
    }

    await prisma.notification.create({
      data: {
        requestId: bill.id,
        title: "Bill",
        status: "approved",
        description: "Approved",
        branchesId: bill.branchesId,
      },
    });

    res.status(200).json({
      message: "Bill Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteBillByNotification = async (req: Request, res: Response) => {
  const { billId } = req.body;

  console.log(billId);

  if (!billId) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }
  try {
    const bill = await prisma.bill.findUnique({
      where: {
        billNumber: billId,
      },
    });
    if (bill) {
      await prisma.bill.delete({
        where: {
          id: bill.id,
        },
      });

      await prisma.notification.create({
        data: {
          branchesId: bill.branchesId,
          requestId: bill.billNumber,
          title: "Bill deleted",
          status: "Approved",
          description: "Approved",
        },
      });
      res.status(200).json({
        message: "Bill Deleted",
      });
    } else {
      res.status(400).json({
        message: "Bill Delete failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateBillRecordByNotification = async (
  req: Request,
  res: Response
) => {
  const { billId, id, data } = req.body;

  if (!billId || !id) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }
  try {
    const bill = await prisma.bill.findUnique({
      where: { billNumber: billId },
    });

    if (!bill) {
      res.status(404).json({ message: "Bill not found" });
      return;
    }
    const existingRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      res.status(404).json({ message: "Existing payment record not found" });
      return;
    }

    if (data.amount) {
      const prevAmount = parseFloat(existingRecord.amount || "0");
      const newAmount = parseFloat(data.amount || "0");
      const prevDate = new Date(existingRecord.date);
      const prevDiff = prevDate.getTime() - new Date(bill.createdAt).getTime();

      let oldBucket: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";
      if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
        oldBucket = "zeroToThirty";
      } else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
        oldBucket = "thirtyToSixty";
      } else {
        oldBucket = "sixtyPlus";
      }
      const oldOutStandingBalance = bill.pendingAmount;
      const oldAmount = Number(bill[oldBucket] || 0);
      const correctedOldAmount = oldAmount - prevAmount + newAmount;
      const newOutstanding = oldOutStandingBalance + prevAmount - newAmount;

      await prisma.bill.update({
        where: { id: bill.id },
        data: {
          [oldBucket]: correctedOldAmount,
          pendingAmount: newOutstanding,
        },
      });
      await prisma.paymentRecord.update({
        where: { id },
        data: {
          ...data,
        },
      });

      const client = await prisma.client.findUnique({
        where: {
          id: bill.clientId!,
        },
      });
      if (!client) return;
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment:
            client.pendingPayment -
            parseFloat(existingRecord.amount) +
            parseFloat(data.amount || "0"),
        },
      });
    } else {
      await prisma.paymentRecord.update({
        where: { id },
        data: {
          ...data,
        },
      });
    }
    await prisma.notification.create({
      data: {
        requestId: bill.id,
        title: "Bill record",
        status: "approved",
        description: "Approved",
        branchesId: bill.branchesId,
      },
    });

    res.status(200).json({ message: "Payment Record Updated" });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteBillRecordByNotification = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Invalid Payment Record Id" });
    return;
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id },
    });

    if (!paymentRecord || !paymentRecord.IDNumber) {
      res.status(404).json({ message: "Payment Record not found" });
      return;
    }

    const bill = await prisma.bill.findUnique({
      where: { billNumber: paymentRecord.IDNumber },
    });

    if (!bill) {
      res.status(404).json({ message: "Bill not found" });
      return;
    }

    // 1. Determine which bucket this record belongs to
    const recordDate = new Date(paymentRecord.date);
    const billCreatedAt = new Date(bill.createdAt);
    const diff = recordDate.getTime() - billCreatedAt.getTime();

    let bucket: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";

    if (diff < 30 * 24 * 60 * 60 * 1000) {
      bucket = "zeroToThirty";
    } else if (diff < 60 * 24 * 60 * 60 * 1000) {
      bucket = "thirtyToSixty";
    } else {
      bucket = "sixtyPlus";
    }

    // 2. Adjust bucket and pendingAmount
    const bucketAmount = Number(bill[bucket] || 0);
    const amountToSubtract = parseFloat(paymentRecord.amount || "0");
    const correctedBucketAmount = bucketAmount - amountToSubtract;
    const updatedPending = bill.pendingAmount + amountToSubtract;

    // 3. Update bill
    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        [bucket]: correctedBucketAmount,
        pendingAmount: updatedPending,
      },
    });

    // 4. Delete payment record
    await prisma.paymentRecord.delete({
      where: { id: paymentRecord.id },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
    });
    if (!client) return;
    await prisma.client.update({
      where: {
        id: client.id,
      },
      data: {
        pendingPayment:
          client.pendingPayment - parseFloat(paymentRecord.amount || "0"),
      },
    });

    await prisma.notification.create({
      data: {
        requestId: bill.id,
        title: "Bill record deleted",
        status: "approved",
        description: "Approved",
        branchesId: bill.branchesId,
      },
    });

    res.status(200).json({ message: "Payment Record Deleted" });
  } catch (error) {
    console.error("Error deleting payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
