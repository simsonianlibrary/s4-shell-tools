import { Package, StringTableResource } from "@s4tk/models";
import { BinaryResourceType } from "@s4tk/models/enums";
import { getBuffer, toHex, toHex32} from './util'
import {ResourceKey} from "@s4tk/models/types";


function printTable(stringTable:StringTableResource, key:ResourceKey) {
  console.log(`STBL ${toHex(key.instance)} has ${stringTable.size} strings`);
  for (const entry of stringTable.entries) {
    console.log(`${toHex32(entry.key)}<!--${entry.value}-->`);
  }
}

export function printStrings(filename: string) {
  const stringTables = Package.extractResources(getBuffer(filename), {
    resourceFilter(type, _group, _inst) {
      return type === BinaryResourceType.StringTable;
    }
  });
  console.log(`Found ${stringTables.length} STBL resources`)
  for (const keyPair of stringTables) {
    const stringTable = keyPair.value as StringTableResource;
    const key = keyPair.key;
    printTable(stringTable,key);
  }
}

