// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";
import {ResourceKey} from "@s4tk/models/types";
import {BinaryResourceType, StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import yaml from "js-yaml";

// const clipboard = require('clipboardy')
const logger = log4js.getLogger();

export function loadYamlFile(path:string):any {
    let yamlFileContents = fs.readFileSync(path, 'utf8');
    return yaml.load(yamlFileContents);
}
export function toHex(value: number | bigint): string {
    return `0x${value.toString(16).toUpperCase().padStart(16, '0')}`;
}
export function HexToBigInt(hexValue:string): bigint {
    return BigInt(`0x${hexValue}`);
}

export function toHex32(value: number): string {
    return `0x${value.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function toKeyString(type: number, group: number, inst: bigint): string {
    return `${type.toString(16).toUpperCase().padStart(8, '0')}!${group.toString(16).toUpperCase().padStart(8, '0')}!${inst.toString(16).toUpperCase()}`;
}

export function parseKeyFromPath(filepath: string): ResourceKey {
    const filename = filepath.split('/').pop().split('.')[0];
    const [type, group, instanceId] = filename.split('!')
    return {type: parseInt(type, 16), group: parseInt(group, 16), instance: HexToBigInt(instanceId)} as ResourceKey;

}
export function generateResourceFilenameFromKey(resourceKey:ResourceKey): string {
    return generateS4SResourceFilename(resourceKey.type,resourceKey.group, resourceKey.instance)
}
export function generateS4SResourceFilename(type:number, group:number, instance:bigint): string {
    switch(type) {
        case BinaryResourceType.StringTable:
            const languageName = LocaleName(instance);
            return `${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}.${languageName}.StringTable.binary`;
        case BinaryResourceType.SimData:
            return `${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}.SimData.xml`;
        case BinaryResourceType.CombinedTuning:
        case BinaryResourceType.DstImage:
            return `${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}.${BinaryResourceType[type]}.binary`;
        default:
            let tuningResourceTypeName = TuningResourceType[type];
            if(tuningResourceTypeName) {
                return `${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}.${tuningResourceTypeName}.xml`;
            } else {
                logger.warn(`Unknown resource type: ${toHex(type)} for resource ${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}`);
                return `${toHex32(BinaryResourceType.StringTable).slice(2)}!${toHex32(group)}!${toHex(instance)}.xml`;
            }
    }
}

export function LocaleName(value: bigint): string {
    return StringTableLocale[StringTableLocale.getLocale(value)]
}


export const TuningTypeCrosswalk: Map<string, string> = new Map<string, string>();

function buildTuningTypeCrosswalk() {
    for (let value in TuningResourceType) {
        TuningTypeCrosswalk.set((TuningResourceType[value] as any).toString(16).toUpperCase().padStart(8, '0'),
            value.toString());
    }
}

buildTuningTypeCrosswalk();

export function canImportFile(filename:string) {
    const resourceKey = parseKeyFromPath(filename);
    return (BinaryResourceType[resourceKey.type] || TuningResourceType[resourceKey.type])
}
