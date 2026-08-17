import { t } from "elysia";

import { Month } from "../../schemas/common.js";

const LockDto = t.Object({
  id: t.String(),
  month: Month,
});

const LockInput = t.Object({ month: Month });

const LocksResponse = t.Object({
  locks: t.Array(LockDto),
});

const LockSaveResponse = t.Object({ lock: LockDto });

export { LockInput, LocksResponse, LockSaveResponse };
