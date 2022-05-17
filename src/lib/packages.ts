import path from "path";
import fs from "fs";
import {PackageFileReadingOptions, Resource, ResourceEntry} from "@s4tk/models/types";
import {Package, RawResource, SimDataResource, XmlResource} from "@s4tk/models";
import {parseKeyFromPath} from "./util";
import {SimDataResourceType} from "./build";
import {TuningResourceType} from "@s4tk/models/enums";

const cachedBuffers: { [key: string]: Buffer; } = {};

export function getBuffer(filename: string): Buffer {
    if (!cachedBuffers[filename]) {
        const filepath = path.resolve(process.cwd(), filename);
        cachedBuffers[filename] = fs.readFileSync(filepath);
    }
    return cachedBuffers[filename];
}

export function getPackage(filename: string, options?: PackageFileReadingOptions): Package {
    return Package.from(getBuffer(filename), options);
}

export function makeResourceEntry(filepath: string): ResourceEntry {
    // 545AC67A
    const resourceKey = parseKeyFromPath(filepath);
    let resource: Resource;
    if (resourceKey.type == SimDataResourceType) {
        resource = SimDataResource.fromXml(getBuffer(filepath).toString())
    } else if(TuningResourceType[resourceKey.type]){
        resource = new XmlResource(getBuffer(filepath).toString());
    } else {
        resource = RawResource.from(getBuffer(filepath))
    }
    return {
        key: resourceKey,
        value: resource,
    } as ResourceEntry;
}
