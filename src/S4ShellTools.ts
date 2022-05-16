#!/usr/bin/env ts-node

import {
    action, command, commandOption, description, option,
    optionalArg, program, requiredArg, usage,
    variadicArg, version,
    Command
} from 'commander-ts';
import {printStrings} from "./lib/printStrings";
import {printStringCounts} from "./lib/printStringCounts";
import {findDuplicateTuningFiles} from "./lib/findDuplicates";
import {build} from "./lib/buildPackage";
// @ts-ignore
import log4js from "log4js";
import {outputFile} from "fs-extra";
import {appendNewString} from "./lib/util";
import {dumpStrings} from "./lib/strings";

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
        console.log(`run`);
    }

    // @ts-ignore
    @command()
    'ls-strings'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
        @optionalArg('outputFile') outputFile: string,
    ) {
        console.log(`Listing Strings in: ${sourcePath}`);
        console.log(`Output File: ${outputFile}`);
        printStrings(sourcePath);
    }
    // @ts-ignore
    @command()
    'string-summary'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        console.log(`Listing Strings in: ${sourcePath}`);
        printStringCounts(sourcePath);
    }
    // @ts-ignore
    @command()
    'find-duplicate-tuning'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        console.log(`Looking for duplicated tuning resources in: ${sourcePath}`);
        findDuplicateTuningFiles(sourcePath);
    }
    // @ts-ignore
    @command()
    build(
        this: Command,
        @requiredArg('buildConfigPath') buildConfigPath: string,
    ) {
        console.log(`Building Project: ${buildConfigPath}`);
        build(buildConfigPath)
        console.log('Done Building Project');
    }
    // @ts-ignore
    @command()
    'add-string'(
        this: Command,
        @requiredArg('stringProperties') stringProperties: string,
        @requiredArg('textContents') textContents: string,
    ) {

        appendNewString(stringProperties,textContents);
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
