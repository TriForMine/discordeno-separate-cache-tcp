import { cache, CacheTableNames } from "../cache.ts";

export default function deleteOne(table: CacheTableNames, key: string) {
    return cache[table].delete(key);
}
