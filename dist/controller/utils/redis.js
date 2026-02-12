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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearGetVehicleCache = exports.clearGetRecentTransactionCache = exports.clearPODCache = exports.clearExpenseCache = exports.clearCreditCache = exports.clearClientCache = exports.clearVendorCache = exports.clearRecentTransactionCache = exports.clearGetAllRecordPaymentCache = exports.clearAllExpenseCache = exports.clearLRCache = exports.clearFMCache = exports.clearAllBillCache = exports.clearDashboardCache = exports.redisGetOrSetFunctions = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisEnv = process.env.REDIS_URL;
if (!redisEnv) {
    throw new Error("REDIS_URL is not set");
}
const redisClient = new ioredis_1.default(redisEnv);
const redisGetOrSetFunctions = (_a) => __awaiter(void 0, [_a], void 0, function* ({ key, fetchFunction, }) {
    const value = yield redisClient.get(key);
    if (value) {
        return JSON.parse(value);
    }
    const response = yield fetchFunction();
    yield redisClient.setex(key, 64800000, JSON.stringify(response));
    return response;
});
exports.redisGetOrSetFunctions = redisGetOrSetFunctions;
const clearDashboardCache = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.del("dashboard");
});
exports.clearDashboardCache = clearDashboardCache;
const clearAllBillCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "bill-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearAllBillCache = clearAllBillCache;
const clearFMCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "FM-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearFMCache = clearFMCache;
const clearLRCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "LR-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearLRCache = clearLRCache;
const clearAllExpenseCache = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.del("getAllCredit");
});
exports.clearAllExpenseCache = clearAllExpenseCache;
const clearGetAllRecordPaymentCache = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redisClient.del("getAllRecordPayment");
});
exports.clearGetAllRecordPaymentCache = clearGetAllRecordPaymentCache;
const clearRecentTransactionCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "recent-payment-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearRecentTransactionCache = clearRecentTransactionCache;
const clearVendorCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "vendor-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearVendorCache = clearVendorCache;
const clearClientCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "client-data*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearClientCache = clearClientCache;
const clearCreditCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "credit-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearCreditCache = clearCreditCache;
const clearExpenseCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "expense-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearExpenseCache = clearExpenseCache;
const clearPODCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "POD-data-*";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearPODCache = clearPODCache;
const clearGetRecentTransactionCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "GetRecentTransactions";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearGetRecentTransactionCache = clearGetRecentTransactionCache;
const clearGetVehicleCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const pattern = "getVehicle";
    const keys = yield redisClient.keys(pattern);
    if (keys.length > 0) {
        yield redisClient.del(keys);
    }
});
exports.clearGetVehicleCache = clearGetVehicleCache;
