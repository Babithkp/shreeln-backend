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
exports.createBulkPayment = exports.updateTdsOfBill = exports.deleteBillRecordByNotification = exports.updateBillRecordByNotification = exports.deleteBillByNotification = exports.updateBillByNotification = exports.deletePaymentRecordFromBill = exports.addPaymentRecordToBill = exports.filterBillDetailsForBranch = exports.filterBillData = exports.getBillByPageForBranch = exports.getBillByPage = exports.getBillByBranchId = exports.filterBillBymonthForBranch = exports.filterBillBymonth = exports.sendBillEmail = exports.deleteBill = exports.getBillDetails = exports.createBillsupplementary = exports.updateBillDetails = exports.createBill = exports.checkBillExists = void 0;
const client_1 = require("@prisma/client");
const billEmail_1 = require("./utils/billEmail");
const redis_1 = require("./utils/redis");
const prisma = new client_1.PrismaClient();
const checkBillExists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billNumber } = req.body;
    try {
        const bill = yield prisma.bill.findUnique({
            where: {
                billNumber,
            },
        });
        console.log(bill);
        if (bill) {
            res.status(200).json({
                message: "Bill Exists",
            });
        }
        else {
            res.status(201).json({
                message: "Bill Not Found",
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
exports.checkBillExists = checkBillExists;
const createBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billNumber, date, dueDate, clientName, hsnSacCode, placeOfSupply, state, statecode, lrData, igstRate, cgstRate, sgstRate, subTotal, total, totalInWords, unloading, hamali, extraKmWeight, detention, weightment, others, otherCharges, branchId, adminId, } = req.body;
    if (!billNumber ||
        !date ||
        !clientName ||
        !hsnSacCode ||
        !placeOfSupply ||
        !state ||
        !statecode ||
        !Array.isArray(lrData) ||
        lrData.length === 0 ||
        !subTotal ||
        !total ||
        !totalInWords) {
        res.status(400).json({
            message: "Invalid Bill Details",
        });
        return;
    }
    try {
        const client = yield prisma.client.findUnique({
            where: {
                name: clientName,
            },
            include: {
                bill: {
                    select: {
                        pendingAmount: true,
                    },
                },
            },
        });
        if (!client) {
            res.status(400).json({
                message: "Invalid Client Id",
            });
            return;
        }
        const bill = yield prisma.bill.create({
            data: Object.assign(Object.assign({ billNumber,
                date,
                dueDate,
                hsnSacCode,
                placeOfSupply,
                state,
                statecode,
                igstRate,
                cgstRate,
                sgstRate,
                subTotal,
                total,
                totalInWords, pendingAmount: subTotal, unloading,
                hamali,
                extraKmWeight,
                detention,
                weightment,
                others,
                otherCharges, clientId: client === null || client === void 0 ? void 0 : client.id, lrData: {
                    connect: lrData.map((lr) => ({ id: lr.id })),
                } }, (adminId ? { adminId } : {})), (branchId ? { branchesId: branchId } : {})),
        });
        const totalPendingAmount = client.bill.reduce((acc, data) => acc + data.pendingAmount, 0);
        const admin = yield prisma.admin.findFirst();
        if (!admin) {
            res.status(400).json({
                message: "Invalid Admin Id",
            });
            return;
        }
        if (totalPendingAmount > (client === null || client === void 0 ? void 0 : client.creditLimit)) {
            yield prisma.notification.create({
                data: {
                    adminId: admin.id,
                    requestId: bill.id,
                    entityType: "Credit Limit",
                    actionType: "info",
                    createdByRole: client.name,
                    message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${client.pendingPayment.toFixed(2)}`,
                    status: "noted",
                },
            });
        }
        const billId = yield prisma.admin.findFirst({
            select: {
                billId: true,
            },
        });
        if (billId) {
            yield prisma.admin.update({
                where: {
                    id: admin.id,
                },
                data: {
                    billId: (parseFloat(billId.billId || "2800") + 1).toString(),
                },
            });
        }
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Bill Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createBill = createBill;
const updateBillDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.params;
    const { billNumber, date, dueDate, hsnSacCode, placeOfSupply, state, statecode, lrData, igstRate, cgstRate, sgstRate, subTotal, total, totalInWords, unloading, hamali, extraKmWeight, detention, weightment, others, otherCharges, } = req.body;
    if (!billNumber ||
        !date ||
        !hsnSacCode ||
        !placeOfSupply ||
        !state ||
        !statecode ||
        !Array.isArray(lrData) ||
        lrData.length === 0 ||
        !subTotal ||
        !total ||
        !totalInWords) {
        res.status(400).json({
            message: "Invalid Bill Details",
        });
        return;
    }
    try {
        const oldBill = yield prisma.bill.findUnique({
            where: { id },
        });
        if (!oldBill) {
            res.status(400).json({
                message: "Bill not found",
            });
            return;
        }
        const paymentTotal = ((_a = oldBill.zeroToThirty) !== null && _a !== void 0 ? _a : 0) +
            ((_b = oldBill.thirtyToSixty) !== null && _b !== void 0 ? _b : 0) +
            ((_c = oldBill.sixtyPlus) !== null && _c !== void 0 ? _c : 0);
        let FinalTotal;
        if (paymentTotal < subTotal) {
            FinalTotal = subTotal - paymentTotal;
        }
        else {
            FinalTotal = paymentTotal - subTotal;
        }
        const bill = yield prisma.bill.update({
            where: { id },
            data: {
                billNumber,
                date,
                dueDate,
                hsnSacCode,
                placeOfSupply,
                state,
                statecode,
                igstRate,
                cgstRate,
                sgstRate,
                subTotal,
                total,
                totalInWords,
                pendingAmount: FinalTotal,
                unloading: null,
                hamali: null,
                extraKmWeight: null,
                detention: null,
                weightment: null,
                others: null,
                otherCharges: null,
                lrData: {
                    set: [],
                },
            },
        });
        yield prisma.bill.update({
            where: { id },
            data: {
                unloading,
                hamali,
                extraKmWeight,
                detention,
                weightment,
                others,
                otherCharges,
                lrData: {
                    connect: lrData.map((lr) => ({ id: lr.id })),
                },
            },
        });
        const client = yield prisma.client.findUnique({
            where: {
                id: bill.clientId,
            },
            include: {
                bill: {
                    select: {
                        pendingAmount: true,
                    },
                },
            },
        });
        if (!client) {
            res.status(400).json({
                message: "Invalid Client Id",
            });
            return;
        }
        const totalPendingAmount = client.bill.reduce((acc, data) => acc + data.pendingAmount, 0);
        if (totalPendingAmount > (client === null || client === void 0 ? void 0 : client.creditLimit)) {
            const admin = yield prisma.admin.findFirst();
            if (!admin) {
                res.status(400).json({
                    message: "Invalid Admin Id",
                });
                return;
            }
            yield prisma.notification.create({
                data: {
                    adminId: admin.id,
                    requestId: bill.id,
                    entityType: "Credit Limit",
                    actionType: "info",
                    createdByRole: client.name,
                    message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${totalPendingAmount}`,
                    status: "noted",
                },
            });
        }
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Bill Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateBillDetails = updateBillDetails;
const createBillsupplementary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billNumber, date, dueDate, clientName, hsnSacCode, placeOfSupply, state, statecode, lrData, igstRate, cgstRate, sgstRate, subTotal, total, totalInWords, unloading, hamali, extraKmWeight, detention, weightment, others, otherCharges, branchId, adminId, } = req.body;
    if (!billNumber ||
        !date ||
        !clientName ||
        !hsnSacCode ||
        !placeOfSupply ||
        !state ||
        !statecode ||
        !Array.isArray(lrData) ||
        lrData.length === 0 ||
        !subTotal ||
        !total ||
        !totalInWords) {
        res.status(400).json({
            message: "Invalid Bill Details",
        });
        return;
    }
    try {
        const client = yield prisma.client.findUnique({
            where: {
                name: clientName,
            },
            include: {
                bill: {
                    select: {
                        pendingAmount: true,
                    },
                },
            },
        });
        if (!client) {
            res.status(400).json({
                message: "Invalid Client Id",
            });
            return;
        }
        const bill = yield prisma.bill.create({
            data: Object.assign(Object.assign({ billNumber,
                date,
                dueDate,
                hsnSacCode,
                placeOfSupply,
                state,
                statecode,
                igstRate,
                cgstRate,
                sgstRate,
                subTotal,
                total,
                totalInWords, pendingAmount: subTotal, unloading,
                hamali,
                extraKmWeight,
                detention,
                weightment,
                others,
                otherCharges, clientId: client === null || client === void 0 ? void 0 : client.id, lrData: {
                    connect: lrData.map((lr) => ({ id: lr.id })),
                } }, (adminId ? { adminId } : {})), (branchId ? { branchesId: branchId } : {})),
        });
        const totalPendingAmount = client.bill.reduce((acc, data) => acc + data.pendingAmount, 0);
        const admin = yield prisma.admin.findFirst();
        if (!admin) {
            res.status(400).json({
                message: "Invalid Admin Id",
            });
            return;
        }
        if (totalPendingAmount > (client === null || client === void 0 ? void 0 : client.creditLimit)) {
            yield prisma.notification.create({
                data: {
                    adminId: admin.id,
                    requestId: bill.id,
                    entityType: "Credit Limit",
                    actionType: "info",
                    createdByRole: client.name,
                    message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${totalPendingAmount.toFixed(2)}`,
                    status: "noted",
                },
            });
        }
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Bill Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createBillsupplementary = createBillsupplementary;
const getBillDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const billingData = yield prisma.bill.findMany({
            include: {
                lrData: {
                    include: {
                        Vehicle: true,
                    },
                },
                PaymentRecords: {
                    orderBy: {
                        date: "asc",
                    },
                },
                Client: true,
                Branches: true,
                Admin: true,
            },
            orderBy: {
                billNumber: "desc",
            },
        });
        if (billingData) {
            res.status(200).json({
                message: "Bill Details",
                data: billingData,
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
exports.getBillDetails = getBillDetails;
const deleteBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: {
                id,
            },
        });
        if (bill) {
            const recordPayments = yield prisma.paymentRecord.findMany({
                where: {
                    billId: bill.id,
                },
            });
            const client = yield prisma.client.findUnique({
                where: {
                    id: bill.clientId,
                },
            });
            if (!client) {
                res.status(400).json({
                    message: "Invalid Client Id",
                });
                return;
            }
            const totalAmount = recordPayments.reduce((acc, data) => acc + parseFloat(data.amount || "0"), 0);
            const oldPendingAmount = client.pendingPayment + totalAmount - bill.subTotal;
            yield prisma.client.update({
                where: {
                    id: client.id,
                },
                data: {
                    pendingPayment: oldPendingAmount,
                },
            });
            yield prisma.bill.delete({
                where: {
                    id: bill.id,
                },
            });
            yield (0, redis_1.clearDashboardCache)();
            yield (0, redis_1.clearAllBillCache)();
            yield (0, redis_1.clearClientCache)();
            res.status(200).json({
                message: "Bill Deleted",
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
exports.deleteBill = deleteBill;
const sendBillEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    const billData = JSON.parse(req.body.billData);
    const subject = ` Billing summary for Shipment  - ${billData.billNumber}`;
    const bodyData = {
        billNumber: billData.billNumber,
        mailBody: billData.mailBody,
        date: billData.date,
        dueDate: billData.dueDate,
        clientName: billData.Client.name,
        clientAddress: billData.Client.address,
        lrData: billData.lrData,
        total: billData.total,
    };
    try {
        let attachments = [];
        if (req.files) {
            const files = Array.isArray(req.files)
                ? req.files
                : Object.values(req.files).flat();
            attachments = files.map((file) => ({
                filename: file.originalname,
                content: file.buffer,
                contentType: file.mimetype,
            }));
        }
        yield (0, billEmail_1.sendBillEmailToClient)(email, subject, (0, billEmail_1.BillEmailBody)(bodyData), attachments);
        res.status(200).json({
            message: "Bill Email Sent",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.sendBillEmail = sendBillEmail;
const filterBillBymonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        res.status(400).json({ message: "Invalid Date Range" });
        return;
    }
    try {
        const bills = yield prisma.bill.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                PaymentRecords: true,
            },
        });
        if (bills) {
            res.status(200).json({
                message: "Bill Details",
                data: bills,
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
exports.filterBillBymonth = filterBillBymonth;
const filterBillBymonthForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId } = req.params;
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate || !branchId) {
        res.status(400).json({ message: "Invalid Date Range" });
        return;
    }
    try {
        const bills = yield prisma.bill.findMany({
            where: {
                branchesId: branchId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                PaymentRecords: true,
            },
        });
        if (bills) {
            res.status(200).json({
                message: "Bill Details",
                data: bills,
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
exports.filterBillBymonthForBranch = filterBillBymonthForBranch;
const getBillByBranchId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId } = req.params;
    if (!branchId) {
        res.status(400).json({
            message: "Invalid Branch Id",
        });
        return;
    }
    try {
        const bills = yield prisma.bill.findMany({
            where: {
                branchesId: branchId,
            },
            include: {
                PaymentRecords: true,
                Client: true,
            },
            orderBy: {
                date: "asc",
            },
        });
        if (bills) {
            res.status(200).json({
                message: "Bill Details",
                data: bills,
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
exports.getBillByBranchId = getBillByBranchId;
const getBillByPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `bill-data-${page}-${skip}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const BillCount = yield prisma.bill.count();
                const BillData = yield prisma.bill.findMany({
                    skip,
                    take: limit,
                    include: {
                        lrData: {
                            include: {
                                Vehicle: true,
                            },
                        },
                        PaymentRecords: {
                            orderBy: {
                                date: "desc",
                            },
                        },
                        WriteOff: {
                            select: {
                                id: true,
                                checked: true,
                                reason: true,
                            },
                        },
                        Client: true,
                        Branches: true,
                        Admin: true,
                    },
                    orderBy: {
                        billNumber: "desc",
                    },
                });
                return {
                    BillCount,
                    BillData,
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
exports.getBillByPage = getBillByPage;
const getBillByPageForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const branchId = req.query.branchId;
    if (!page || !limit || !branchId) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const BillCount = yield prisma.bill.count({
            where: {
                branchesId: branchId,
            },
        });
        const BillData = yield prisma.bill.findMany({
            skip,
            take: limit,
            where: {
                branchesId: branchId,
            },
            include: {
                lrData: {
                    include: {
                        Vehicle: true,
                    },
                },
                PaymentRecords: {
                    orderBy: {
                        date: "asc",
                    },
                },
                WriteOff: {
                    select: {
                        id: true,
                        checked: true,
                        reason: true,
                    },
                },
                Client: true,
                Branches: true,
                Admin: true,
            },
            orderBy: {
                billNumber: "desc",
            },
        });
        const data = {
            BillCount,
            BillData,
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
exports.getBillByPageForBranch = getBillByPageForBranch;
const filterBillData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text } = req.params;
    try {
        const bills = yield prisma.bill.findMany({
            where: {
                OR: [
                    { billNumber: { contains: text, mode: "insensitive" } },
                    { Client: { name: { contains: text, mode: "insensitive" } } },
                ],
            },
            include: {
                lrData: {
                    include: {
                        Vehicle: true,
                    },
                },
                PaymentRecords: {
                    orderBy: {
                        date: "asc",
                    },
                },
                Client: true,
                Branches: true,
                Admin: true,
                WriteOff: true
            },
            orderBy: {
                date: "desc",
            },
        });
        if (bills) {
            res.status(200).json({
                message: "Bill Details",
                data: bills,
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
exports.filterBillData = filterBillData;
const filterBillDetailsForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId, text } = req.params;
    try {
        const bills = yield prisma.bill.findMany({
            where: {
                branchesId: branchId,
                OR: [
                    { billNumber: { contains: text, mode: "insensitive" } },
                    { Client: { name: { contains: text, mode: "insensitive" } } },
                ],
            },
            include: {
                lrData: {
                    include: {
                        Vehicle: true,
                    },
                },
                PaymentRecords: {
                    orderBy: {
                        date: "asc",
                    },
                },
                Client: true,
                Branches: true,
                Admin: true,
                WriteOff: true
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (bills) {
            res.status(200).json({
                message: "Bill Details",
                data: bills,
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
exports.filterBillDetailsForBranch = filterBillDetailsForBranch;
const addPaymentRecordToBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { date, customerName, amount, amountInWords, pendingAmount, transactionNumber, paymentMode, remarks, branchId, clientId, adminId, IDNumber, id, } = req.body;
    if (!IDNumber ||
        !date ||
        !customerName ||
        !amount ||
        !amountInWords ||
        !transactionNumber ||
        !paymentMode ||
        !remarks) {
        res.status(400).json({ message: "Invalid Payment Record Details" });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: { billNumber: IDNumber },
            include: {
                Client: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!bill) {
            res.status(404).json({ message: "FM not found" });
            return;
        }
        if (id) {
            const existingRecord = yield prisma.paymentRecord.findUnique({
                where: { id },
            });
            if (!existingRecord) {
                res.status(404).json({ message: "Existing payment record not found" });
                return;
            }
            const prevAmount = parseFloat(existingRecord.amount || "0");
            const newAmount = parseFloat(amount || "0");
            const prevDate = new Date(existingRecord.date);
            const prevDiff = prevDate.getTime() - new Date(bill.createdAt).getTime();
            let oldBucket;
            if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
                oldBucket = "zeroToThirty";
            }
            else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
                oldBucket = "thirtyToSixty";
            }
            else {
                oldBucket = "sixtyPlus";
            }
            const oldOutStandingBalance = bill.pendingAmount;
            const oldAmount = Number(bill[oldBucket] || 0);
            const correctedOldAmount = oldAmount - prevAmount + newAmount;
            const newOutstanding = oldOutStandingBalance + prevAmount - newAmount;
            yield prisma.bill.update({
                where: { id: bill.id },
                data: {
                    [oldBucket]: correctedOldAmount,
                    pendingAmount: newOutstanding,
                },
            });
            yield prisma.paymentRecord.update({
                where: { id },
                data: {
                    IDNumber,
                    date,
                    customerName,
                    amount,
                    amountInWords,
                    pendingAmount,
                    transactionNumber,
                    paymentMode,
                    remarks,
                },
            });
            const client = yield prisma.client.findUnique({
                where: {
                    id: (_a = bill.Client) === null || _a === void 0 ? void 0 : _a.id,
                },
            });
            if (!client)
                return;
            yield prisma.client.update({
                where: {
                    id: client.id,
                },
                data: {
                    pendingPayment: client.pendingPayment +
                        parseFloat(existingRecord.amount) -
                        parseFloat(amount || "0"),
                },
            });
        }
        else {
            const oldPendingAmount = bill.pendingAmount;
            yield prisma.bill.update({
                where: { id: bill.id },
                data: {
                    pendingAmount: oldPendingAmount - parseFloat(amount || "0"),
                },
            });
            const newRecord = yield prisma.paymentRecord.create({
                data: Object.assign(Object.assign({ IDNumber,
                    date,
                    customerName,
                    amount,
                    amountInWords, pendingAmount: parseFloat(pendingAmount), transactionNumber,
                    paymentMode,
                    remarks,
                    clientId, billId: bill.id }, (adminId ? { adminId } : {})), (branchId ? { branchesId: branchId } : {})),
            });
            const dateDiff = new Date(newRecord.date).getTime() - new Date(bill.createdAt).getTime();
            let settingTo;
            if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
                settingTo = "zeroToThirty";
            }
            else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
                settingTo = "thirtyToSixty";
            }
            else {
                settingTo = "sixtyPlus";
            }
            const updatedAmount = (bill[settingTo] || 0) + parseFloat(newRecord.amount);
            yield prisma.bill.update({
                where: { id: bill.id },
                data: {
                    [settingTo]: updatedAmount,
                    pendingAmount: parseFloat(pendingAmount),
                },
            });
        }
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearGetAllRecordPaymentCache)();
        yield (0, redis_1.clearRecentTransactionCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({ message: "Payment Record Added" });
    }
    catch (error) {
        console.error("Error adding payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.addPaymentRecordToBill = addPaymentRecordToBill;
const deletePaymentRecordFromBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Invalid Payment Record Id" });
        return;
    }
    try {
        const paymentRecord = yield prisma.paymentRecord.findUnique({
            where: { id },
        });
        if (!paymentRecord || !paymentRecord.IDNumber) {
            res.status(404).json({ message: "Payment Record not found" });
            return;
        }
        const bill = yield prisma.bill.findUnique({
            where: { billNumber: paymentRecord.IDNumber },
        });
        if (!bill) {
            res.status(404).json({ message: "Bill not found" });
            return;
        }
        // 1. Determine which bucket this record belongs to
        const recordDate = new Date(paymentRecord.date);
        const billCreatedAt = new Date(bill.createdAt);
        const diff = recordDate.getTime() - billCreatedAt.getTime();
        let bucket;
        if (diff < 30 * 24 * 60 * 60 * 1000) {
            bucket = "zeroToThirty";
        }
        else if (diff < 60 * 24 * 60 * 60 * 1000) {
            bucket = "thirtyToSixty";
        }
        else {
            bucket = "sixtyPlus";
        }
        // 2. Adjust bucket and pendingAmount
        const bucketAmount = Number(bill[bucket] || 0);
        const amountToSubtract = parseFloat(paymentRecord.amount || "0");
        const correctedBucketAmount = bucketAmount - amountToSubtract;
        const updatedPending = bill.pendingAmount + amountToSubtract;
        // 3. Update bill
        yield prisma.bill.update({
            where: { id: bill.id },
            data: {
                [bucket]: correctedBucketAmount,
                pendingAmount: updatedPending,
            },
        });
        // 4. Delete payment record
        yield prisma.paymentRecord.delete({
            where: { id: paymentRecord.id },
        });
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearGetAllRecordPaymentCache)();
        yield (0, redis_1.clearRecentTransactionCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({ message: "Payment Record Deleted" });
    }
    catch (error) {
        console.error("Error deleting payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deletePaymentRecordFromBill = deletePaymentRecordFromBill;
const updateBillByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billId } = req.body;
    const { billNumber, date, dueDate, hsnSacCode, placeOfSupply, state, statecode, lrData, igstRate, cgstRate, sgstRate, subTotal, total, totalInWords, unloading, hamali, extraKmWeight, detention, weightment, others, otherCharges, } = req.body.data;
    if (!billNumber ||
        !date ||
        !hsnSacCode ||
        !placeOfSupply ||
        !state ||
        !statecode ||
        !Array.isArray(lrData) ||
        lrData.length === 0 ||
        !subTotal ||
        !total ||
        !totalInWords) {
        res.status(400).json({
            message: "Invalid Bill Details",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.update({
            where: { billNumber: billId },
            data: {
                billNumber,
                date,
                dueDate,
                hsnSacCode,
                placeOfSupply,
                state,
                statecode,
                igstRate,
                cgstRate,
                sgstRate,
                subTotal,
                total,
                totalInWords,
                pendingAmount: subTotal,
                unloading: null,
                hamali: null,
                extraKmWeight: null,
                detention: null,
                weightment: null,
                others: null,
                otherCharges: null,
                lrData: {
                    set: [],
                },
            },
        });
        yield prisma.bill.update({
            where: { billNumber: billId },
            data: {
                unloading,
                hamali,
                extraKmWeight,
                detention,
                weightment,
                others,
                otherCharges,
                lrData: {
                    connect: lrData.map((lr) => ({ id: lr.id })),
                },
            },
        });
        const client = yield prisma.client.findUnique({
            where: {
                id: bill.clientId,
            },
            include: {
                bill: {
                    select: {
                        pendingAmount: true,
                    },
                },
            },
        });
        if (!client) {
            res.status(400).json({
                message: "Invalid Client Id",
            });
            return;
        }
        const totalPendingAmount = client.bill.reduce((acc, data) => acc + data.pendingAmount, 0);
        if (totalPendingAmount > (client === null || client === void 0 ? void 0 : client.creditLimit)) {
            const admin = yield prisma.admin.findFirst();
            if (!admin) {
                res.status(400).json({
                    message: "Invalid Admin Id",
                });
                return;
            }
            yield prisma.notification.create({
                data: {
                    adminId: admin.id,
                    requestId: bill.id,
                    entityType: "Credit Limit",
                    actionType: "info",
                    createdByRole: client.name,
                    message: `The credit limit of INR ${client.creditLimit} for the client ${client.name} has reached. The current outstanding is INR ${totalPendingAmount}`,
                    status: "noted",
                },
            });
        }
        yield prisma.notification.create({
            data: {
                requestId: bill.billNumber,
                entityType: "Bill",
                actionType: "approved",
                createdByRole: "Admin",
                status: "noted",
                branchesId: bill.branchesId,
            },
        });
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearRecentTransactionCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Bill Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateBillByNotification = updateBillByNotification;
const deleteBillByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billId } = req.body;
    if (!billId) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: {
                billNumber: billId,
            },
        });
        if (bill) {
            yield prisma.bill.delete({
                where: {
                    id: bill.id,
                },
            });
            yield prisma.notification.create({
                data: {
                    branchesId: bill.branchesId,
                    requestId: bill.billNumber,
                    entityType: "Bill",
                    actionType: "approved",
                    createdByRole: "Admin",
                    status: "noted",
                },
            });
            yield (0, redis_1.clearDashboardCache)();
            yield (0, redis_1.clearAllBillCache)();
            yield (0, redis_1.clearClientCache)();
            res.status(200).json({
                message: "Bill Deleted",
            });
        }
        else {
            res.status(400).json({
                message: "Bill Delete failed",
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
exports.deleteBillByNotification = deleteBillByNotification;
const updateBillRecordByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { billId, id, data } = req.body;
    if (!billId || !id) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: { billNumber: billId },
        });
        if (!bill) {
            res.status(404).json({ message: "Bill not found" });
            return;
        }
        const existingRecord = yield prisma.paymentRecord.findUnique({
            where: { id },
        });
        if (!existingRecord) {
            res.status(404).json({ message: "Existing payment record not found" });
            return;
        }
        if (data.amount) {
            const prevAmount = parseFloat(existingRecord.amount || "0");
            const newAmount = parseFloat(data.amount || "0");
            const prevDate = new Date(existingRecord.date);
            const prevDiff = prevDate.getTime() - new Date(bill.createdAt).getTime();
            let oldBucket;
            if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
                oldBucket = "zeroToThirty";
            }
            else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
                oldBucket = "thirtyToSixty";
            }
            else {
                oldBucket = "sixtyPlus";
            }
            const oldOutStandingBalance = bill.pendingAmount;
            const oldAmount = Number(bill[oldBucket] || 0);
            const correctedOldAmount = oldAmount - prevAmount + newAmount;
            const newOutstanding = oldOutStandingBalance + prevAmount - newAmount;
            yield prisma.bill.update({
                where: { id: bill.id },
                data: {
                    [oldBucket]: correctedOldAmount,
                    pendingAmount: newOutstanding,
                },
            });
            yield prisma.paymentRecord.update({
                where: { id },
                data: Object.assign({}, data),
            });
        }
        else {
            yield prisma.paymentRecord.update({
                where: { id },
                data: Object.assign({}, data),
            });
        }
        yield prisma.notification.create({
            data: {
                requestId: bill.id,
                entityType: "Bill record",
                actionType: "approved",
                createdByRole: "Admin",
                status: "noted",
                branchesId: bill.branchesId,
                data: JSON.stringify({ id: bill.billNumber }),
            },
        });
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearGetAllRecordPaymentCache)();
        yield (0, redis_1.clearRecentTransactionCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({ message: "Payment Record Updated" });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateBillRecordByNotification = updateBillRecordByNotification;
const deleteBillRecordByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Invalid Payment Record Id" });
        return;
    }
    try {
        const paymentRecord = yield prisma.paymentRecord.findUnique({
            where: { id },
        });
        if (!paymentRecord || !paymentRecord.IDNumber) {
            res.status(404).json({ message: "Payment Record not found" });
            return;
        }
        const bill = yield prisma.bill.findUnique({
            where: { billNumber: paymentRecord.IDNumber },
        });
        if (!bill) {
            res.status(404).json({ message: "Bill not found" });
            return;
        }
        // 1. Determine which bucket this record belongs to
        const recordDate = new Date(paymentRecord.date);
        const billCreatedAt = new Date(bill.createdAt);
        const diff = recordDate.getTime() - billCreatedAt.getTime();
        let bucket;
        if (diff < 30 * 24 * 60 * 60 * 1000) {
            bucket = "zeroToThirty";
        }
        else if (diff < 60 * 24 * 60 * 60 * 1000) {
            bucket = "thirtyToSixty";
        }
        else {
            bucket = "sixtyPlus";
        }
        // 2. Adjust bucket and pendingAmount
        const bucketAmount = Number(bill[bucket] || 0);
        const amountToSubtract = parseFloat(paymentRecord.amount || "0");
        const correctedBucketAmount = bucketAmount - amountToSubtract;
        const updatedPending = bill.pendingAmount + amountToSubtract;
        // 3. Update bill
        yield prisma.bill.update({
            where: { id: bill.id },
            data: {
                [bucket]: correctedBucketAmount,
                pendingAmount: updatedPending,
            },
        });
        // 4. Delete payment record
        yield prisma.paymentRecord.delete({
            where: { id: paymentRecord.id },
        });
        yield prisma.notification.create({
            data: {
                requestId: bill.id,
                branchesId: bill.branchesId,
                entityType: "Bill record",
                actionType: "approved",
                createdByRole: "Admin",
                status: "noted",
                data: JSON.stringify({ id: bill.billNumber }),
            },
        });
        yield (0, redis_1.clearDashboardCache)();
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearGetAllRecordPaymentCache)();
        yield (0, redis_1.clearRecentTransactionCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({ message: "Payment Record Deleted" });
    }
    catch (error) {
        console.error("Error deleting payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.deleteBillRecordByNotification = deleteBillRecordByNotification;
const updateTdsOfBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, tds } = req.params;
    if (!id || !tds) {
        res.status(400).json({
            message: "Invalid Bill Id",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: { id },
        });
        if (!bill) {
            res.status(400).json({
                message: "Invalid Bill Id",
            });
            return;
        }
        yield prisma.bill.update({
            where: { id },
            data: {
                tds: parseInt(tds),
            },
        });
        yield (0, redis_1.clearClientCache)();
        yield (0, redis_1.clearAllBillCache)();
        res.status(200).json({
            message: "TDS Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateTdsOfBill = updateTdsOfBill;
const createBulkPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, transactionNumber, paymentMode, remarks, branchId, adminId, billData, } = req.body;
    if (!date || !transactionNumber || !paymentMode || !remarks || !billData) {
        res.status(400).json({
            message: "Invalid Payment Record Details",
        });
        return;
    }
    try {
        yield Promise.all(billData.map((data) => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma.paymentRecord.create({
                data: Object.assign(Object.assign({ IDNumber: data.billNumber, date, customerName: "", amount: data.amount, amountInWords: data.amountInWords, pendingAmount: data.pendingAmount, transactionNumber,
                    paymentMode,
                    remarks, Bill: {
                        connect: { billNumber: data.billNumber },
                    } }, (adminId ? { Admin: { connect: { id: adminId } } } : {})), (branchId ? { Branches: { connect: { id: branchId } } } : {})),
            });
            const bill = yield prisma.bill.findUnique({
                where: { billNumber: data.billNumber },
            });
            if (!bill)
                return;
            const dateDiff = new Date(date).getTime() - new Date(bill.createdAt).getTime();
            let settingTo;
            if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
                settingTo = "zeroToThirty";
            }
            else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
                settingTo = "thirtyToSixty";
            }
            else {
                settingTo = "sixtyPlus";
            }
            const updatedAmount = (bill[settingTo] || 0) + parseFloat(data.amount);
            yield prisma.bill.update({
                where: { id: bill.id },
                data: {
                    [settingTo]: updatedAmount,
                    pendingAmount: parseFloat(data.pendingAmount),
                },
            });
        })));
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        yield (0, redis_1.clearGetAllRecordPaymentCache)();
        res.status(200).json({
            message: "Successfully updated Bill details",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createBulkPayment = createBulkPayment;
