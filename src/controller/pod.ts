import { Request, Response } from "express";import { PrismaClient } from "@prisma/client";
import { deleteLRFile } from "./fileUpload";
import { clearPODCache, redisGetOrSetFunctions } from "./utils/redis";

const prisma = new PrismaClient();

export const createPOD = async (req: Request, res: Response) => {
  const {
    lrNumber,
    date,
    from,
    to,
    clientName,
    clientGSTIN,
    receivingDate,
    receivingBranch,
    documentLink,
    branchesId,
    adminId,
  } = req.body;

  if (
    !lrNumber ||
    !date ||
    !from ||
    !to ||
    !clientName ||
    !clientGSTIN ||
    !receivingDate ||
    !receivingBranch ||
    !documentLink
  ) {
    res.status(400).json({
      message: "Invalid POD Details",
    });
    return;
  }

  try {
    const lr = await prisma.lR.findUnique({
      where: {
        lrNumber: lrNumber,
      },
    });

    await prisma.pOD.create({
      data: {
        lrNumber,
        date,
        from,
        to,
        clientName,
        clientGSTIN,
        receivingDate,
        receivingBranch,
        documentLink,
        lRId: lr?.id,
        ...(adminId ? { adminId } : {}),
        ...(branchesId ? { branchesId } : {}),
      },
    });

    const FM = await prisma.fM.findFirst({
      where: {
        LRDetails: {
          some: {
            lrNumber: lrNumber,
          },
        },
      },
    });
    if (FM) {
      const isOnlyOneLR = FM.LRDetails.length === 1;

      const updatedLRDetails = FM.LRDetails.map((lr) =>
        lr.lrNumber === lrNumber ? { ...lr, status: "paid" } : lr
      );

      if ((FM.status === "open" || FM.status === "pending") && isOnlyOneLR) {
        await prisma.fM.update({
          where: { id: FM.id },
          data: {
            status: "delivered",
            LRDetails: updatedLRDetails,
          },
        });
      } else if (
        (FM.status === "open" ||
          FM.status === "pending" ||
          FM.status === "partially Delivered") &&
        !isOnlyOneLR
      ) {
        const isAllPaid = updatedLRDetails.every((lr) => lr.status === "paid");

        await prisma.fM.update({
          where: { id: FM.id },
          data: {
            status: isAllPaid ? "delivered" : "partially Delivered",
            LRDetails: updatedLRDetails,
          },
        });
      }
    }
    await clearPODCache()
    res.status(200).json({
      message: "POD Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllPODs = async (req: Request, res: Response) => {
  try {
    const pods = await prisma.pOD.findMany({
      orderBy: {
        date: "desc",
      },
    });
    res.status(200).json({ data: pods });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deletePOD = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid POD Id",
    });
    return;
  }
  try {
    const pod = await prisma.pOD.findUnique({
      where: {
        id,
      },
    });
    if (pod) {
      await deleteLRFile(pod.documentLink);
      await prisma.pOD.delete({
        where: {
          id: pod.id,
        },
      });

      const FM = await prisma.fM.findFirst({
        where: {
          LRDetails: {
            some: {
              lrNumber: pod.lrNumber,
            },
          },
        },
      });
      if (FM) {
        const isOnlyOneLR = FM.LRDetails.length === 1;
        const updatedLRDetails = FM.LRDetails.map((lr) =>
          lr.lrNumber === pod.lrNumber ? { ...lr, status: "unPaid" } : lr
        );
        if (isOnlyOneLR) {
          await prisma.fM.update({
            where: { id: FM.id },
            data: {
              status: "open",
              LRDetails: updatedLRDetails,
            },
          });
        } else {
          await prisma.fM.update({
            where: { id: FM.id },
            data: {
              status: "partially Delivered",
              LRDetails: updatedLRDetails,
            },
          });
        }
      }
    }
    await clearPODCache()
    res.status(200).json({
      message: "POD Deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updatePODDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    date,
    from,
    to,
    clientName,
    clientGSTIN,
    receivingDate,
    receivingBranch,
    documentLink,
  } = req.body;

  if (
    !id ||
    !date ||
    !from ||
    !to ||
    !clientName ||
    !clientGSTIN ||
    !receivingDate ||
    !receivingBranch ||
    !documentLink
  ) {
    res.status(400).json({
      message: "Invalid POD Details",
    });
    return;
  }

  try {
    await prisma.pOD.update({
      where: {
        id,
      },
      data: {
        date,
        from,
        to,
        clientName,
        clientGSTIN,
        receivingDate,
        receivingBranch,
        documentLink,
      },
    });
    await clearPODCache()
    res.status(200).json({
      message: "POD Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const checkPaymentForStatusChange = async () => {
  const Allfms = await prisma.fM.findMany();

  for (const FM of Allfms) {
    const time = new Date().getTime() - new Date(FM.createdAt).getTime();

    if (
      time > 45 * 24 * 60 * 60 * 1000 &&
      FM.status &&
      FM.status === "pending"
    ) {
      const existingAmount = (FM.thirtyToSixty || 0) + 1000;
      await prisma.fM.update({
        where: { id: FM.id },
        data: {
          status: "onHold",
          thirtyToSixty: existingAmount,
        },
      });
      const admin = await prisma.admin.findFirst();
      await prisma.paymentRecord.create({
        data: {
          IDNumber: FM.fmNumber,
          customerName: FM.vendorName,
          amount: (1000).toFixed(2),
          amountInWords: "One Thousand Rupees Only",
          transactionNumber: "nill",
          paymentMode: "nill",
          remarks: "Delayed POD",
          fMId: FM.id,
          adminId: admin?.id,
          pendingAmount: 0,
          date: new Date().toISOString().split("T")[0],
        },
      });
    } else if (
      time > 30 * 24 * 60 * 60 * 1000 &&
      FM.status &&
      ["open", "partially Delivered"].includes(FM.status)
    ) {
      await prisma.fM.update({
        where: { id: FM.id },
        data: {
          status: "pending",
        },
      });
    }
  }
};

export const updatePODByNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data } = req.body;
  if (!id) {
    res.status(400).json({
      message: "Invalid POD Id",
    });
    return;
  }
  try {
    const pod = await prisma.pOD.findUnique({
      where: { id },
      include: {
        Branches: true,
      },
    });

    if (!pod) {
      res.status(404).json({ message: "POD not found" });
      return;
    }
    await prisma.pOD.update({
      where: { id: pod.id },
      data: {
        ...data,
      },
    });

    await prisma.notification.create({
      data: {
        requestId: pod.lrNumber,
        title: "POD",
        message: pod.Branches?.branchName,
        status: "editable",
        branchesId: pod.branchesId,
      },
    });
    await clearPODCache()
    res.status(200).json({
      message: "POD Updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deletePODByNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid POD Id",
    });
    return;
  }
  try {
    const pod = await prisma.pOD.findUnique({
      where: { id },
      include: {
        Branches: true,
      },
    });
    if (pod) {
      await deleteLRFile(pod.documentLink);
      await prisma.pOD.delete({
        where: {
          id: pod.id,
        },
      });
      await prisma.notification.create({
        data: {
          requestId: pod.lrNumber,
          title: "POD deleted",
          message: pod.Branches?.branchName,
          status: "delete",
          branchesId: pod.branchesId,
        },
      });
      await clearPODCache()
      res.status(200).json({
        message: "POD Deleted",
      });
    } else {
      res.status(400).json({
        message: "POD Delete failed",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getPodByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid POD Id",
    });
    return;
  }
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (branchId !== "null") {
    whereClause.branchesId = branchId;
  }

  try {
    const data = await redisGetOrSetFunctions({
      key: `POD-data-${page}-${skip}`,
      fetchFunction: async () => {
        const PODCount = await prisma.pOD.count({
          where: whereClause,
        });
        const PODData = await prisma.pOD.findMany({
          skip,
          take: limit,
          where: whereClause,
          orderBy: {
            date: "desc",
          },
        });
        return {
          PODCount,
          PODData,
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

export const filterPODByText = async (req: Request, res: Response) => {
  const { text, branchId } = req.params;

  try {
    const whereClause: any = {
      OR: [
        { lrNumber: { contains: text, mode: "insensitive" } },
        { clientName: { contains: text, mode: "insensitive" } },
      ],
    };
    if (branchId !== "null") {
      whereClause.branchesId = branchId;
    }
    const pods = await prisma.pOD.findMany({
      where: whereClause,
      orderBy: {
        date: "desc",
      },
    });
    if (pods) {
      res.status(200).json({
        message: "POD Details",
        data: pods,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
