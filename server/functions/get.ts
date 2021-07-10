import { cache, CacheTableNames } from "../cache.ts";

export default function get(table: CacheTableNames, key: string) {
    return cache[table].get(key);
}
