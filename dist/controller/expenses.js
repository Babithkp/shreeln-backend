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
exports.filterCreditByDateForBranch = exports.filterCreditByDate = exports.filterExpensesByDateForBranch = exports.filterExpensesByDate = exports.getAllCredit = exports.updateCreditByNotification = exports.deleteCreditByNotification = exports.filterCreditsByTitle = exports.deleteCredit = exports.updateCreditDetails = exports.getCreditByPage = exports.createCredit = exports.filterExpensesByTitle = exports.getExpenseByPage = exports.deleteExpenseByNotification = exports.updateExpenseByNotification = exports.updateExpenseDetails = exports.deleteExpense = exports.getAllExpenses = exports.createExpense = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("./utils/redis");
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
                expenseId: (parseFloat(admin.expenseId || "1000") + 1).toString(),
            },
        });
        yield (0, redis_1.clearAllExpenseCache)();
        yield (0, redis_1.clearExpenseCache)();
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
            select: {
                amount: true,
            },
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
            yield (0, redis_1.clearAllExpenseCache)();
            yield (0, redis_1.clearExpenseCache)();
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
        yield (0, redis_1.clearAllExpenseCache)();
        yield (0, redis_1.clearExpenseCache)();
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
            yield (0, redis_1.clearAllExpenseCache)();
            yield (0, redis_1.clearExpenseCache)();
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
            yield (0, redis_1.clearAllExpenseCache)();
            yield (0, redis_1.clearExpenseCache)();
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
const getExpenseByPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const branchId = req.query.branchId;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (branchId !== "null") {
        whereClause.branchesId = branchId;
    }
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `expense-data-${page}-${skip}-${whereClause.branchesId ? whereClause.branchesId : "null"}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const ExpenseCount = yield prisma.expense.count({
                    where: whereClause,
                });
                const ExpenseData = yield prisma.expense.findMany({
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
            }),
        });
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getExpenseByPage = getExpenseByPage;
const filterExpensesByTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, branchId } = req.params;
    try {
        const whereClause = {
            OR: [
                { expenseId: { contains: text, mode: "insensitive" } },
                { title: { contains: text, mode: "insensitive" } },
            ],
        };
        if (branchId !== "null") {
            whereClause.branchesId = branchId;
        }
        const expenses = yield prisma.expense.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterExpensesByTitle = filterExpensesByTitle;
const createCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { creditId, description, date, category, customerName, linkTo, billNumber, fmNumber, amount, amountInWords, paymentType, transactionNumber, title, branchesId, adminId, } = req.body;
    if (!creditId ||
        !description ||
        !date ||
        !category ||
        !amount ||
        !amountInWords ||
        !paymentType ||
        !transactionNumber ||
        !title) {
        res.status(400).json({
            message: "Invalid Credit Details",
        });
        return;
    }
    try {
        const creditIdExists = yield prisma.credit.findFirst({
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
        yield prisma.credit.create({
            data: Object.assign(Object.assign({ creditId,
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
        yield prisma.admin.update({
            where: {
                id: admin.id,
            },
            data: {
                creditId: (parseFloat(admin.creditId || "1000") + 1).toString(),
            },
        });
        yield (0, redis_1.clearCreditCache)();
        res.status(200).json({
            message: "Credit Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createCredit = createCredit;
const getCreditByPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const branchId = req.query.branchId;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid Credit Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    const whereClause = {};
    if (branchId !== "null") {
        whereClause.branchesId = branchId;
    }
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `credit-data-${page}-${skip}-${whereClause.branchesId ? whereClause.branchesId : "null"}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const creditCount = yield prisma.credit.count();
                const creditData = yield prisma.credit.findMany({
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
                        creditId: "asc",
                    },
                });
                return {
                    creditCount,
                    creditData,
                };
            }),
        });
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getCreditByPage = getCreditByPage;
const updateCreditDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { creditId, description, date, category, customerName, linkTo, billNumber, fmNumber, amount, amountInWords, paymentType, transactionNumber, title, } = req.body;
    const { id } = req.params;
    if (!id ||
        !creditId ||
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
        yield prisma.credit.update({
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
        yield (0, redis_1.clearCreditCache)();
        res.status(200).json({
            message: "Credit Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateCreditDetails = updateCreditDetails;
const deleteCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    try {
        const credit = yield prisma.credit.findUnique({
            where: {
                id,
            },
        });
        if (credit) {
            yield prisma.credit.delete({
                where: {
                    id: credit.id,
                },
            });
            yield (0, redis_1.clearCreditCache)();
            res.status(200).json({
                message: "credit Deleted",
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
exports.deleteCredit = deleteCredit;
const filterCreditsByTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, branchId } = req.params;
    try {
        const whereClause = {
            OR: [
                { creditId: { contains: text, mode: "insensitive" } },
                { title: { contains: text, mode: "insensitive" } },
            ],
        };
        if (branchId !== "null") {
            whereClause.branchesId = branchId;
        }
        const expenses = yield prisma.credit.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterCreditsByTitle = filterCreditsByTitle;
const deleteCreditByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Expense Id",
        });
        return;
    }
    try {
        const credit = yield prisma.credit.findUnique({
            where: {
                creditId: id,
            },
            include: {
                Branches: true,
            },
        });
        if (credit) {
            yield prisma.credit.delete({
                where: {
                    id: credit.id,
                },
            });
            yield prisma.notification.create({
                data: {
                    requestId: credit.creditId,
                    title: "Credit deleted",
                    message: (_a = credit.Branches) === null || _a === void 0 ? void 0 : _a.branchName,
                    description: "Approved",
                    status: "editable",
                    branchesId: credit.branchesId,
                },
            });
            yield (0, redis_1.clearCreditCache)();
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
exports.deleteCreditByNotification = deleteCreditByNotification;
const updateCreditByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { data } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid Credit Id",
        });
        return;
    }
    try {
        const expense = yield prisma.credit.findUnique({
            where: {
                creditId: id,
            },
            include: {
                Branches: true,
            },
        });
        if (expense) {
            yield prisma.credit.update({
                where: {
                    id: expense.id,
                },
                data: Object.assign({}, data),
            });
            yield prisma.notification.create({
                data: {
                    requestId: expense.creditId,
                    title: "Credit edited",
                    message: (_a = expense.Branches) === null || _a === void 0 ? void 0 : _a.branchName,
                    description: "Approved",
                    status: "editable",
                    branchesId: expense.branchesId,
                },
            });
            yield (0, redis_1.clearCreditCache)();
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
exports.updateCreditByNotification = updateCreditByNotification;
const getAllCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: "getAllCredit",
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                return yield prisma.credit.findMany({
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
            }),
        });
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllCredit = getAllCredit;
const filterExpensesByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    try {
        const expenses = yield prisma.expense.findMany({
            where: Object.assign({}, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterExpensesByDate = filterExpensesByDate;
const filterExpensesByDateForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    const { branchId } = req.params;
    try {
        const expenses = yield prisma.expense.findMany({
            where: Object.assign(Object.assign({}, (branchId ? { branchesId: branchId } : {})), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterExpensesByDateForBranch = filterExpensesByDateForBranch;
const filterCreditByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    try {
        const credit = yield prisma.credit.findMany({
            where: Object.assign({}, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterCreditByDate = filterCreditByDate;
const filterCreditByDateForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to } = req.body;
    const { branchId } = req.params;
    try {
        const credit = yield prisma.credit.findMany({
            where: Object.assign(Object.assign({}, (branchId ? { branchesId: branchId } : {})), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterCreditByDateForBranch = filterCreditByDateForBranch;
