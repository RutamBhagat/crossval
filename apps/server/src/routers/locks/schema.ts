import { type } from "arktype";

import { Month } from "@/validation";

const lockInputSchema = type({ month: Month });

export { lockInputSchema };
