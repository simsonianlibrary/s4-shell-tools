// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";
// @ts-ignore
import fg from 'fast-glob';
// @ts-ignore
import fse from "fs-extra";
// @ts-ignore
import yaml from "js-yaml";
// @ts-ignore
import log4js from "log4js";
import { Package } from "@s4tk/models";
import { BuildProject, MergeTarget } from "./types";
import { buildStringsPackage } from "./strings";
import { makeResourceEntry } from "./packages";
import { canImportFile, generateS4SResourceFilename, loadYamlFile } from "./util";
import { BinaryResourceType } from "@s4tk/models/enums";
import { Conversions } from "./conversions";
import { mergePackageFilesToPath } from "./merge";
import {ResourceEntry} from "@s4tk/models/types";

export const SimDataResourceType = 1415235194;

const logger = log4js.getLogger();

export function build(configPath: string) {
    logger.trace(`PWD=${process.env.PWD}`);
    try {
        let data = loadYamlFile(configPath) as BuildProject;
        const config = new BuildProject(data);
        config._project = path.dirname(configPath)
        logger.info(`Project path: ${config.getProject()}`)
        buildProject(config)
    } catch (e) {
        logger.error(`Error building project:${configPath}: ${e}`);
        console.log(e.stackTrace);
    }
}

export function buildProject(config: BuildProject) {
    config.ensureBuildDirectory()
    logger.debug(`Packages: ${config.getPackages()}`)
    logger.info("buildProject:Start");
    buildPackages(config);
    buildStrings(config);
    mergePackages(config);
    logger.info("buildProject:Done");
}

export function buildPackage(filepaths: string[], outputPath: string) {
    logger.debug("-- buildPackage:Start");
    try {
        const resources = new Array<ResourceEntry>();
        filepaths.forEach(filepath => {
            if (canImportFile(filepath)) {
                const entry = makeResourceEntry(filepath);
                resources.push(entry);
            } else if (!filepath.endsWith('.properties')) {
                logger.warn(`Cannot import file type: ${filepath}`)
            }
        });
        logger.trace(`using build files:${JSON.stringify(filepaths)}`);
        const outputPackage = new Package(resources);

        logger.info(`Included ${outputPackage.entries.length} resources`);
        const packageBuffer = outputPackage.getBuffer();
        logger.trace(`Package Buffer: ${packageBuffer.length} bytes`);

        logger.trace(`writing output file: ${outputPath}`);
        fs.writeFileSync(outputPath, packageBuffer);

    } catch (e) {
        logger.error("buildPackage:ERROR");
        throw (e);
    }
    logger.debug("-- buildPackage:Done");
}

function excludePatterns(filenames: string[], exclude: string[]): string[] {
    return filenames.filter(value => {
        const matches = exclude.filter((pattern) => {
            return value.includes(pattern)
        });
        if (matches.length) {
            logger.trace(`Excluded: ${value}`)
        }
        return matches.length == 0;
    })
}

function buildPackages(config: BuildProject) {
    logger.debug("- buildPackages:Start");
    try {

        config.getPackages().forEach(packageToBuild => {
            // build a list of glob pattern paths relative to the project path
            const globPatterns = new Array<string>();
            packageToBuild.files?.forEach(filePattern => {
                const pathPattern = path.resolve(config.getProject(), filePattern)
                globPatterns.push(pathPattern);
            });
            logger.trace(`${packageToBuild.name} globs: ${config.getPackages()}`)

            // subtract files that match one of the exclude patterns from the set that matches the glob patterns
            logger.trace(`${packageToBuild.name} exclude: ${config.getExcludePatterns()}`)
            const filepaths = excludePatterns(fg.sync(globPatterns), config.getExcludePatterns());
            logger.debug(`${packageToBuild.name}: ${filepaths.length} files`)

            const outputPath = config.resolveOutputPath(packageToBuild.name);
            logger.trace(`Building ${outputPath}`);

            buildPackage(filepaths, outputPath);
            logger.info(`Built package ${outputPath}`);
        });

    } catch (e) {
        logger.error(`buildPackages:ERROR:${e}`);
        throw (e);
    }
    logger.debug("- buildPackages:Done");
}

function buildStrings(config: BuildProject) {
    logger.debug("- buildStrings:Start");
    try {
        const globPatterns = new Array<string>();
        config.getStringPackages().forEach(stringPackage => {
            stringPackage.files.forEach(tuningFile => {
                globPatterns.push(config.resolveProjectPath(tuningFile));
            });
            const filepaths = fg.sync(globPatterns);
            config.resolveOutputPath('strings_package.package');
            const packageName = stringPackage.name ? stringPackage.name : `strings_package-${new Date().getTime()}.package`
            buildStringsPackage(config.resolveOutputPath(packageName), filepaths, stringPackage.instanceId);
        })
    } catch (e) {
        logger.error(`buildStrings:ERROR:${e}`);
        throw (e);
    }
    logger.debug("- buildStrings:Done");
}

function mergePackages(config: BuildProject) {
    logger.info("merging packages");
    logger.debug("- mergePackages:Start");
    try {
        config.getMerges().forEach(mergeTarget => {
            // const outputDir = path.resolve(config._project, config._outputDir)
            // const outputFile = `${outputDir}/${mergeTarget.name}`;
            const outputFile = config.resolveOutputPath(mergeTarget.name);
            const donorPaths = mergeTarget.files.map<string>(filename => config.resolveProjectPath(filename))
            mergePackageFilesToPath(donorPaths, outputFile, mergeTarget.combineStrings);
        })
    } catch (e) {
        logger.error(`mergePackages:ERROR:${e}`);
        throw (e);
    }
    logger.debug("- mergePackages:Done");

}
