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
exports.filterLRForClientForBranch = exports.filterLRForClient = exports.filterBillLRByClientForBranch = exports.filterBillLRByClient = exports.filterClientByName = exports.getClientForPage = exports.filterVendorByName = exports.getVendorForPage = exports.filterFMLRByVendor = exports.filterFMLRByVendorForBranch = exports.getBillLRForClient = exports.deleteVehicle = exports.updateVehicleDetails = exports.getVehicleById = exports.getAllVehicles = exports.createVehicle = exports.deleteVendor = exports.updateVendorDetails = exports.getAllVendors = exports.createVendor = void 0;
const client_1 = require("@prisma/client");
const redis_1 = require("./utils/redis");
const prisma = new client_1.PrismaClient();
const createVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, GSTIN, contactPerson, contactNumber, address, TDS, city, state, pincode, email, pan, outstandingLimit, } = req.body;
    if (!name ||
        !contactPerson ||
        !contactNumber ||
        !address ||
        !TDS ||
        !city ||
        !state ||
        !pincode ||
        !pan ||
        !outstandingLimit) {
        res.status(400).json({
            message: "Invalid Vendor Details",
        });
        return;
    }
    try {
        const admin = yield prisma.admin.findFirst();
        const isVendorNameAvailable = yield prisma.vendors.findFirst({
            where: {
                name: name,
            },
        });
        if (isVendorNameAvailable) {
            res.status(201).json({
                message: "Vendor Name already exists",
            });
            return;
        }
        if (admin) {
            yield prisma.vendors.create({
                data: {
                    name,
                    GSTIN,
                    contactPerson,
                    contactNumber,
                    address,
                    TDS,
                    city,
                    state,
                    pincode,
                    email,
                    pan,
                    outstandingLimit: parseFloat(outstandingLimit),
                    adminId: admin === null || admin === void 0 ? void 0 : admin.id,
                },
            });
            yield (0, redis_1.clearVendorCache)();
            res.status(200).json({
                message: "Vendor Created",
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
exports.createVendor = createVendor;
const getAllVendors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendors = yield prisma.vendors.findMany({
            include: {
                vehicles: {
                    include: {
                        LR: true,
                    },
                },
                FM: {
                    include: {
                        PaymentRecords: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json({ data: vendors });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.getAllVendors = getAllVendors;
const updateVendorDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, GSTIN, contactPerson, contactNumber, address, TDS, city, state, pincode, email, pan, outstandingLimit, } = req.body;
    const { id } = req.params;
    if (!id ||
        !name ||
        !contactPerson ||
        !contactNumber ||
        !address ||
        !TDS ||
        !city ||
        !state ||
        !pincode ||
        !pan ||
        !outstandingLimit) {
        res.status(400).json({
            message: "Invalid Vendor Details",
        });
        return;
    }
    try {
        const vendor = yield prisma.vendors.findUnique({
            where: {
                id,
            },
        });
        if (vendor) {
            if (vendor.name !== name) {
                const isVendorNameAvailable = yield prisma.vendors.findFirst({
                    where: {
                        name: name,
                    },
                });
                if (isVendorNameAvailable) {
                    res.status(201).json({
                        message: "Vendor Name already exists, please try another one",
                    });
                    return;
                }
            }
            yield prisma.vendors.update({
                where: {
                    id: vendor.id,
                },
                data: {
                    name,
                    GSTIN,
                    contactPerson,
                    contactNumber,
                    address,
                    TDS,
                    city,
                    pan,
                    state,
                    pincode,
                    email,
                    outstandingLimit: parseFloat(outstandingLimit || "0"),
                },
            });
            yield (0, redis_1.clearVendorCache)();
            res.status(200).json({
                message: "Vendor Updated",
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
exports.updateVendorDetails = updateVendorDetails;
const deleteVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Vendor Id",
        });
        return;
    }
    try {
        const vendor = yield prisma.vendors.findUnique({
            where: {
                id,
            },
        });
        if (vendor) {
            yield prisma.vendors.delete({
                where: {
                    id: vendor.id,
                },
            });
            yield (0, redis_1.clearVendorCache)();
            res.status(200).json({
                message: "Vendor Deleted",
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
exports.deleteVendor = deleteVendor;
const createVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorName, vehicletypes, vehicleNumber, ownerName, ownerPhone, driverName, driverPhone, insurance, RC, panNumber, } = req.body;
    if (!vehicletypes ||
        !vehicleNumber ||
        !insurance ||
        !RC ||
        !panNumber ||
        !driverPhone) {
        res.status(400).json({
            message: "Invalid Vehicle Details",
        });
        return;
    }
    try {
        const vendor = yield prisma.vendors.findUnique({
            where: {
                name: vendorName,
            },
        });
        if (vendor) {
            yield prisma.vehicle.create({
                data: {
                    vendorName,
                    vehicletypes,
                    vehicleNumber,
                    ownerName,
                    ownerPhone,
                    driverName,
                    driverPhone,
                    insurance,
                    RC,
                    panNumber,
                    vendorId: vendor.id,
                },
            });
            yield (0, redis_1.clearGetVehicleCache)();
            res.status(200).json({
                message: "Vehicle Created",
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
exports.createVehicle = createVehicle;
const getAllVehicles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `getVehicle`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                return yield prisma.vehicle.findMany({
                    include: {
                        vendor: true
                    }
                });
            })
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
exports.getAllVehicles = getAllVehicles;
const getVehicleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Vehicle Details",
        });
        return;
    }
    try {
        const vehicle = yield prisma.vehicle.findFirst({
            where: {
                id,
            },
            include: {
                vendor: true,
            },
        });
        if (vehicle) {
            res.status(200).json({ data: vehicle });
        }
        else {
            res.status(400).json({
                message: "Invalid Vehicle Details",
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
exports.getVehicleById = getVehicleById;
const updateVehicleDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vendorName, vehicletypes, vehicleNumber, ownerName, ownerPhone, driverName, driverPhone, insurance, RC, } = req.body;
    const { id } = req.params;
    if (!id ||
        !vendorName ||
        !vehicletypes ||
        !vehicleNumber ||
        !ownerName ||
        !ownerPhone ||
        !driverPhone ||
        !insurance ||
        !RC) {
        res.status(400).json({
            message: "Invalid Vehicle Details",
        });
        return;
    }
    try {
        const vehicle = yield prisma.vehicle.findUnique({
            where: {
                id,
            },
        });
        if (vehicle) {
            yield prisma.vehicle.update({
                where: {
                    id: vehicle.id,
                },
                data: {
                    vendorName,
                    vehicletypes,
                    vehicleNumber,
                    ownerName,
                    ownerPhone,
                    driverName,
                    driverPhone,
                    insurance,
                    RC,
                },
            });
            yield (0, redis_1.clearGetVehicleCache)();
            res.status(200).json({
                message: "Vehicle Updated",
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
exports.updateVehicleDetails = updateVehicleDetails;
const deleteVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            message: "Invalid Vehicle Id",
        });
        return;
    }
    try {
        const vehicle = yield prisma.vehicle.findUnique({
            where: {
                id,
            },
        });
        if (vehicle) {
            yield prisma.vehicle.delete({
                where: {
                    id: vehicle.id,
                },
            });
            yield (0, redis_1.clearGetVehicleCache)();
            res.status(200).json({
                message: "Vehicle Deleted",
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
exports.deleteVehicle = deleteVehicle;
const getBillLRForClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    try {
        const client = yield prisma.client.findUnique({
            where: { name },
        });
        if (!client) {
            res.status(404).json({ message: "Client not found" });
            return;
        }
        const dateFilter = {};
        if (from)
            dateFilter.gte = from;
        if (to)
            dateFilter.lte = to;
        const bills = yield prisma.bill.findMany({
            where: Object.assign({ clientId: client.id }, (from || to ? { date: dateFilter } : {})),
            include: {
                lrData: {
                    select: {
                        lrNumber: true,
                        from: true,
                        to: true,
                        totalAmt: true,
                    },
                },
            },
        });
        const LRs = yield prisma.lR.findMany({
            where: {
                clientId: client.id,
            },
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
            },
        });
        const data = {
            bills,
            LRs: LRs.filter((lr) => lr.billId == null),
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
exports.getBillLRForClient = getBillLRForClient;
const filterFMLRByVendorForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    const { branchId } = req.params;
    try {
        const FMs = yield prisma.fM.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (branchId ? { branchId } : {})), { vendorName: name === "All" ? {} : name }), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                PaymentRecords: true,
                branch: true
            },
        });
        const LRs = yield prisma.lR.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (branchId ? { branchId } : {})), { Vehicle: {
                    vendor: {
                        name: name === "All" ? {} : name,
                    },
                } }), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
                pod: true,
                branch: true
            },
        });
        const data = {
            FMs,
            LRs: LRs.filter((lr) => lr.pod.length == 0),
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
exports.filterFMLRByVendorForBranch = filterFMLRByVendorForBranch;
const filterFMLRByVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    try {
        const FMs = yield prisma.fM.findMany({
            where: Object.assign({ vendorName: name === "All" ? {} : name }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                PaymentRecords: true,
            },
        });
        const LRs = yield prisma.lR.findMany({
            where: Object.assign({ Vehicle: {
                    vendor: {
                        name: name === "All" ? {} : name,
                    },
                } }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
                pod: true,
            },
        });
        const data = {
            FMs,
            LRs: LRs.filter((lr) => lr.pod.length == 0),
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
exports.filterFMLRByVendor = filterFMLRByVendor;
const getVendorForPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid Vendor Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `vendor-data-${page}-${skip}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const totalVendors = yield prisma.vendors.count({
                    where: {
                        FM: {
                            some: {
                                outStandingBalance: {
                                    gt: '0',
                                },
                            },
                        },
                    },
                });
                const vendorData = yield prisma.vendors.findMany({
                    skip,
                    take: limit,
                    where: {
                        FM: {
                            some: {
                                outStandingBalance: {
                                    gt: '0',
                                },
                            },
                        },
                    },
                    include: {
                        vehicles: {
                            include: {
                                LR: true,
                            },
                        },
                        FM: {
                            include: {
                                PaymentRecords: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return {
                    vendorCount: totalVendors,
                    vendorData,
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
exports.getVendorForPage = getVendorForPage;
const filterVendorByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.params;
    try {
        const vendor = yield prisma.vendors.findMany({
            where: {
                OR: [
                    { name: { contains: name, mode: "insensitive" } },
                    { contactPerson: { contains: name, mode: "insensitive" } },
                ],
            },
            include: {
                vehicles: {
                    include: {
                        LR: true,
                    },
                },
                FM: {
                    include: {
                        PaymentRecords: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (vendor) {
            res.status(200).json({
                message: "Vendor Details",
                data: vendor,
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
exports.filterVendorByName = filterVendorByName;
const getClientForPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    if (!page || !limit) {
        res.status(400).json({
            message: "Invalid Client Id",
        });
        return;
    }
    const skip = (page - 1) * limit;
    try {
        const data = yield (0, redis_1.redisGetOrSetFunctions)({
            key: `client-data-${page}-${skip}`,
            fetchFunction: () => __awaiter(void 0, void 0, void 0, function* () {
                const totalClients = yield prisma.client.count({
                    where: {
                        bill: {
                            some: {
                                pendingAmount: {
                                    gt: 0,
                                },
                            },
                        },
                    },
                });
                const clientData = yield prisma.client.findMany({
                    skip,
                    take: limit,
                    where: {
                        bill: {
                            some: {
                                pendingAmount: {
                                    gt: 0,
                                },
                            },
                        },
                    },
                    include: {
                        bill: {
                            include: {
                                PaymentRecords: true,
                            },
                        },
                        LR: {
                            include: {
                                Vehicle: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return {
                    clientCount: totalClients,
                    clientData,
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
exports.getClientForPage = getClientForPage;
const filterClientByName = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.params;
    try {
        const client = yield prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: name, mode: "insensitive" } },
                    { city: { contains: name, mode: "insensitive" } },
                    { contactPerson: { contains: name, mode: "insensitive" } },
                ],
            },
            include: {
                bill: {
                    include: {
                        PaymentRecords: true,
                    },
                },
                LR: {
                    include: {
                        Vehicle: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        if (client) {
            res.status(200).json({
                message: "Client Details",
                data: client,
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
exports.filterClientByName = filterClientByName;
const filterBillLRByClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    try {
        const bills = yield prisma.bill.findMany({
            where: Object.assign({ Client: Object.assign({}, (name === "All" ? {} : { name })) }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                lrData: true,
                Client: {
                    select: {
                        name: true,
                        GSTIN: true,
                        address: true,
                    },
                },
                PaymentRecords: {
                    select: {
                        amount: true,
                        date: true,
                    },
                },
                WriteOff: true,
            },
        });
        const LRs = yield prisma.lR.findMany({
            where: Object.assign({ client: Object.assign({}, (name === "All" ? {} : { name })) }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                branch: true,
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
            },
        });
        const data = {
            bills,
            LRs: LRs.filter((lr) => lr.billId == null),
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
exports.filterBillLRByClient = filterBillLRByClient;
const filterBillLRByClientForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    const { branchId } = req.params;
    try {
        const bills = yield prisma.bill.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (branchId ? { branchesId: branchId } : {})), { Client: Object.assign({}, (name === "All" ? {} : { name })) }), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                lrData: true,
                Client: {
                    select: {
                        name: true,
                        GSTIN: true,
                        address: true,
                    },
                },
                PaymentRecords: {
                    select: {
                        amount: true,
                        date: true,
                    },
                },
                WriteOff: true,
            },
        });
        const LRs = yield prisma.lR.findMany({
            where: Object.assign({ branch: Object.assign({}, (branchId ? { id: branchId } : {})), client: Object.assign({}, (name === "All" ? {} : { name })) }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
                branch: true
            },
        });
        const data = {
            bills,
            LRs: LRs.filter((lr) => lr.billId == null),
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
exports.filterBillLRByClientForBranch = filterBillLRByClientForBranch;
const filterLRForClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to, name } = req.body;
    try {
        const LRs = yield prisma.lR.findMany({
            where: Object.assign(Object.assign({}, (name === "All" ? {} : { client: { name } })), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        res.status(200).json({ data: LRs });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterLRForClient = filterLRForClient;
const filterLRForClientForBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { from, to, name } = req.body;
    const { branchId } = req.params;
    try {
        const LRs = yield prisma.lR.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (branchId ? { branchId } : {})), (name === "All" ? {} : { client: { name } })), (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
            include: {
                Vehicle: {
                    select: {
                        vehicleNumber: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        res.status(200).json({ data: LRs });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterLRForClientForBranch = filterLRForClientForBranch;
