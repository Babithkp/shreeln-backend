import express from "express";import {
  createCredit,
  createExpense,
  deleteCredit,
  deleteCreditByNotification,
  deleteExpense,
  deleteExpenseByNotification,
  filterCreditByDate,
  filterCreditByDateForBranch,
  filterCreditsByTitle,
  filterExpensesByDate,
  filterExpensesByDateForBranch,
  filterExpensesByTitle,
  getAllCredit,
  getAllExpenses,
  getCreditByPage,
  getExpenseByPage,
  updateCreditByNotification,
  updateCreditDetails,
  updateExpenseByNotification,
  updateExpenseDetails,
} from "../controller/expenses";

import { invalidateDashboardOnSuccess } from "../controller/utils/redis";
const expensesRouter = express.Router();

expensesRouter.post("/expenses/create", invalidateDashboardOnSuccess, createExpense);
expensesRouter.get("/expenses/getAll", getAllExpenses);
expensesRouter.get("/credits/getAll", getAllCredit);
expensesRouter.delete("/expenses/delete/:id", invalidateDashboardOnSuccess, deleteExpense);
expensesRouter.delete("/credit/delete/:id", deleteCredit);
expensesRouter.patch("/expenses/update/:id", invalidateDashboardOnSuccess, updateExpenseDetails);
expensesRouter.patch("/credit/update/:id", updateCreditDetails);
expensesRouter.patch(
  "/expenses/updateByNotification/:id",
  invalidateDashboardOnSuccess,
  updateExpenseByNotification
);
expensesRouter.patch(
  "/credit/updateByNotification/:id",
  updateCreditByNotification
);
expensesRouter.delete(
  "/expenses/deleteByNotification/:id",
  invalidateDashboardOnSuccess,
  deleteExpenseByNotification
);
expensesRouter.delete(
  "/credit/deleteByNotification/:id",
  deleteCreditByNotification
);
expensesRouter.get("/expenses/getByPage", getExpenseByPage);
expensesRouter.get(
  "/expenses/filterByTitle/:text/:branchId",
  filterExpensesByTitle
);
expensesRouter.get(
  "/credits/filterByTitle/:text/:branchId",
  filterCreditsByTitle
);
expensesRouter.post("/expenses/credits/create", createCredit);
expensesRouter.get("/credits/getByPage", getCreditByPage);
expensesRouter.post("/expenses/filterExpensesByDate", filterExpensesByDate);
expensesRouter.post("/credit/filterCreditByDate", filterCreditByDate); 
expensesRouter.post("/expenses/filterExpensesByDateForBranch/:branchId", filterExpensesByDateForBranch);
expensesRouter.post("/credit/filterCreditByDateForBranch/:branchId", filterCreditByDateForBranch);


export default expensesRouter;
