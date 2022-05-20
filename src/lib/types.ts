/**
 * Specifies a package to be built, along with the tuning files that should go into it
 *
 */
export interface OutputFile {
    name: string;
    files: Array<string>;
}

/**
 * Specifies a package to be build from string .properties files
 */
export interface StringBuildDefinition {
    instanceId: string | null;
    hashKey: string | null;    
    name: string | null;
    files: Array<string>;
}

/**
 * Specifies a package to be built by merging other packages together
 */
// export interface MergeTarget {
//     name: string;
//     combineStrings: boolean | null;
//     stblId: string | null;
//     stblHashKey: string | null;
//     files: Array<string>;
// }

/**
 * Internal structure used for scanning packages for duplicate tuning files
 */
export class TuningData {
    name: string;
    filename: string;
    key: string;
    constructor(name:string, filename:string, key:string) {
        this.name = name;
        this.filename = filename;
        this.key = key;
    }
}

/**
 * Internal structure used when importing properties files
 */
export class StringTextFileEntry {
    hashId: string;
    contents: string;
    constructor(hashId:string, contents:string) {
        this.hashId = hashId;
        this.contents = contents
    }
}
