#!/usr/bin/env node

import {
    command, description,
    program, requiredArg, usage,
    version,variadicArg,
    Command, option, commandOption,
} from 'commander-ts';
import {findDuplicateTuningFiles} from "./lib/scan";
import {BuildService} from "./lib/service/buildService";

import log4js from "log4js";
import {StblService} from "./lib/service/stblService";
import path from "path";
import {container} from "tsyringe";
import {MergeService} from "./lib/service/mergeService";

const logger = log4js.getLogger();
logger.level = "trace";



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
    }

    run() {

    }
    @command()
    @commandOption('--config <configPath>')
    build(
        this: Command,
    ) {
        const options = this.opts();
        setLogLevel(this.parent?.opts());

        // if build config path isn't present, default to 'build.yml' in the current directory
        const config = options.config ? options.config : "./build.yml"

        // get the project path relative to the current directory
        const projectPath = path.resolve(process.cwd(), config);

        const buildManager = container.resolve(BuildService);

        logger.info(`Building Project: ${projectPath}`);

        const buildFile = buildManager.loadBuildFile(projectPath);
        buildManager.buildProject(buildFile);

        logger.info('Done Building Project');
    }
    @command()
    @commandOption('--combineStrings')
    @commandOption('--output <output>')
    merge(
        this: Command,
        @variadicArg('packagePaths') packagePaths: Array<string>
    ) {
        const options = this.opts();
        setLogLevel(this.parent?.opts())

        const mergeManager = container.resolve(MergeService);

        // if build output path isn't present, default to 'build' in the current directory
        const output = options.output ? options.output : "./build"

        mergeManager.mergePackageFilesToPath(packagePaths,output, options.combineStrings);
    }
    @command()
    @commandOption('--output <output>')
    'dump-strings'(
        this: Command,
        @requiredArg('packageFile') packageFile: string,
    ) {
        const options = this.opts();
        setLogLevel(this.parent?.opts())

        const stblService = container.resolve(StblService);
        // if build output path isn't present, default to 'build' in the current directory
        const output = options.output ? options.output : "./build"

        stblService.dumpStrings(packageFile,output);
    }

    @command()
    @commandOption('--output <output>')
    'import-property-files'(
        this: Command,
        @variadicArg('propertyFiles') propertyFiles: Array<string>,
    ) {
        const options = this.opts();
        setLogLevel(this.parent?.opts())

        const stblService = container.resolve(StblService);
        // if build output path isn't present, default to 'build/strings.package' in the current directory
        const output = options.output ? options.output : "./build/strings.package"

        stblService.buildStringsPackage(output,propertyFiles);
    }

    @command()
    'string-summary'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        setLogLevel(this.parent?.opts())
        const stblService = container.resolve(StblService);

        logger.info(`Listing entry counts per STBL in: ${sourcePath}`);
        stblService.printStringCountsInPackage(sourcePath);
    }

    @command()
    'find-duplicate-tuning'(
        this: Command,
        @requiredArg('sourcePath') sourcePath:string,
    ) {
        setLogLevel(this.parent?.opts())

        logger.info(`Looking for duplicated tuning resources in: ${sourcePath}`);
        findDuplicateTuningFiles(sourcePath);
    }

}

function setLogLevel(options:any) {
    const logLevel = options?.trace ? "TRACE" : (options?.debug ? "DEBUG" : "INFO");
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
// @ts-ignore unused variable error
let _ = new S4ShellTools();
