#!/usr/bin/env ts-node

import {
    command, description,
    program, requiredArg, usage,
    version,variadicArg,
    Command, option, commandOption
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
    @option('--debug')
    debug: boolean = false;

    @option('--trace')
    trace: boolean = false;

    constructor() {
        setLogLevel()
    }

    @command()
    run() {
        logger.info(`run`);
    }

    // @ts-ignore
    @command()
    @commandOption('--config <configPath>')
    build(
        this: Command,
    ) {
        const options = this.opts();
        const config = options.config ? options.config : "./build.yml"
        const projectPath = path.resolve(process.cwd(), config);
        logger.info(`Building Project: ${projectPath}`);
        build(projectPath)
        logger.info('Done Building Project');
    }
    // @ts-ignore
    @command()
    @commandOption('--combineStrings')
    @commandOption('--output <output>')
    'merge'(
        this: Command,
        @variadicArg('packagePaths') packagePaths: Array<string>
    ) {
        const options = this.opts();
        const output = options.output ? options.output : "./build"
        mergePackageFilesToPath(packagePaths,output, options.combineStrings);
    }
    // @ts-ignore
    @command()
    @commandOption('--output <output>')
    'dump-strings'(
        this: Command,
        @requiredArg('packageFile') packageFile: string,
    ) {
        const options = this.opts();
        console.log(`debug: ${this.parent.opts().debug}`)
        const output = options.output ? options.output : "./build"
        dumpStrings(packageFile,output);
    }
    // @ts-ignore
    @command()
    @commandOption('--output <output>')
    'import-property-files'(
        this: Command,
        @variadicArg('propertyFiles') propertyFiles: Array<string>,
    ) {
        const options = this.opts();
        const output = options.output ? options.output : "./build/strings.package"
        buildStringsPackage(output,propertyFiles);
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
