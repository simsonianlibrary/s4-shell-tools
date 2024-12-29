/**
 Tools to build many Sims 4 modding projects.
 */

import fs from "fs";
import log4js from "log4js";
import {Package} from "@s4tk/models";
import {StblService} from "./stblService";
import {MergeService} from "./mergeService";
import {ResourceKeyService} from "./resourceKeyService";
import {autoInjectable} from "tsyringe";
import 'reflect-metadata';
import {BuildFile} from "./buildFile";
import {FileService} from "./fileService";

const log = log4js.getLogger();

/**
 * Top level function to build a Sims 4 package file from XML and string properties files
 *
 * @param configPath path to build.yml
 */

/**
 * Class to manage the overall build process. It reads the build.yml file and processes the
 * files described therein.
 */
@autoInjectable()
export class BuildService {
    resourceKeyService: ResourceKeyService;
    fileManager: FileService;
    mergeManager: MergeService;
    stblService: StblService

    constructor(resourceKeyService?: ResourceKeyService,
                fileManager?: FileService,
                mergeManager?: MergeService,
                stblService?: StblService) {
        this.resourceKeyService = resourceKeyService;
        this.fileManager = fileManager;
        this.mergeManager = mergeManager;
        this.stblService = stblService;
    }
    public loadBuildFile(path:string): BuildFile {
        return new BuildFile(path);
    }
    /**
     * Top level function to build a mod described by a BuildFile instance.
     */

    public buildProject(buildFile: BuildFile): void {
        try {
            this.fileManager.ensureBuildDirectory(buildFile)
            log.debug(`Packages: ${JSON.stringify(buildFile.getPackages())}`)
            log.info("buildProject:Start");
            this.buildPackages(buildFile);
            this.buildStrings(buildFile);
            this.mergePackages(buildFile);
            log.info("buildProject:Done");
        } catch (error) {
            log.fatal("buildProject:ERROR", error);
        }
    }

    private buildPackage(filepaths: string[], outputPath: string) {
        log.debug("-- buildPackage:Start");
        try {
            log.debug("--- scanning tuning files");
            let tuningFileCache = this.resourceKeyService.buildTuningMap(filepaths)
            let tuningMap = tuningFileCache.tuningMap
            let simDataMap = tuningFileCache.simDataMap;
            let resources = Array.from(tuningMap.values());
            let simDatas = Array.from(simDataMap.values()).map( value => { return value.resourceKeyPair});
            resources.push(...simDatas);
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

    private buildPackages(buildFile: BuildFile) {
        log.debug("- buildPackages:Start");
        try {

            buildFile.getPackages().forEach(packageToBuild => {
                const filepaths = this.fileManager.globsToFiles(buildFile,packageToBuild.files);
                log.debug(`${packageToBuild.name}: ${filepaths.length} files`)

                const outputPath = buildFile.resolveOutputPath(packageToBuild.name);
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

    private buildStrings(buildFile: BuildFile) {
        log.debug("- buildStrings:Start");
        try {
            buildFile.getStringPackages().forEach(stringPackage => {
                const filepaths = this.fileManager.globsToFiles(buildFile,stringPackage.files);
                buildFile.resolveOutputPath('strings_package.package');
                const packageName = stringPackage.name ? stringPackage.name : `strings_package-${new Date().getTime()}.package`
                this.stblService.buildStringsPackage(buildFile.resolveOutputPath(packageName), filepaths, stringPackage.instanceId);
            })
        } catch (e) {
            log.fatal(`buildStrings:ERROR:${e}`);
            throw (e);
        }
        log.debug("- buildStrings:Done");
    }

    private mergePackages(buildFile: BuildFile) {
        log.info("merging packages");
        log.debug("- mergePackages:Start");
        try {
            this.mergeManager.mergeTargets(buildFile);
        } catch (e) {
            log.fatal(`mergePackages:ERROR:${e}`);
            throw (e);
        }
        log.debug("- mergePackages:Done");

    }

}


