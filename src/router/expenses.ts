import express from "express";
import { createExpense, deleteExpense, deleteExpenseByNotification, filterExpensesByTitle, getAllExpenses, getExpenseByPage, updateExpenseByNotification, updateExpenseDetails } from "../controller/expenses";

const expensesRouter = express.Router();

expensesRouter.post("/expenses/create", createExpense);
expensesRouter.get("/expenses/getAll", getAllExpenses);
expensesRouter.delete("/expenses/delete/:id", deleteExpense);
expensesRouter.patch("/expenses/update/:id", updateExpenseDetails);
expensesRouter.patch("/expenses/updateByNotification/:id", updateExpenseByNotification);
expensesRouter.delete("/expenses/deleteByNotification/:id", deleteExpenseByNotification);
expensesRouter.get("/expenses/getByPage", getExpenseByPage);
expensesRouter.get("/expenses/filterByTitle/:text/:branchId", filterExpensesByTitle);

export default expensesRouter;