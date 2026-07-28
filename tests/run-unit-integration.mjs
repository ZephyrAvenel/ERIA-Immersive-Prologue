import { runGroups } from "./run-tests.mjs";

await runGroups(["unit", "integration"]);
