/**
 Tools to build many Sims 4 modding projects.
 */

import fs from "fs";
import path from "path";
import fg from 'fast-glob';
import fse from "fs-extra";
import yaml from "js-yaml";
import log4js from "log4js";
import {Package} from "@s4tk/models";
import {OutputFile, StringBuildDefinition} from "./types";
import {buildStringsPackage} from "./strings";
import {makeResourceEntry} from "./packages";
import {canImportFile, loadYamlFile} from "./util";
import {MergeTarget} from "./merge";
import {ResourceEntry} from "@s4tk/models/types";


const log = log4js.getLogger();

export function build(configPath: string) {
    log.trace(`PWD=${process.env.PWD}`);
    try {
        const config = new BuildProject(configPath);
        config.buildProject()
    } catch (e) {
        log.error(`Error building project:${configPath}: ${e}`);
        console.log(e.stackTrace);
    }
}

export class BuildProject {
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

    public ensureBuildDirectory() {
        fse.ensureDirSync(this.getOutputDirectory());
    }

    buildProject() {
        this.ensureBuildDirectory()
        log.debug(`Packages: ${JSON.stringify(this.getPackages())}`)
        log.info("buildProject:Start");
        this.buildPackages();
        this.buildStrings();
        this.mergePackages();
        log.info("buildProject:Done");
    }

    buildPackage(filepaths: string[], outputPath: string) {
        log.debug("-- buildPackage:Start");
        try {
            const resources = new Array<ResourceEntry>();
            filepaths.forEach(filepath => {
                if (canImportFile(filepath)) {
                    const entry = makeResourceEntry(filepath);
                    resources.push(entry);
                } else if (!filepath.endsWith('.properties')) {
                    log.warn(`Cannot import file type: ${filepath}`)
                }
            });
            log.trace(`using build files:${JSON.stringify(filepaths)}`);
            const outputPackage = new Package(resources);

            log.info(`Included ${outputPackage.entries.length} resources`);
            const packageBuffer = outputPackage.getBuffer();
            log.trace(`Package Buffer: ${packageBuffer.length} bytes`);

            log.trace(`writing output file: ${outputPath}`);
            fs.writeFileSync(outputPath, packageBuffer);

        } catch (e) {
            log.fatal("buildPackage:ERROR");
            throw (e);
        }
        log.debug("-- buildPackage:Done");
    }

    excludePatterns(filenames: string[], exclude: string[]): string[] {
        return filenames.filter(value => {
            const matches = exclude.filter((pattern) => {
                return value.includes(pattern)
            });
            if (matches.length) {
                log.trace(`Excluded: ${value}`)
            }
            return matches.length == 0;
        })
    }

    buildPackages() {
        log.debug("- buildPackages:Start");
        try {

            this.getPackages().forEach(packageToBuild => {
                // build a list of glob pattern paths relative to the project path
                const globPatterns = new Array<string>();
                packageToBuild.files?.forEach(filePattern => {
                    const pathPattern = path.resolve(this.getProject(), filePattern)
                    globPatterns.push(pathPattern);
                });
                log.trace(`${packageToBuild.name} globs: ${JSON.stringify(this.getPackages())}`)

                // subtract files that match one of the exclude patterns from the set that matches the glob patterns
                log.trace(`${packageToBuild.name} exclude: ${this.getExcludePatterns()}`)
                const filepaths = this.excludePatterns(fg.sync(globPatterns), this.getExcludePatterns());
                log.debug(`${packageToBuild.name}: ${filepaths.length} files`)

                const outputPath = this.resolveOutputPath(packageToBuild.name);
                log.trace(`Building ${outputPath}`);

                this.buildPackage(filepaths, outputPath);
                log.info(`Built package ${outputPath}`);
            });

        } catch (e) {
            log.fatal(`buildPackages:ERROR:${e}`);
            throw (e);
        }
        log.debug("- buildPackages:Done");
    }

    buildStrings() {
        log.debug("- buildStrings:Start");
        try {
            const globPatterns = new Array<string>();
            this.getStringPackages().forEach(stringPackage => {
                stringPackage.files.forEach(tuningFile => {
                    globPatterns.push(this.resolveProjectPath(tuningFile));
                });
                const filepaths = fg.sync(globPatterns);
                this.resolveOutputPath('strings_package.package');
                const packageName = stringPackage.name ? stringPackage.name : `strings_package-${new Date().getTime()}.package`
                buildStringsPackage(this.resolveOutputPath(packageName), filepaths, stringPackage.instanceId);
            })
        } catch (e) {
            log.fatal(`buildStrings:ERROR:${e}`);
            throw (e);
        }
        log.debug("- buildStrings:Done");
    }

    mergePackages() {
        log.info("merging packages");
        log.debug("- mergePackages:Start");
        try {
            this.getMerges().forEach(mergeTargetData => {
                const mergeTarget = new MergeTarget(this,mergeTargetData);
                // const outputDir = path.resolve(config._project, config._outputDir)
                // const outputFile = `${outputDir}/${mergeTarget.name}`;
                const outputFile = this.resolveOutputPath(mergeTarget.name);
                const donorPaths = mergeTargetData.files.map<string>(filename => this.resolveProjectPath(filename))
                mergeTarget.mergePackageFilesToPath(donorPaths, outputFile, mergeTarget.combineStrings);
            })
        } catch (e) {
            log.fatal(`mergePackages:ERROR:${e}`);
            throw (e);
        }
        log.debug("- mergePackages:Done");

    }

}


