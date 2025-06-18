"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpenseByNotification = exports.updateExpenseByNotification = exports.updateExpenseDetails = exports.deleteExpense = exports.getAllExpenses = exports.createExpense = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { expenseId, description, date, category, customerName, linkTo, billNumber, fmNumber, amount, amountInWords, paymentType, transactionNumber, title, branchesId, adminId, } = req.body;
    if (!expenseId ||
        !description ||
        !date ||
        !category ||
        !amount ||
        !amountInWords ||
        !paymentType ||
        !transactionNumber ||
        !title) {
        res.status(400).json({
            message: "Invalid Expense Details",
        });
        return;
    }
    try {
        const expenseIdExists = yield prisma.expense.findFirst({
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
        yield prisma.expense.create({
            data: Object.assign(Object.assign({ expenseId,
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
                title }, (adminId ? { adminId } : {})), (branchesId ? { branchesId } : {})),
        });
        const admin = yield prisma.admin.findFirst({
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
        yield prisma.admin.update({
            where: {
                id: admin.id,
            },
            data: {
                expenseId: (parseFloat(admin.expenseId || "0000") + 1).toString().padStart(5, "0"),
            },
        });
        res.status(200).json({
            message: "Expense Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createExpense = createExpense;
const getAllExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenses = yield prisma.expense.findMany({
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
                date: "asc"
            }
        });
        res.status(200).json({ data: expenses });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllExpenses = getAllExpenses;
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    try {
        const expense = yield prisma.expense.findUnique({
            where: {
                id,
            },
        });
        if (expense) {
            yield prisma.expense.delete({
                where: {
                    id: expense.id,
                },
            });
            res.status(200).json({
                message: "Expense Deleted",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deleteExpense = deleteExpense;
const updateExpenseDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { expenseId, description, date, category, customerName, linkTo, billNumber, fmNumber, amount, amountInWords, paymentType, transactionNumber, title, } = req.body;
    const { id } = req.params;
    if (!id ||
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
        !title) {
        res.status(400).json({
            message: "Invalid Expense Details",
        });
        return;
    }
    try {
        yield prisma.expense.update({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateExpenseDetails = updateExpenseDetails;
const updateExpenseByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { data } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    try {
        const expense = yield prisma.expense.findUnique({
            where: {
                expenseId: id,
            },
            include: {
                Branches: true,
            },
        });
        if (expense) {
            yield prisma.expense.update({
                where: {
                    id: expense.id,
                },
                data: Object.assign({}, data),
            });
            yield prisma.notification.create({
                data: {
                    requestId: expense.expenseId,
                    title: "Expense",
                    message: (_a = expense.Branches) === null || _a === void 0 ? void 0 : _a.branchName,
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateExpenseByNotification = updateExpenseByNotification;
const deleteExpenseByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    try {
        const expense = yield prisma.expense.findUnique({
            where: {
                expenseId: id,
            },
            include: {
                Branches: true,
            },
        });
        if (expense) {
            yield prisma.expense.delete({
                where: {
                    id: expense.id,
                },
            });
            yield prisma.notification.create({
                data: {
                    requestId: expense.expenseId,
                    title: "Expense deleted",
                    message: (_a = expense.Branches) === null || _a === void 0 ? void 0 : _a.branchName,
                    description: "Approved",
                    status: "editable",
                    branchesId: expense.branchesId,
                },
            });
            res.status(200).json({
                message: "Expense Deleted",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deleteExpenseByNotification = deleteExpenseByNotification;
