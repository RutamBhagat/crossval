import mongoose from "mongoose";

const { Schema } = mongoose;

const planSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    categoryId: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
  },
  {
    collection: "plans",
    timestamps: true,
  },
);

planSchema.index({ userId: 1, categoryId: 1, month: 1 }, { unique: true });
planSchema.index({ userId: 1, month: 1, categoryId: 1 });

const Plan = mongoose.models.Plan ?? mongoose.model("Plan", planSchema);

export { Plan };
