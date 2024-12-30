import {ResourceKey, ResourceKeyPair} from "@s4tk/models/types";
import {XmlDocumentNode} from "@s4tk/xml-dom";
import {SimDataGroup, TuningResourceType} from "@s4tk/models/enums";
import log4js from "log4js";
import {fnv32, fnv64} from "@s4tk/hashing";
import {is32BitSchema} from "../util";
import {SimDataResource, XmlResource} from "@s4tk/models";
import {SimDataReference} from "../model/types";
import {autoInjectable} from "tsyringe";
import {FileService} from "./fileService";

const logger = log4js.getLogger();

/**
 * The ResourceKeyService is responsible for generating the type, group and instance ID for tuning and simdata files
 * based on their XML contents. Since there's no way to be sure what group value to use for SimData by just looking at
 * the SimData file, this class makes two passes over the tuning.
 *
 * One pass caches all the tuning files, and another iterates over the SimData files, looking up the corresponding
 * instance ID from the tuning files, and using the tuning file's instance class to calculate the group value for the
 * SimData file. SimData files without a corresponding tuning file with the same ID are considered errors and halt
 * the build process.
 */
@autoInjectable()
export class ResourceKeyService {
    fileService: FileService;

    constructor(fileService?: FileService) {
        this.fileService = fileService;
    }

    /**
     * Builds a TuningFileCache map of the tuning and SimData files used to build a mod.
     *
     * @param filePaths list of tuning and simdata XML files
     */
    public buildTuningMap(filePaths: string[]): TuningFileCache  {
        const tuningFileCache:TuningFileCache = new TuningFileCache();

        filePaths.forEach(filePath => {
            if (filePath.endsWith(".xml")) {
                this.parseTuningResourceKey(tuningFileCache,filePath);
            }
        });
        // makes another pass over the simData references to:
        // * look up the tuning entry with the same instance id
        // * get the correct SimDataGroup value for the tuning entry's instance class
        for (const entry of Array.from(tuningFileCache.getSimDataMap().entries())){
            const key = entry[0];
            const dataReference = entry[1];

            // for each simData, look for the corresponding tuning (same ID) and use the
            // type of the tuning to determine the group for the simData
            // look up the sim data group for the tuning file's type
            const groupId = this.getSimDataGroupForInstance(tuningFileCache, key);
            if (groupId) {
                const resourceKeyPair = dataReference.resourceKeyPair;
                // update the group with the correct value
                resourceKeyPair.key.group = groupId;
                resourceKeyPair.value = tuningFileCache.getSimDataMap().get(key).resourceKeyPair.value;
                tuningFileCache.addSimDataResource(resourceKeyPair.key.instance, dataReference);
            } else {
                throw (new Error(`No tuning file found for SimData: ${key}: ${dataReference.filepath}`))
            }
        }
        return tuningFileCache;
    }

    private getSimDataGroupForInstance(tuningFileCache:TuningFileCache, instance: BigInt):number {
            const tuningKeyPair = tuningFileCache.getTuningMap().get(instance);
            if (tuningKeyPair) {
                // look up the sim data group for the tuning file's type
                return SimDataGroup.getForTuning(tuningKeyPair.key.type);
            }
            return 0;
    }
    /**
     * parseTuningResourceKey looks at the XML of a file and determines whether it is a tuning file or a SimData file.
     * It then routes it through the appropriate import method where it is cached.
     *
     * @param tuningFileCache TuningFileCache used to track the build process
     * @param filepath path of the file on disk
     * @private
     */
    private parseTuningResourceKey(tuningFileCache: TuningFileCache, filepath: string): void {
        logger.trace(`Parsing resource key from: ${filepath}`);

        if (filepath.endsWith(".xml")) {
            const file = this.fileService.readString(filepath);

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

    /**
     * Import a tuning XML file. This is cached to refer to later if it goes with a SimData file.
     *
     * @param tuningFileCache TuningFileCache used to track the build process
     * @param docNode top level XML document node for the tuning file
     * @param filepath path of the file on disk, used when reporting errors
     * @param file XML contents of the SimData file.
     * @private
     */
    private importTuningFile(tuningFileCache: TuningFileCache,docNode: XmlDocumentNode, filepath: string, file: string): void {
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
        tuningFileCache.addTuningResource(resourceKey.instance, entry);
    }

    /**
     * importSimDataFile caches SimData XML files and sets their group ID to zero upon import. Once all files are cached,
     * the SimData are iterated over, and for each one, the tuning XML with the same instance ID (calculated via FNV
     * of the name field in the SimData) is used to calculate the correct SimDataGroup.
     *
     * @param tuningFileCache TuningFileCache used to track the build process
     * @param docNode top level XML document node for the SimData file
     * @param filepath path of the file on disk, used when reporting errors
     * @param file XML contents of the SimData file.
     * @private
     */
    private importSimDataFile(tuningFileCache: TuningFileCache, docNode: XmlDocumentNode, filepath: string, file: string): void {
        const name = docNode.child.child.child.attributes.name
        const schema = docNode.child.child.child.attributes.schema

        const instance = is32BitSchema(schema) ? BigInt(fnv32(name, true)): fnv64(name, true);
        const typeCode = 0x545AC67A;
        // set the group to 0 for now. Later code iterates over these simdatas, looking for associated
        // tuning files with the same ID to get the actual class, which is then used to get the group ID.
        const resourceKey: ResourceKey = {type:typeCode, group: 0x00000000, instance:instance} as ResourceKey;
        const dataResource = SimDataResource.fromXml(file)
        const entry = {key: resourceKey, value: dataResource} as ResourceKeyPair;
        const dataRef = new SimDataReference(instance, filepath,entry);
        tuningFileCache.addSimDataResource(instance as bigint,dataRef)
    }
}

/**
 * private cache class used to track the tuning data for a build process.
 */
class TuningFileCache {
    _tuningMap: Map<BigInt, ResourceKeyPair>  = new Map<BigInt, ResourceKeyPair>();
    _simDataMap: Map<BigInt,SimDataReference> = new Map<BigInt, SimDataReference>();

    constructor() {
        this._tuningMap = new Map<BigInt, ResourceKeyPair>();
        this._simDataMap = new Map<BigInt, SimDataReference>();
    }
    public addTuningResource(instanceId:BigInt, resourceKeyPair:ResourceKeyPair):void {
        this._tuningMap.set(instanceId,resourceKeyPair);
    }
    public addSimDataResource(instanceId:BigInt, simDataReference:SimDataReference):void {
        this._simDataMap.set(instanceId,simDataReference);
    }
    public getTuningMap() : Map<BigInt, ResourceKeyPair> {
        return this._tuningMap
    }
    public getSimDataMap() : Map<BigInt, SimDataReference> {
        return this._simDataMap
    }

}