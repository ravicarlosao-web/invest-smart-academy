import * as schema from "./schema/index.js";
export declare const db: import("drizzle-orm/libsql/driver-core").LibSQLDatabase<typeof schema> & {
    $client: import("@libsql/client").Client;
};
/**
 * Ensures all required tables exist in Turso.
 * Safe to call on every startup — uses CREATE TABLE IF NOT EXISTS.
 */
export declare function initDb(): Promise<void>;
export * from "./schema/index.js";
export { eq, and, or, not, desc, asc, sql, inArray, isNull, isNotNull, lt, lte, gt, gte } from "drizzle-orm";
//# sourceMappingURL=index.d.ts.map