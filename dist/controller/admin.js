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
exports.updateOtherSettings = exports.getOtherSettings = exports.getBillId = exports.getExpenseId = exports.updateNotification = exports.deleteNotification = exports.getAllAdminNotifications = exports.fectchAdminData = exports.getAllClients = exports.createClient = exports.changeBranchPassword = exports.getBrachersNames = exports.createBranch = exports.adminLogin = exports.createAdmin = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const existingAdmin = yield prisma.admin.findFirst();
    if (!existingAdmin) {
        yield prisma.admin.create({
            data: {
                userName: "admin",
                password: "admin@1234",
                branchManager: "Shivam Jha",
                address: "Flat No.203, 3rd Floor, Sai Godavari Apartment, Kuduregere Road, Madanayakanahalli, Bangalore Rural ",
                branchName: "Bangalore - admin",
                city: "Bangalore",
                state: "Karnataka",
                pincode: "562162",
                email: "bangalore@shreelnlogistics.com",
                contactNumber: "9036416520,90364416521",
            },
        });
        console.log("Admin created");
    }
    else {
        console.log("Admin already exists");
    }
});
exports.createAdmin = createAdmin;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userName, password } = req.body;
    if (!userName || !password) {
        res.status(400).json({
            message: "Invalid Credentials",
        });
        return;
    }
    try {
        const admin = yield prisma.admin.findUnique({
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
exports.adminLogin = adminLogin;
const createBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchName, branchManager, contactNumber, address, city, state, pincode, username, password, employeeCount, email, } = req.body;
    if (!branchName ||
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
        const admin = yield prisma.admin.findFirst({});
        const isBranchNameAvailable = yield prisma.branches.findFirst({
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
            yield prisma.branches.create({
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
                    adminId: admin === null || admin === void 0 ? void 0 : admin.id,
                },
            });
            res.status(200).json({
                message: "Branch Created",
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
exports.createBranch = createBranch;
const getBrachersNames = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const branches = yield prisma.branches.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getBrachersNames = getBrachersNames;
const changeBranchPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { adminPassword, branchName, newPassword } = req.body;
    if (!adminPassword || !branchName || !newPassword) {
        res.status(400).json({
            message: "Invalid Credentials",
        });
        return;
    }
    try {
        const admin = yield prisma.admin.findFirst();
        if (admin) {
            if (admin.password !== adminPassword) {
                res.status(400).json({
                    message: "Invalid Credentials",
                });
                return;
            }
            const branch = yield prisma.branches.findUnique({
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
            yield prisma.branches.update({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.changeBranchPassword = changeBranchPassword;
const createClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, GSTIN, contactPerson, contactNumber, address, city, state, pincode, email, panNumber, creditLimit, } = req.body;
    if (!name ||
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
        const admin = yield prisma.admin.findFirst();
        const isClientNameAvailable = yield prisma.client.findFirst({
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
            yield prisma.client.create({
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
                    adminId: admin === null || admin === void 0 ? void 0 : admin.id,
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createClient = createClient;
const getAllClients = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clients = yield prisma.client.findMany({
            include: {
                PaymentRecord: true,
                bill: true,
                LR: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        res.status(200).json({ data: clients });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllClients = getAllClients;
const fectchAdminData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin = yield prisma.admin.findFirst({
            include: {
                bill: true,
                FM: true,
            },
        });
        if (admin) {
            res.status(200).json({
                message: "Admin Data",
                data: admin,
            });
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.fectchAdminData = fectchAdminData;
const getAllAdminNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin = yield prisma.admin.findFirst();
        const notifications = yield prisma.notification.findMany({
            where: {
                adminId: admin === null || admin === void 0 ? void 0 : admin.id,
            },
            include: {
                Branches: true,
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
exports.getAllAdminNotifications = getAllAdminNotifications;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Notification Id",
        });
        return;
    }
    try {
        const notification = yield prisma.notification.findUnique({
            where: {
                id,
            },
        });
        if (notification) {
            yield prisma.notification.delete({
                where: {
                    id: notification.id,
                },
            });
            res.status(200).json({
                message: "Notification Deleted",
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
exports.deleteNotification = deleteNotification;
const updateNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, status } = req.params;
    if (!id || !status) {
        res.status(400).json({
            message: "Invalid Notification Id",
        });
        return;
    }
    try {
        const notification = yield prisma.notification.findUnique({
            where: {
                id,
            },
        });
        if (notification) {
            yield prisma.notification.update({
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
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateNotification = updateNotification;
const getExpenseId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenseId = yield prisma.admin.findFirst({
            select: {
                expenseId: true,
            },
        });
        res.status(200).json({
            message: "Expense Id",
            data: expenseId,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getExpenseId = getExpenseId;
const getBillId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const billId = yield prisma.admin.findFirst({
            select: {
                billId: true,
            },
        });
        res.status(200).json({
            message: "Bill Id",
            data: billId,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getBillId = getBillId;
const getOtherSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin = yield prisma.admin.findFirst({
            select: {
                billId: true,
                expenseId: true,
            },
        });
        res.status(200).json({
            message: "Other Settings",
            data: admin,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getOtherSettings = getOtherSettings;
const updateOtherSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billId, expenseId } = req.body;
    if (!billId || !expenseId) {
        res.status(400).json({
            message: "Invalid Other Settings",
        });
        return;
    }
    try {
        const admin = yield prisma.admin.findFirst();
        if (admin) {
            yield prisma.admin.update({
                where: {
                    id: admin.id,
                },
                data: {
                    billId,
                    expenseId,
                },
            });
            res.status(200).json({
                message: "Other Settings Updated",
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
exports.updateOtherSettings = updateOtherSettings;
