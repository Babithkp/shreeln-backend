import { Request, Response } from "express"; import { PrismaClient } from "@prisma/client";
import {
  billData,
  BillEmailBody,
  sendBillEmailToClient,
} from "./utils/billEmail";
import {
  clearAllBillCache,
  clearClientCache,
  clearDashboardCache,
  clearGetAllRecordPaymentCache,
  clearRecentTransactionCache,
  redisGetOrSetFunctions,
} from "./utils/redis";

const prisma = new PrismaClient();

export const checkBillExists = async (req: Request, res: Response) => {
  const { billNumber } = req.body;
  try {
    const bill = await prisma.bill.findUnique({
      where: {
        billNumber,
      },
    });
    console.log(bill);

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
    clientName,
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

  if (
    !billNumber ||
    !date ||
    !clientName ||
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
        name: clientName,
      },
      include: {
        bill: {
          select: {
            pendingAmount: true,
          },
        },
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
        clientId: client?.id,
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
        ...(adminId ? { adminId } : {}),
        ...(branchId ? { branchesId: branchId } : {}),
      },
    });

    const totalPendingAmount = client.bill.reduce(
      (acc, data) => acc + data.pendingAmount,
      0
    );

    const admin = await prisma.admin.findFirst();
    if (!admin) {
      res.status(400).json({
        message: "Invalid Admin Id",
      });
      return;
    }
    if (totalPendingAmount > client?.creditLimit) {
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: bill.id,
          entityType: "Credit Limit",
          actionType: "info",
          createdByRole: client.name,
          message: `The credit limit of INR ${client.creditLimit
            } for the client ${client.name
            } has reached. The current outstanding is INR ${client.pendingPayment.toFixed(
              2
            )}`,
          status: "noted",
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
    await clearDashboardCache();
    await clearAllBillCache();
    await clearClientCache();
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

    const paymentTotal =
      (oldBill.zeroToThirty ?? 0) +
      (oldBill.thirtyToSixty ?? 0) +
      (oldBill.sixtyPlus ?? 0);

    let FinalTotal;
    if (paymentTotal < subTotal) {
      FinalTotal = subTotal - paymentTotal;
    } else {
      FinalTotal = paymentTotal - subTotal;
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
        pendingAmount: FinalTotal,
        unloading: null,
        hamali: null,
        extraKmWeight: null,
        detention: null,
        weightment: null,
        others: null,
        otherCharges: null,
        lrData: {
          set: [],
        },
      },
    });

    await prisma.bill.update({
      where: { id },
      data: {
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
      },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
      include: {
        bill: {
          select: {
            pendingAmount: true,
          },
        },
      },
    });
    if (!client) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }

    const totalPendingAmount = client.bill.reduce(
      (acc, data) => acc + data.pendingAmount,
      0
    );

    if (totalPendingAmount > client?.creditLimit) {
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
          entityType: "Credit Limit",
          actionType: "info",
          createdByRole: client.name,
          message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${totalPendingAmount}`,
          status: "noted",
        },
      });
    }
    await clearDashboardCache();
    await clearAllBillCache();
    await clearClientCache();
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

export const createBillsupplementary = async (req: Request, res: Response) => {
  const {
    billNumber,
    date,
    dueDate,
    clientName,
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

  if (
    !billNumber ||
    !date ||
    !clientName ||
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
        name: clientName,
      },
      include: {
        bill: {
          select: {
            pendingAmount: true,
          },
        },
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
        clientId: client?.id,
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
        ...(adminId ? { adminId } : {}),
        ...(branchId ? { branchesId: branchId } : {}),
      },
    });



    const totalPendingAmount = client.bill.reduce(
      (acc, data) => acc + data.pendingAmount,
      0
    );

    const admin = await prisma.admin.findFirst();
    if (!admin) {
      res.status(400).json({
        message: "Invalid Admin Id",
      });
      return;
    }
    if (totalPendingAmount > client?.creditLimit) {
      await prisma.notification.create({
        data: {
          adminId: admin.id,
          requestId: bill.id,
          entityType: "Credit Limit",
          actionType: "info",
          createdByRole: client.name,
          message: `The credit limit of INR ${client.creditLimit
            } for the client ${client.name
            } has reached. The current outstanding is INR ${totalPendingAmount.toFixed(
              2
            )}`,
          status: "noted",
        },
      });
    }
    await clearDashboardCache();
    await clearAllBillCache();
    await clearClientCache();
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
        Branches: true,
        Admin: true,
      },
      orderBy: {
        billNumber: "desc",
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
      const recordPayments = await prisma.paymentRecord.findMany({
        where: {
          billId: bill.id,
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
      const totalAmount = recordPayments.reduce(
        (acc, data) => acc + parseFloat(data.amount || "0"),
        0
      );

      const oldPendingAmount =
        client.pendingPayment + totalAmount - bill.subTotal;

      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment: oldPendingAmount,
        },
      });
      await prisma.bill.delete({
        where: {
          id: bill.id,
        },
      });
      await clearDashboardCache();
      await clearAllBillCache();
      await clearClientCache();
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
    clientName: billData.Client.name,
    clientAddress: billData.Client.address,
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
export const filterBillBymonthForBranch = async (
  req: Request,
  res: Response
) => {
  const { branchId } = req.params;
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate || !branchId) {
    res.status(400).json({ message: "Invalid Date Range" });
    return;
  }
  try {
    const bills = await prisma.bill.findMany({
      where: {
        branchesId: branchId,
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
        Client: true,
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

export const getBillByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }
  const skip = (page - 1) * limit;
  try {
    const data = await redisGetOrSetFunctions({
      key: `bill-data-${page}-${skip}`,
      fetchFunction: async () => {
        const BillCount = await prisma.bill.count();
        const BillData = await prisma.bill.findMany({
          skip,
          take: limit,
          include: {
            lrData: {
              include: {
                Vehicle: true,
              },
            },
            PaymentRecords: {
              orderBy: {
                date: "desc",
              },
            },
            WriteOff: {
              select: {
                id: true,
                checked: true,
                reason: true,
              },
            },
            Client: true,
            Branches: true,
            Admin: true,
          },
          orderBy: {
            billNumber: "desc",
          },
        });
        return {
          BillCount,
          BillData,
        };
      },
    });

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBillByPageForBranch = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit || !branchId) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }
  const skip = (page - 1) * limit;
  try {
    const BillCount = await prisma.bill.count({
      where: {
        branchesId: branchId,
      },
    });
    const BillData = await prisma.bill.findMany({
      skip,
      take: limit,
      where: {
        branchesId: branchId,
      },
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
        WriteOff: {
          select: {
            id: true,
            checked: true,
            reason: true,
          },
        },
        Client: true,
        Branches: true,
        Admin: true,
      },
      orderBy: {
        billNumber: "desc",
      },
    });

    const data = {
      BillCount,
      BillData,
    };

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterBillData = async (req: Request, res: Response) => {
  const { text } = req.params;
  try {
    const bills = await prisma.bill.findMany({
      where: {
        OR: [
          { billNumber: { contains: text, mode: "insensitive" } },
          { Client: { name: { contains: text, mode: "insensitive" } } },
        ],
      },
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
        Branches: true,
        Admin: true,
        WriteOff: true
      },
      orderBy: {
        date: "desc",
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

export const filterBillDetailsForBranch = async (
  req: Request,
  res: Response
) => {
  const { branchId, text } = req.params;

  try {
    const bills = await prisma.bill.findMany({
      where: {
        branchesId: branchId,
        OR: [
          { billNumber: { contains: text, mode: "insensitive" } },
          { Client: { name: { contains: text, mode: "insensitive" } } },
        ],
      },
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
        Branches: true,
        Admin: true,
        WriteOff: true
      },
      orderBy: {
        createdAt: "desc",
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
      include: {
        Client: {
          select: {
            id: true,
          },
        },
      },
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
          id: bill.Client?.id,
        },
      });
      if (!client) return;
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment:
            client.pendingPayment +
            parseFloat(existingRecord.amount) -
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

    }
    await clearDashboardCache();
    await clearAllBillCache();
    await clearGetAllRecordPaymentCache();
    await clearRecentTransactionCache();
    await clearClientCache();
    res.status(200).json({ message: "Payment Record Added" });
  } catch (error) {
    console.error("Error adding payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

    await clearDashboardCache();
    await clearAllBillCache();
    await clearGetAllRecordPaymentCache();
    await clearRecentTransactionCache();
    await clearClientCache();
    res.status(200).json({ message: "Payment Record Deleted" });
  } catch (error) {
    console.error("Error deleting payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
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
        pendingAmount: subTotal,
        unloading: null,
        hamali: null,
        extraKmWeight: null,
        detention: null,
        weightment: null,
        others: null,
        otherCharges: null,
        lrData: {
          set: [],
        },
      },
    });

    await prisma.bill.update({
      where: { billNumber: billId },
      data: {
        unloading,
        hamali,
        extraKmWeight,
        detention,
        weightment,
        others,
        otherCharges,
        lrData: {
          connect: lrData.map((lr: any) => ({ id: lr.id })),
        },
      },
    });

    const client = await prisma.client.findUnique({
      where: {
        id: bill.clientId!,
      },
      include: {
        bill: {
          select: {
            pendingAmount: true,
          },
        },
      },
    });
    if (!client) {
      res.status(400).json({
        message: "Invalid Client Id",
      });
      return;
    }

    const totalPendingAmount = client.bill.reduce(
      (acc, data) => acc + data.pendingAmount,
      0
    );


    if (totalPendingAmount > client?.creditLimit) {
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
          entityType: "Credit Limit",
          actionType: "info",
          createdByRole: client.name,
          message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${totalPendingAmount}`,
          status: "noted",
        },
      });
    }

    await prisma.notification.create({
      data: {
        requestId: bill.billNumber,
        entityType: "Bill",
        actionType: "approved",
        createdByRole: "Admin",
        status: "noted",
        branchesId: bill.branchesId,
      },
    });
    await clearDashboardCache();
    await clearAllBillCache();
    await clearRecentTransactionCache();
    await clearClientCache();
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
          entityType: "Bill",
          actionType: "approved",
          createdByRole: "Admin",
          status: "noted",
        },
      });
      await clearDashboardCache();
      await clearAllBillCache();
      await clearClientCache();
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
        entityType: "Bill record",
        actionType: "approved",
        createdByRole: "Admin",
        status: "noted",
        branchesId: bill.branchesId,
        data: JSON.stringify({id: bill.billNumber}),
      },
    });
    await clearDashboardCache();
    await clearAllBillCache();
    await clearGetAllRecordPaymentCache();
    await clearRecentTransactionCache();
    await clearClientCache();
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



    await prisma.notification.create({
      data: {
        requestId: bill.id,
        branchesId: bill.branchesId,
        entityType: "Bill record",
        actionType: "approved",
        createdByRole: "Admin",
        status: "noted",
        data: JSON.stringify({id: bill.billNumber}),
      },
    });
    await clearDashboardCache();
    await clearAllBillCache();
    await clearGetAllRecordPaymentCache();
    await clearRecentTransactionCache();
    await clearClientCache();
    res.status(200).json({ message: "Payment Record Deleted" });
  } catch (error) {
    console.error("Error deleting payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTdsOfBill = async (req: Request, res: Response) => {
  const { id, tds } = req.params;
  if (!id || !tds) {
    res.status(400).json({
      message: "Invalid Bill Id",
    });
    return;
  }

  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
    });
    if (!bill) {
      res.status(400).json({
        message: "Invalid Bill Id",
      });
      return;
    }
    if (bill?.tdsValueHasBeenUpdated && !bill?.tdsValueHasBeenUpdated){
      await prisma.bill.update({
        where: { id },
        data: {
          tdsValueHasBeenUpdated:true
        },
      });
    }
    await prisma.bill.update({
      where: { id },
      data: {
        tds: parseInt(tds),
      },
    });
    await clearClientCache();
    await clearAllBillCache();
    res.status(200).json({
      message: "TDS Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createBulkPayment = async (req: Request, res: Response) => {
  const {
    date,
    transactionNumber,
    paymentMode,
    remarks,
    branchId,
    adminId,
    billData,
  } = req.body;
  if (!date || !transactionNumber || !paymentMode || !remarks || !billData) {
    res.status(400).json({
      message: "Invalid Payment Record Details",
    });
    return;
  }
  try {
    await Promise.all(
      billData.map(async (data: any) => {
        await prisma.paymentRecord.create({
          data: {
            IDNumber: data.billNumber,
            date,
            customerName: "",
            amount: data.amount,
            amountInWords: data.amountInWords,
            pendingAmount: data.pendingAmount,
            transactionNumber,
            paymentMode,
            remarks,
            Bill: {
              connect: { billNumber: data.billNumber },
            },
            ...(adminId ? { Admin: { connect: { id: adminId } } } : {}),
            ...(branchId ? { Branches: { connect: { id: branchId } } } : {}),
          },
        });

        const bill = await prisma.bill.findUnique({
          where: { billNumber: data.billNumber },
        });
        if (!bill) return;
        const dateDiff =
          new Date(date).getTime() - new Date(bill.createdAt).getTime();

        let settingTo: "zeroToThirty" | "thirtyToSixty" | "sixtyPlus";

        if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
          settingTo = "zeroToThirty";
        } else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
          settingTo = "thirtyToSixty";
        } else {
          settingTo = "sixtyPlus";
        }

        const updatedAmount =
          ((bill[settingTo] as number) || 0) + parseFloat(data.amount);

        await prisma.bill.update({
          where: { id: bill.id },
          data: {
            [settingTo]: updatedAmount,
            pendingAmount: parseFloat(data.pendingAmount),
          },
        });
      })
    );

    await clearAllBillCache();
    await clearClientCache();
    await clearGetAllRecordPaymentCache();
    res.status(200).json({
      message: "Successfully updated Bill details",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};


export const updateBill = async (ID:string) => {
  const payment = await prisma.paymentRecord.findUnique({
    where: { id: ID },
  });
  
  if (!payment) {
    throw new Error("Payment record not found");
  }
  
  const {
    date,
    customerName,
    amount,
    amountInWords,
    pendingAmount,
    transactionNumber,
    paymentMode,
    remarks,
    clientId,
    adminId,
    IDNumber,
    id,
  } = payment;



  try {
    const bill = await prisma.bill.findUnique({
      where: { billNumber: IDNumber },
      include: {
        Client: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!bill) {
      return;
    }
    if (id) {
      const existingRecord = await prisma.paymentRecord.findUnique({
        where: { id },
      });

      if (!existingRecord) {
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
          id: bill.Client?.id,
        },
      });
      if (!client) return;
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          pendingPayment:
            client.pendingPayment +
            parseFloat(existingRecord.amount) -
            parseFloat(amount || "0"),
        },
      });
    } 


    await clearDashboardCache();
    await clearAllBillCache();
    await clearGetAllRecordPaymentCache();
    await clearRecentTransactionCache();
    await clearClientCache();
    console.log(bill.billNumber);
    
  } catch (error) {
    console.error("Error adding payment record:", error);
  }
};