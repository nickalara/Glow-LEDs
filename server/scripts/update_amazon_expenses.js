import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import Expense from "../api/expenses/expense.js";
import config from "../config.js";

// Connect to MongoDB
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/**
 * Parse the Amazon order history CSV file
 * @param {string} filePath - Path to the CSV file
 * @param {string} currency - Currency of the CSV file ('USD' or 'EUR')
 * @returns {Array} - Array of parsed Amazon orders
 */
const parseAmazonCSV = (filePath, currency = "USD") => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Parse CSV data
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true, // Amazon CSV might have inconsistent column counts
      trim: true,
    });

    console.log("CSV headers:", Object.keys(records[0]));
    console.log(`Processing ${currency} CSV file with ${records.length} records`);

    // Process and clean the data
    return records
      .map(record => {
        // Extract date from the date field
        let date;

        if (record.date) {
          // For EUR records, handle potential European date format (DD-MM-YYYY or DD/MM/YYYY)
          if (currency === "EUR") {
            // Check if the date might be in European format
            const dateParts = record.date.split(/[-/]/);

            // If we have a date like 2024-12-30, it might actually be 30-12-2023 in European format
            // Check if the first part is a year (4 digits) and the second part is > 12 (invalid month)
            if (
              dateParts.length === 3 &&
              dateParts[0].length === 4 &&
              parseInt(dateParts[1], 10) > 12 &&
              parseInt(dateParts[1], 10) <= 31
            ) {
              // This is likely a European date with swapped month/day
              // Reconstruct as YYYY-MM-DD
              date = new Date(`${dateParts[0]}-${dateParts[2]}-${dateParts[1]}`);

              // If the date is in the future, subtract a year (likely from previous year)
              const now = new Date();
              if (date > now) {
                date.setFullYear(date.getFullYear() - 1);
              }

              console.log(`Corrected European date format: ${record.date} -> ${date.toISOString().split("T")[0]}`);
            } else {
              // Try standard date parsing
              date = new Date(record.date);

              // If the date is in the future, subtract a year (likely from previous year)
              const now = new Date();
              if (date > now) {
                date.setFullYear(date.getFullYear() - 1);
                console.log(`Adjusted future date: ${record.date} -> ${date.toISOString().split("T")[0]}`);
              }
            }
          } else {
            // For USD records, use standard date parsing
            date = new Date(record.date);
          }
        } else {
          date = null;
        }

        // Skip invalid dates
        if (!date || Number.isNaN(date.getTime())) {
          console.log(`Skipping record with invalid date: ${record.date}`);
          return null;
        }

        // Extract total amount, removing any currency symbols and converting to number
        let total = 0;
        if (record.total) {
          // Remove all non-numeric characters except decimal point and comma
          let cleanedTotal = record.total.replace(/[^\d.,]/g, "");

          // Handle European number format (replace comma with dot)
          if (currency === "EUR") {
            cleanedTotal = cleanedTotal.replace(",", ".");
          }

          total = parseFloat(cleanedTotal);

          // If parsing failed, log and skip
          if (Number.isNaN(total)) {
            console.log(`Skipping record with invalid total: ${record.total}`);
            return null;
          }
        }

        // Extract items, which might contain multiple items separated by semicolons
        const items = record.items || "";

        // Extract card info from payments field
        const cardInfo = record.payments ? extractCardInfo(record.payments) : null;

        return {
          orderId: record["order id"] || "",
          date,
          total,
          items,
          card: cardInfo,
          currency,
          rawData: record, // Keep the raw data for debugging
        };
      })
      .filter(record => record !== null && record.date && record.total > 0); // Filter out invalid records
  } catch (error) {
    console.error(`Error parsing Amazon ${currency} CSV:`, error);
    return [];
  }
};

/**
 * Extract card information from the payments field
 * @param {string} payments - The payments field from the CSV
 * @returns {string} - The extracted card information
 */
const extractCardInfo = payments => {
  if (!payments) return null;

  // Example format: "Visa ending in 9204: October 8, 2024: $34.99;"
  const cardMatch = payments.match(/(Visa|AmericanExpress|Mastercard|Discover)(?:\s+ending\s+in\s+(\d+))?/i);

  if (cardMatch) {
    const cardType = cardMatch[1];
    const lastFour = cardMatch[2] || "";

    if (cardType.toLowerCase() === "americanexpress") {
      return `AMEX ${lastFour}`;
    } else {
      return `${cardType.toUpperCase()} ${lastFour}`;
    }
  }

  // Check for Amazon card patterns
  const amazonMatch = payments.match(
    /Amazon(?:\s+(?:Business)?(?:\s+Prime)?(?:\s+Card)?)?(?:\s+ending\s+in\s+(\d+))?/i
  );
  if (amazonMatch) {
    const lastFour = amazonMatch[1] || "";
    return lastFour ? `Amazon ${lastFour}` : "Amazon";
  }

  return payments.trim();
};

/**
 * Check if two card strings might refer to the same card
 * @param {string} card1 - First card string
 * @param {string} card2 - Second card string
 * @returns {boolean} - Whether the cards might match
 */
const cardsMatch = (card1, card2) => {
  if (!card1 || !card2) return true; // If either is missing, don't use card for matching

  // Normalize card strings
  const normalize = str => str.toLowerCase().trim().replace(/\s+/g, " ");
  const card1Norm = normalize(card1);
  const card2Norm = normalize(card2);

  // Direct match
  if (card1Norm === card2Norm) return true;

  // Check if one contains the other
  if (card1Norm.includes(card2Norm) || card2Norm.includes(card1Norm)) return true;

  // Extract card numbers if present
  const getCardNumber = str => {
    const match = str.match(/\d{4}/);
    return match ? match[0] : null;
  };

  const num1 = getCardNumber(card1Norm);
  const num2 = getCardNumber(card2Norm);

  // If both have numbers and they match
  if (num1 && num2 && num1 === num2) return true;

  // Check for common card types
  const cardTypes = ["amazon", "visa", "mastercard", "amex", "discover", "charles schwab"];

  // Check if they share any card type
  return cardTypes.some(type => {
    if (card1Norm.includes(type) && card2Norm.includes(type)) {
      // If they share a card type, check if they also have numbers
      if (num1 && num2) {
        // If numbers exist but don't match, then it's not the same card
        return num1 === num2;
      }
      // They share a card type and at least one doesn't have a number
      return true;
    }
    return false;
  });
};

/**
 * Convert amount from EUR to USD using a fixed exchange rate
 * @param {number} amount - Amount in EUR
 * @param {number} exchangeRate - Exchange rate (EUR to USD)
 * @returns {number} - Amount in USD
 */
const convertEurToUsd = (amount, exchangeRate) => {
  return amount * exchangeRate;
};

/**
 * Find expenses that match Amazon orders
 * @param {Array} amazonOrders - Array of parsed Amazon orders
 * @param {number} exchangeRate - Exchange rate from EUR to USD
 * @returns {Promise<Object>} - Object containing matches and unmatched orders
 */
const matchExpensesWithOrders = async (amazonOrders, exchangeRate) => {
  const matches = [];
  const unmatchedOrders = [];
  const ordersToProcess = [...amazonOrders];

  // Get all Amazon expenses from 2024
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-12-31");

  // Find expenses where place_of_purchase contains "Amazon" (case insensitive)
  const amazonExpenses = await Expense.find({
    place_of_purchase: { $regex: /amazon/i },
    date_of_purchase: { $gte: startDate, $lte: endDate },
    deleted: false,
  });

  console.log(`Found ${amazonExpenses.length} Amazon expenses from 2024`);
  console.log(`Found ${ordersToProcess.length} Amazon orders from the CSV files`);

  // Debug: Print some sample expenses and orders
  console.log("\nSample expenses:");
  amazonExpenses.slice(0, 3).forEach(expense => {
    console.log(
      `- Expense: ${expense._id}, Date: ${expense.date_of_purchase.toISOString().split("T")[0]}, Amount: $${expense.amount}, Card: ${expense.card}`
    );
  });

  console.log("\nSample orders:");
  ordersToProcess.slice(0, 3).forEach(order => {
    const currencySymbol = order.currency === "EUR" ? "€" : "$";
    console.log(
      `- Order: ${order.orderId}, Date: ${order.date.toISOString().split("T")[0]}, Amount: ${currencySymbol}${order.total}, Currency: ${order.currency}, Items: ${order.items.substring(0, 50)}...`
    );
  });

  // For each Amazon expense, try to find a matching order
  amazonExpenses.forEach(expense => {
    const expenseDate = new Date(expense.date_of_purchase);
    const expenseAmount = Math.abs(expense.amount);

    // Look for orders with matching amount and flexible date
    const matchingOrders = ordersToProcess.filter(order => {
      const orderDate = new Date(order.date);

      // Check if dates are within a 5-day window (credit card posting can be delayed)
      const dateDiff = Math.abs(orderDate.getTime() - expenseDate.getTime());
      const daysDiff = Math.floor(dateDiff / (1000 * 60 * 60 * 24));
      const closeDate = daysDiff <= 5; // Within 5 days

      // Convert order amount to USD if it's in EUR
      const orderAmountUSD = order.currency === "EUR" ? convertEurToUsd(order.total, exchangeRate) : order.total;

      // Check if amounts are close (within 5% to account for currency conversion fluctuations)
      const amountDiff = Math.abs(orderAmountUSD - expenseAmount);
      const percentDiff = amountDiff / expenseAmount;

      // For USD orders, use a tighter match (within 1 cent)
      // For EUR orders, allow for more flexibility due to exchange rate variations (within 5%)
      const closeAmount = order.currency === "USD" ? amountDiff < 0.01 : percentDiff < 0.05;

      // Check if cards match using our improved matching function
      const cardMatch = cardsMatch(order.card, expense.card);

      // Reject matches where the order date is more than 30 days away from the expense date
      // This prevents matching with orders that are too far in the future or past
      if (daysDiff > 30) {
        return false;
      }

      // For matching, we prioritize amount match, then consider date and card
      const isMatch = closeAmount && (closeDate || cardMatch);

      if (isMatch) {
        console.log(`Match found! Expense: ${expense._id}, Order: ${order.orderId}`);
        console.log(
          `  Expense Date: ${expenseDate.toISOString().split("T")[0]}, Order Date: ${orderDate.toISOString().split("T")[0]}, Days Diff: ${daysDiff}`
        );
        console.log(
          `  Expense Amount: $${expenseAmount}, Order Amount: ${order.currency === "EUR" ? "€" : "$"}${order.total}`
        );
        if (order.currency === "EUR") {
          console.log(
            `  Order Amount in USD (approx): $${orderAmountUSD.toFixed(2)}, Difference: $${amountDiff.toFixed(2)} (${(percentDiff * 100).toFixed(2)}%)`
          );
        }
        console.log(`  Expense Card: ${expense.card}, Order Card: ${order.card}`);
      }

      return isMatch;
    });

    if (matchingOrders.length > 0) {
      // Sort matching orders by date proximity to expense date
      matchingOrders.sort((a, b) => {
        const aDateDiff = Math.abs(new Date(a.date).getTime() - expenseDate.getTime());
        const bDateDiff = Math.abs(new Date(b.date).getTime() - expenseDate.getTime());
        return aDateDiff - bDateDiff;
      });

      // Use the closest matching order by date
      const matchedOrder = matchingOrders[0];

      // Remove the matched order from the list to avoid duplicate matches
      const orderIndex = ordersToProcess.findIndex(o => o.orderId === matchedOrder.orderId);
      if (orderIndex !== -1) {
        ordersToProcess.splice(orderIndex, 1);
      }

      matches.push({
        expense,
        order: matchedOrder,
      });
    }
  });

  // Any remaining orders in ordersToProcess are unmatched
  unmatchedOrders.push(...ordersToProcess);

  return { matches, unmatchedOrders };
};

/**
 * Update expense names with the items from matched Amazon orders
 * @param {Array} matches - Array of matched expenses with their corresponding Amazon orders
 * @returns {Promise<number>} - Number of updated expenses
 */
const updateExpenseNames = async matches => {
  // Prepare all updates
  const updatePromises = matches
    .filter(match => match.order.items && match.order.items.trim() !== "")
    .map(match => {
      const { expense, order } = match;
      const storeName = order.currency === "EUR" ? "Amazon ES" : "Amazon";
      const newExpenseName = `${storeName}: ${order.items.trim()}`;

      console.log(`Updating expense ${expense._id} with new name: ${newExpenseName}`);

      return Expense.updateOne({ _id: expense._id }, { expense_name: newExpenseName });
    });

  // Execute all updates in parallel
  const results = await Promise.all(updatePromises);
  const updatedCount = results.reduce((count, result) => count + (result.modifiedCount || 0), 0);

  console.log(`Updated ${updatedCount} expenses with Amazon order details`);
  return updatedCount;
};

/**
 * Main function to run the script
 */
const main = async () => {
  try {
    // Set the exchange rate for EUR to USD conversion
    // This is a fixed rate and should be updated periodically for accuracy
    const exchangeRate = 1.08; // 1 EUR = 1.08 USD (as of May 2024)
    console.log(`Using EUR to USD exchange rate: ${exchangeRate}`);

    let amazonOrders = [];

    // Process regular Amazon orders (USD)
    let usdCsvFilePath = path.resolve(process.cwd(), "amazon_order_history.csv");
    if (fs.existsSync(usdCsvFilePath)) {
      console.log(`Found USD CSV file at: ${usdCsvFilePath}`);
      const usdOrders = parseAmazonCSV(usdCsvFilePath, "USD");
      console.log(`Parsed ${usdOrders.length} Amazon USD orders from CSV`);
      amazonOrders = [...amazonOrders, ...usdOrders];
    } else {
      usdCsvFilePath = path.resolve(process.cwd(), "../amazon_order_history.csv");
      if (fs.existsSync(usdCsvFilePath)) {
        console.log(`Found USD CSV file at: ${usdCsvFilePath}`);
        const usdOrders = parseAmazonCSV(usdCsvFilePath, "USD");
        console.log(`Parsed ${usdOrders.length} Amazon USD orders from CSV`);
        amazonOrders = [...amazonOrders, ...usdOrders];
      } else {
        console.log("No Amazon USD order history CSV file found.");
      }
    }

    // Process Amazon ES orders (EUR)
    let eurCsvFilePath = path.resolve(process.cwd(), "amazon_es_order_history.csv");
    if (fs.existsSync(eurCsvFilePath)) {
      console.log(`Found EUR CSV file at: ${eurCsvFilePath}`);
      const eurOrders = parseAmazonCSV(eurCsvFilePath, "EUR");
      console.log(`Parsed ${eurOrders.length} Amazon EUR orders from CSV`);
      amazonOrders = [...amazonOrders, ...eurOrders];
    } else {
      eurCsvFilePath = path.resolve(process.cwd(), "../amazon_es_order_history.csv");
      if (fs.existsSync(eurCsvFilePath)) {
        console.log(`Found EUR CSV file at: ${eurCsvFilePath}`);
        const eurOrders = parseAmazonCSV(eurCsvFilePath, "EUR");
        console.log(`Parsed ${eurOrders.length} Amazon EUR orders from CSV`);
        amazonOrders = [...amazonOrders, ...eurOrders];
      } else {
        console.log("No Amazon ES order history CSV file found.");
      }
    }

    if (amazonOrders.length === 0) {
      throw new Error("No Amazon order history CSV files found. Please place them in the root or server directory.");
    }

    console.log(`Total Amazon orders from all CSV files: ${amazonOrders.length}`);

    // Match expenses with orders
    const { matches, unmatchedOrders } = await matchExpensesWithOrders(amazonOrders, exchangeRate);
    console.log(`Found ${matches.length} matches between expenses and Amazon orders`);
    console.log(`${unmatchedOrders.length} Amazon orders could not be matched to expenses`);

    // Update expense names
    await updateExpenseNames(matches);

    // Save unmatched orders to a file for later reference
    if (unmatchedOrders.length > 0) {
      console.log("\nUnmatched Amazon orders:");

      // Create a CSV of unmatched orders
      const unmatchedOrdersCSV = [
        "Date,Amount,Currency,Items,Card", // Header
        ...unmatchedOrders.map(
          order =>
            `${order.date.toISOString().split("T")[0]},${order.total},${order.currency},"${order.items.replace(/"/g, '""')}",${order.card || ""}`
        ),
      ].join("\n");

      const unmatchedOrdersPath = path.resolve(process.cwd(), "../unmatched_amazon_orders.csv");
      fs.writeFileSync(unmatchedOrdersPath, unmatchedOrdersCSV);
      console.log(`Saved ${unmatchedOrders.length} unmatched orders to ${unmatchedOrdersPath}`);

      // Log first 10 unmatched orders to console
      unmatchedOrders.slice(0, 10).forEach(order => {
        const currencySymbol = order.currency === "EUR" ? "€" : "$";
        console.log(
          `- Order ${order.orderId}: ${order.date.toISOString().split("T")[0]}, ${currencySymbol}${order.total}, Items: ${order.items.substring(0, 100)}...`
        );
      });
      console.log(`... and ${unmatchedOrders.length - 10} more unmatched orders`);
    }

    console.log("\nScript completed successfully");
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
};

// Run the script
main();
