import { Package, StringTableResource } from "@s4tk/models";
import {BinaryResourceType, StringTableLocale} from "@s4tk/models/enums";
import {getBuffer, LocaleName, toHex} from "./util";




export function printStringCounts(filename: string) {
  const stringTables = Package.extractResources(getBuffer(filename), {
    resourceFilter(type, group, inst) {
      return type === BinaryResourceType.StringTable;
    }
  });

  console.log(`Found ${stringTables.length} STBL resources`)
  console.log('InstanceKey       \tLanguage         \tStringCount');
  console.log('==================\t=================\t===========');
  
  for(const entry of stringTables) {
    const stringTable = entry.value as StringTableResource;
    console.log([
      toHex(entry.key.instance),
      LocaleName(entry.key.instance).padEnd(17,' '),
      stringTable.size].join('\t'));
  }
}

