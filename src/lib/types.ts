import {FixedWidth, FixedWidthConvertible} from "fixed-width-ts-decorator";

export class OutputFile {
    name: string;
    files: Array<string>;
}
export class StringBuildDefinition {
    instanceId: string;
    files: Array<string>;
}
export class BuildProject {
    project: string;
    outputDir: string;
    excludePatterns: Array<string>;
    packages: Array<OutputFile>;
    stringPackages: Array<StringBuildDefinition>;
}

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

export class StringTextFileEntry {
    @FixedWidth({ start: 0, width: 10 })
    hashId: string;

    @FixedWidth({ start: 10, width: 400 })
    comment: string;
}
