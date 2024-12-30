import fs from "fs";

import {StringTableLocale, TuningResourceType} from "@s4tk/models/enums";
import yaml from "js-yaml";
import {XMLValidator} from "fast-xml-parser";


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
 * Lookup the locale name for a given locale code
 * @param value Locale code
 */
export function LocaleName(value: bigint): string {
    return StringTableLocale[StringTableLocale.getLocale(value)]
}

/**
 * Lookup the tuning type name based on the tuning type
 * @param value tuning type code
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

/**
 * Looks up the class of the tuning file to determine whether it requires a 32 bit
 * instance ID instead of a 64 bit instance ID. This is kind of an error prone way to
 * do this, since any patch might add more classes that may need to be added here.
 *
 * Haven't found a better way yet. The source of truth is in the TDESC files, but I haven't
 * involved those in the build process.
 *
 * @param schema
 */
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