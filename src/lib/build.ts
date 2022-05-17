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
import {Package} from "@s4tk/models";
import {BuildProject} from "./types";
import {buildStringsPackage} from "./strings";
import {makeResourceEntry} from "./packages";
import {canImportFile, loadYamlFile} from "./util";

export const SimDataResourceType = 1415235194;

const logger = log4js.getLogger();

export function build(configPath:string) {
    logger.trace(`PWD=${process.env.PWD}`);
    try {
        let data = loadYamlFile(configPath);
        const config = data as BuildProject;
        logger.info(`Project path: ${config.project}`)
        buildProject(config)
    } catch (e) {
        logger.error(`Error opening project file:${configPath}: ${e}`);
    }
}

export function buildProject(config:BuildProject) {
    fse.ensureDirSync(path.resolve(config.project,config.outputDir));
    logger.debug(`Packages: ${config.packages}`)
    logger.info("buildProject:Start");
    buildPackages(config);
    buildStrings(config);
    logger.info("buildProject:Done");
}

export function buildPackage(filepaths: string[], outputPath: string) {
    logger.debug("buildPackage:Start");
    const resources = new Array<any>();
    filepaths.forEach(filepath => {
        if (canImportFile(filepath)) {
            const entry = makeResourceEntry(filepath);
            resources.push(entry);
        } else {
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
    logger.debug("buildPackage:Done");

}

function excludePatterns(filenames: string[],exclude:string[]): string[] {
    return filenames.filter( value => {
        const matches = exclude.filter( (pattern) => {
            return value.includes(pattern)
        });
        if(matches.length) {
            logger.trace(`Excluded: ${value}`)
        }
        return matches.length == 0;
    })
}

function buildPackages(config:BuildProject) {
    logger.debug("buildPackages:Start");
    config.packages.forEach(packageToBuild => {

        // build a list of glob pattern paths relative to the project path
        const globPatterns = new Array<string>();
        packageToBuild.files.forEach(filePattern => {
            const pathPattern = path.resolve(config.project,filePattern)
            globPatterns.push(pathPattern);
        });
        logger.trace(`${packageToBuild.name} globs: ${config.packages}`)

        // subtract files that match one of the exclude patterns from the set that matches the glob patterns
        logger.trace(`${packageToBuild.name} exclude: ${config.excludePatterns}`)
        const filepaths = excludePatterns(fg.sync(globPatterns),config.excludePatterns);
        logger.debug(`${packageToBuild.name}: ${filepaths.length} files`)

        const outputPath = path.resolve(path.resolve(config.project,config.outputDir),packageToBuild.name)
        logger.trace(`Building ${outputPath}`);

        buildPackage(filepaths, outputPath);
        logger.info(`Built package ${outputPath}`);
    });
    logger.debug("buildPackages:Done");
}
function buildStrings(config:BuildProject) {
    logger.debug("buildStrings:Start");
    const globPattern = new Array<string>();
    config.stringPackages.forEach(stringPackage => {
        stringPackage.files.forEach(tuningFile => {
            const pattern = path.resolve(config.project,tuningFile)
            globPattern.push(pattern);
        });
        const filepaths = fg.sync(globPattern);
        buildStringsPackage(stringPackage.instanceId,filepaths,path.resolve(config.project,config.outputDir));
        logger.debug("buildStrings:Done");
    })
}
