import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const branchLogin = async (req: Request, res: Response) => {
  const { branchName, password } = req.body;
  if (!branchName || !password) {
    res.status(400).json({
      message: "Invalid Credentials",
    });
    return;
  }
  try {
    const branch = await prisma.branches.findUnique({
      where: {
        branchName,
        password: password,
      },
    });

    if (branch) {
      res.status(200).json({
        message: "Login Successful",
        data: branch,
      });
    } else {
      res.status(400).json({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllBranchDetails = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branches.findMany({
      include: {
        bill: true,
        FM: true,
      },
    });
    res.status(200).json({ data: branches });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateBranchDetails = async (req: Request, res: Response) => {
  const {
    id,
    branchName,
    branchManager,
    contactNumber,
    address,
    city,
    state,
    pincode,
    username,
    password,
    employeeCount,
    email,
  } = req.body;
  if (
    !id ||
    !branchName ||
    !branchManager ||
    !contactNumber ||
    !address ||
    !city ||
    !state ||
    !pincode ||
    !username ||
    !password ||
    !email ||
    !employeeCount
  ) {
    res.status(400).json({
      message: "Invalid Branch Details",
    });
    return;
  }
  try {
    const branch = await prisma.branches.findUnique({
      where: {
        id,
      },
    });
    if (branch) {
      await prisma.branches.update({
        where: {
          id: branch.id,
        },
        data: {
          branchName,
          branchManager,
          contactNumber,
          address,
          city,
          state,
          pincode,
          username,
          password,
          employeeCount,
          email,
        },
      });
      res.status(200).json({
        message: "Branch Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Branch Id",
    });
    return;
  }
  try {
    const branch = await prisma.branches.findUnique({
      where: {
        id,
      },
    });
    if (branch) {
      await prisma.branches.delete({
        where: {
          id: branch.id,
        },
      });
      res.status(200).json({
        message: "Branch Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateclientDetails = async (req: Request, res: Response) => {
  const {
    name,
    GSTIN,
    contactPerson,
    contactNumber,
    address,
    city,
    state,
    pincode,
    email,
    panNumber,
    creditLimit,
  } = req.body;
  const { id } = req.params;
  if (
    !id ||
    !name ||
    !GSTIN ||
    !contactPerson ||
    !contactNumber ||
    !address ||
    !city ||
    !state ||
    !pincode ||
    !email ||
    !panNumber ||
    !creditLimit
  ) {
    res.status(400).json({
      message: "Invalid Client Details",
    });
    return;
  }

  try {
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });
    if (client) {
      if (client.name !== name) {
        const isClientNameAvailable = await prisma.client.findFirst({
          where: {
            name: name,
          },
        });
        if (isClientNameAvailable) {
          res.status(201).json({
            message: "Client Name already exists, please try another one",
          });
          return;
        }
      }
      await prisma.client.update({
        where: {
          id: client.id,
        },
        data: {
          name,
          GSTIN,
          contactPerson,
          contactNumber,
          address,
          city,
          state,
          pincode,
          email,
          panNumber,
          creditLimit:parseFloat(creditLimit),
        },
      });
      res.status(200).json({
        message: "Client Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Client Id",
    });
    return;
  }
  try {
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });
    if (client) {
      await prisma.client.delete({
        where: {
          id: client.id,
        },
      });
      res.status(200).json({
        message: "Client Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllRecortPayment = async (req: Request, res: Response) => {
  try {
    const paymentRecord = await prisma.paymentRecord.findMany({
      include: {
        FM: true,
        Bill: true,
        Branches: true,
        Admin: true,
      },
      orderBy: {
        date: "asc",
      },
    });
    res.status(200).json({ data: paymentRecord });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterRecordPayment = async (req: Request, res: Response) => {
  const { name, from, to } = req.body;

  try {
    const whereClause: any = {};

    if (name) {
      const orConditions: any[] = [
        { IDNumber: { contains: name, mode: "insensitive" } },
        { customerName: { contains: name, mode: "insensitive" } },
      ];

      if (!isNaN(Number(name))) {
        orConditions.push({
          amount: { contains: name.toString(), mode: "insensitive" },
        });
      }

      whereClause.OR = orConditions;
    }

    if (from && to) {
      whereClause.date = {
        gte: from,
        lte: to,
      };
    }

    const paymentRecord = await prisma.paymentRecord.findMany({
      where: whereClause,
      include: {
        Admin: true,
        Branches: true,
      },
    });

    res.status(200).json({ data: paymentRecord });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const filterBranchBymonth = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ message: "Invalid Date Range" });
    return;
  }
  try {
    const branches = await prisma.branches.findMany({
      where: {
        bill: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        bill: true,
      },
    });
    const admin = await prisma.admin.findFirst({
      where: {
        bill: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        bill: true,
      },
    });
    if (branches && admin) {
      res.status(200).json({
        message: "Branch Details",
        data: [admin, ...branches],
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBranchNotifications = async (req: Request, res: Response) => {
  const { branchId } = req.params;
  if (!branchId) {
    res.status(400).json({
      message: "Invalid Branch Id",
    });
    return;
  }
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        branchesId: branchId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    res.status(200).json({ data: notifications });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createNotification = async (req: Request, res: Response) => {
  const { requestId, title, message, description, data, status,fileId } = req.body;
  
  if (!requestId || !title ) {
    res.status(400).json({
      message: "Invalid Notification Details",
    });
    return;
  }
  try {
    const admin = await prisma.admin.findFirst();
    await prisma.notification.create({
      data: {
        requestId,
        title,
        message,
        description,
        data: data ? JSON.parse(data) : null,
        adminId: admin?.id,
        status,
        fileId
      },
    });
    res.status(200).json({
      message: "Notification Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createNotificationForBranch = async (req: Request, res: Response) => {
  const { requestId, title, message, description,  status, branchId } = req.body;


  if (!requestId || !title || !branchId) {
    res.status(400).json({
      message: "Invalid Notification Details",
    });
    return;
  }
  try {
    await prisma.notification.create({
      data: {
        requestId,
        title,
        message,
        description,
        status,
        branchesId: branchId
      },
    });
    res.status(200).json({
      message: "Notification Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};