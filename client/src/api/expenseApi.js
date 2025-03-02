/* eslint-disable consistent-return */
import { createAsyncThunk } from "@reduxjs/toolkit";

import axios from "axios";
import { errorMessage } from "../helpers/sharedHelpers";

import { create_query } from "../utils/helper_functions";
import { showError, showSuccess } from "../slices/snackbarSlice";
import store from "../store";

export const getExpenses = async ({ search, sorting, filters, page, pageSize }) => {
  try {
    return await axios.get(`/api/expenses`, {
      params: {
        limit: pageSize,
        page: page,
        search: search,
        sort: sorting,
        filters: JSON.stringify(filters),
      },
    });
  } catch (error) {
    store.dispatch(showError({ message: errorMessage(error) }));
  }
};

export const getExpenseFilters = async () => {
  const { data } = await axios.get(`/api/expenses/filters`);
  return data;
};

export const listExpenses = createAsyncThunk("expenses/listExpenses", async (query, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await axios.get(`/api/expenses?${create_query(query)}`);
    return data;
  } catch (error) {
    dispatch(showError({ message: errorMessage(error) }));
    return rejectWithValue(error.response?.data);
  }
});

export const saveExpense = createAsyncThunk("expenses/saveExpense", async (expense, { dispatch, rejectWithValue }) => {
  try {
    if (!expense._id) {
      const { data } = await axios.post("/api/expenses", expense);
      dispatch(showSuccess({ message: `Expense Created` }));
      return data;
    } else {
      const { data } = await axios.put(`/api/expenses/${expense._id}`, expense);
      dispatch(showSuccess({ message: `Expense Updated` }));
      return data;
    }
  } catch (error) {
    dispatch(showError({ message: errorMessage(error) }));
    return rejectWithValue(error.response?.data);
  }
});

export const detailsExpense = createAsyncThunk("expenses/detailsExpense", async (id, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await axios.get(`/api/expenses/${id}`);
    dispatch(showSuccess({ message: `Expense Found` }));
    return data;
  } catch (error) {
    dispatch(showError({ message: errorMessage(error) }));
    return rejectWithValue(error.response?.data);
  }
});

export const getExpensesByLink = createAsyncThunk(
  "expenses/getExpensesByLink",
  async (link, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/expenses/link`, { link });
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  "expenses/deleteExpense",
  async (pathname, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.delete("/api/expenses/" + pathname);
      dispatch(showSuccess({ message: `Expense Deleted` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteMultipleExpenses = createAsyncThunk(
  "expenses/deleteMultipleExpenses",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/expenses/delete_multiple`, { ids });
      dispatch(showSuccess({ message: `Expenses Deleted` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const backfillSubscriptions = createAsyncThunk(
  "expenses/backfillSubscriptions",
  async (expenseId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/expenses/${expenseId}/subscriptions/backfill`);
      dispatch(showSuccess({ message: `Subscriptions Backfill Complete` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const bulkSaveExpenses = createAsyncThunk(
  "expenses/bulkSaveExpenses",
  async (expenses, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.post(`/api/expenses/bulk`, { expenses });
      dispatch(showSuccess({ message: `Bulk Save Complete - ${data.message}` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateMultipleExpenseField = createAsyncThunk(
  "expenses/updateMultipleExpenseField",
  async ({ ids, field, value }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/api/expenses/update_multiple_field`, { ids, field, value });
      dispatch(showSuccess({ message: `${field} Updated` }));
      return data;
    } catch (error) {
      dispatch(showError({ message: errorMessage(error) }));
      return rejectWithValue(error.response?.data);
    }
  }
);
