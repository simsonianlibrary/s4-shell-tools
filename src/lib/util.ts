// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";
import {ResourceKey} from "@s4tk/models/types";
import {BinaryResourceType, StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import yaml from "js-yaml";
import libxmljs from "libxmljs";
import {Conversions} from "./conversions";
// const clipboard = require('clipboardy')
const logger = log4js.getLogger();

export function loadYamlFile(path:string):any {
    let yamlFileContents = fs.readFileSync(path, 'utf8');
    return yaml.load(yamlFileContents);
}

export function parseKeyFromPath(filepath: string): ResourceKey {
    logger.trace(`Parsing resource key from: ${filepath}`)
    const [type, group, instanceId] = path.basename(filepath,path.extname(filepath)).split('.')[0].split('!')
    if(!(type && group && instanceId)) {
        throw(new Error(`Invalid filename format: ${filepath} => ${[type, group, instanceId]}`))
    }
    return {type: parseInt(type, 16), group: parseInt(group, 16), instance: Conversions.strToBigInt(instanceId)} as ResourceKey;
}

export function canImportFile(filename:string): boolean {
    if(!filename.endsWith('.xml')) {
        logger.trace(`Skipping non-XML file: ${filename}`);
        return false
    }
    const resourceKey = parseKeyFromPath(filename);
    if(BinaryResourceType[resourceKey.type]) {
        logger.trace(`Is Binary Resource Type`);
        return true;
    } else if (TuningTypeName(resourceKey.type)) {
        logger.trace(`Is Tuning Resource Type`);
        return true;
    }
    logger.warn(`Skipping unhandled file type! Try importing it with S4Studio: ${filename}`);
    return false;
}

export function generateResourceFilenameFromKey(resourceKey:ResourceKey): string {
    return generateS4SResourceFilename(resourceKey.type,resourceKey.group, resourceKey.instance)
}
export function generateS4SResourceFilename(type:number, group:number, instance:bigint): string {
    const keyString = Conversions.generateKeyString(type, group, instance)
    const resourceTypeName = BinaryResourceType[type];
    switch(type) {
        case BinaryResourceType.StringTable:
            const languageName = LocaleName(instance);
            return `${keyString}.${languageName}.${resourceTypeName}.binary`;
        case BinaryResourceType.SimData:
            return `${keyString}.${resourceTypeName}.xml`;
        case BinaryResourceType.CombinedTuning:
        case BinaryResourceType.DstImage:
            return `${keyString}.${resourceTypeName}.binary`;
        default:
            let tuningResourceTypeName = TuningTypeName(type);
            if(tuningResourceTypeName) {
                return `${keyString}.${tuningResourceTypeName}.xml`;
            } else {
                logger.warn(`Unknown resource type: ${keyString}`);
                return `${keyString}.Unknown.binary`;
            }
    }
}

export function LocaleName(value: bigint): string {
    return StringTableLocale[StringTableLocale.getLocale(value)]
}
export function TuningTypeName(value: number): string {
    return TuningResourceType[value]?.toString()
}
export function isValidXML(text:string) {
    try {
        libxmljs.parseXml(text);
    } catch (e) {
        return false;
    }
    return true;
}
