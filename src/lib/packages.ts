import path from "path";
import fs from "fs";
import {PackageFileReadingOptions, Resource, ResourceEntry} from "@s4tk/models/types";
import {Package, RawResource, SimDataResource, XmlResource} from "@s4tk/models";
import {isValidXML, parseKeyFromPath} from "./util";
import {SimDataResourceType} from "./build";
import {TuningResourceType,BinaryResourceType} from "@s4tk/models/enums";
import log4js from "log4js";

const logger = log4js.getLogger();

const cachedBuffers: { [key: string]: Buffer; } = {};

export function getBuffer(filename: string): Buffer {
    try {
        if (!cachedBuffers[filename]) {
            const filepath = path.resolve(process.cwd(), filename);
            cachedBuffers[filename] = fs.readFileSync(filepath);
        }
        return cachedBuffers[filename];

    } catch (e) {
        logger.error(`Could not open file: ${filename}:${e}`)
    }

}
export function savePackage(pkg:Package, outputPath:string) {
    const buffer = pkg.getBuffer();
    fs.writeFileSync(outputPath,buffer);
}

export function getPackage(filename: string, options?: PackageFileReadingOptions): Package {
    return Package.from(getBuffer(filename), options);
}

export function makeResourceEntry(filepath: string): ResourceEntry {
    logger.trace(`Creating resource key from ${filepath}`)
    let resource: Resource;

    const resourceKey = parseKeyFromPath(filepath);
    
    if (resourceKey.type == BinaryResourceType.SimData) {
        let stringContents = getBuffer(filepath).toString();
        if (!isValidXML(stringContents)) {
            throw(new Error(`File contains invalid XML: ${filepath}`));
        }
        resource = SimDataResource.fromXml(stringContents)

    } else if (TuningResourceType[resourceKey.type]) {
        let stringContents = getBuffer(filepath).toString();
        if (!isValidXML(stringContents)) {
            throw(new Error(`File contains invalid XML: ${filepath}`));
        }
        resource = new XmlResource(stringContents);

    } else {
        resource = RawResource.from(getBuffer(filepath))

    }

    return {
        key: resourceKey,
        value: resource,
    } as ResourceEntry;
}
