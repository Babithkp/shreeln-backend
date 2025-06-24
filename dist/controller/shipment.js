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
exports.deleteFMRecordByNotification = exports.updateRecordPaymentByNotification = exports.deleteLRByNotification = exports.deleteFMByNotification = exports.updateFMByNotification = exports.updateLRByNotification = exports.getLRByBranchId = exports.getFMByBranchId = exports.filterFMBymonth = exports.deletePaymentRecordFromFM = exports.addPaymentRecordToFM = exports.sendFMEmail = exports.updateFM = exports.deleteFM = exports.getFMData = exports.createFM = exports.sendLREmail = exports.filterLRDetails = exports.updateLR = exports.deleteLR = exports.getLRByLrNumber = exports.getLRData = exports.createLR = void 0;
const client_1 = require("@prisma/client");
const LREmail_1 = require("./utils/LREmail");
const FMEmail_1 = require("./utils/FMEmail");
const prisma = new client_1.PrismaClient();
const createLR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId, adminId, lrNumber, date, from, to, insurance, consignorName, consignorGSTIN, consignorPincode, consignorAddress, consigneeName, consigneeGSTIN, consigneePincode, consigneeAddress, noOfPackages, methodOfPacking, description, invoiceNo, invoiceDate, value, weight, sizeL, sizeW, sizeH, ftl, Vehicle, paymentType, freightCharges, hamali, surcharge, stCh, riskCh, unLoading, extraKms, detention, weightment, others, ewbNumber, ewbExpiryDate, totalAmt, emails, client, } = req.body;
    if (!lrNumber ||
        !date ||
        !from ||
        !to ||
        !insurance ||
        !consignorName ||
        !consignorGSTIN ||
        !consignorPincode ||
        !consignorAddress ||
        !consigneeName ||
        !consigneePincode ||
        !consigneeAddress ||
        !noOfPackages ||
        !methodOfPacking ||
        !description ||
        !weight ||
        !Vehicle ||
        !paymentType ||
        !client) {
        res.status(400).json({
            message: "Invalid LR Details",
        });
        return;
    }
    try {
        const isLRNumberAvailable = yield prisma.lR.findFirst({
            where: {
                lrNumber: lrNumber,
            },
        });
        if (isLRNumberAvailable) {
            res.status(201).json({
                message: "LR Number already exists",
            });
            return;
        }
        const vehicle = yield prisma.vehicle.findFirst({
            where: {
                vehicleNumber: Vehicle.vehicleNumber,
            },
        });
        yield prisma.lR.create({
            data: Object.assign(Object.assign(Object.assign({}, (adminId ? { adminId } : {})), (branchId ? { branchId } : {})), { lrNumber,
                date,
                from,
                to,
                insurance,
                consignorName,
                consignorGSTIN,
                consignorPincode,
                consignorAddress,
                consigneeName,
                consigneeGSTIN,
                consigneePincode,
                consigneeAddress,
                noOfPackages,
                methodOfPacking,
                description,
                invoiceNo,
                invoiceDate,
                value,
                weight,
                sizeL,
                sizeW,
                sizeH,
                ftl,
                paymentType,
                freightCharges,
                hamali,
                surcharge,
                stCh,
                riskCh,
                unLoading,
                extraKms,
                detention,
                weightment,
                others,
                ewbNumber,
                ewbExpiryDate,
                totalAmt,
                emails, vehicleId: vehicle === null || vehicle === void 0 ? void 0 : vehicle.id, client }),
        });
        res.status(200).json({
            message: "LR Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createLR = createLR;
const getLRData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lrs = yield prisma.lR.findMany({
            include: {
                Vehicle: true,
                branch: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
                admin: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
                pod: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });
        res.status(200).json({ data: lrs });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getLRData = getLRData;
const getLRByLrNumber = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lrNumber } = req.params;
    if (!lrNumber) {
        res.status(400).json({
            message: "Invalid LR Id",
        });
        return;
    }
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                lrNumber,
            },
        });
        if (lr) {
            res.status(200).json({
                message: "LR Details",
                data: lr,
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
exports.getLRByLrNumber = getLRByLrNumber;
const deleteLR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid LR Id",
        });
        return;
    }
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                id,
            },
        });
        if (lr) {
            yield prisma.lR.delete({
                where: {
                    id: lr.id,
                },
            });
            res.status(200).json({
                message: "LR Deleted",
            });
            return;
        }
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.deleteLR = deleteLR;
const updateLR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lrNumber, date, from, to, insurance, consignorName, consignorGSTIN, consignorPincode, consignorAddress, consigneeName, consigneeGSTIN, consigneePincode, consigneeAddress, noOfPackages, methodOfPacking, description, invoiceNo, invoiceDate, value, weight, sizeL, sizeW, sizeH, ftl, vehicleId, paymentType, freightCharges, hamali, surcharge, stCh, riskCh, unLoading, extraKms, detention, weightment, others, ewbNumber, ewbExpiryDate, totalAmt, emails, client, } = req.body;
    if (!lrNumber ||
        !date ||
        !from ||
        !to ||
        !insurance ||
        !consignorName ||
        !consignorGSTIN ||
        !consignorPincode ||
        !consignorAddress ||
        !consigneeName ||
        !consigneePincode ||
        !consigneeAddress ||
        !noOfPackages ||
        !methodOfPacking ||
        !description ||
        !weight ||
        !vehicleId ||
        !client) {
        res.status(400).json({
            message: "Invalid LR Details",
        });
        return;
    }
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                lrNumber,
            },
        });
        const vehicle = yield prisma.vehicle.findFirst({
            where: {
                vehicleNumber: vehicleId,
            },
        });
        if (lr) {
            yield prisma.lR.update({
                where: {
                    id: lr.id,
                },
                data: {
                    lrNumber,
                    date,
                    from,
                    to,
                    insurance,
                    consignorName,
                    consignorGSTIN,
                    consignorPincode,
                    consignorAddress,
                    consigneeName,
                    consigneeGSTIN,
                    consigneePincode,
                    consigneeAddress,
                    noOfPackages,
                    methodOfPacking,
                    description,
                    invoiceNo,
                    invoiceDate,
                    value,
                    weight,
                    sizeL,
                    sizeW,
                    sizeH,
                    ftl,
                    paymentType,
                    freightCharges,
                    hamali,
                    surcharge,
                    stCh,
                    riskCh,
                    unLoading,
                    extraKms,
                    detention,
                    weightment,
                    others,
                    ewbNumber,
                    ewbExpiryDate,
                    totalAmt,
                    emails,
                    vehicleId: vehicle === null || vehicle === void 0 ? void 0 : vehicle.id,
                    client,
                },
            });
            res.status(200).json({
                message: "LR Updated",
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
exports.updateLR = updateLR;
const filterLRDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text } = req.params;
    console.log(text);
    try {
        const lrs = yield prisma.lR.findMany({
            where: {
                OR: [
                    { lrNumber: { contains: text, mode: "insensitive" } },
                    { consigneeName: { contains: text, mode: "insensitive" } },
                    { consignorName: { contains: text, mode: "insensitive" } },
                    { from: { contains: text, mode: "insensitive" } },
                    { to: { contains: text, mode: "insensitive" } },
                    { description: { contains: text, mode: "insensitive" } },
                ],
            },
            include: {
                Vehicle: true,
                branch: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
                admin: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });
        if (lrs) {
            res.status(200).json({
                message: "LR Details",
                data: lrs,
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
exports.filterLRDetails = filterLRDetails;
const sendLREmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { email } = req.params;
    const LRData = JSON.parse(req.body.LrData);
    const subject = `Lorry Receipt for You Shipment - #${LRData.lrNumber}`;
    const bodyData = {
        lrNumber: LRData.lrNumber,
        body: LRData.mailBody,
        date: LRData.date,
        from: LRData.from,
        to: LRData.to,
        branchContactNumber: ((_a = LRData.admin) === null || _a === void 0 ? void 0 : _a.contactNumber) || ((_b = LRData.branch) === null || _b === void 0 ? void 0 : _b.contactNumber),
        consignorName: LRData.consignorName,
        branchAddress: ((_c = LRData.admin) === null || _c === void 0 ? void 0 : _c.address) || ((_d = LRData.branch) === null || _d === void 0 ? void 0 : _d.address),
        branchCity: ((_e = LRData.admin) === null || _e === void 0 ? void 0 : _e.city) || ((_f = LRData.branch) === null || _f === void 0 ? void 0 : _f.city),
        branchPincode: ((_g = LRData.admin) === null || _g === void 0 ? void 0 : _g.pincode) || ((_h = LRData.branch) === null || _h === void 0 ? void 0 : _h.pincode),
        consigneeName: LRData.consigneeName,
        noOfPackages: LRData.noOfPackages,
        description: LRData.description,
        vehicleNo: LRData.vehicleNo,
        driverPhone: LRData.driverPhone,
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
        yield (0, LREmail_1.sendLREmailToClient)(email, subject, (0, LREmail_1.LREmailBody)(bodyData), attachments);
        res.status(200).json({
            message: "LR Email Sent",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.sendLREmail = sendLREmail;
const createFM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fmNumber, date, from, to, vehicleNo, vehicleType, weight, packages, vendorName, vendorEmail, ContactPerson, DriverName, contactNumber, ownerName, TDS, insturance, Rc, advance, hire, balance, otherCharges, detentionCharges, rtoCharges, tds, netBalance, amountInwords, dlNumber, driverSignature, LRDetails, adminId, branchId, payableAt, ftl, sizeL, sizeW, sizeH, } = req.body;
    try {
        const isFMNumberAvailable = yield prisma.fM.findFirst({
            where: {
                fmNumber: fmNumber,
            },
        });
        if (isFMNumberAvailable) {
            res.status(201).json({
                message: "FM Number already exists",
            });
            return;
        }
        const vendor = yield prisma.vendors.findUnique({
            where: {
                name: vendorName,
            },
        });
        if (!vendor) {
            res.status(400).json({
                message: "Invalid Vendor Id",
            });
            return;
        }
        const value = parseFloat(hire || "0") +
            parseFloat(otherCharges || "0") +
            parseFloat(detentionCharges || "0") +
            parseFloat(rtoCharges || "0");
        const finalValue = value - parseFloat(tds || "0");
        const fm = yield prisma.fM.create({
            data: Object.assign(Object.assign({ fmNumber,
                date,
                from,
                to,
                vehicleNo,
                vehicleType,
                weight, package: packages, vendorEmail: vendorEmail, vendorName,
                ContactPerson,
                DriverName,
                contactNumber,
                ownerName,
                TDS,
                insturance,
                Rc,
                advance,
                hire,
                balance,
                otherCharges,
                detentionCharges,
                rtoCharges,
                tds,
                netBalance,
                payableAt,
                ftl,
                sizeL,
                sizeW,
                sizeH, outStandingBalance: finalValue.toString(), outStandingAdvance: advance ? parseFloat(advance || "0") : 0, amountInwords,
                dlNumber,
                driverSignature, LRDetails: LRDetails, Vendors: {
                    connect: { id: vendor.id },
                } }, (adminId ? { admin: { connect: { id: adminId } } } : {})), (branchId ? { branch: { connect: { id: branchId } } } : {})),
        });
        const updatedVendor = yield prisma.vendors.update({
            where: {
                id: vendor.id,
            },
            data: {
                currentOutStanding: vendor.currentOutStanding + finalValue,
            },
        });
        if ((updatedVendor === null || updatedVendor === void 0 ? void 0 : updatedVendor.currentOutStanding) > (updatedVendor === null || updatedVendor === void 0 ? void 0 : updatedVendor.outstandingLimit)) {
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
                    requestId: fm.id,
                    title: "Outstanding limit",
                    description: `The outstanding limit of INR ${updatedVendor.outstandingLimit} for the vendor ${updatedVendor.name} has reached. The current outstanding is INR ${updatedVendor.currentOutStanding}`,
                    message: "",
                    status: "one-time",
                },
            });
        }
        res.status(200).json({
            message: "FM Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createFM = createFM;
const getFMData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.fM.findMany({
            include: {
                PaymentRecords: {
                    orderBy: {
                        date: "desc",
                    },
                },
                branch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
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
exports.getFMData = getFMData;
const deleteFM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid FM Id",
        });
        return;
    }
    try {
        const fm = yield prisma.fM.findUnique({
            where: {
                id,
            },
        });
        if (fm) {
            yield prisma.fM.delete({
                where: {
                    id: fm.id,
                },
            });
            res.status(200).json({
                message: "FM Deleted",
            });
            if (!fm.vendorsId) {
                res.status(202).json({
                    message: "Invalid Vendor Id",
                });
                return;
            }
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: fm.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding -
                        parseFloat(fm.outStandingBalance || "0"),
                },
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
exports.deleteFM = deleteFM;
const updateFM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fmNumber, date, from, to, vehicleNo, vehicleType, weight, packages, vendorName, ContactPerson, DriverName, contactNumber, ownerName, TDS, insturance, Rc, advance, hire, balance, otherCharges, detentionCharges, rtoCharges, tds, netBalance, amountInwords, dlNumber, driverSignature, LRDetails, vendorsId, payableAt, ftl, sizeL, sizeW, sizeH, } = req.body;
    try {
        const fm = yield prisma.fM.findUnique({
            where: {
                fmNumber,
            },
        });
        const vendor = yield prisma.vendors.findUnique({
            where: {
                name: vendorsId,
            },
        });
        if (!vendor) {
            res.status(400).json({
                message: "Invalid Vendor Id",
            });
            return;
        }
        if (fm) {
            const value = parseFloat(hire || "0") +
                parseFloat(otherCharges || "0") +
                parseFloat(detentionCharges || "0") +
                parseFloat(rtoCharges || "0");
            const finalValue = value - parseFloat(tds || "0");
            const newOutstanding = finalValue -
                ((fm.zeroToThirty || 0) +
                    (fm.thirtyToSixty || 0) +
                    (fm.sixtyToNinety || 0) +
                    (fm.ninetyPlus || 0));
            yield prisma.fM.update({
                where: {
                    id: fm.id,
                },
                data: {
                    fmNumber,
                    date,
                    from,
                    to,
                    vehicleNo,
                    vehicleType,
                    weight,
                    package: packages,
                    vendorName,
                    ContactPerson,
                    DriverName,
                    contactNumber,
                    ownerName,
                    TDS,
                    insturance,
                    Rc,
                    advance,
                    hire,
                    balance,
                    otherCharges,
                    detentionCharges,
                    rtoCharges,
                    tds,
                    netBalance,
                    payableAt,
                    ftl,
                    sizeL,
                    sizeW,
                    sizeH,
                    outStandingBalance: newOutstanding.toString(),
                    outStandingAdvance: advance ? parseFloat(advance || "0") : 0,
                    amountInwords,
                    dlNumber,
                    driverSignature,
                    LRDetails,
                },
            });
            const oldValue = parseFloat(fm.hire || "0") +
                parseFloat(fm.otherCharges || "0") +
                parseFloat(fm.detentionCharges || "0") +
                parseFloat(fm.rtoCharges || "0");
            const finalOldValue = oldValue - parseFloat(fm.tds || "0");
            const oldOutstanding = vendor.currentOutStanding - finalOldValue;
            const updatedVendor = yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: oldOutstanding + finalValue,
                },
            });
            if ((updatedVendor === null || updatedVendor === void 0 ? void 0 : updatedVendor.currentOutStanding) > (updatedVendor === null || updatedVendor === void 0 ? void 0 : updatedVendor.outstandingLimit)) {
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
                        requestId: fm.id,
                        title: "Outstanding limit",
                        description: `The outstanding limit of INR ${vendor.outstandingLimit} for the vendor ${vendor.name} has reached. The current outstanding is INR ${vendor.currentOutStanding.toFixed(2)}`,
                        message: "",
                        status: "one-time",
                    },
                });
            }
            res.status(200).json({
                message: "FM Updated",
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
exports.updateFM = updateFM;
const sendFMEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email } = req.params;
    const FMData = JSON.parse(req.body.FmData);
    const subject = `Freight Memo details for - #${FMData.fmNumber}`;
    const bodyData = {
        fmNumber: FMData.fmNumber,
        body: FMData.mailBody,
        date: FMData.date,
        from: FMData.from,
        to: FMData.to,
        vehicleNo: FMData.vehicleNo,
        driverName: FMData.DriverName,
        driverPhone: FMData.contactNumber,
        lrNumbers: (_a = FMData.LRDetails) === null || _a === void 0 ? void 0 : _a.map((lr) => lr.lrNumber).toString(),
        totalAmt: FMData.amountInwords,
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
        yield (0, FMEmail_1.sendFMEmailToClient)(email, subject, (0, FMEmail_1.FMEmailBody)(bodyData), attachments);
        res.status(200).json({
            message: "FM Email Sent",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.sendFMEmail = sendFMEmail;
const addPaymentRecordToFM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, customerName, amount, amountInWords, pendingAmount, transactionNumber, paymentMode, remarks, branchId, adminId, id, } = req.body;
    const { IDNumber } = req.params;
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
        const fm = yield prisma.fM.findUnique({
            where: { fmNumber: IDNumber },
        });
        if (!fm) {
            res.status(404).json({ message: "FM not found" });
            return;
        }
        if (id) {
            // 1. Fetch the existing payment record
            const existingRecord = yield prisma.paymentRecord.findUnique({
                where: { id },
            });
            if (!existingRecord) {
                res.status(404).json({ message: "Existing payment record not found" });
                return;
            }
            // 2. Parse old & new amounts
            const prevAmount = parseFloat(existingRecord.amount || "0");
            const newAmount = parseFloat(amount || "0");
            const oldOutStandingBalance = parseFloat(fm.outStandingBalance || "0");
            const prevAdvanceOutstanding = parseFloat(existingRecord.amount || "0") + fm.outStandingAdvance;
            // 3. Find which bucket old record belonged to
            const prevDate = new Date(existingRecord.date);
            const prevDiff = prevDate.getTime() - new Date(fm.createdAt).getTime();
            let oldBucket;
            if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
                oldBucket = "zeroToThirty";
            }
            else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
                oldBucket = "thirtyToSixty";
            }
            else if (prevDiff < 90 * 24 * 60 * 60 * 1000) {
                oldBucket = "sixtyToNinety";
            }
            else {
                oldBucket = "ninetyPlus";
            }
            // 4. Subtract the previous amount from old bucket
            const oldAmount = Number(fm[oldBucket] || 0);
            const correctedOldAmount = oldAmount - prevAmount + newAmount;
            const newOutstanding = parseFloat((oldOutStandingBalance + (prevAmount - newAmount)).toFixed(2));
            const outstandingAdv = prevAdvanceOutstanding - parseFloat(amount);
            const FM = yield prisma.fM.update({
                where: { id: fm.id },
                data: {
                    [oldBucket]: correctedOldAmount,
                    outStandingBalance: newOutstanding.toString(),
                    outStandingAdvance: outstandingAdv < 0 ? 0 : outstandingAdv,
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
            if (!FM.vendorsId)
                return;
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: FM.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding - prevAmount + newAmount,
                },
            });
        }
        else {
            const newRecord = yield prisma.paymentRecord.create({
                data: Object.assign(Object.assign({ IDNumber,
                    date,
                    customerName,
                    amount,
                    amountInWords, pendingAmount: parseFloat(pendingAmount), transactionNumber,
                    paymentMode,
                    remarks, fMId: fm.id }, (adminId ? { adminId } : {})), (branchId ? { branchesId: branchId } : {})),
            });
            const dateDiff = new Date(newRecord.date).getTime() - new Date(fm.createdAt).getTime();
            let settingTo;
            if (dateDiff < 30 * 24 * 60 * 60 * 1000) {
                settingTo = "zeroToThirty";
            }
            else if (dateDiff < 60 * 24 * 60 * 60 * 1000) {
                settingTo = "thirtyToSixty";
            }
            else if (dateDiff < 90 * 24 * 60 * 60 * 1000) {
                settingTo = "sixtyToNinety";
            }
            else {
                settingTo = "ninetyPlus";
            }
            const updatedAmount = (fm[settingTo] || 0) + parseFloat(newRecord.amount);
            const updatedAdvance = fm.outStandingAdvance - parseFloat(amount);
            const FM = yield prisma.fM.update({
                where: { id: fm.id },
                data: {
                    [settingTo]: updatedAmount,
                    outStandingBalance: pendingAmount.toString(),
                    outStandingAdvance: updatedAdvance < 0 ? 0 : updatedAdvance,
                },
            });
            if (!FM.vendorsId)
                return;
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: FM.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding + parseFloat(amount || "0"),
                },
            });
        }
        res.status(200).json({ message: "Payment Record Added" });
    }
    catch (error) {
        console.error("Error adding payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
});
exports.addPaymentRecordToFM = addPaymentRecordToFM;
const deletePaymentRecordFromFM = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, IDNumber } = req.params;
    if (!id && !IDNumber) {
        res.status(400).json({ message: "Invalid Payment Record Id" });
        return;
    }
    try {
        const paymentRecord = yield prisma.paymentRecord.findUnique({
            where: { id },
        });
        if (paymentRecord) {
            const fm = yield prisma.fM.findUnique({
                where: { fmNumber: IDNumber },
            });
            if (!fm) {
                res.status(404).json({ message: "FM not found" });
                return;
            }
            const recordDate = new Date(paymentRecord.date);
            const createdAt = new Date(fm.createdAt);
            const diff = recordDate.getTime() - createdAt.getTime();
            let bucket;
            if (diff < 30 * 24 * 60 * 60 * 1000) {
                bucket = "zeroToThirty";
            }
            else if (diff < 60 * 24 * 60 * 60 * 1000) {
                bucket = "thirtyToSixty";
            }
            else if (diff < 90 * 24 * 60 * 60 * 1000) {
                bucket = "sixtyToNinety";
            }
            else {
                bucket = "ninetyPlus";
            }
            const bucketAmount = Number(fm[bucket] || 0);
            const correctedBucketAmount = bucketAmount - parseFloat(paymentRecord.amount || "0");
            const updatedOutstanding = parseFloat(fm.outStandingBalance || "0") +
                parseFloat(paymentRecord.amount || "0");
            yield prisma.fM.update({
                where: { id: fm.id },
                data: {
                    [bucket]: correctedBucketAmount,
                    outStandingBalance: updatedOutstanding.toString(),
                    outStandingAdvance: parseFloat(paymentRecord.amount || "0") + fm.outStandingAdvance,
                },
            });
            yield prisma.paymentRecord.delete({
                where: { id },
            });
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: fm.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding - parseFloat(paymentRecord.amount || "0"),
                },
            });
            res.status(200).json({ message: "Payment Record Deleted" });
            return;
        }
    }
    catch (error) {
        console.error("Error deleting payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
});
exports.deletePaymentRecordFromFM = deletePaymentRecordFromFM;
const filterFMBymonth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        res.status(400).json({ message: "Invalid Date Range" });
        return;
    }
    try {
        const fms = yield prisma.fM.findMany({
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
        if (fms) {
            res.status(200).json({
                message: "FM Details",
                data: fms,
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
exports.filterFMBymonth = filterFMBymonth;
const getFMByBranchId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId } = req.params;
    if (!branchId) {
        res.status(400).json({
            message: "Invalid Branch Id",
        });
        return;
    }
    try {
        const FMs = yield prisma.fM.findMany({
            where: {
                branchId: branchId,
            },
            include: {
                PaymentRecords: true,
            },
        });
        if (FMs) {
            res.status(200).json({
                message: "FM Details",
                data: FMs,
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
exports.getFMByBranchId = getFMByBranchId;
const getLRByBranchId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { branchId } = req.params;
    if (!branchId) {
        res.status(400).json({
            message: "Invalid Branch Id",
        });
        return;
    }
    try {
        const LRs = yield prisma.lR.findMany({
            where: {
                branchId: branchId,
            },
            include: {
                Vehicle: true,
                branch: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
                admin: {
                    select: {
                        branchName: true,
                        contactNumber: true,
                        address: true,
                        city: true,
                        state: true,
                        pincode: true,
                    },
                },
            },
        });
        if (LRs) {
            res.status(200).json({
                message: "LR Details",
                data: LRs,
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
exports.getLRByBranchId = getLRByBranchId;
const updateLRByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, lrNumber } = req.body;
    if (!lrNumber) {
        res.status(400).json({
            message: "Invalid LR Id",
        });
        return;
    }
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                lrNumber: lrNumber,
            },
        });
        if (lr) {
            const updated = yield prisma.lR.update({
                where: {
                    id: lr.id,
                },
                data: Object.assign({}, data.data),
            });
            if (updated) {
                yield prisma.notification.create({
                    data: {
                        branchesId: lr.branchId,
                        requestId: lr.lrNumber,
                        title: "LR",
                        status: "approved",
                        description: "Approved",
                    },
                });
            }
        }
        else {
            res.status(400).json({
                message: "LR Updated failed",
            });
            return;
        }
        res.status(200).json({
            message: "LR Updated",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.updateLRByNotification = updateLRByNotification;
const updateFMByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { data } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid FM Id",
        });
        return;
    }
    try {
        const fm = yield prisma.fM.findUnique({
            where: {
                fmNumber: id,
            },
        });
        if (fm) {
            const updated = yield prisma.fM.update({
                where: {
                    id: fm.id,
                },
                data: Object.assign({}, data),
            });
            if (updated) {
                yield prisma.notification.create({
                    data: {
                        branchesId: fm.branchId,
                        requestId: fm.fmNumber,
                        title: "FM",
                        status: "approved",
                        description: "Approved",
                    },
                });
            }
        }
        else {
            res.status(400).json({
                message: "FM Updated failed",
            });
            return;
        }
        res.status(200).json({
            message: "FM Updated",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.updateFMByNotification = updateFMByNotification;
const deleteFMByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const fm = yield prisma.fM.findUnique({
            where: {
                fmNumber: id,
            },
        });
        if (fm) {
            const updated = yield prisma.fM.delete({
                where: {
                    id: fm.id,
                },
            });
            if (updated) {
                yield prisma.notification.create({
                    data: {
                        branchesId: fm.branchId,
                        requestId: fm.fmNumber,
                        title: "FM",
                        status: "deleted",
                        description: "deleted",
                    },
                });
            }
        }
        else {
            res.status(400).json({
                message: "FM Deleted failed",
            });
            return;
        }
        res.status(200).json({
            message: "FM Deleted",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.deleteFMByNotification = deleteFMByNotification;
const deleteLRByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    try {
        const lr = yield prisma.lR.findUnique({
            where: {
                lrNumber: id,
            },
        });
        if (lr) {
            const updated = yield prisma.lR.delete({
                where: {
                    id: lr.id,
                },
            });
            if (updated) {
                yield prisma.notification.create({
                    data: {
                        branchesId: lr.branchId,
                        requestId: lr.lrNumber,
                        title: "LR",
                        status: "deleted",
                        description: "deleted",
                    },
                });
            }
        }
        else {
            res.status(400).json({
                message: "LR Deleted failed",
            });
            return;
        }
        res.status(200).json({
            message: "LR Deleted",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
exports.deleteLRByNotification = deleteLRByNotification;
const updateRecordPaymentByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, LRnumber } = req.params;
    const { data } = req.body;
    if (!id) {
        res.status(400).json({
            message: "Invalid Payment Record Id",
        });
        return;
    }
    try {
        const paymentRecord = yield prisma.paymentRecord.findFirst({
            where: { id },
        });
        const FM = yield prisma.fM.findUnique({
            where: { fmNumber: LRnumber },
        });
        if (!paymentRecord) {
            res.status(404).json({
                message: "Payment Record not found",
            });
            return;
        }
        if (!FM) {
            res.status(404).json({
                message: "FM not found",
            });
            return;
        }
        if (data.amount) {
            const prevAmount = parseFloat(paymentRecord.amount || "0");
            const newAmount = parseFloat(data.amount || "0");
            const oldOutStandingBalance = parseFloat(FM.outStandingBalance || "0");
            const prevDate = new Date(paymentRecord.date);
            const prevDiff = prevDate.getTime() - new Date(FM.createdAt).getTime();
            let oldBucket;
            if (prevDiff < 30 * 24 * 60 * 60 * 1000) {
                oldBucket = "zeroToThirty";
            }
            else if (prevDiff < 60 * 24 * 60 * 60 * 1000) {
                oldBucket = "thirtyToSixty";
            }
            else if (prevDiff < 90 * 24 * 60 * 60 * 1000) {
                oldBucket = "sixtyToNinety";
            }
            else {
                oldBucket = "ninetyPlus";
            }
            // 4. Subtract the previous amount from old bucket
            const oldAmount = Number(FM[oldBucket] || 0);
            const correctedOldAmount = oldAmount - prevAmount + newAmount;
            const newOutstanding = parseFloat((oldOutStandingBalance + (prevAmount - newAmount)).toFixed(2));
            yield prisma.fM.update({
                where: { id: FM.id },
                data: {
                    [oldBucket]: correctedOldAmount,
                    outStandingBalance: newOutstanding.toString(),
                },
            });
            if (!FM.vendorsId)
                return;
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: FM.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding - prevAmount + newAmount,
                },
            });
        }
        yield prisma.paymentRecord.update({
            where: { id: paymentRecord.id },
            data: Object.assign({}, data),
        });
        yield prisma.notification.create({
            data: {
                branchesId: FM.branchId,
                requestId: FM.fmNumber,
                title: "FM record",
                status: "Approved",
                description: "Approved",
            },
        });
        res.status(200).json({
            message: "Payment Record Updated",
        });
    }
    catch (error) {
        console.error("Error adding payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
});
exports.updateRecordPaymentByNotification = updateRecordPaymentByNotification;
const deleteFMRecordByNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, IDNumber } = req.params;
    if (!id && !IDNumber) {
        res.status(400).json({ message: "Invalid Payment Record Id" });
        return;
    }
    try {
        const paymentRecord = yield prisma.paymentRecord.findUnique({
            where: { id },
        });
        if (paymentRecord) {
            const fm = yield prisma.fM.findUnique({
                where: { fmNumber: IDNumber },
            });
            if (!fm) {
                res.status(404).json({ message: "FM not found" });
                return;
            }
            const recordDate = new Date(paymentRecord.date);
            const createdAt = new Date(fm.createdAt);
            const diff = recordDate.getTime() - createdAt.getTime();
            let bucket;
            if (diff < 30 * 24 * 60 * 60 * 1000) {
                bucket = "zeroToThirty";
            }
            else if (diff < 60 * 24 * 60 * 60 * 1000) {
                bucket = "thirtyToSixty";
            }
            else if (diff < 90 * 24 * 60 * 60 * 1000) {
                bucket = "sixtyToNinety";
            }
            else {
                bucket = "ninetyPlus";
            }
            const bucketAmount = Number(fm[bucket] || 0);
            const correctedBucketAmount = bucketAmount - parseFloat(paymentRecord.amount || "0");
            const updatedOutstanding = parseFloat(fm.outStandingBalance || "0") +
                parseFloat(paymentRecord.amount || "0");
            yield prisma.fM.update({
                where: { id: fm.id },
                data: {
                    [bucket]: correctedBucketAmount,
                    outStandingBalance: updatedOutstanding.toString(),
                },
            });
            yield prisma.paymentRecord.delete({
                where: { id },
            });
            const vendor = yield prisma.vendors.findUnique({
                where: {
                    id: fm.vendorsId,
                },
            });
            if (!vendor)
                return;
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    currentOutStanding: vendor.currentOutStanding - parseFloat(paymentRecord.amount || "0"),
                },
            });
            yield prisma.notification.create({
                data: {
                    branchesId: fm.branchId,
                    requestId: fm.fmNumber,
                    title: "FM record",
                    status: "Approved",
                    description: "Approved",
                },
            });
            res.status(200).json({ message: "Payment Record Deleted" });
            return;
        }
        res.status(400).json({ message: "FM record delete failed" });
    }
    catch (error) {
        console.error("Error adding payment record:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
    }
});
exports.deleteFMRecordByNotification = deleteFMRecordByNotification;
