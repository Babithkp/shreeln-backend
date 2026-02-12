import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  clearAllExpenseCache,
  clearCreditCache,
  clearExpenseCache,
  redisGetOrSetFunctions,
} from "./utils/redis";
const prisma = new PrismaClient();

export const createExpense = async (req: Request, res: Response) => {
  const {
    expenseId,
    description,
    date,
    category,
    customerName,
    linkTo,
    billNumber,
    fmNumber,
    amount,
    amountInWords,
    paymentType,
    transactionNumber,
    title,
    branchesId,
    adminId,
  } = req.body;

  if (
    !expenseId ||
    !description ||
    !date ||
    !category ||
    !amount ||
    !amountInWords ||
    !paymentType ||
    !transactionNumber ||
    !title
  ) {
    res.status(400).json({
      message: "Invalid Expense Details",
    });
    return;
  }
  try {
    const expenseIdExists = await prisma.expense.findFirst({
      where: {
        expenseId,
      },
    });
    if (expenseIdExists) {
      res.status(201).json({
        message: "Expense Id already exists",
      });
      return;
    }
    await prisma.expense.create({
      data: {
        expenseId,
        description,
        date,
        category,
        customerName,
        linkTo,
        billNumber,
        fmNumber,
        amount,
        amountInWords,
        paymentType,
        transactionNumber,
        title,
        ...(adminId ? { adminId } : {}),
        ...(branchesId ? { branchesId } : {}),
      },
    });

    const admin = await prisma.admin.findFirst({
      select: {
        expenseId: true,
        id: true,
      },
    });
    if (!admin) {
      res.status(201).json({
        message: "Invalid Admin Id",
      });
      return;
    }
    await prisma.admin.update({
      where: {
        id: admin.id,
      },
      data: {
        expenseId: (parseFloat(admin.expenseId || "1000") + 1).toString(),
      },
    });
    await clearAllExpenseCache();
    await clearExpenseCache();
    res.status(200).json({
      message: "Expense Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      select: {
        amount: true,
      },
    });
    res.status(200).json({ data: expenses });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Expense Id",
    });
    return;
  }
  try {
    const expense = await prisma.expense.findUnique({
      where: {
        id,
      },
    });
    if (expense) {
      await prisma.expense.delete({
        where: {
          id: expense.id,
        },
      });
      await clearAllExpenseCache();
      await clearExpenseCache();
      res.status(200).json({
        message: "Expense Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateExpenseDetails = async (req: Request, res: Response) => {
  const {
    expenseId,
    description,
    date,
    category,
    customerName,
    linkTo,
    billNumber,
    fmNumber,
    amount,
    amountInWords,
    paymentType,
    transactionNumber,
    title,
  } = req.body;
  const { id } = req.params;
  if (
    !id ||
    !expenseId ||
    !description ||
    !date ||
    !category ||
    !amount ||
    !amountInWords ||
    !paymentType ||
    !transactionNumber ||
    !title
  ) {
    res.status(400).json({
      message: "Invalid Expense Details",
    });
    return;
  }
  try {
    await prisma.expense.update({
      where: {
        id,
      },
      data: {
        expenseId,
        description,
        date,
        category,
        customerName,
        linkTo,
        billNumber,
        fmNumber,
        amount,
        amountInWords,
        paymentType,
        transactionNumber,
        title,
      },
    });
    await clearAllExpenseCache();
    await clearExpenseCache();
    res.status(200).json({
      message: "Expense Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateExpenseByNotification = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { data } = req.body;

  if (!id) {
    res.status(400).json({
      message: "Invalid Expense Id",
    });
    return;
  }
  try {
    const expense = await prisma.expense.findUnique({
      where: {
        expenseId: id,
      },
      include: {
        Branches: true,
      },
    });
    if (expense) {
      await prisma.expense.update({
        where: {
          id: expense.id,
        },
        data: {
          ...data,
        },
      });
      await prisma.notification.create({
        data: {
          requestId: expense.expenseId,
          branchesId: expense.branchesId,
          entityType: "Expense",
          actionType: "approved",
          createdByRole: "Admin",
          status: "noted",
        },
      });
      await clearAllExpenseCache();
      await clearExpenseCache();
      res.status(200).json({
        message: "Expense Updated",
      });
      return;
    }
    res.status(401).json({
      message: "Expense Not Found",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteExpenseByNotification = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Expense Id",
    });
    return;
  }
  try {
    const expense = await prisma.expense.findUnique({
      where: {
        expenseId: id,
      },
      include: {
        Branches: true,
      },
    });
    if (expense) {
      await prisma.expense.delete({
        where: {
          id: expense.id,
        },
      });

      await prisma.notification.create({
        data: {
          requestId: expense.expenseId,
          branchesId: expense.branchesId,
          entityType: "Expense",
          actionType: "approved",
          createdByRole: "Admin",
          status: "noted",
        },
      });
      await clearAllExpenseCache();
      await clearExpenseCache();
      res.status(200).json({
        message: "Expense Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getExpenseByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid Expense Id",
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
      key: `expense-data-${page}-${skip}-${whereClause.branchesId ? whereClause.branchesId : "null"
        }`,
      fetchFunction: async () => {
        const ExpenseCount = await prisma.expense.count({
          where: whereClause,
        });
        const ExpenseData = await prisma.expense.findMany({
          skip,
          take: limit,
          where: whereClause,
          include: {
            Branches: {
              select: {
                branchName: true,
              },
            },
            Admin: {
              select: {
                branchName: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        });
        return {
          ExpenseCount,
          ExpenseData,
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

export const filterExpensesByTitle = async (req: Request, res: Response) => {
  const { text, branchId } = req.params;

  try {
    const whereClause: any = {
      OR: [
        { expenseId: { contains: text, mode: "insensitive" } },
        { title: { contains: text, mode: "insensitive" } },
      ],
    };
    if (branchId !== "null") {
      whereClause.branchesId = branchId;
    }
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    if (expenses) {
      res.status(200).json({
        message: "Expense Details",
        data: expenses,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const createCredit = async (req: Request, res: Response) => {
  const {
    creditId,
    description,
    date,
    category,
    customerName,
    linkTo,
    billNumber,
    fmNumber,
    amount,
    amountInWords,
    paymentType,
    transactionNumber,
    title,
    branchesId,
    adminId,
  } = req.body;

  if (
    !creditId ||
    !description ||
    !date ||
    !category ||
    !amount ||
    !amountInWords ||
    !paymentType ||
    !transactionNumber ||
    !title
  ) {
    res.status(400).json({
      message: "Invalid Credit Details",
    });
    return;
  }
  try {
    const creditIdExists = await prisma.credit.findFirst({
      where: {
        creditId,
      },
    });
    if (creditIdExists) {
      res.status(201).json({
        message: "Expense Id already exists",
      });
      return;
    }
    await prisma.credit.create({
      data: {
        creditId,
        description,
        date,
        category,
        customerName,
        linkTo,
        billNumber,
        fmNumber,
        amount,
        amountInWords,
        paymentType,
        transactionNumber,
        title,
        ...(adminId ? { adminId } : {}),
        ...(branchesId ? { branchesId } : {}),
      },
    });

    const admin = await prisma.admin.findFirst({
      select: {
        creditId: true,
        id: true,
      },
    });
    if (!admin) {
      res.status(201).json({
        message: "Invalid Admin Id",
      });
      return;
    }
    await prisma.admin.update({
      where: {
        id: admin.id,
      },
      data: {
        creditId: (parseFloat(admin.creditId || "1000") + 1).toString(),
      },
    });
    await clearCreditCache();
    res.status(200).json({
      message: "Credit Created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getCreditByPage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const branchId = req.query.branchId as string;

  if (!page || !limit) {
    res.status(400).json({
      message: "Invalid Credit Id",
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
      key: `credit-data-${page}-${skip}-${whereClause.branchesId ? whereClause.branchesId : "null"
        }`,
      fetchFunction: async () => {
        const creditCount = await prisma.credit.count();
        const creditData = await prisma.credit.findMany({
          skip,
          take: limit,
          where: whereClause,
          include: {
            Branches: {
              select: {
                branchName: true,
              },
            },
            Admin: {
              select: {
                branchName: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        });
        return {
          creditCount,
          creditData,
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

export const updateCreditDetails = async (req: Request, res: Response) => {
  const {
    creditId,
    description,
    date,
    category,
    customerName,
    linkTo,
    billNumber,
    fmNumber,
    amount,
    amountInWords,
    paymentType,
    transactionNumber,
    title,
  } = req.body;
  const { id } = req.params;

  if (
    !id ||
    !creditId ||
    !description ||
    !date ||
    !category ||
    !amount ||
    !amountInWords ||
    !paymentType ||
    !transactionNumber ||
    !title
  ) {
    res.status(400).json({
      message: "Invalid Expense Details",
    });
    return;
  }
  try {
    await prisma.credit.update({
      where: {
        id,
      },
      data: {
        creditId,
        description,
        date,
        category,
        customerName,
        linkTo,
        billNumber,
        fmNumber,
        amount,
        amountInWords,
        paymentType,
        transactionNumber,
        title,
      },
    });
    await clearCreditCache();
    res.status(200).json({
      message: "Credit Updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteCredit = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Expense Id",
    });
    return;
  }
  try {
    const credit = await prisma.credit.findUnique({
      where: {
        id,
      },
    });
    if (credit) {
      await prisma.credit.delete({
        where: {
          id: credit.id,
        },
      });
      await clearCreditCache();
      res.status(200).json({
        message: "credit Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterCreditsByTitle = async (req: Request, res: Response) => {
  const { text, branchId } = req.params;

  try {
    const whereClause: any = {
      OR: [
        { creditId: { contains: text, mode: "insensitive" } },
        { title: { contains: text, mode: "insensitive" } },
      ],
    };
    if (branchId !== "null") {
      whereClause.branchesId = branchId;
    }
    const expenses = await prisma.credit.findMany({
      where: whereClause,
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    if (expenses) {
      res.status(200).json({
        message: "Expense Details",
        data: expenses,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const deleteCreditByNotification = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({
      message: "Invalid Expense Id",
    });
    return;
  }
  try {
    const credit = await prisma.credit.findUnique({
      where: {
        creditId: id,
      },
      include: {
        Branches: true,
      },
    });

    if (credit) {
      await prisma.credit.delete({
        where: {
          id: credit.id,
        },
      });

      await prisma.notification.create({
        data: {
          requestId: credit.creditId,
          branchesId: credit.branchesId,
          entityType: "Credit",
          actionType: "approved",
          createdByRole: "Admin",
          status: "noted",
        },
      });
      await clearCreditCache();
      res.status(200).json({
        message: "Expense Deleted",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const updateCreditByNotification = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { data } = req.body;

  if (!id) {
    res.status(400).json({
      message: "Invalid Credit Id",
    });
    return;
  }
  try {
    const expense = await prisma.credit.findUnique({
      where: {
        creditId: id,
      },
      include: {
        Branches: true,
      },
    });
    if (expense) {
      await prisma.credit.update({
        where: {
          id: expense.id,
        },
        data: {
          ...data,
        },
      });
      await prisma.notification.create({
        data: {
          requestId: expense.creditId,
          branchesId: expense.branchesId,
          entityType: "Credit",
          actionType: "approved",
          createdByRole: "Admin",
          status: "noted",
        },
      });
      await clearCreditCache();
      res.status(200).json({
        message: "Expense Updated",
      });
      return;
    }
    res.status(401).json({
      message: "Expense Not Found",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const getAllCredit = async (req: Request, res: Response) => {
  try {
    const data = await redisGetOrSetFunctions({
      key: "getAllCredit",
      fetchFunction: async () => {
        return await prisma.credit.findMany({
          include: {
            Branches: {
              select: {
                branchName: true,
              },
            },
            Admin: {
              select: {
                branchName: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        });
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

export const filterExpensesByDate = async (req: Request, res: Response) => {
  const { from, to } = req.body;

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        ...(from || to
          ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
          : {}),
      },
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
    });

    res.status(200).json({ data: expenses });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
export const filterExpensesByDateForBranch = async (
  req: Request,
  res: Response
) => {
  const { from, to } = req.body;
  const { branchId } = req.params;

  try {
    const expenses = await prisma.expense.findMany({
      where: {
        ...(branchId ? { branchesId: branchId } : {}),
        ...(from || to
          ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
          : {}),
      },
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
    });

    res.status(200).json({ data: expenses });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};

export const filterCreditByDate = async (req: Request, res: Response) => {
  const { from, to } = req.body;

  try {
    const credit = await prisma.credit.findMany({
      where: {
        ...(from || to
          ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
          : {}),
      },
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
    });
    res.status(200).json({ data: credit });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
export const filterCreditByDateForBranch = async (
  req: Request,
  res: Response
) => {
  const { from, to } = req.body;
  const { branchId } = req.params;

  try {
    const credit = await prisma.credit.findMany({
      where: {
        ...(branchId ? { branchesId: branchId } : {}),
        ...(from || to
          ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
          : {}),
      },
      include: {
        Branches: {
          select: {
            branchName: true,
          },
        },
        Admin: {
          select: {
            branchName: true,
          },
        },
      },
    });
    res.status(200).json({ data: credit });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
    console.log(error);
  }
};
