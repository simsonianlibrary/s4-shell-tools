import fs from "fs";
import path from "path";
import {ResourceEntry, ResourceKey} from "@s4tk/models/types";
import {fnv64} from "@s4tk/hashing";

import {BinaryResourceType, SimDataGroup, StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import yaml from "js-yaml";
import {Conversions} from "./conversions";
const logger = log4js.getLogger();
import { XMLValidator } from "fast-xml-parser";
import { XmlDocumentNode } from '@s4tk/xml-dom'
import { readFileSync } from 'fs';

// f
/**
 * Read a YML file and return the contents as an object
 * @param path path to the YML file
 */
export function loadYamlFile(path:string):any {
    let yamlFileContents = fs.readFileSync(path, 'utf8');
    return yaml.load(yamlFileContents);
}

/**
 * Parse a resource key from a file name based on S4Studio naming conventions.
 * @param filepath file to parse resource key from
 */
export function parseKeyFromPath(filepath: string): ResourceKey {
    logger.trace(`Parsing resource key from: ${filepath}`)
    let type: number;
    let group: number;
    let instanceId: bigint;

    if(filepath.endsWith(".xml")) {
        const file = readFileSync(filepath, 'utf-8');

        let docNode = XmlDocumentNode.from(file);
        if(docNode.child.tag == 'SimData') {
            var dataGroup = SimDataGroup[(docNode.child.child.child.attributes.schema)];
            let keystr = Conversions.generateKeyString(0x545AC67A,parseInt(dataGroup),fnv64(docNode.child.child.child.attributes.name)) 
            logger.debug(`Key: ${keystr}`);
            type = 0x545AC67A;
            group = parseInt(dataGroup);
            instanceId = fnv64(docNode.child.child.child.attributes.name);
        } else {
            // logger.info(`Class: ${docNode.child.attributes.i}`);
            var typeCode = TuningResourceType.parseAttr(docNode.child.attributes.i);
            let id = BigInt(docNode.child.attributes.s);
            let keystr = Conversions.generateKeyString(typeCode,0x00000000,id); 
            logger.debug(`Key: ${keystr}`);
            type = typeCode;
            group = 0x00000000;
            instanceId = id;
        }

    }
    if(!(type && instanceId)) {
        throw(new Error(`Invalid XML: ${filepath} => ${[type, group, instanceId]}`))
    }
    return {type: type, group, instance: instanceId} as ResourceKey;
}

/**
 * Test whether a given file can be imported by this tool
 * @param filename file to test
 */
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

/**
 * Generate a S4S format filename from a given resource key
 * @param resourceKey ResourceKey to generate filename for
 */
export function generateResourceFilenameFromKey(resourceKey:ResourceKey): string {
    return generateS4SResourceFilename(resourceKey.type,resourceKey.group, resourceKey.instance)
}

/**
 * Generate a S4S format filename from a given resource key
 * @param type resource type
 * @param group resource group
 * @param instance instance ID
 */
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

/**
 * Lookup the locale name for a given locale code
 * @param value Locale code
 * @constructor
 */
export function LocaleName(value: bigint): string {
    return StringTableLocale[StringTableLocale.getLocale(value)]
}

/**
 * Lookup the tuning type name based on the tuning type
 * @param value tuning type code
 * @constructor
 */
export function TuningTypeName(value: number): string {
    return TuningResourceType[value]?.toString()
}

/**
 * Test whether a string contains valid XML
 * @param text string to check
 */
export function isValidXML(text:string) {

    const result = XMLValidator.validate(text, {
        allowBooleanAttributes: true
    });
    return result    
}
