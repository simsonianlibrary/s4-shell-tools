import {StringTextFileEntry} from "./types";
import fs from "fs";
import {Package, StringTableResource} from "@s4tk/models";
import {BinaryResourceType} from "@s4tk/models/enums";
import {ResourceKey, ResourceKeyPair} from "@s4tk/models/types";
import {generateS4SResourceFilename, LocaleName, parseKeyFromPath} from "./util";
import log4js from "log4js";
import {getBuffer} from "./packages";
import PropertiesReader from "properties-reader";
import {Conversions} from "./conversions";

const logger = log4js.getLogger();

// replaced with PropertiesReader for now
export function parseStringsTextFile(filename: string): Array<StringTextFileEntry> {
    logger.debug(`opening strings file: ${filename}`);
    const file = fs.readFileSync(filename, {encoding: 'utf8'});
    const lines = file.split('\n').filter(l => l);
    return lines.flatMap(line => {
        const columns = line.split('=', 1)
        if(columns.length != 2) {
            logger.warn(`Skipping malformatted line: ${line}`);
            return [];
        }
        const entryData = new StringTextFileEntry(columns[0],columns[1]);
        return [entryData];
    });
}

export function buildStringsPackage(outputPath:string,
                                    propertyFilePaths: Array<string>,
                                    overrideInstanceId: string=null) {
    logger.debug(`-- buildStringsPackage:Start`)
    try {
        const packageFile = new Package();
        propertyFilePaths = propertyFilePaths.filter( path => path.endsWith('.properties'))
        logger.trace(`Strings files: ${propertyFilePaths}`);
        propertyFilePaths.forEach(propertyFilePath => {

            const mergedStbl = new StringTableResource();

            // read strings and hash keys from .properties file
            const properties = PropertiesReader(propertyFilePath);

            // add them to the string table resource
            properties.each((key, value) => {
                mergedStbl.add(parseInt(key, 16), value.toString());
            })
            let instanceId;
            if(overrideInstanceId) {
                // use the instanceId passed in
                instanceId = overrideInstanceId;
            } else {
                // read the stbl key from the files
                instanceId = Conversions.numToHex64Str(parseKeyFromPath(propertyFilePath).instance);
            }

            // const resourceKey = parseKeyFromPath(propertyFilePath)
            // write the resource to the new package
            const resourceKey = {
                type: BinaryResourceType.StringTable,
                group: parseInt('80000000',16),
                instance: Conversions.strToBigInt(instanceId)
            } as ResourceKey;
            logger.trace(`adding STBL : ${Conversions.keyToString(resourceKey)}`)
            packageFile.add(resourceKey, mergedStbl);

        });
        logger.trace("writing strings package to disk");
        const packageBuffer = packageFile.getBuffer()
        fs.writeFileSync(outputPath, packageBuffer);

    } catch (e) {
        logger.error(`buildStringsPackage:ERROR:${e}`)
    }
    logger.debug(`-- buildStringsPackage:Done`)
}

function extractTable(stringTable: StringTableResource, key: ResourceKey): Array<string> {
    let rows = new Array<string>();
    logger.debug(`STBL ${Conversions.toHex(key.instance)} has ${stringTable.size} strings`);
    for (const entry of stringTable.entries) {
        rows.push([Conversions.numToStblRef(entry.key), entry.value].join('='));
    }
    return rows;
}
export function stblToProperties(keyPair:ResourceKeyPair): string {
    const stringTable = keyPair.value as StringTableResource;
    const key = keyPair.key;
    let lines = extractTable(stringTable, key);
    return lines.join('\n')
}
export function dumpStrings(filename: string, outputDirectory: string) {
    const stringTables = Package.extractResources(getBuffer(filename), {
        resourceFilter(type, _group, _inst) {
            return type === BinaryResourceType.StringTable;
        }
    });
    logger.info(`Found ${stringTables.length} STBL resources`)
    for (const keyPair of stringTables) {
        // const stringTable = keyPair.value as StringTableResource;
        // const key = keyPair.key;
        // let lines = extractTable(stringTable, key);
        // let output = lines.join('\n');
        const output = stblToProperties(keyPair)
        const stblFilename = generateS4SResourceFilename(BinaryResourceType.StringTable, 80000000, keyPair.key.instance);

        const outfile = `${outputDirectory}/${stblFilename}.properties`;
        fs.writeFileSync(outfile, output);
    }
}

export function printStringCountsInPackage(filename: string) {
    const stringTables = Package.extractResources(getBuffer(filename), {
        resourceFilter(type, _group, _inst) {
            return type === BinaryResourceType.StringTable;
        }
    });

    logger.info(`Found ${stringTables.length} STBL resources`)
    console.log('InstanceKey       \tLanguage         \tStringCount');
    console.log('==================\t=================\t===========');

    for (const entry of stringTables) {
        const stringTable = entry.value as StringTableResource;
        console.log([
            Conversions.toHex(entry.key.instance),
            LocaleName(entry.key.instance).padEnd(17, ' '),
            stringTable.size].join('\t'));
    }
}

export function printStringsInPackage(filename: string) {
    const stringTables = Package.extractResources(getBuffer(filename), {
        resourceFilter(type, _group, _inst) {
            return type === BinaryResourceType.StringTable;
        }
    });
    logger.info(`Found ${stringTables.length} STBL resources`)
    for (const keyPair of stringTables) {
        const stringTable = keyPair.value as StringTableResource;
        const key = keyPair.key;
        printTable(stringTable, key);
    }
}

function printTable(stringTable: StringTableResource, key: ResourceKey) {
    logger.info(`STBL ${Conversions.toHex(key.instance)} has ${stringTable.size} strings`);
    for (const entry of stringTable.entries) {
        console.log(`${Conversions.numToStblRef(entry.key)}<!--${entry.value}-->`);
    }
}
