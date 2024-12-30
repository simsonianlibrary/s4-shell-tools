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

import {Package} from "@s4tk/models";
import {PackageService} from "./packageService";
import {ResourceKeyPair} from "@s4tk/models/types";
import log4js from "log4js";
import {StblService} from "./stblService";
import {autoInjectable} from "tsyringe";
import {MergeTarget} from "../model/types";
import {BuildFile} from "../model/buildFile";
import {FileService} from "./fileService";

const logger = log4js.getLogger();



@autoInjectable()
export class MergeService {
    packageService: PackageService;
    stblService: StblService;
    fileService: FileService;

    constructor(packageService?: PackageService,
                stblService?: StblService,
                fileService?: FileService) {
        this.packageService = packageService;
        this.stblService = stblService;
        this.fileService = fileService;
    }
    public mergeTargets(buildFile:BuildFile): void {
        buildFile.getMerges().forEach(mergeTargetData => {
            const mergeTarget = new MergeTarget(mergeTargetData);
            const outputFile = buildFile.resolveOutputPath(mergeTarget.name);
            const sourcePaths = this.fileService.globsToFiles(buildFile,mergeTargetData.files);

            // const sourcePaths = mergeTargetData.files.map<string>(filename => buildFile.resolveProjectPath(filename))
            this.mergePackageFilesToPath(sourcePaths, outputFile, mergeTarget.combineStrings);
        })

    }
    public mergePackageFilesToPath(packagePaths:Array<string>, outputPath:string,aggregateStringTables:boolean) {
        logger.debug(`--combineStrings == ${aggregateStringTables}`)
        const sourceBuffers = packagePaths.map<Package>(path => Package.from(this.packageService.getBuffer(path)) );
        const targetPackage = this.mergePackages(sourceBuffers, aggregateStringTables);
        const duplicateKeys = targetPackage.findRepeatedKeys();
        if(duplicateKeys?.length) {
            duplicateKeys.forEach( (key) => {
                logger.error(`Duplicate Key Found: ${key.instance.toString()}`)
            });
            throw(new Error(`DUPLICATE TUNING RESOURCES FOUND: ${duplicateKeys}`))
        }
        this.packageService.savePackage(targetPackage, outputPath);
    }

    private mergePackages(packages:Array<Package>, aggregateStringTables:boolean): Package {
        const pkg = new Package();
        // I seem to be getting the same resulting package whether this flag is set or not. Not sure why, however.
        if (aggregateStringTables) {
            let stringResources:Array<ResourceKeyPair> = new Array<ResourceKeyPair>();
            packages.forEach(sourcePackage => {
                const nonStringResources = this.stblService.filterStringTables(sourcePackage,false);
                stringResources = stringResources.concat(this.stblService.filterStringTables(sourcePackage,true));
                pkg.addAll(nonStringResources);
            });
            stringResources = this.stblService.mergeStringResourcesByLanguage(stringResources);
            pkg.addAll(stringResources);
        } else {
            packages.forEach(sourcePackage => {
                pkg.addAll(sourcePackage.entries);
            });
        }
        return pkg;
    }


}
