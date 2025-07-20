import express from "express";import {
  createCredit,
  createExpense,
  deleteCredit,
  deleteCreditByNotification,
  deleteExpense,
  deleteExpenseByNotification,
  filterCreditsByTitle,
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

const expensesRouter = express.Router();

expensesRouter.post("/expenses/create", createExpense);
expensesRouter.get("/expenses/getAll", getAllExpenses);
expensesRouter.get("/credits/getAll", getAllCredit);
expensesRouter.delete("/expenses/delete/:id", deleteExpense);
expensesRouter.delete("/credit/delete/:id", deleteCredit);
expensesRouter.patch("/expenses/update/:id", updateExpenseDetails);
expensesRouter.patch("/credit/update/:id", updateCreditDetails);
expensesRouter.patch(
  "/expenses/updateByNotification/:id",
  updateExpenseByNotification
);
expensesRouter.patch(
  "/credit/updateByNotification/:id",
  updateCreditByNotification
);
expensesRouter.delete(
  "/expenses/deleteByNotification/:id",
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

export default expensesRouter;
