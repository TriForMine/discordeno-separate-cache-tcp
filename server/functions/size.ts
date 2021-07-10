import { cache, CacheTableNames } from "../cache.ts";

export default function size(table: CacheTableNames) {
    return cache[table].size;
}
