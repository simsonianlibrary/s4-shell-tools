import {ResourceKey, ResourceKeyPair} from "@s4tk/models/types";
import {readFileSync} from "fs";
import {XmlDocumentNode} from "@s4tk/xml-dom";
import {SimDataGroup, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import {fnv32, fnv64} from "@s4tk/hashing";
import {is32BitSchema} from "./util";
import {SimDataResource, XmlResource} from "@s4tk/models";
import {SimDataReference} from "./types";
import {autoInjectable} from "tsyringe";

const logger = log4js.getLogger();

class TuningFileCache {
    tuningMap: Map<BigInt, ResourceKeyPair>  = new Map<BigInt, ResourceKeyPair>();
    simDataMap: Map<BigInt,SimDataReference> = new Map<BigInt, SimDataReference>();

    constructor() {
        this.tuningMap = new Map<BigInt, ResourceKeyPair>();
        this.simDataMap = new Map<BigInt, SimDataReference>();
    }
    getTuningMap() : Map<BigInt, ResourceKeyPair> {
        return this.tuningMap
    }
    getSimDataMap() : Map<BigInt, SimDataReference> {
        return this.simDataMap
    }

}
@autoInjectable()
export class ResourceKeyService {
    // tuningMap: Map<BigInt, ResourceKeyPair>  = new Map<BigInt, ResourceKeyPair>();
    // simDataMap: Map<BigInt,SimDataReference> = new Map<BigInt, SimDataReference>();

    constructor() {
        // this.tuningMap = new Map<BigInt, ResourceKeyPair>();
        // this.simDataMap = new Map<BigInt, SimDataReference>();
    }
    buildTuningMap(filePaths: string[]): TuningFileCache  {
        const tuningFileCache:TuningFileCache = new TuningFileCache();

        filePaths.forEach(filePath => {
            if (filePath.endsWith(".xml")) {
                this.parseTuningResourceKey(tuningFileCache,filePath);
            }
        });
        // makes another pass over the simData references to:
        // * look up the tuning entry with the same instance id
        // * get the correct SimDataGroup value for the tuning entry's instance class
        for (const entry of Array.from(tuningFileCache.simDataMap.entries())){
            const key = entry[0];
            const dataReference = entry[1];

            // for each simData, look for the corresponding tuning (same ID) and use the
            // type of the tuning to determine the group for the simData
            const tuningKeyPair = tuningFileCache.tuningMap.get(key);
            if (tuningKeyPair) {
                // look up the sim data group for the tuning file's type
                const groupId = SimDataGroup.getForTuning(tuningKeyPair.key.type);
                const resourceKeyPair = dataReference.resourceKeyPair;
                // update the group with the correct value
                resourceKeyPair.key.group = groupId;
                resourceKeyPair.value = tuningFileCache.simDataMap.get(key).resourceKeyPair.value;
                tuningFileCache.simDataMap.set(resourceKeyPair.key.instance,dataReference);
            } else {
                throw(new Error(`No tuning file found for SimData: ${key}: ${dataReference.filepath}`))
            }
        }
        return tuningFileCache;
    }

    parseTuningResourceKey(tuningFileCache: TuningFileCache, filepath: string): void {
        logger.trace(`Parsing resource key from: ${filepath}`);

        if (filepath.endsWith(".xml")) {
            const file = readFileSync(filepath, 'utf-8');

            const docNode = XmlDocumentNode.from(file);
            if (docNode.child.tag == 'I') {
                this.importTuningFile(tuningFileCache,docNode,filepath, file);
            } else if (docNode.child.tag == 'SimData' ) {
                this.importSimDataFile(tuningFileCache,docNode,filepath, file);
            } else {
                logger.warn(`Ignoring non-tuning file: ${filepath}`);
            }
        }
    }
    // import a Sims 4 tuning file
    importTuningFile(tuningFileCache: TuningFileCache,docNode: XmlDocumentNode, filepath: string, file: string): void {
        const name = docNode.child.attributes.n
        const instanceClass = docNode.child.attributes.i;
        if(!name) {
            throw(new Error(`name attribute not found: ${filepath}`))
        }
        const typeCode: TuningResourceType = TuningResourceType.parseAttr(instanceClass);
        const scriptClass: string = docNode.child.attributes.c;
        const instance: bigint = is32BitSchema(scriptClass) ? BigInt(fnv32(name,true)): fnv64(name,true);
        const resourceKey: ResourceKey = {type:typeCode, group:0x00000000, instance:instance} as ResourceKey;
        const xmlResource = new XmlResource(file);
        const entry = {key:resourceKey, value:xmlResource} as ResourceKeyPair;
        tuningFileCache.tuningMap.set(resourceKey.instance, entry);
    }
    // import a SimData XML definition
    importSimDataFile(tuningFileCache: TuningFileCache, docNode: XmlDocumentNode, filepath: string, file: string): void {
        const name = docNode.child.child.child.attributes.name
        const schema = docNode.child.child.child.attributes.schema

        const instance = is32BitSchema(schema) ? BigInt(fnv32(name, true)): fnv64(name, true);
        const typeCode = 0x545AC67A;
        // set the group to 0 for now. Later code iterates over the simdatas, looking for associated
        // tuning files with the same ID to get the actual class to use to get the group ID.
        const resourceKey: ResourceKey = {type:typeCode, group: 0x00000000, instance:instance} as ResourceKey;
        const dataResource = SimDataResource.fromXml(file)
        const entry = {key: resourceKey, value: dataResource} as ResourceKeyPair;
        const dataRef = new SimDataReference(instance, filepath,entry);
        tuningFileCache.simDataMap.set(instance as bigint,dataRef)
    }
}