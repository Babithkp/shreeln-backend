import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  clearAllBillCache,
  clearClientCache,
  clearFMCache,
  clearVendorCache,
} from "./utils/redis";
import { updateFMDetails } from "./shipment";
const prisma = new PrismaClient();

export const createFMWriteOff = async (req: Request, res: Response) => {
  const { vendorName, date, IDNumber, amount, reason, branchId, checked } =
    req.body;

  if (!vendorName || !date || !IDNumber || !amount || !reason) {
    res.status(400).json({
      message: "Invalid Write Off Details",
    });
    return;
  }

  try {
    const fm = await prisma.fM.findUnique({
      where: {
        fmNumber: IDNumber,
      },
    });
    if (!fm) {
      res.status(400).json({
        message: "Invalid FM Number",
      });
      return;
    }
    const writeOff = await prisma.writeOff.create({
      data: {
        vendorName,
        date,
        IDNumber,
        amount,
        reason,
        checked,
        ...(branchId && { branchId }),
      },
    });

    await prisma.fM.update({
      where: { id: fm.id },
      data: {
        outStandingAdvance: 0,
        outStandingBalance: "0",
        WriteOff: {
          connect: { id: writeOff.id },
        },
      },
    });

    await clearFMCache();
    await clearVendorCache();
    res.status(200).json({
      message: "Write Off Created",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
export const createBillWriteOff = async (req: Request, res: Response) => {
  const { vendorName, date, IDNumber, amount, reason, branchId, checked } =
    req.body;

  if (!vendorName || !date || !IDNumber || !amount || !reason) {
    res.status(400).json({
      message: "Invalid Write Off Details",
    });
    return;
  }

  try {
    const bill = await prisma.bill.findUnique({
      where: {
        billNumber: IDNumber,
      },
    });
    if (!bill) {
      res.status(400).json({
        message: "Invalid FM Number",
      });
      return;
    }
    const writeOff = await prisma.writeOff.create({
      data: {
        vendorName,
        date,
        IDNumber,
        amount,
        reason,
        checked,
        ...(branchId && { branchId }),
      },
    });

    await prisma.bill.update({
      where: { id: bill.id },
      data: {
        pendingAmount: 0,
        WriteOff: {
          connect: { id: writeOff.id },
        },
      },
    });

    await clearAllBillCache();
    await clearClientCache();
    res.status(200).json({
      message: "Write Off Created",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const getAllWriteOff = async (req: Request, res: Response) => {
  try {
    const writeOffs = await prisma.writeOff.findMany();
    res.status(200).json({ data: writeOffs });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteFmWriteOff = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Write Off Id",
    });
    return;
  }
  try {
    const writeOff = await prisma.writeOff.findUnique({
      where: {
        IDNumber: id,
      },
    });
    if (!writeOff) {
      res.status(400).json({
        message: "Write Off not found",
      });
      return;
    }
    await prisma.writeOff.delete({
      where: {
        id: writeOff.id,
      },
    });
    await updateFMDetails(writeOff.IDNumber);
    await clearFMCache();
    await clearVendorCache();
    res.status(200).json({
      message: "Write Off Deleted",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteBillWriteOff = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({
      message: "Invalid Write Off Id",
    });
    return;
  }
  try {
    const writeOff = await prisma.writeOff.findUnique({
      where: {
        IDNumber: id,
      },
    });
    if (!writeOff) {
      res.status(400).json({
        message: "Write Off not found",
      });
      return;
    }
    await prisma.writeOff.delete({
      where: {
        id: writeOff.id,
      },
    });
    await prisma.bill.update({
      where: { id: writeOff.billId! },
      data: {
        pendingAmount: parseFloat(writeOff.amount),
      },
    });

    await clearAllBillCache();
    await clearClientCache();
    res.status(200).json({
      message: "Write Off Deleted",
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterWriteOff = async (req: Request, res: Response) => {
  const { from, to, clientName, branchId, vendorName } = req.body;

  try {
    const writeOffs = await prisma.writeOff.findMany({
      where: {
        date: { gte: from, lte: to }, // always filter by date
        ...(vendorName === "All"
          ? { fMId: { not: null } } // only FM results
          : clientName === "All"
          ? { billId: { not: null } } // only Bill results
          : {
              vendorName: {
                contains: vendorName || clientName,
                mode: "insensitive",
              },
            }),
        ...(branchId && { branchId }),
      },
    });
    if (writeOffs) {
      res.status(200).json({
        message: "Write Off Details",
        data: writeOffs,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
