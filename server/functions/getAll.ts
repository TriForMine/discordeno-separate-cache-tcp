import { cache, CacheTableNames } from "../cache.ts";

export default function getAll(table: CacheTableNames) {
    return cache[table];
}
