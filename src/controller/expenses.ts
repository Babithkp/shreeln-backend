import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
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
      orderBy:{
        date: "asc"
      }
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
    !customerName ||
    !linkTo ||
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
          title: "Expense",
          message: expense.Branches?.branchName,
          description: "Approved",
          status: "editable",
          branchesId: expense.branchesId,
        },
      });
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
          title: "Expense deleted",
          message: expense.Branches?.branchName,
          description: "Approved",
          status: "editable",
          branchesId: expense.branchesId,
        },
      });

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
