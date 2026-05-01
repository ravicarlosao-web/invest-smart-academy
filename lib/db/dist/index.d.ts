import * as schema from "./schema";
export declare const db: import("drizzle-orm/libsql/driver-core").LibSQLDatabase<typeof schema> & {
    $client: import("@libsql/client").Client;
};
/**
 * Ensures all required tables exist in Turso.
 * Safe to call on every startup — uses CREATE TABLE IF NOT EXISTS.
 */
export declare function initDb(): Promise<void>;
export * from "./schema";
export { eq, and, or, not, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
//# sourceMappingURL=index.d.ts.map