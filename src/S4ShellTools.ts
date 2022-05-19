#!/usr/bin/env ts-node

import {
    command, description,
    program, requiredArg, usage,
    version,variadicArg,
    Command, option
} from 'commander-ts';
import {findDuplicateTuningFiles} from "./lib/scan";
import {build} from "./lib/build";
import {mergePackageFilesToPath} from "./lib/merge";

// @ts-ignore
import log4js from "log4js";
import {buildStringsPackage, dumpStrings, printStringCountsInPackage} from "./lib/strings";
import path from "path";

const logger = log4js.getLogger();
logger.level = "trace";



// @ts-ignore
@program()
@version('1.0.0')
@description('Tools to build and manage a Sims 4 .package file')
@usage('--help')
export class S4ShellTools {
    // @option('--log-level <logLevel>')
    // logLevel: string = 'info';

    constructor() {
        setLogLevel()
    }

    run() {
        logger.info(`run`);
    }

    // @ts-ignore
    @command()
    build(
        this: Command,
        @requiredArg('buildConfigPath') buildConfigPath: string,
    ) {
        logger.info(`Building Project: ${buildConfigPath}`);
        build(path.resolve(process.cwd(), buildConfigPath))
        logger.info('Done Building Project');
    }
    // @ts-ignore
    @command()
    'merge'(
        this: Command,
        @requiredArg('outputPath') outputPath: string,
        @variadicArg('packagePaths') packagePaths: Array<string>,
    ) {
        mergePackageFilesToPath(packagePaths,outputPath);
    }
    // @ts-ignore
    @command()
    'dump-strings'(
        this: Command,
        @requiredArg('packageFile') packageFile: string,
        @requiredArg('outputDirectory') outputDirectory: string,
    ) {
        dumpStrings(packageFile,outputDirectory);
    }
    // @ts-ignore
    @command()
    'import-property-files'(
        this: Command,
        @requiredArg('outputPath') outputPath: string,
        @variadicArg('propertyFiles') propertyFiles: Array<string>,
    ) {
        buildStringsPackage(outputPath,propertyFiles);
    }
    // @ts-ignore
    @command()
    'string-summary'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        logger.info(`Listing entry counts per STBL in: ${sourcePath}`);
        printStringCountsInPackage(sourcePath);
    }
    // @ts-ignore
    @command()
    'find-duplicate-tuning'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        logger.info(`Looking for duplicated tuning resources in: ${sourcePath}`);
        findDuplicateTuningFiles(sourcePath);
    }

}

function setLogLevel() {
    let logLevel = process.env.LOG_LEVEL;
    if(!logLevel) {
        logger.info(`Using default log level ${logger.level}`)
        return;
    }
    // logger.info(`Setting log level to: ${logLevel}`);
    switch(logLevel.toUpperCase()) {
        case 'INFO':
            logger.level = "INFO";
            break;
        case 'DEBUG':
            logger.level = "DEBUG";
            break;
        case 'TRACE':
            logger.level = "TRACE";
            break;
        default:
            logger.warn(`Unknown log level specified: ${logLevel}. Must be one of [INFO,DEBUG,TRACE]`)
    }
}
const s4shelltools = new S4ShellTools();
