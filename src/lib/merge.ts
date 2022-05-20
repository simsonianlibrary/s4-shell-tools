/**
 * # Merge Packages
 * ## Merge packages workflow:
 * 1. Create a new empty package
 * 2. Extract all non-string resources from each package, and copy them into the new empty package
 * 3. Extract all string resources from each package and sort them in a unified multimap by locale code
 * 4. Create a random new StringResource table ID and set the locale to English
 * 5. Remove all duplicates from the English string resources
 * 6. Walk the list of StringLocaleCodes and for each non english locale code, extract the list of string entries and remove duplicates
 * 7. For each non-English locale, copy over any string entries that are included in the English list but missing in that one
 * 8. Create a new StringTableResource for each non-English locale, adding the associated list of string entries for that locale
 * 9. Add the single set of StringTableResources (one for each locale) to the new package
 * 10. Check the package for duplicated resource keys. Fail the build if any are found, logging the duplicated resource keys.
 * 11. Done.
 *
 * @module
 */

import {Package, StringTableResource} from "@s4tk/models";
import {fnv64} from "@s4tk/hashing";
import {getBuffer, savePackage} from "./packages";
import {ResourceKey, ResourceKeyPair, StringEntry} from "@s4tk/models/types";
import {BinaryResourceType, StringTableLocale} from "@s4tk/models/enums";
import {v4 as uuidv4} from 'uuid';
import {ArrayMultimap} from '@teppeis/multimaps';
import {Conversions} from "./conversions";
import setHighByte = StringTableLocale.setHighByte;
import getLocale = StringTableLocale.getLocale;
import {getAllEnumValues} from "enum-for";
import log4js from "log4js";
import {BuildProject} from "./build";
const logger = log4js.getLogger();


export class MergeTarget {
    project: BuildProject | null;
    name:string;
    combineStrings:boolean | null;
    stblId:string | null;
    stblHashKey:string | null;
    files:Array<string>;

    constructor(project:BuildProject,data:MergeTarget) {
        this.project = project;
        this.name = data.name;
        this.combineStrings = data.combineStrings;
        this.stblId = data.stblId
        this.stblHashKey = data.stblHashKey;
        this.files = data.files;
    }
    mergePackageFilesToPath(packagePaths:Array<string>, outputPath:string,aggregateStringTables:boolean) {
        logger.debug(`--combineStrings == ${aggregateStringTables}`)
        const donorBuffers = packagePaths.map<Package>(path => Package.from(getBuffer(path)) );
        const targetPackage = this.mergePackages(donorBuffers, aggregateStringTables);
        const duplicateKeys = targetPackage.findRepeatedKeys();
        if(duplicateKeys?.length) {
            throw(new Error(`DUPLICATE TUNING RESOURCES FOUND: ${duplicateKeys}`))
        }
        savePackage(targetPackage, outputPath);
    }

    mergePackages(packages:Array<Package>, aggregateStringTables:boolean): Package {
        const pkg = new Package();
        // I seem to be getting the same resulting package whether this flag is set or not. Not sure why, however.
        if (aggregateStringTables) {
            let stringResources:Array<ResourceKeyPair> = new Array<ResourceKeyPair>();
            packages.forEach(donorPackage => {
                const nonStringResources = this.filterStringTables(donorPackage,false);
                stringResources = stringResources.concat(this.filterStringTables(donorPackage,true));
                pkg.addAll(nonStringResources);
            });
            stringResources = this.mergeStringResourcesByLanguage(stringResources);
            pkg.addAll(stringResources);
        } else {
            packages.forEach(donorPackage => {
                pkg.addAll(donorPackage.entries);
            });
        }
        return pkg;
    }
    mergeStringResourcesByLanguage(stringResources:Array<ResourceKeyPair>): Array<ResourceKeyPair> {
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
            allNonEnLocaleCodes.forEach( localeCode => {
                let nonEnStbl = this.getStringTableByLocale(stblList,localeCode as StringTableLocale)
                if(!nonEnStbl) {
                    const emptyStbl = new StringTableResource();
                    const instId = setHighByte(localeCode as StringTableLocale,newStringTableId);
                    const newStblKey = {
                        type:BinaryResourceType.StringTable,
                        group:0,
                        instance: instId
                    } as ResourceKey
                    nonEnStbl = {key:newStblKey, value: emptyStbl} as ResourceKeyPair;
                }
                (enStrings.value as StringTableResource).entries.forEach( stringEntry => {
                    if(!(nonEnStbl.value as StringTableResource).entries.find(nonEnStbl => nonEnStbl.key == stringEntry.key)) {
                        (nonEnStbl.value as StringTableResource).add(stringEntry.key,stringEntry.value);
                    }
                })
            })
        }
        return stblList;
    }
    getStringTableByLocale(stringTables:Array<ResourceKeyPair>,locale:StringTableLocale):ResourceKeyPair {
        return stringTables.find(resourceKeyPair => {
            return getLocale(resourceKeyPair.key.instance) == locale
        })
    }
    removeDuplicateStrings(stringTable:StringTableResource):StringTableResource {
        let entriesKeys = new Set(stringTable.entries.map(entry => entry.key));
        const newStbl = new StringTableResource();
        Array.from(entriesKeys).forEach(key => {
            const uniqueEntry = stringTable.getByKey(key)
            newStbl.add(key,uniqueEntry.value);
        })
        return newStbl
    }
    filterStringTables(pkg:Package, include:boolean): Array<ResourceKeyPair> {
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

}
