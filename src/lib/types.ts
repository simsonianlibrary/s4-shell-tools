import path from "path";
import fse from "fs-extra";

/**
 * Specifies a package to be built, along with the tuning files that should go into it
 *
 */
export class OutputFile {
    name: string;
    files: Array<string>;
}

/**
 * Specifies a package to be build from string .properties files
 */
export class StringBuildDefinition {
    instanceId: string | null;
    name: string | null;
    files: Array<string>;
}

/**
 * Specifies a package to be built by merging other packages together
 */
export class MergeTarget {
    name: string;
    combineStrings: boolean | null;
    files: Array<string>;
}

/**
 * Top level specification of a build project
 */
export class BuildProject {
    _project: string;
    _outputDir: string;
    _excludePatterns: Array<string>;
    _packages: Array<OutputFile>;
    _stringPackages: Array<StringBuildDefinition>;
    _merges: Array<MergeTarget>;
    constructor(data:any) {
        this._project = data.project;
        this._outputDir = data.output;
        this._excludePatterns = data.exclude;
        this._packages = data.packages;
        this._stringPackages = data.strings;
        this._merges = data.merges;
    }
    public getProject():string {
        return this._project;
    }
    public getOutputDirectory(): string {
        return path.resolve(this._project, this._outputDir);
    }
    public resolveProjectPath(outputFilename:string): string {
        return path.resolve(this.getProject(),outputFilename);
    }
    public resolveOutputPath(outputFilename:string): string {
        return path.resolve(this.getOutputDirectory(),outputFilename);
    }
    public getExcludePatterns(): Array<string> {
        return this._excludePatterns ? this._excludePatterns : [];
    }
    public getPackages(): Array<OutputFile> {
        return this._packages ? this._packages : [];
    }
    public getStringPackages(): Array<StringBuildDefinition> {
        return this._stringPackages ? this._stringPackages : [];
    }
    public getMerges(): Array<MergeTarget> {
        return this._merges ? this._merges : [];
    }
    public ensureBuildDirectory() {
        fse.ensureDirSync(this.getOutputDirectory());
    }
}

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
