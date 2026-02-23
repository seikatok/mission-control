/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityEvents from "../activityEvents.js";
import type * as agentTemplates from "../agentTemplates.js";
import type * as agents from "../agents.js";
import type * as boards from "../boards.js";
import type * as clearAll from "../clearAll.js";
import type * as complianceEvents from "../complianceEvents.js";
import type * as dashboard from "../dashboard.js";
import type * as decisions from "../decisions.js";
import type * as e2eSetup from "../e2eSetup.js";
import type * as gateways from "../gateways.js";
import type * as goals from "../goals.js";
import type * as helpers from "../helpers.js";
import type * as outputs from "../outputs.js";
import type * as runs from "../runs.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityEvents: typeof activityEvents;
  agentTemplates: typeof agentTemplates;
  agents: typeof agents;
  boards: typeof boards;
  clearAll: typeof clearAll;
  complianceEvents: typeof complianceEvents;
  dashboard: typeof dashboard;
  decisions: typeof decisions;
  e2eSetup: typeof e2eSetup;
  gateways: typeof gateways;
  goals: typeof goals;
  helpers: typeof helpers;
  outputs: typeof outputs;
  runs: typeof runs;
  seed: typeof seed;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
