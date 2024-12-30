import path from "path";
import {PackageFileReadingOptions} from "@s4tk/models/types";
import {Package} from "@s4tk/models";
import log4js from "log4js";
import {autoInjectable} from "tsyringe";
import {FileService} from "./fileService";

const logger = log4js.getLogger();

@autoInjectable()
export class PackageService {
    cachedBuffers: { [key: string]: Buffer; } = {};
    fileService: FileService;

    constructor(fileService: FileService) {
        this.fileService = fileService;
    }
    public getBuffer(filename: string): Buffer {
        try {
            if (!this.cachedBuffers[filename]) {
                const filepath = path.resolve(process.cwd(), filename);
                this.cachedBuffers[filename] = this.fileService.readBuffer(filepath);
            }
            return this.cachedBuffers[filename];

        } catch (e) {
            logger.error(`Could not open file: ${filename}:${e}`)
        }

    }
    public savePackage(pkg:Package, outputPath:string) {
        const buffer = pkg.getBuffer();
        this.fileService.writeBuffer(outputPath,buffer);
    }

    public getPackage(filename: string, options?: PackageFileReadingOptions): Package {
        return Package.from(this.getBuffer(filename), options);
    }
}


