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
exports.filterPODByText = exports.getPodByPage = exports.deletePODByNotification = exports.updatePODByNotification = exports.checkPaymentForStatusChange = exports.updatePODDetails = exports.deletePOD = exports.getAllPODs = exports.createPOD = void 0;
const client_1 = require("@prisma/client");
const fileUpload_1 = require("./fileUpload");
const redis_1 = require("./utils/redis");
const prisma = new client_1.PrismaClient();
const createPOD = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lrNumber, date, from, to, clientName, clientGSTIN, receivingDate, receivingBranch, documentLink, branchesId, adminId, } = req.body;
    if (!lrNumber ||
        !date ||
        !from ||
        !to ||
        !clientName ||
        !clientGSTIN ||
        !receivingDate ||
        !receivingBranch ||
        !documentLink) {
        res.status(400).json({
            message: "Invalid POD Details",
        });
        return;
    }
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                lrNumber: lrNumber,
            },
        });
        yield prisma.pOD.create({
            data: Object.assign(Object.assign({ lrNumber,
                date,
                from,
                to,
                clientName,
                clientGSTIN,
                receivingDate,
                receivingBranch,
                documentLink, lRId: lr === null || lr === void 0 ? void 0 : lr.id }, (adminId ? { adminId } : {})), (branchesId ? { branchesId } : {})),
        });
        const FM = yield prisma.fM.findFirst({
            where: {
                LRDetails: {
                    some: {
                        lrNumber: lrNumber,
                    },
                },
            },
        });
        if (FM) {
            const isOnlyOneLR = FM.LRDetails.length === 1;
            const updatedLRDetails = FM.LRDetails.map((lr) => lr.lrNumber === lrNumber ? Object.assign(Object.assign({}, lr), { status: "paid" }) : lr);
            if ((FM.status === "open" || FM.status === "pending") && isOnlyOneLR) {
                yield prisma.fM.update({
                    where: { id: FM.id },
                    data: {
                        status: "delivered",
                        LRDetails: updatedLRDetails,
                    },
                });
            }
            else if ((FM.status === "open" ||
                FM.status === "pending" ||
                FM.status === "partially Delivered") &&
                !isOnlyOneLR) {
                const isAllPaid = updatedLRDetails.every((lr) => lr.status === "paid");
                yield prisma.fM.update({
                    where: { id: FM.id },
                    data: {
                        status: isAllPaid ? "delivered" : "partially Delivered",
                        LRDetails: updatedLRDetails,
                    },
                });
            }
        }
        yield (0, redis_1.clearPODCache)();
        res.status(200).json({
            message: "POD Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createPOD = createPOD;
const getAllPODs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pods = yield prisma.pOD.findMany({
            orderBy: {
                date: "desc",
            },
        });
        res.status(200).json({ data: pods });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllPODs = getAllPODs;
const deletePOD = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid POD Id",
        });
        return;
    }
    try {
        const pod = yield prisma.pOD.findUnique({
            where: {
                id,
            },
        });
        if (pod) {
            yield (0, fileUpload_1.deleteLRFile)(pod.documentLink);
            yield prisma.lR.update({
                where: { id: pod.lrNumber },
                data: {
                    pod: {
                        disconnect: { id: pod.id },
                    },
                },
            });
            yield prisma.pOD.delete({
                where: {
                    id: pod.id,
                },
            });
            const FM = yield prisma.fM.findFirst({
                where: {
                    LRDetails: {
                        some: {
                            lrNumber: pod.lrNumber,
                        },
                    },
                },
            });
            if (FM) {
                const isOnlyOneLR = FM.LRDetails.length === 1;
                const updatedLRDetails = FM.LRDetails.map((lr) => lr.lrNumber === pod.lrNumber ? Object.assign(Object.assign({}, lr), { status: "unPaid" }) : lr);
                if (isOnlyOneLR) {
                    yield prisma.fM.update({
                        where: { id: FM.id },
                        data: {
                            status: "open",
                            LRDetails: updatedLRDetails,
                        },
                    });
                }
                else {
                    yield prisma.fM.update({
                        where: { id: FM.id },
                        data: {
                            status: "partially Delivered",
                            LRDetails: updatedLRDetails,
                        },
                    });
                }
            }
        }
        yield (0, redis_1.clearPODCache)();
        res.status(200).json({
            message: "POD Deleted",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deletePOD = deletePOD;
const updatePODDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { date, from, to, clientName, clientGSTIN, receivingDate, receivingBranch, documentLink, } = req.body;
    if (!id ||
        !date ||
        !from ||
        !to ||
        !clientName ||
        !clientGSTIN ||
        !receivingDate ||
        !receivingBranch ||
        !documentLink) {
        res.status(400).json({
            message: "Invalid POD Details",
        });
        return;
    }
    try {
        yield prisma.pOD.update({
            where: {
                id,
            },
            data: {
                date,
                from,
                to,
                clientName,
                clientGSTIN,
                receivingDate,
                receivingBranch,
                documentLink,
            },
        });
        yield (0, redis_1.clearPODCache)();
        res.status(200).json({
            message: "POD Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updatePODDetails = updatePODDetails;
const checkPaymentForStatusChange = () => __awaiter(void 0, void 0, void 0, function* () {
    const Allfms = yield prisma.fM.findMany();
    for (const FM of Allfms) {
        const time = new Date().getTime() - new Date(FM.createdAt).getTime();
        if (time > 45 * 24 * 60 * 60 * 1000 &&
            FM.status &&
            FM.status === "pending") {
            const existingAmount = (FM.thirtyToSixty || 0) + 1000;
            yield prisma.fM.update({
                where: { id: FM.id },
                data: {
                    status: "onHold",
                    thirtyToSixty: existingAmount,
                },
            });
            const admin = yield prisma.admin.findFirst();
            yield prisma.paymentRecord.create({
                data: {
                    IDNumber: FM.fmNumber,
                    customerName: FM.vendorName,
                    amount: (1000).toFixed(2),
                    amountInWords: "One Thousand Rupees Only",
                    transactionNumber: "nill",
                    paymentMode: "nill",
                    remarks: "Delayed POD",
                    fMId: FM.id,
                    adminId: admin === null || admin === void 0 ? void 0 : admin.id,
                    pendingAmount: 0,
                    date: new Date().toISOString().split("T")[0],
                },
            });
        }
        else if (time > 30 * 24 * 60 * 60 * 1000 &&
            FM.status &&
            ["open", "partially Delivered"].includes(FM.status)) {
            yield prisma.fM.update({
                where: { id: FM.id },
                data: {
                    status: "pending",
                },
            });
        }
    }
});
exports.checkPaymentForStatusChange = checkPaymentForStatusChange;
const updatePODByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { data } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid POD Id",
        });
        return;
    }
    try {
        const pod = yield prisma.pOD.findUnique({
            where: { lrNumber: id },
            include: {
                Branches: true,
            },
        });
        if (!pod) {
            res.status(404).json({ message: "POD not found" });
            return;
        }
        yield prisma.pOD.update({
            where: { id: pod.id },
            data: Object.assign({}, data),
        });
        yield prisma.notification.create({
            data: {
                requestId: pod.lrNumber,
                entityType: "POD",
                actionType: "approved",
                createdByRole: "Admin",
                status: "noted",
                branchesId: pod.branchesId,
            },
        });
        yield (0, redis_1.clearPODCache)();
        res.status(200).json({
            message: "POD Updated",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.updatePODByNotification = updatePODByNotification;
const deletePODByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid POD Id",
        });
        return;
    }
    try {
        const pod = yield prisma.pOD.findUnique({
            where: { lrNumber: id },
            include: {
                Branches: true,
            },
        });
        if (pod) {
            yield (0, fileUpload_1.deleteLRFile)(pod.documentLink);
            yield prisma.lR.update({
                where: { id: pod.lrNumber },
                data: {
                    pod: {
                        disconnect: { id: pod.id },
                    },
                },
            });
            yield prisma.pOD.delete({
                where: {
                    id: pod.id,
                },
            });
            yield prisma.notification.create({
                data: {
                    requestId: pod.lrNumber,
                    entityType: "POD",
                    actionType: "approved",
                    createdByRole: "Admin",
                    status: "noted",
                    branchesId: pod.branchesId,
                },
            });
            yield (0, redis_1.clearPODCache)();
            res.status(200).json({
                message: "POD Deleted",
            });
        }
        else {
            res.status(400).json({
                message: "POD Delete failed",
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
exports.deletePODByNotification = deletePODByNotification;
const getPodByPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const branchId = req.query.branchId;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid POD Id",
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
            key: `POD-data-${page}-${skip}-${whereClause.branchesId ? whereClause.branchesId : "null"}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const PODCount = yield prisma.pOD.count({
                    where: whereClause,
                });
                const PODData = yield prisma.pOD.findMany({
                    skip,
                    take: limit,
                    where: whereClause,
                    orderBy: {
                        date: "desc",
                    },
                });
                return {
                    PODCount,
                    PODData,
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
exports.getPodByPage = getPodByPage;
const filterPODByText = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text, branchId } = req.params;
    try {
        const whereClause = {
            OR: [
                { lrNumber: { contains: text, mode: "insensitive" } },
                { clientName: { contains: text, mode: "insensitive" } },
            ],
        };
        if (branchId !== "null") {
            whereClause.branchesId = branchId;
        }
        const pods = yield prisma.pOD.findMany({
            where: whereClause,
            orderBy: {
                date: "desc",
            },
        });
        if (pods) {
            res.status(200).json({
                message: "POD Details",
                data: pods,
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
exports.filterPODByText = filterPODByText;
