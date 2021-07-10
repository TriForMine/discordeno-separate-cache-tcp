import { cache, CacheTableNames } from "../cache.ts";

export default function set(table: CacheTableNames, key: string, value: any) {
    return cache[table].set(key, value);
}
