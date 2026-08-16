import { configure } from "arktype/config";

configure({
  onUndeclaredKey: "delete",
});
