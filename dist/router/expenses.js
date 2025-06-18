"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expenses_1 = require("../controller/expenses");
const expensesRouter = express_1.default.Router();
expensesRouter.post("/expenses/create", expenses_1.createExpense);
expensesRouter.get("/expenses/getAll", expenses_1.getAllExpenses);
expensesRouter.delete("/expenses/delete/:id", expenses_1.deleteExpense);
expensesRouter.patch("/expenses/update/:id", expenses_1.updateExpenseDetails);
expensesRouter.patch("/expenses/updateByNotification/:id", expenses_1.updateExpenseByNotification);
expensesRouter.delete("/expenses/deleteByNotification/:id", expenses_1.deleteExpenseByNotification);
exports.default = expensesRouter;
