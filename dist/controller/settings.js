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
exports.updateBankDetails = exports.getBankDetails = exports.createBankDetails = exports.updateGeneralSettings = exports.getGeneralSettings = exports.createGeneralSettings = exports.updateCompanyProfile = exports.getCompanyProfile = exports.createCompanyProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, contactNumber, alternateContactNumber, GSTIN, HSN, websiteURL, address, } = req.body;
    if (!email ||
        !contactNumber ||
        !alternateContactNumber ||
        !GSTIN ||
        !HSN ||
        !websiteURL ||
        !address) {
        res.status(400).json({
            message: "Invalid Company Profile Details",
        });
        return;
    }
    try {
        yield prisma.companyProfile.create({
            data: {
                email,
                contactNumber,
                alternateContactNumber,
                GSTIN,
                HSN,
                websiteURL,
                address,
            },
        });
        res.status(200).json({
            message: "Company Profile Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createCompanyProfile = createCompanyProfile;
const getCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const companyProfile = yield prisma.companyProfile.findFirst();
        if (companyProfile) {
            res.status(200).json({
                message: "Company Profile Details",
                data: companyProfile,
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
exports.getCompanyProfile = getCompanyProfile;
const updateCompanyProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, contactNumber, alternateContactNumber, GSTIN, HSN, websiteURL, address, } = req.body;
    const id = req.params.id;
    if (!email ||
        !contactNumber ||
        !alternateContactNumber ||
        !GSTIN ||
        !HSN ||
        !websiteURL ||
        !address) {
        res.status(400).json({
            message: "Invalid Company Profile Details",
        });
        return;
    }
    try {
        yield prisma.companyProfile.update({
            where: {
                id,
            },
            data: {
                email,
                contactNumber,
                alternateContactNumber,
                GSTIN,
                HSN,
                websiteURL,
                address,
            },
        });
        res.status(200).json({
            message: "Company Profile Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateCompanyProfile = updateCompanyProfile;
const createGeneralSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { expenseTypes, vehicleTypes, } = req.body;
    if (!expenseTypes ||
        !vehicleTypes) {
        res.status(400).json({
            message: "Invalid General Settings Details",
        });
        return;
    }
    try {
        yield prisma.generalSettings.create({
            data: {
                expenseTypes,
                vehicleTypes,
            },
        });
        res.status(200).json({
            message: "General Settings Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createGeneralSettings = createGeneralSettings;
const getGeneralSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const generalSettings = yield prisma.generalSettings.findFirst();
        if (generalSettings) {
            res.status(200).json({
                message: "General Settings Details",
                data: generalSettings,
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
exports.getGeneralSettings = getGeneralSettings;
const updateGeneralSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { expenseTypes, vehicleTypes, } = req.body;
    const id = req.params.id;
    if (!expenseTypes ||
        !vehicleTypes) {
        res.status(400).json({
            message: "Invalid General Settings Details",
        });
        return;
    }
    try {
        yield prisma.generalSettings.update({
            where: {
                id: id,
            },
            data: {
                expenseTypes,
                vehicleTypes,
            },
        });
        res.status(200).json({
            message: "General Settings Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateGeneralSettings = updateGeneralSettings;
const createBankDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, accountNumber, ifscCode, } = req.body;
    if (!name ||
        !accountNumber ||
        !ifscCode) {
        res.status(400).json({
            message: "Invalid Bank Details",
        });
        return;
    }
    try {
        yield prisma.bankDetails.create({
            data: {
                name,
                accountNumber,
                ifscCode,
            },
        });
        res.status(200).json({
            message: "Bank Details Created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.createBankDetails = createBankDetails;
const getBankDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bankDetails = yield prisma.bankDetails.findFirst();
        if (bankDetails) {
            res.status(200).json({
                message: "Bank Details",
                data: bankDetails,
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
exports.getBankDetails = getBankDetails;
const updateBankDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, accountNumber, ifscCode, } = req.body;
    const id = req.params.id;
    if (!name ||
        !accountNumber ||
        !ifscCode) {
        res.status(400).json({
            message: "Invalid Bank Details",
        });
        return;
    }
    try {
        yield prisma.bankDetails.update({
            where: {
                id,
            },
            data: {
                name,
                accountNumber,
                ifscCode,
            },
        });
        res.status(200).json({
            message: "Bank Details Updated",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
        console.log(error);
    }
});
exports.updateBankDetails = updateBankDetails;
