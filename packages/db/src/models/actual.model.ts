import { categoryIds, type CategoryId } from "@crossval/domain/categories";
import mongoose from "mongoose";

const { Schema } = mongoose;

interface ActualRecord {
  userId: string;
  categoryId: CategoryId;
  month: string;
  amountCents: number;
  note?: string | undefined;
}

const actualSchema = new Schema<ActualRecord>(
  {
    userId: { type: String, required: true },
    categoryId: { type: String, required: true, trim: true, enum: categoryIds },
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
    note: { type: String, trim: true, maxlength: 500 },
  },
  { collection: "actuals", timestamps: true },
);

actualSchema.index({ userId: 1, month: 1, categoryId: 1 });

const Actual =  mongoose.model<ActualRecord>("Actual", actualSchema);

export { Actual };
