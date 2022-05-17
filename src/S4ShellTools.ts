#!/usr/bin/env ts-node

import {
    command, description,
    program, requiredArg, usage,
    version,
    Command
} from 'commander-ts';
import {findDuplicateTuningFiles} from "./lib/scan";
import {build} from "./lib/build";
// @ts-ignore
import log4js from "log4js";
import { dumpStrings, printStringCountsInPackage } from "./lib/strings";

const logger = log4js.getLogger();
logger.level = "debug";



// @ts-ignore
@program()
@version('1.0.0')
@description('Prints the English Strings in a Package')
@usage('--help')
export class S4ShellTools {
    constructor() {}

    run() {
        logger.info(`run`);
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
    // @ts-ignore
    @command()
    build(
        this: Command,
        @requiredArg('buildConfigPath') buildConfigPath: string,
    ) {
        logger.info(`Building Project: ${buildConfigPath}`);
        build(buildConfigPath)
        logger.info('Done Building Project');
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
}

const s4modtools = new S4ShellTools();
