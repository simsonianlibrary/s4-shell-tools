import path from "path";
import fg from "fast-glob";
import log4js from "log4js";
import fse from "fs-extra";
import {BuildFile} from "../model/buildFile";
import {autoInjectable} from "tsyringe";
import fs from "fs";

const logger = log4js.getLogger();

@autoInjectable()
export class FileService {

    constructor() {
    }

    public globsToFiles(buildFile:BuildFile, fileglobs: string[]): string[] {
        // build a list of glob pattern paths relative to the project path
        const globPatterns = new Array<string>();
        fileglobs?.forEach(filePattern => {
            const pathPattern = path.resolve(buildFile.getProject(), filePattern)
            globPatterns.push(pathPattern);
        });
        // logger.trace(`${packageToBuild.name} globs: ${JSON.stringify(this.project.getPackages())}`)

        // subtract files that match one of the exclude patterns from the set that matches the glob patterns
        logger.trace(`Exclude: ${buildFile.getExcludePatterns()}`)
        const filepaths = this.excludePatterns(fg.sync(globPatterns), buildFile.getExcludePatterns());
        logger.debug(`${filepaths.length} files`)
        return filepaths;
    }
    public ensureBuildDirectory(buildFile:BuildFile) {
        fse.ensureDirSync(buildFile.getOutputDirectory());
    }
    public excludePatterns(filenames: string[], exclude: string[]): string[] {
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
    public readBuffer(filePath:string): Buffer {
        return fs.readFileSync(filePath)
    }
    public readString(filePath:string): string {
        return fs.readFileSync(filePath).toString()
    }
    public writeBuffer(outputPath:string, packageBuffer: Buffer | string) {
        fs.writeFileSync(outputPath, packageBuffer);
    }
    public writeString(outputPath:string, buffer: string) {
        fs.writeFileSync(outputPath, buffer);
    }
}