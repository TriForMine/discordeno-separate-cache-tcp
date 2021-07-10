import { cache, CacheTableNames } from "../cache.ts";

export default function clear(table: CacheTableNames) {
    return cache[table].clear();
}
