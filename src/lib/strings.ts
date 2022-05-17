import {StringTextFileEntry} from "./types";
import fs from "fs";
import {Package, StringTableResource} from "@s4tk/models";
import {BinaryResourceType} from "@s4tk/models/enums";
import {ResourceKey} from "@s4tk/models/types";
import {generateS4SResourceFilename, HexToBigInt, LocaleName, toHex, toHex32} from "./util";
import log4js from "log4js";
import {getBuffer} from "./packages";
import PropertiesReader from "properties-reader";

const logger = log4js.getLogger();

// replaced with PropertiesReader for now
export function ParseStringsTextFile(filename: string): Array<StringTextFileEntry> {
    logger.debug(`opening strings file: ${filename}`);
    const file = fs.readFileSync(filename, {encoding: 'utf8'});
    const lines = file.split('\n').filter(l => l);
    return lines.map(line => {
        const entryData = new StringTextFileEntry();
        const columns = line.split('=')
        entryData.hashId = columns[0]
        entryData.comment = columns[1]
        return entryData;
    });
}

export function buildStringsPackage(instanceId: string, propertyFilePaths: Array<string>, outputDirectory: string) {
    logger.debug(`buildStringsPackage:Start`)

    const packageFile = new Package();
    propertyFilePaths.forEach(propertyFilePath => {
        const mergedStbl = new StringTableResource();

        // read strings and hash keys from .properties file
        const properties = PropertiesReader(propertyFilePath);

        // add them to the string table resource
        properties.each((key, value) => {
            mergedStbl.add(parseInt(key, 16),value.toString());
        })

        const stblFilename = generateS4SResourceFilename(BinaryResourceType.StringTable,80000000,HexToBigInt(instanceId));

        // write the STBL resource to disk
        let filename = `${outputDirectory}/${stblFilename}`
        const stblBuffer = mergedStbl.getBuffer();
        fs.writeFileSync(filename, stblBuffer);
        logger.trace(`Wrote strings file to disk: ${filename}`);

        // write the resource to the new package
        const resourceKey = {
            type: BinaryResourceType.StringTable,
            group: 80000000,
            instance: HexToBigInt(instanceId)
        } as ResourceKey;
        logger.trace(`adding STBL to new package file: ${filename}`)
        packageFile.add(resourceKey, mergedStbl);
    });
    logger.trace("writing strings package to disk");
    const packageBuffer = packageFile.getBuffer()
    fs.writeFileSync(`${outputDirectory}/strings_package.package`, packageBuffer);
    logger.debug(`buildStringsPackage:Done`)
}

function extractTable(stringTable:StringTableResource, key:ResourceKey): Array<string> {
    let rows = new Array<string>();
    logger.debug(`STBL ${toHex(key.instance)} has ${stringTable.size} strings`);
    for (const entry of stringTable.entries) {
        rows.push([toHex32(entry.key),entry.value].join('='));
    }
    return rows;

}

export function dumpStrings(filename: string, outputDirectory:string) {
    const stringTables = Package.extractResources(getBuffer(filename), {
        resourceFilter(type, _group, _inst) {
            return type === BinaryResourceType.StringTable;
        }
    });
    logger.info(`Found ${stringTables.length} STBL resources`)
    for (const keyPair of stringTables) {
        const stringTable = keyPair.value as StringTableResource;
        const key = keyPair.key;
        let lines = extractTable(stringTable,key);
        let output = lines.join('\n');
        let languageName = LocaleName(key.instance);
        const stblFilename = `${toHex32(BinaryResourceType.StringTable).slice(2)}!80000000!${key.instance.toString(16).padStart(16,'0')}.${languageName}.StringTable.properties`;
        const outfile = `${outputDirectory}/${stblFilename}`;
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
            toHex(entry.key.instance),
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
    logger.info(`STBL ${toHex(key.instance)} has ${stringTable.size} strings`);
    for (const entry of stringTable.entries) {
        console.log(`${toHex32(entry.key)}<!--${entry.value}-->`);
    }
}
