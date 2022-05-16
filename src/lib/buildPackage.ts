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
import { Package, SimDataResource, XmlResource } from "@s4tk/models";
import { Resource, ResourceEntry } from "@s4tk/models/types";
import {parseKeyFromPath} from "./util";
import { readYamlEnvSync } from 'yaml-env-defaults';
import {BuildProject, StringBuildDefinition} from "./types";
import {buildStringsPackage} from "./strings";

export const SimDataResourceType = 1415235194;

const cachedBuffers: { [key: string]: Buffer; } = {};

const logger = log4js.getLogger();

function getBuffer(filename: string): Buffer {
    if (!cachedBuffers[filename]) {
        const filepath = path.resolve(filename);
        cachedBuffers[filename] = fs.readFileSync(filepath);
    }

    return cachedBuffers[filename];
}

function makeResourceEntry(filepath: string): ResourceEntry {
    // 545AC67A
    const resourceKey = parseKeyFromPath(filepath);
    let resource: Resource;
    if (resourceKey.type == SimDataResourceType) {
        resource = SimDataResource.fromXml(getBuffer(filepath).toString())
    } else {
        resource = new XmlResource(getBuffer(filepath).toString());
    }
    return {
        key: resourceKey,
        value: resource,
    } as ResourceEntry;
}

export function buildPackage(filepaths: string[], outputPath: string) {
    logger.info('Entering build package');
    const resources = new Array<any>();
    filepaths.forEach(filepath => {
        if (filepath.endsWith(".xml")) {
            const entry = makeResourceEntry(filepath);
            resources.push(entry);
        } else {
            logger.warn(`Skipping non-xml file: ${filepath}`)
        }
    });
    logger.debug(`using build files:`);
    logger.debug(filepaths);
    const outputPackage = new Package(resources);
    logger.info(`Included ${outputPackage.entries.length} resources`);
    const packageBuffer = outputPackage.getBuffer();
    logger.debug(`Package Buffer: ${packageBuffer.length} bytes`);
    logger.debug(`writing output file: ${outputPath}`);
    fs.writeFileSync(outputPath, packageBuffer);

}

function excludePatterns(filenames: string[],exclude:string[]): string[] {
    return filenames.filter( value => {
        const matches = exclude.filter( (pattern) => {
            return value.includes(pattern)
        });
        if(matches.length) {
            logger.debug(`Excluded: ${value}`)
        }
        return matches.length == 0;
    })
}

export function build(configPath:string) {
    logger.debug(`PWD=${process.env.PWD}`);
    // let data = readYamlEnvSync(configPath);
    try {
        let yamlFileContents = fs.readFileSync(configPath, 'utf8');
        let data = yaml.load(yamlFileContents);
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
    config.packages.forEach(packageToBuild => {
        const globPattern = new Array<string>();
        packageToBuild.files.forEach(tuningFile => {
            const pattern = path.resolve(config.project,tuningFile)
            globPattern.push(pattern);
        });
        logger.debug(`${packageToBuild.name} globs: ${config.packages}`)
        logger.debug(`${packageToBuild.name} exclude: ${config.excludePatterns}`)
        const filepaths = excludePatterns(fg.sync(globPattern),config.excludePatterns);
        logger.debug(`${packageToBuild.name}: ${filepaths.length} files`)
        const outputPath = path.resolve(path.resolve(config.project,config.outputDir),packageToBuild.name)
        logger.info(`Building ${outputPath}`);
        buildPackage(filepaths, outputPath);
        logger.info("buildPackage:Done");
        logger.info(`Built package ${outputPath}`);
    });
    logger.info("buildStrings:Start");
    const globPattern = new Array<string>();
    config.stringPackages.forEach(stringPackage => {
        stringPackage.files.forEach(tuningFile => {
            const pattern = path.resolve(config.project,tuningFile)
            globPattern.push(pattern);
        });
        const filepaths = fg.sync(globPattern);
        buildStringsPackage(stringPackage.instanceId,filepaths,path.resolve(config.project,config.outputDir));
        logger.info("buildStrings:Done");
        logger.info("buildProject:Done");
    })
}
