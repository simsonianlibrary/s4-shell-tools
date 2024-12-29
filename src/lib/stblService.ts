import fs from "fs";
import {Package, StringTableResource} from "@s4tk/models";
import {BinaryResourceType, StringTableLocale} from "@s4tk/models/enums";
import {ResourceKey, ResourceKeyPair, StringEntry} from "@s4tk/models/types";
import {generateS4SResourceFilename, LocaleName, parseKeyFromPath} from "./util";
import log4js from "log4js";
import PropertiesReader from "properties-reader";
import {Conversions} from "./conversions";
import getLocale = StringTableLocale.getLocale;
import {fnv64} from "@s4tk/hashing";
import {v4 as uuidv4} from "uuid";
import {ArrayMultimap} from "@teppeis/multimaps";
import setHighByte = StringTableLocale.setHighByte;
import {autoInjectable} from "tsyringe";
import {PackageService} from "./packageService";

const logger = log4js.getLogger();

@autoInjectable()
export class StblService {
    packageService: PackageService;

    constructor(packageManager?: PackageService) {
        this.packageService = packageManager;
    }

    public buildStringsPackage(outputPath:string,
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

    extractTable(stringTable: StringTableResource, key: ResourceKey): Array<string> {
        let rows = new Array<string>();
        logger.debug(`STBL ${Conversions.toHex(key.instance)} has ${stringTable.size} strings`);
        for (const entry of stringTable.entries) {
            rows.push([Conversions.numToStblRef(entry.key), entry.value].join('='));
        }
        return rows;
    }
    public stblToProperties(keyPair:ResourceKeyPair): string {
        const stringTable = keyPair.value as StringTableResource;
        const key = keyPair.key;
        let lines = this.extractTable(stringTable, key);
        return lines.join('\n')
    }
    public dumpStrings(filename: string, outputDirectory: string) {
        const stringTables = Package.extractResources(this.packageService.getBuffer(filename), {
            resourceFilter(type, _group, _inst) {
                return type === BinaryResourceType.StringTable;
            }
        });
        logger.info(`Found ${stringTables.length} STBL resources`)
        for (const keyPair of stringTables) {
            const output = this.stblToProperties(keyPair)
            const stblFilename = generateS4SResourceFilename(BinaryResourceType.StringTable, 80000000, keyPair.key.instance);

            const outfile = `${outputDirectory}/${stblFilename}.properties`;
            fs.writeFileSync(outfile, output);
        }
    }

    public printStringCountsInPackage(filename: string) {
        const stringTables = Package.extractResources(this.packageService.getBuffer(filename), {
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

    public printStringsInPackage(filename: string) {
        const stringTables = Package.extractResources(this.packageService.getBuffer(filename), {
            resourceFilter(type, _group, _inst) {
                return type === BinaryResourceType.StringTable;
            }
        });
        logger.info(`Found ${stringTables.length} STBL resources`)
        for (const keyPair of stringTables) {
            const stringTable = keyPair.value as StringTableResource;
            const key = keyPair.key;
            this.printTable(stringTable, key);
        }
    }

    public printTable(stringTable: StringTableResource, key: ResourceKey) {
        logger.info(`STBL ${Conversions.toHex(key.instance)} has ${stringTable.size} strings`);
        for (const entry of stringTable.entries) {
            console.log(`${Conversions.numToStblRef(entry.key)}<!--${entry.value}-->`);
        }
    }

    public getStringTableByLocale(stringTables:Array<ResourceKeyPair>,locale:StringTableLocale):ResourceKeyPair {
        return stringTables.find(resourceKeyPair => {
            return getLocale(resourceKeyPair.key.instance) == locale
        })
    }
    public removeDuplicateStrings(stringTable:StringTableResource):StringTableResource {
        let entriesKeys = new Set(stringTable.entries.map(entry => entry.key));
        const newStbl = new StringTableResource();
        Array.from(entriesKeys).forEach(key => {
            const uniqueEntry = stringTable.getByKey(key)
            newStbl.add(key,uniqueEntry.value);
        })
        return newStbl
    }
    public filterStringTables(pkg:Package, include:boolean): Array<ResourceKeyPair> {
        return Package.extractResources(pkg.getBuffer(), {
            resourceFilter(type, _group, _inst) {
                if(include) {
                    return  type === BinaryResourceType.StringTable;
                } else {
                    return  type !== BinaryResourceType.StringTable;
                }
            }
        });
    }

    public mergeStringResourcesByLanguage(stringResources:Array<ResourceKeyPair>): Array<ResourceKeyPair> {
        let newStringTableId = fnv64(uuidv4(),true);
        const stringMap = new ArrayMultimap<StringTableLocale,StringEntry>();
        // for each string resource, gather the entries in a multimap using the locale codes of the
        // string resources as keys.
        stringResources.forEach(stringEntry=> {
            const localeCode = getLocale(stringEntry.key.instance);
            for (const entry of (stringEntry.value as StringTableResource).entries) {
                stringMap.put(localeCode,entry);
            }
        });
        // create a new list of STBLs
        const stblList = new Array<ResourceKeyPair>();
        // create one STBL for each possible locale code
        Array.from(stringMap.keys()).forEach(localeCode => {
            // select the list of string entries for the locale
            const stringEntries = stringMap.get(localeCode);
            let stbl = new StringTableResource();
            stbl.addAll(stringEntries);
            // filter out any duplicate string entries in the STBL
            stbl = this.removeDuplicateStrings(stbl);
            //set the locale code on the STBL instance ID
            const stblId = setHighByte(localeCode,newStringTableId);
            const resourceKeyPair = {
                key:{type:BinaryResourceType.StringTable, group:0x00000000,instance:stblId} as ResourceKey,
                value:stbl
            }
            // add it to the list of generated STBLs
            stblList.push(resourceKeyPair);
        });
        // grab the English one from the list of new STBLs
        const enStrings = this.getStringTableByLocale(stblList,StringTableLocale.English);
        // create a list of all the non-English locale codes
        const allNonEnLocaleCodes = Object.values(StringTableLocale).filter(val => (val!=0 && !isNaN(Number(val)))) as Array<StringTableLocale>;
        if(enStrings) {
            // create an STBL resource for each non-English locale code, and add the list of string entries for that locale from the multimap.
            // For each entry in the English STBL, ensure that there is a matching string entry in each of the other locale-coded STBLs.
            // if it's missing in an STBL, copy it from the English STBL.
            logger.trace(`All locale codes: ${allNonEnLocaleCodes}`)
            allNonEnLocaleCodes.forEach( localeCode => {
                let nonEnStbl = this.getStringTableByLocale(stblList,localeCode as StringTableLocale)
                if(!nonEnStbl) {
                    logger.trace(`Strings for ${localeCode} not found. Creating them...`)
                    const emptyStbl = new StringTableResource();
                    const instId = setHighByte(localeCode as StringTableLocale,newStringTableId);
                    const newStblKey = {
                        type:BinaryResourceType.StringTable,
                        group:0,
                        instance: instId
                    } as ResourceKey
                    nonEnStbl = {key:newStblKey, value: emptyStbl} as ResourceKeyPair;
                    stblList.push(nonEnStbl);

                } else {
                    logger.trace(`STBL for ${localeCode} found.`);
                }
                (enStrings.value as StringTableResource).entries.forEach( stringEntry => {
                    if(!(nonEnStbl.value as StringTableResource).entries.find(nonEnStbl => nonEnStbl.key == stringEntry.key)) {
                        logger.trace(`Copying string ${stringEntry.key} from EN to ${Conversions.toHex(localeCode)}.`);
                        (nonEnStbl.value as StringTableResource).add(stringEntry.key,stringEntry.value);
                    }
                })
            })
        }
        return stblList;
    }    
}


