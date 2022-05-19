import { Package } from "@s4tk/models";
import {getBuffer, savePackage} from "./packages";

export function mergePackages(packages:Array<Package>): Package {
    const pkg = new Package();
    packages.forEach(donorPackage => {
        //const entries = donorPackage.entries.filter(entry => {!entry.value.isXml()});
        pkg.addAll(donorPackage.entries);
    })
    return pkg;
}

export function mergePackageFilesToPath(packagePaths:Array<string>, outputPath:string) {
    const donorBuffers = packagePaths.map<Package>(path => Package.from(getBuffer(path)) );
    const targetPackage = mergePackages(donorBuffers);
    savePackage(targetPackage, outputPath);
}
