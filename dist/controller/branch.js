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
exports.filterRecordPaymentByNameForBranch = exports.filterRecordPaymentByName = exports.getRecentPaymentsForBranchPage = exports.getRecentPaymentsForPage = exports.createNotificationForBranch = exports.createNotification = exports.getBranchNotifications = exports.filterBranchBymonth = exports.filterRecordPayment = exports.getAllRecordPayment = exports.deleteClient = exports.updateclientDetails = exports.deleteBranch = exports.updateBranchDetails = exports.getAllBranchDetails = exports.branchLogin = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("./utils/redis");
const prisma = new client_1.PrismaClient();
const branchLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchName, password } = req.body;
    if (!branchName || !password) {
        res.status(400).json({
            message: "Invalid Credentials",
        });
        return;
    }
    try {
        const branch = yield prisma.branches.findUnique({
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
        }
        else {
            res.status(400).json({
                message: "Invalid Credentials",
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
exports.branchLogin = branchLogin;
const getAllBranchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branches = yield prisma.branches.findMany({
            include: {
                bill: true,
                FM: true,
            },
        });
        res.status(200).json({ data: branches });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllBranchDetails = getAllBranchDetails;
const updateBranchDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, branchName, branchManager, contactNumber, address, city, state, pincode, username, password, employeeCount, email, } = req.body;
    if (!id ||
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
        !employeeCount) {
        res.status(400).json({
            message: "Invalid Branch Details",
        });
        return;
    }
    try {
        const branch = yield prisma.branches.findUnique({
            where: {
                id,
            },
        });
        if (branch) {
            yield prisma.branches.update({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateBranchDetails = updateBranchDetails;
const deleteBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Branch Id",
        });
        return;
    }
    try {
        const branch = yield prisma.branches.findUnique({
            where: {
                id,
            },
        });
        if (branch) {
            yield prisma.branches.delete({
                where: {
                    id: branch.id,
                },
            });
            res.status(200).json({
                message: "Branch Deleted",
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
exports.deleteBranch = deleteBranch;
const updateclientDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, GSTIN, contactPerson, contactNumber, address, city, state, pincode, email, panNumber, creditLimit, } = req.body;
    const { id } = req.params;
    if (!id ||
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
        !creditLimit) {
        res.status(400).json({
            message: "Invalid Client Details",
        });
        return;
    }
    try {
        const client = yield prisma.client.findUnique({
            where: {
                id,
            },
        });
        if (client) {
            if (client.name !== name) {
                const isClientNameAvailable = yield prisma.client.findFirst({
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
            yield prisma.client.update({
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
                    creditLimit: parseFloat(creditLimit),
                },
            });
            yield (0, redis_1.clearClientCache)();
            res.status(200).json({
                message: "Client Updated",
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
exports.updateclientDetails = updateclientDetails;
const deleteClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Client Id",
        });
        return;
    }
    try {
        const client = yield prisma.client.findUnique({
            where: {
                id,
            },
        });
        if (client) {
            yield prisma.client.delete({
                where: {
                    id: client.id,
                },
            });
            yield (0, redis_1.clearClientCache)();
            res.status(200).json({
                message: "Client Deleted",
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
exports.deleteClient = deleteClient;
const getAllRecordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: "getAllRecordPayment",
            expiry: "1800",
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                return yield prisma.paymentRecord.findMany({
                    include: {
                        FM: true,
                        Bill: true,
                        Branches: true,
                        Admin: true,
                    },
                    orderBy: {
                        date: "desc",
                    },
                });
            }),
        });
        res.status(200).json({ data: data });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllRecordPayment = getAllRecordPayment;
const filterRecordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    try {
        const whereClause = {};
        if (name) {
            const orConditions = [
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
        const paymentRecord = yield prisma.paymentRecord.findMany({
            where: whereClause,
            include: {
                Admin: true,
                Branches: true,
            },
        });
        res.status(200).json({ data: paymentRecord });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.filterRecordPayment = filterRecordPayment;
const filterBranchBymonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        res.status(400).json({ message: "Invalid Date Range" });
        return;
    }
    try {
        const branches = yield prisma.branches.findMany({
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
            select: {
                branchName: true,
                FM: {
                    select: {
                        hire: true,
                        otherCharges: true,
                        detentionCharges: true,
                        rtoCharges: true,
                        tds: true,
                        date: true,
                    },
                },
                bill: {
                    select: {
                        subTotal: true,
                        date: true,
                    },
                },
            },
        });
        const admin = yield prisma.admin.findFirst({
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
            select: {
                branchName: true,
                FM: {
                    select: {
                        hire: true,
                        otherCharges: true,
                        detentionCharges: true,
                        rtoCharges: true,
                        tds: true,
                    },
                },
                bill: {
                    select: {
                        subTotal: true,
                    },
                },
            },
        });
        const data = [admin, ...branches];
        res.status(200).json({
            message: "Branch Details",
            data: [admin, ...branches],
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterBranchBymonth = filterBranchBymonth;
const getBranchNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId } = req.params;
    if (!branchId) {
        res.status(400).json({
            message: "Invalid Branch Id",
        });
        return;
    }
    try {
        const notifications = yield prisma.notification.findMany({
            where: {
                branchesId: branchId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        res.status(200).json({ data: notifications });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getBranchNotifications = getBranchNotifications;
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId, title, message, description, data, status, fileId } = req.body;
    if (!requestId || !title) {
        res.status(400).json({
            message: "Invalid Notification Details",
        });
        return;
    }
    try {
        const admin = yield prisma.admin.findFirst();
        yield prisma.notification.create({
            data: {
                requestId,
                title,
                message,
                description,
                data: data ? JSON.parse(data) : null,
                adminId: admin === null || admin === void 0 ? void 0 : admin.id,
                status,
                fileId,
            },
        });
        res.status(200).json({
            message: "Notification Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createNotification = createNotification;
const createNotificationForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId, title, message, description, status, branchId } = req.body;
    if (!requestId || !title || !branchId) {
        res.status(400).json({
            message: "Invalid Notification Details",
        });
        return;
    }
    try {
        yield prisma.notification.create({
            data: {
                requestId,
                title,
                message,
                description,
                status,
                branchesId: branchId,
            },
        });
        res.status(200).json({
            message: "Notification Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createNotificationForBranch = createNotificationForBranch;
const getRecentPaymentsForPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid LR Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `recent-payment-${page}-${skip}`,
            expiry: "1800",
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const paymentCount = yield prisma.paymentRecord.count();
                const paymentRecord = yield prisma.paymentRecord.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        date: "desc",
                    },
                });
                return {
                    paymentCount,
                    paymentRecord,
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
exports.getRecentPaymentsForPage = getRecentPaymentsForPage;
const getRecentPaymentsForBranchPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const branchId = req.query.branchId;
    if (!page || !limit || !branchId) {
        res.status(400).json({
            message: "Invalid LR Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const paymentCount = yield prisma.paymentRecord.count({
            where: {
                branchesId: branchId,
            },
        });
        const paymentRecord = yield prisma.paymentRecord.findMany({
            skip,
            take: limit,
            where: {
                branchesId: branchId,
            },
            orderBy: {
                date: "desc",
            },
        });
        const data = {
            paymentCount,
            paymentRecord,
        };
        res.status(200).json({ data });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getRecentPaymentsForBranchPage = getRecentPaymentsForBranchPage;
const filterRecordPaymentByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.params;
    try {
        const paymentRecord = yield prisma.paymentRecord.findMany({
            where: {
                OR: [{ customerName: { contains: name, mode: "insensitive" } }],
            },
        });
        res.status(200).json({ data: paymentRecord });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterRecordPaymentByName = filterRecordPaymentByName;
const filterRecordPaymentByNameForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, branchId } = req.params;
    try {
        const paymentRecord = yield prisma.paymentRecord.findMany({
            where: {
                OR: [{ customerName: { contains: name, mode: "insensitive" } }],
                branchesId: branchId,
            },
        });
        res.status(200).json({ data: paymentRecord });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterRecordPaymentByNameForBranch = filterRecordPaymentByNameForBranch;
