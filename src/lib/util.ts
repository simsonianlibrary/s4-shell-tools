import fs, {readFileSync} from "fs";
import path from "path";
import {ResourceKey} from "@s4tk/models/types";
import {fnv64} from "@s4tk/hashing";

import {BinaryResourceType, SimDataGroup, StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import yaml from "js-yaml";
import {Conversions} from "./conversions";
import {XMLValidator} from "fast-xml-parser";
import {XmlDocumentNode} from '@s4tk/xml-dom'

const logger = log4js.getLogger();

// f
/**
 * Read a YML file and return the contents as an object
 * @param path path to the YML file
 */
export function loadYamlFile(path: string): any {
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

    if (filepath.endsWith(".xml")) {
        const file = readFileSync(filepath, 'utf-8');

        let docNode = XmlDocumentNode.from(file);
        if (docNode.child.tag == 'SimData') {
            let schemaname = docNode.child.child.child.attributes.schema;
            logger.info(`SimData: ${docNode.child.child.child.attributes.name}`);
            let tuningType = TuningResourceType.parseAttr(schemaname);
            const dataGroup: SimDataGroup = SimDataGroup.getForTuning(tuningType);
            let keystr = Conversions.generateKeyString(0x545AC67A, dataGroup, fnv64(docNode.child.child.child.attributes.name, true))
            logger.debug(`Key: ${keystr}`);
            type = 0x545AC67A;
            group = dataGroup;
            instanceId = fnv64(docNode.child.child.child.attributes.name, true);
        } else {
            logger.info(`Tuning: ${docNode.child.attributes.n}`);
            const instanceName = docNode.child.attributes.i;
            if(!instanceName) {
                logger.error(`Instance value not found: ${filepath}`);
                return;
            }
            const typeCode = TuningResourceType.parseAttr(instanceName);
            let id = BigInt(docNode.child.attributes.s);
            let keystr = Conversions.generateKeyString(typeCode, 0x00000000, id);
            logger.debug(`Key: ${keystr}`);
            type = typeCode;
            group = 0x00000000;
            instanceId = id;
        }
    } else {
        const [typestr, groupstr, instanceIdstr] = path.basename(filepath, path.extname(filepath)).split('.')[0].split('!')
        if (!(typestr && groupstr && instanceIdstr)) {
            throw (new Error(`Invalid filename format: ${filepath} => ${[typestr, groupstr, instanceIdstr]}`))
        }
        type = parseInt(typestr, 16);

        group = parseInt(groupstr, 16);
        instanceId = Conversions.strToBigInt(instanceIdstr);

    }
    if (!(type && instanceId)) {
        throw (new Error(`Invalid XML: ${filepath} => ${[type, group, instanceId]}`))
    }
    return {type: type, group:group, instance: instanceId} as ResourceKey;
}




/**
 * Generate a S4S format filename from a given resource key
 * @param type resource type
 * @param group resource group
 * @param instance instance ID
 */
export function generateS4SResourceFilename(type: number, group: number, instance: bigint): string {
    const keyString = Conversions.generateKeyString(type, group, instance)
    const resourceTypeName = BinaryResourceType[type];
    switch (type) {
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
            if (tuningResourceTypeName) {
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
export function isValidXML(text: string) {

    return XMLValidator.validate(text, {
        allowBooleanAttributes: true
    })
}

export function is32BitSchema(schema:string): boolean {
    const ThirtyTwoBitSchemas = [
        "Preference",
        "Reward",
        "HouseholdReward",
        "SimReward",
        "RelationshipBit",
        "SocialContextBit",
        "Aspiration",
        "AspirationAssignment",
        "AspirationBasic",
        "AspirationCareer",
        "AspirationGig",
        "AspirationFamilialTrigger",
        "AspirationNotification",
        "AspirationOrganizationTask",
        "AspirationSimInfoPanel",
        "AspirationWhimSet",
        "ObjectivelessWhimSet",
        "TimedAspiration",
        "ZoneDirectorEventListener",
        "Recipe"
    ]
    return ThirtyTwoBitSchemas.includes(schema);
}