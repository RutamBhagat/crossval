import mongoose from "mongoose";

const { Schema } = mongoose;

const periodLockSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
  },
  {
    collection: "periodLocks",
    timestamps: true,
  },
);

periodLockSchema.index({ userId: 1, month: 1 }, { unique: true });

const PeriodLock =
  mongoose.models.PeriodLock ?? mongoose.model("PeriodLock", periodLockSchema);

export { PeriodLock };
