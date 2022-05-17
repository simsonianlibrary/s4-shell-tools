import {XmlResource} from "@s4tk/models";
import {toKeyString, TuningTypeCrosswalk} from './util'
// @ts-ignore
import dirTree from "directory-tree";
import {TuningData} from "./types";
// @ts-ignore
import log4js from "log4js";
import {getPackage} from "./packages";

const includeFiles = new Array<any>();
const logger = log4js.getLogger();


const resourceMap: Map<string, Array<TuningData>> = new Map<string, Array<TuningData>>();

export function findDuplicates(filenames: string[]) {
    filenames.forEach(filename => {
        const packageFile = getPackage(filename);
        packageFile.entries.forEach(entry => {
            if (entry.value.isXml()) {
                try {
                    const key = toKeyString(entry.key.type, entry.key.group, entry.key.instance);
                    const xml = entry.value as XmlResource;
                    const tuningName = (xml.dom.children[0] as any).name;
                    if (!resourceMap.get(key)) {
                        resourceMap.set(key, new Array<TuningData>());
                    }
                    const tuning = new TuningData(tuningName, filename, key);
                    resourceMap.get(key).push(tuning);
                } catch (e) {
                    console.error(`Error parsing resource ${filename}:${toKeyString(entry.key.type, entry.key.group, entry.key.instance)}`, e);
                }
            }
        })
    });
    let duplicatedCount = 0;
    resourceMap.forEach((value: Array<TuningData>, key: string) => {
        if (value.length > 1) {
            duplicatedCount++
            const typeKey = key.substr(0, 8);
            logger.debug(`\n${TuningTypeCrosswalk.get(typeKey)}: ${key} ${value[0].name}`);
            value.forEach(tuningData => {
                console.log(`${tuningData.filename}`);
            });
        }
    });
    console.log(`\nFound ${duplicatedCount} duplicated tuning resources`);
}

export function findDuplicateTuningFiles(filepath: string) {
    dirTree(filepath,
        {extensions: /\.package/}, (item: any, _PATH: any, _stats: any) => {
            includeFiles.push(item)
        });
    findDuplicates(includeFiles.map(a => a.path));
}

