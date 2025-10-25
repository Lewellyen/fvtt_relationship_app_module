import { RAM_CONSTANTS } from "../constants";

Hooks.on("init", () => {
  console.log(`${RAM_CONSTANTS.MODULE_LOG_PREFIX} init`);
});

Hooks.on("ready", () => {
  console.log(`${RAM_CONSTANTS.MODULE_LOG_PREFIX} ready`);
});

