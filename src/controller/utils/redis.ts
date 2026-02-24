import Redis from "ioredis";import dotenv from "dotenv";
dotenv.config();
const redisEnv = process.env.REDIS_URL;
if (!redisEnv) {
  throw new Error("REDIS_URL is not set");
}
const redisClient = new Redis(redisEnv);

export const redisGetOrSetFunctions = async <T>({
  key,
  fetchFunction,
}: {
  key: string;
  fetchFunction: () => Promise<T>;
}): Promise<T> => {
  const value = await redisClient.get(key);
  if (value) {
    return JSON.parse(value);
  }
  const response = await fetchFunction();
  await redisClient.setex(key, 64800000, JSON.stringify(response));
  return response;
};

export const clearDashboardCache = async () => {
  await redisClient.del("dashboard");
};

export const clearAllBillCache = async () => {
  const pattern = "bill-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearFMCache = async () => {
  const pattern = "FM-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearLRCache = async () => {
  const pattern = "LR-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearAllExpenseCache = async () => {
  await redisClient.del("getAllCredit");
};

export const clearGetAllRecordPaymentCache = async () => {
  await redisClient.del("getAllRecordPayment");
};

export const clearRecentTransactionCache = async () => {
  const pattern = "recent-payment-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

export const clearVendorCache = async () => {
  const pattern = "vendor-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearClientCache = async () => {
  const pattern = "client-data*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
};

export const clearCreditCache = async () => {
  const pattern = "credit-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearExpenseCache = async () => {
  const pattern = "expense-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearPODCache = async () => {
  const pattern = "POD-data-*";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const clearGetRecentTransactionCache = async () => {
  const pattern = "GetRecentTransactions";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
export const clearGetVehicleCache = async () => {
  const pattern = "getVehicle";
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};