import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createAdmin = async () => {
  const existingAdmin = await prisma.admin.findFirst();

  if (!existingAdmin) {
    await prisma.admin.create({
      data: {
        userName: "admin",
        password: "admin@1234",
        branchManager: "Shivam Jha",
        address:
          "Flat No.203, 3rd Floor, Sai Godavari Apartment, Kuduregere Road, Madanayakanahalli, Bangalore Rural ",
        branchName: "Bangalore - admin",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "562162",
        email: "bangalore@shreelnlogistics.com",
        contactNumber: "9036416520,90364416521",
      },
    });

    console.log("Admin created");
  } else {
    console.log("Admin already exists");
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    res.status(400).json({
      message: "Invalid Credentials",
    });
    return;
  }
  try {
    const admin = await prisma.admin.findUnique({
      where: {
        userName: userName,
        password: password,
      },
    });

    if (admin) {
      res.status(200).json({
        message: "Login Successful",
        data: admin,
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

export const createBranch = async (req: Request, res: Response) => {
  const {
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
    const admin = await prisma.admin.findFirst({});
    const isBranchNameAvailable = await prisma.branches.findFirst({
      where: {
        branchName: branchName,
      },
    });
    if (isBranchNameAvailable) {
      res.status(201).json({
        message: "Branch Name already exists",
      });
      return;
    }
    if (admin) {
      await prisma.branches.create({
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
          adminId: admin?.id,
        },
      });
      res.status(200).json({
        message: "Branch Created",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getBrachersNames = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branches.findMany({
      select: {
        id: true,
        branchName: true,
      },
    });
    if (!branches) {
      res.status(400).json({
        message: "Branches not found",
      });
      return;
    }
    res.status(200).json({
      message: "Branches",
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const changeBranchPassword = async (req: Request, res: Response) => {
  const { adminPassword, branchName, newPassword } = req.body;
  if (!adminPassword || !branchName || !newPassword) {
    res.status(400).json({
      message: "Invalid Credentials",
    });
    return;
  }
  try {
    const admin = await prisma.admin.findFirst();
    if (admin) {
      if (admin.password !== adminPassword) {
        res.status(400).json({
          message: "Invalid Credentials",
        });
        return;
      }
      const branch = await prisma.branches.findUnique({
        where: {
          branchName: branchName,
        },
      });
      if (!branch) {
        res.status(400).json({
          message: "Invalid Credentials",
        });
        return;
      }
      await prisma.branches.update({
        where: {
          id: branch.id,
        },
        data: {
          password: newPassword,
        },
      });
      res.status(200).json({
        message: "Password Changed",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createClient = async (req: Request, res: Response) => {
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
  if (
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
    const admin = await prisma.admin.findFirst();
    const isClientNameAvailable = await prisma.client.findFirst({
      where: {
        name,
      },
    });
    if (isClientNameAvailable) {
      res.status(201).json({
        message: "Client Name already exists",
      });
      return;
    }
    if (admin) {
      await prisma.client.create({
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
          adminId: admin?.id,
        },
      });
      res.status(200).json({
        message: "Client Created",
      });
      return;
    }

    res.status(400).json({
      message: "Client Not Found",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        PaymentRecord: true,
        bill: true,
      },
      orderBy:{
        createdAt: "asc"
      }
    });
    res.status(200).json({ data: clients });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};


export const fectchAdminData = async (req: Request, res: Response) => {
  try {
    const admin = await prisma.admin.findFirst({
      include:{
        bill:true,
        FM:true
      }
    });
    if (admin) {
      res.status(200).json({
        message: "Admin Data",
        data: admin,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const getAllAdminNotifications = async (req: Request, res: Response) => {
  try {
    const admin = await prisma.admin.findFirst();
    const notifications = await prisma.notification.findMany({
      where: {
        adminId: admin?.id,
      },
      include:{
        Branches: true
      },
      orderBy:{
        createdAt:"asc"
      }
    });
    res.status(200).json({ data: notifications });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Notification Id",
    });
    return;
  }
  try {
    const notification = await prisma.notification.findUnique({
      where: {
        id,
      },
    });
    if (notification) {
      await prisma.notification.delete({
        where: {
          id: notification.id,
        },
      });
      res.status(200).json({
        message: "Notification Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateNotification = async (req: Request, res: Response) => {
  const { id, status } = req.params;
  if (!id || !status ) {
    res.status(400).json({
      message: "Invalid Notification Id",
    });
    return;
  }
  try {
    const notification = await prisma.notification.findUnique({
      where: {
        id,
      },
    });
    if (notification) {
      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          status,
        },
      });
      res.status(200).json({
        message: "Notification Updated",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};


export const getExpenseId  = async (req: Request, res: Response) => {

  try {
    const expenseId = await prisma.admin.findFirst({
      select:{
        expenseId:true
      }
    })
    res.status(200).json({
      message: "Expense Id",
      data: expenseId
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
}

export const getBillId = async (req: Request, res: Response) => {
  try {
    const billId = await prisma.admin.findFirst({
      select: {
        billId: true,
      },
    });
    res.status(200).json({
      message: "Bill Id",
      data: billId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
}