/* eslint-disable max-lines-per-function */

import { createSlice } from "@reduxjs/toolkit";
import * as API from "../api";

const expense = {
  id: null,
  expense_name: "",
  application: "",
  url: "",
  place_of_purchase: "",
  date_of_purchase: "",
  category: "",
  card: "",
  amount: 0,
  reason: "",
  documents: [],
  is_subscription: false,
  is_direct_expense: false,
  subscription: {
    amount: 0,
    frequency: "",
    start_date: "",
    end_date: "",
  },
};

const expensePage = createSlice({
  name: "expensePage",
  initialState: {
    loading: false,
    expenses: [],
    expense: expense,
    remoteVersionRequirement: 0,
    edit_expense_modal: false,
    upload_expense_modal: false,
    expense_modal: false,
    message: "",
    error: {},
    filters: {},
  },
  reducers: {
    set_expense: (state, { payload }) => {
      const updated_expense = payload;
      return {
        ...state,
        expense: { ...state.expense, ...updated_expense },
      };
    },
    set_loading: (state, { payload }) => {
      state.loading = payload;
    },
    set_edit_expense_modal: (state, { payload }) => {
      state.edit_expense_modal = payload;
    },
    open_create_expense_modal: (state, { payload }) => {
      state.edit_expense_modal = true;
      state.expense = expense;
    },
    open_edit_expense_modal: (state, { payload }) => {
      state.edit_expense_modal = true;
      state.expense = payload;
    },
    close_expense_modal: (state, { payload }) => {
      state.edit_expense_modal = false;
      state.upload_expense_modal = false;
      state.expense_modal = false;
      state.expense = expense;
    },
    open_expense_modal: (state, { payload }) => {
      state.expense_modal = true;
      state.expense = payload;
    },
    expense_uploaded: (state, { payload }) => {
      state.upload_expense_modal = false;
      state.remoteVersionRequirement = Date.now();
    },
    set_filters: (state, { payload }) => {
      state.filters = payload;
    },
  },
  extraReducers: {
    [API.listExpenses.pending]: (state, { payload }) => {
      state.loading = true;
      state.expenses = [];
    },
    [API.listExpenses.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.expenses = payload.data;
      state.totalPages = payload.total_count;
      state.page = payload.currentPage;
      state.message = "Expenses Found";
    },
    [API.listExpenses.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.saveExpense.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.saveExpense.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.message = "Expense Saved";
      state.remoteVersionRequirement = Date.now();
      state.edit_expense_modal = false;
    },
    [API.saveExpense.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.detailsExpense.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.detailsExpense.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.expense = payload;
      state.message = "Expense Found";
    },
    [API.detailsExpense.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.deleteExpense.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.deleteExpense.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.message = "Expense Deleted";
      state.remoteVersionRequirement = Date.now();
    },
    [API.deleteExpense.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.deleteMultipleExpenses.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.deleteMultipleExpenses.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.message = "Expense Deleted";
      state.remoteVersionRequirement = Date.now();
    },
    [API.deleteMultipleExpenses.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.backfillSubscriptions.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.backfillSubscriptions.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.message = "Backfill Subscriptions Success";
      state.remoteVersionRequirement = Date.now();
    },
    [API.backfillSubscriptions.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.bulkSaveExpenses.pending]: (state, { payload }) => {
      state.loading = true;
    },
    [API.bulkSaveExpenses.fulfilled]: (state, { payload }) => {
      state.loading = false;
      state.message = "Backfill Subscriptions Success";
      state.remoteVersionRequirement = Date.now();
    },
    [API.bulkSaveExpenses.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
    [API.updateMultipleExpenseField.pending]: state => {
      state.loading = true;
    },
    [API.updateMultipleExpenseField.fulfilled]: state => {
      state.loading = false;
      state.remoteVersionRequirement = Date.now();
    },
    [API.updateMultipleExpenseField.rejected]: (state, { payload, error }) => {
      state.loading = false;
      state.error = payload ? payload.error : error.message;
      state.message = payload ? payload.message : "An error occurred";
    },
  },
});

export const {
  set_loading,
  set_expense,
  set_edit_expense_modal,
  open_create_expense_modal,
  open_expense_modal,
  close_expense_modal,
  open_edit_expense_modal,
  expense_uploaded,
  set_filters,
} = expensePage.actions;
export default expensePage.reducer;
