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
exports.filterFMByVendor = exports.filterBillByClient = exports.deleteVehicle = exports.updateVehicleDetails = exports.getVehicleById = exports.getAllVehicles = exports.createVehicle = exports.deleteVendor = exports.updateVendorDetails = exports.getAllVendors = exports.createVendor = void 0;
const client_1 = require("@prisma/client");
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
                createdAt: 'desc'
            }
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
    if (!vehicletypes || !vehicleNumber || !insurance || !RC || !panNumber || !driverPhone) {
        res.status(400).json({
            message: "Invalid Vehicle Details",
        });
        return;
    }
    try {
        const isVehicleNumberAvailable = yield prisma.vehicle.findFirst({
            where: {
                vehicleNumber,
            },
        });
        if (isVehicleNumberAvailable) {
            res.status(201).json({
                message: "Vehicle Number already exists",
            });
            return;
        }
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
        const vehicles = yield prisma.vehicle.findMany();
        res.status(200).json({ data: vehicles });
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
const filterBillByClient = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                lrData: true,
            },
        });
        res.status(200).json({ data: bills });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterBillByClient = filterBillByClient;
const filterFMByVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, from, to } = req.body;
    try {
        const vendor = yield prisma.vendors.findUnique({
            where: { name },
        });
        console.log(vendor);
        if (!vendor) {
            res.status(404).json({ message: "Vendor not found" });
            return;
        }
        const FMs = yield prisma.fM.findMany({
            where: Object.assign({ vendorName: vendor.name }, (from || to
                ? {
                    date: Object.assign(Object.assign({}, (from ? { gte: from } : {})), (to ? { lte: to } : {})),
                }
                : {})),
        });
        res.status(200).json({ data: FMs });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.filterFMByVendor = filterFMByVendor;
