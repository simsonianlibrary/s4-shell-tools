import {ResourceKey, ResourceKeyPair} from "@s4tk/models/types";
import {readFileSync} from "fs";
import {XmlDocumentNode} from "@s4tk/xml-dom";
import {SimDataGroup, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import {fnv64, fnv32} from "@s4tk/hashing";
import {is32BitSchema} from "./util";
import {SimDataResource, XmlResource} from "@s4tk/models";

const logger = log4js.getLogger();

class SimDataReference {
    filepath: string;
    id:bigint;
    resourceKeyPair: ResourceKeyPair;
    constructor(id: bigint, filepath: string, resourceKeyPair: ResourceKeyPair) {
        this.filepath = filepath;
        this.id = id;
        this.resourceKeyPair = resourceKeyPair;

    }

}
export class ResourceKeyService {
    tuningMap: Map<BigInt, ResourceKeyPair>  = new Map<BigInt, ResourceKeyPair>();
    simDataMap: Map<BigInt,SimDataReference> = new Map<BigInt, SimDataReference>();

    constructor() {
        this.tuningMap = new Map<BigInt, ResourceKeyPair>();
        this.simDataMap = new Map<BigInt, SimDataReference>();
    }
    buildTuningMap(filePaths: string[]): Map<BigInt, ResourceKeyPair>  {
        filePaths.forEach(filePath => {
            if (filePath.endsWith(".xml")) {
                this.parseTuningResourceKey(filePath);
            }
        });
        // makes another pass over the simData references to:
        // * look up the tuning entry with the same instance id
        // * get the correct SimDataGroup value for the tuning entry's instance class
        for (let entry of Array.from(this.simDataMap.entries())){
            let key = entry[0];
            let dataReference = entry[1];

            // for each simData, look for the corresponding tuning (same ID) and use the
            // type of the tuning to determine the group for the simData
            let tuningKeyPair = this.tuningMap.get(key);
            if (tuningKeyPair) {
                // look up the sim data group for the tuning file's type
                let groupId = SimDataGroup.getForTuning(tuningKeyPair.key.type);
                let resourceKeyPair = dataReference.resourceKeyPair;
                // update the group with the correct value
                resourceKeyPair.key.group = groupId;
                resourceKeyPair.value = this.simDataMap.get(key).resourceKeyPair.value;
                this.simDataMap.set(resourceKeyPair.key.instance,dataReference);
            } else {
                throw(new Error(`No tuning file found for SimData: ${key}: ${dataReference.filepath}`))
            }
        }
        return this.tuningMap;
    }

    parseTuningResourceKey(filepath: string): void {
        logger.trace(`Parsing resource key from: ${filepath}`);

        if (filepath.endsWith(".xml")) {
            const file = readFileSync(filepath, 'utf-8');

            let docNode = XmlDocumentNode.from(file);
            if (docNode.child.tag == 'I') {
                this.importTuningFile(docNode,filepath, file);
            } else if (docNode.child.tag == 'SimData' ) {
                this.importSimDataFile(docNode,filepath, file);
            } else {
                logger.warn(`Ignoring non-tuning file: ${filepath}`);
            }
        }
    }
    // import a Sims 4 tuning file
    importTuningFile(docNode: XmlDocumentNode, filepath: string, file: string): void {
        let name = docNode.child.attributes.n
        let instanceClass = docNode.child.attributes.i;
        if(!name) {
            throw(new Error(`name attribute not found: ${filepath}`))
        }
        let typeCode: TuningResourceType = TuningResourceType.parseAttr(instanceClass);
        let scriptClass: string = docNode.child.attributes.c;
        let instance: bigint = is32BitSchema(scriptClass) ? BigInt(fnv32(name,true)): fnv64(name,true);
        let resourceKey: ResourceKey = {type:typeCode, group:0x00000000, instance:instance} as ResourceKey;
        let xmlResource = new XmlResource(file);
        let entry = {key:resourceKey, value:xmlResource} as ResourceKeyPair;
        this.tuningMap.set(resourceKey.instance, entry);
    }
    // import a SimData XML definition
    importSimDataFile(docNode: XmlDocumentNode, filepath: string, file: string): void {
        let name = docNode.child.child.child.attributes.name
        let schema = docNode.child.child.child.attributes.schema

        let instance = is32BitSchema(schema) ? BigInt(fnv32(name, true)): fnv64(name, true);
        let typeCode = 0x545AC67A;
        // set the group to 0 for now. Later code iterates over the simdatas, looking for associated
        // tuning files with the same ID to get the actual class to use to get the group ID.
        let resourceKey: ResourceKey = {type:typeCode, group: 0x00000000, instance:instance} as ResourceKey;
        let dataResource = SimDataResource.fromXml(file)
        let entry = {key: resourceKey, value: dataResource} as ResourceKeyPair;
        let dataRef = new SimDataReference(instance, filepath,entry);
        this.simDataMap.set(instance as bigint,dataRef)
    }
}