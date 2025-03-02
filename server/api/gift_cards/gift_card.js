import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    initialBalance: {
      type: Number,
      required: true,
    },
    currentBalance: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ["customer", "sponsor_benefit", "promotion", "compensation"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expirationDate: {
      type: Date,
    },
    transactions: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add method to check balance
giftCardSchema.methods.checkBalance = function () {
  return this.currentBalance;
};

// Add method to validate gift card
giftCardSchema.methods.isValid = function () {
  if (!this.isActive || this.deleted) return false;
  if (this.expirationDate && new Date() > this.expirationDate) return false;
  if (this.currentBalance <= 0) return false;
  return true;
};

// Add method to use gift card
giftCardSchema.methods.use = async function (amount, orderId) {
  if (!this.isValid()) throw new Error("Gift card is not valid");
  if (amount > this.currentBalance) throw new Error("Insufficient balance");

  this.currentBalance -= amount;
  this.transactions.push({
    orderId,
    amount,
    date: Date.now(),
  });

  if (this.currentBalance === 0) {
    this.isActive = false;
  }

  return this.save();
};

const GiftCard = mongoose.model("GiftCard", giftCardSchema);
export default GiftCard;
