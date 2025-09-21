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
exports.filterWriteOff = exports.deleteBillWriteOff = exports.deleteFmWriteOff = exports.getAllWriteOff = exports.createBillWriteOff = exports.createFMWriteOff = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("./utils/redis");
const shipment_1 = require("./shipment");
const prisma = new client_1.PrismaClient();
const createFMWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorName, date, IDNumber, amount, reason, branchId, checked } = req.body;
    if (!vendorName || !date || !IDNumber || !amount || !reason) {
        res.status(400).json({
            message: "Invalid Write Off Details",
        });
        return;
    }
    try {
        const fm = yield prisma.fM.findUnique({
            where: {
                fmNumber: IDNumber,
            },
        });
        if (!fm) {
            res.status(400).json({
                message: "Invalid FM Number",
            });
            return;
        }
        const writeOff = yield prisma.writeOff.create({
            data: Object.assign({ vendorName,
                date,
                IDNumber,
                amount,
                reason,
                checked }, (branchId && { branchId })),
        });
        yield prisma.fM.update({
            where: { id: fm.id },
            data: {
                outStandingAdvance: 0,
                outStandingBalance: "0",
                WriteOff: {
                    connect: { id: writeOff.id },
                },
            },
        });
        yield (0, redis_1.clearFMCache)();
        yield (0, redis_1.clearVendorCache)();
        res.status(200).json({
            message: "Write Off Created",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.createFMWriteOff = createFMWriteOff;
const createBillWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorName, date, IDNumber, amount, reason, branchId, checked } = req.body;
    if (!vendorName || !date || !IDNumber || !amount || !reason) {
        res.status(400).json({
            message: "Invalid Write Off Details",
        });
        return;
    }
    try {
        const bill = yield prisma.bill.findUnique({
            where: {
                billNumber: IDNumber,
            },
        });
        if (!bill) {
            res.status(400).json({
                message: "Invalid FM Number",
            });
            return;
        }
        const writeOff = yield prisma.writeOff.create({
            data: Object.assign({ vendorName,
                date,
                IDNumber,
                amount,
                reason,
                checked }, (branchId && { branchId })),
        });
        yield prisma.bill.update({
            where: { id: bill.id },
            data: {
                pendingAmount: 0,
                WriteOff: {
                    connect: { id: writeOff.id },
                },
            },
        });
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Write Off Created",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.createBillWriteOff = createBillWriteOff;
const getAllWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const writeOffs = yield prisma.writeOff.findMany();
        res.status(200).json({ data: writeOffs });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllWriteOff = getAllWriteOff;
const deleteFmWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Write Off Id",
        });
        return;
    }
    try {
        const writeOff = yield prisma.writeOff.findUnique({
            where: {
                IDNumber: id,
            },
        });
        if (!writeOff) {
            res.status(400).json({
                message: "Write Off not found",
            });
            return;
        }
        yield prisma.writeOff.delete({
            where: {
                id: writeOff.id,
            },
        });
        yield (0, shipment_1.updateFMDetails)(writeOff.IDNumber);
        yield (0, redis_1.clearFMCache)();
        yield (0, redis_1.clearVendorCache)();
        res.status(200).json({
            message: "Write Off Deleted",
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deleteFmWriteOff = deleteFmWriteOff;
const deleteBillWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid Write Off Id",
        });
        return;
    }
    try {
        const writeOff = yield prisma.writeOff.findUnique({
            where: {
                IDNumber: id,
            },
        });
        if (!writeOff) {
            res.status(400).json({
                message: "Write Off not found",
            });
            return;
        }
        yield prisma.writeOff.delete({
            where: {
                id: writeOff.id,
            },
        });
        yield prisma.bill.update({
            where: { id: writeOff.billId },
            data: {
                pendingAmount: parseFloat(writeOff.amount),
            },
        });
        yield (0, redis_1.clearAllBillCache)();
        yield (0, redis_1.clearClientCache)();
        res.status(200).json({
            message: "Write Off Deleted",
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deleteBillWriteOff = deleteBillWriteOff;
const filterWriteOff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to, clientName, branchId, vendorName } = req.body;
    try {
        const writeOffs = yield prisma.writeOff.findMany({
            where: Object.assign(Object.assign({ date: { gte: from, lte: to } }, (vendorName === "All"
                ? { fMId: { not: null } } // only FM results
                : clientName === "All"
                    ? { billId: { not: null } } // only Bill results
                    : {
                        vendorName: {
                            contains: vendorName || clientName,
                            mode: "insensitive",
                        },
                    })), (branchId && { branchId })),
        });
        if (writeOffs) {
            res.status(200).json({
                message: "Write Off Details",
                data: writeOffs,
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
exports.filterWriteOff = filterWriteOff;
