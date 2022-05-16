// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";
import type {PackageFileReadingOptions} from "@s4tk/models/types";
import {ResourceKey} from "@s4tk/models/types";

import {Package} from "@s4tk/models";
import {StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import {v4 as uuidv4} from "uuid";
import * as hashing from "@s4tk/hashing";
import log4js from "log4js";

import clipboard from 'clipboardy';

// const clipboard = require('clipboardy')
const logger = log4js.getLogger();

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

export function toHex(value: number | bigint): string {
    return `0x${value.toString(16).toUpperCase().padStart(16, '0')}`;
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
    return {type: parseInt(type, 16), group: parseInt(group, 16), instance: BigInt(`0x${instanceId}`)} as ResourceKey;

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

export function appendNewString(stringFile:string, textContents:string) {
    let myuuid = uuidv4();
    let stblHash = hashing.fnv32(myuuid, true)
    let stringFileLine = `${toHex32(stblHash)}=${textContents}\n`;
    clipboard.writeSync(stringFileLine);
    fs.appendFileSync(stringFile, stringFileLine);
}
