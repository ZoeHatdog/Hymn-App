import type { Hymn } from "@hymn-app/shared-types";



export type CachedHymnRecord = {

    hymn: Hymn;
    cachedAt: number;
    localImagePaths: string[];

}
