import {XmlResource} from "@s4tk/models";
import dirTree from "directory-tree";
import {TuningData} from "./types";
import {Conversions} from "./conversions";
import log4js from "log4js";
import {getPackage} from "./packages";
import {TuningResourceType} from "@s4tk/models/enums";

const logger = log4js.getLogger();


export function findDuplicates(filenames: string[]) {
    const resourceMap: Map<string, Array<TuningData>> = new Map<string, Array<TuningData>>();
    filenames.forEach(filename => {
        const packageFile = getPackage(filename);
        packageFile.entries.forEach(entry => {
            if (entry.value.isXml()) {
                try {
                    const key = Conversions.generateKeyString(entry.key.type, entry.key.group, entry.key.instance);
                    const xml = entry.value as XmlResource;
                    const tuningName = (xml.dom.children[0] as any).name;
                    if (!resourceMap.get(key)) {
                        resourceMap.set(key, new Array<TuningData>());
                    }
                    const tuning = new TuningData(tuningName, filename, key);
                    resourceMap.get(key).push(tuning);
                } catch (e) {
                    console.error(`Error parsing resource ${filename}:${Conversions.generateKeyString(entry.key.type, entry.key.group, entry.key.instance)}`, e);
                }
            }
        })
    });
    let duplicatedCount = 0;
    resourceMap.forEach((value: Array<TuningData>, key: string) => {
        if (value.length > 1) {
            duplicatedCount++
            const typeKey = key.substr(0, 8);
            logger.debug(`\n${TuningResourceType[parseInt(typeKey,16)]}: ${key} ${value[0].name}`);
            value.forEach(tuningData => {
                console.log(`${tuningData.filename}`);
            });
        }
    });
    console.log(`\nFound ${duplicatedCount} duplicated tuning resources`);
}

export function findDuplicateTuningFiles(filepath: string) {
    const includeFiles = new Array<any>();
    dirTree(filepath,
        {extensions: /\.package/}, (item: any, _PATH: any, _stats: any) => {
            includeFiles.push(item)
        });
    findDuplicates(includeFiles.map(a => a.path));
}

