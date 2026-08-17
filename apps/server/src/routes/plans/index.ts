import { Plan } from "@crossval/db/models/plan.model";
import { runIfPeriodsOpen } from "@crossval/db/period-state";
import { Elysia } from "elysia";

import { authPlugin } from "../../plugins/auth.js";
import { commonModels } from "../../schemas/common.js";
import {
  PlanInput,
  PlanSaveResponse,
  PlansListResponse,
  PlansQuery,
} from "./schema.js";

const plansRoutes = new Elysia({ prefix: "/plans" })
  .use(commonModels)
  .use(authPlugin)
  .get(
    "/",
    async ({ query, userId }) => {
      const filter = { userId };
      const [plans, total] = await Promise.all([
        Plan.find(filter)
          .sort({ [query.sort]: query.direction, _id: 1 })
          .skip(query.offset)
          .limit(query.limit)
          .lean(),
        Plan.countDocuments(filter),
      ]);

      return {
        plans: plans.map((plan) => ({
          id: plan._id.toString(),
          categoryId: plan.categoryId,
          month: plan.month,
          amountCents: plan.amountCents,
        })),
        total,
      };
    },
    {
      auth: true,
      query: PlansQuery,
      response: {
        200: PlansListResponse,
        401: "error.api",
        429: "error.rateLimit",
      },
    },
  )
  .put(
    "/",
    async ({ body, status, userId }) => {
      const result = await runIfPeriodsOpen(userId, [body.month], (session) =>
        Plan.findOneAndUpdate(
          { userId, categoryId: body.categoryId, month: body.month },
          { $set: { amountCents: body.amount * 100 } },
          {
            returnDocument: "after",
            runValidators: true,
            session,
            upsert: true,
          },
        ).lean(),
      );

      if (!result.ok) {
        return status(423, {
          type: "period_locked",
          message: `Plans for ${body.month} are locked`,
        });
      }
      if (!result.value) throw new Error("Plan was not saved");

      return {
        plan: {
          id: result.value._id.toString(),
          categoryId: result.value.categoryId,
          month: result.value.month,
          amountCents: result.value.amountCents,
        },
      };
    },
    {
      auth: true,
      body: PlanInput,
      response: {
        200: PlanSaveResponse,
        401: "error.api",
        423: "error.api",
        429: "error.rateLimit",
      },
    },
  );

export { plansRoutes };
