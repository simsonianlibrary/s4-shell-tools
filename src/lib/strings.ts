import {StringTextFileEntry} from "./types";
import fs from "fs";
import {Package, StringTableResource} from "@s4tk/models";
import {BinaryResourceType} from "@s4tk/models/enums";
import {ResourceKey} from "@s4tk/models/types";
import {getBuffer, toHex, toHex32} from "./util";
import log4js from "log4js";
import path from "path";
const logger = log4js.getLogger();

export function ParseStringsTextFile(filename: string): Array<StringTextFileEntry> {
    // Or you can read file line by line
    logger.debug(`opening strings file: ${filename}`);
    const file = fs.readFileSync(filename, {encoding: 'utf8'});
    const lines = file.split('\n').filter(l => l);
    const entries: Array<StringTextFileEntry> = lines.map(line => {
        const entryData = new StringTextFileEntry();
        const columns = line.split('=')
        entryData.hashId = columns[0]
        entryData.comment = columns[1]
        return entryData;
    });
    // console.log(entries);
    return entries;
}

export function buildStringsPackage(instanceId: string, stringFiles: Array<string>, outputDirectory: string) {
    logger.debug(`Entered buildStringsPackage`)

    const packageFile = new Package();
    stringFiles.forEach(stringFile => {
        const entries = ParseStringsTextFile(stringFile);

        const mergedStbl = new StringTableResource();
        entries.forEach(entry => {
            mergedStbl.add(parseInt(entry.hashId, 16), entry.comment);
        })

        const stblFilename = `${toHex32(BinaryResourceType.StringTable).slice(2)}!80000000!${instanceId}.English.StringTable.binary`;
        logger.debug(`About to save STBL file to disk: ${stblFilename}`)

        const stblBuffer = mergedStbl.getBuffer();
        let filename = `${outputDirectory}/${stblFilename}`
        fs.writeFileSync(filename, stblBuffer);
        logger.debug(`Wrote strings file to disk: ${filename}`)
        const resourceKey = {
            type: BinaryResourceType.StringTable,
            group: 80000000,
            instance: BigInt(`0x${instanceId}`)
        } as ResourceKey;
        logger.debug(`adding STBL to new package file: ${filename}`)
        packageFile.add(resourceKey, mergedStbl);
    });
    logger.debug("writing strings package to disk");
    const packageBuffer = packageFile.getBuffer()
    fs.writeFileSync(`${outputDirectory}/strings_package.package`, packageBuffer);
}

function extractTable(stringTable:StringTableResource, key:ResourceKey): Array<string> {
    let rows = new Array<string>();
    logger.debug(`STBL ${toHex(key.instance)} has ${stringTable.size} strings`);
    for (const entry of stringTable.entries) {
        rows.push(`${toHex32(entry.key)}=${entry.value}`);
    }
    return rows;
}

export function dumpStrings(filename: string, outputDirectory:string) {
    const stringTables = Package.extractResources(getBuffer(filename), {
        resourceFilter(type, _group, _inst) {
            return type === BinaryResourceType.StringTable;
        }
    });
    console.log(`Found ${stringTables.length} STBL resources`)
    for (const keyPair of stringTables) {
        const stringTable = keyPair.value as StringTableResource;
        const key = keyPair.key;
        let lines = extractTable(stringTable,key);
        let output = lines.join('\n');
        const stblFilename = `${toHex32(BinaryResourceType.StringTable).slice(2)}!80000000!${key.instance.toString(16).padStart(16,'0')}.English.StringTable.properties`;
        const outfile = `${outputDirectory}/${stblFilename}`;
        fs.writeFileSync(outfile, output);
    }
}
