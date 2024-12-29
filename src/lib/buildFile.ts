import {loadYamlFile} from "./util";
import {MergeTarget, OutputFile, StringBuildDefinition} from "./types";
import path from "path";
import log4js from "log4js";

const log = log4js.getLogger();

export class BuildFile {
    _project: string;
    _outputDir: string;
    _excludePatterns: Array<string>;
    _packages: Array<OutputFile>;
    _stringPackages: Array<StringBuildDefinition>;
    _merges: Array<MergeTarget>;

    constructor(configPath: string) {
        let data = loadYamlFile(configPath) as any;
        this._outputDir = data.output;
        this._excludePatterns = data.exclude;
        this._packages = data.packages;
        this._stringPackages = data.strings;
        this._merges = data.merges;

        // set the project directory to the parent of the build.yml config file.
        this._project = path.dirname(configPath)
        log.info(`Project path: ${this.getProject()}`)

    }

    public getProject(): string {
        return this._project;
    }

    public getOutputDirectory(): string {
        return path.resolve(this._project, this._outputDir);
    }

    public resolveProjectPath(outputFilename: string): string {
        return path.resolve(this.getProject(), outputFilename);
    }

    public resolveOutputPath(outputFilename: string): string {
        return path.resolve(this.getOutputDirectory(), outputFilename);
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

}