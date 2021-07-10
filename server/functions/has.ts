import { cache, CacheTableNames } from "../cache.ts";

export default function has(table: CacheTableNames, key: string) {
    return cache[table].has(key);
}
