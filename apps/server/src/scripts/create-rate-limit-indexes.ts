import { connection } from "@crossval/db";

import { mongoRateLimiter } from "../middleware/mongo-rate-limit";

try {
  await mongoRateLimiter.createIndexes();
} finally {
  await connection.close();
}
