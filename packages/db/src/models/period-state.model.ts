import mongoose from "mongoose";

const { Schema } = mongoose;

const periodStateSchema = new Schema(
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
    locked: {
      type: Boolean,
      required: true,
      default: false,
    },
    revision: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    collection: "periodLocks",
    timestamps: true,
  },
);

periodStateSchema.index({ userId: 1, month: 1 }, { unique: true });

const PeriodState =
  mongoose.models.PeriodState ?? mongoose.model("PeriodState", periodStateSchema);

export { PeriodState };
