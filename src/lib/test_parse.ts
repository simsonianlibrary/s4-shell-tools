import {toHex, toHex32} from "./util";
import log4js from "log4js";
import {Package, StringTableResource} from "@s4tk/models";
import * as hashing from "@s4tk/hashing"
import fs from "fs";
import {v4 as uuidv4} from 'uuid';
import {BinaryResourceType, TuningResourceType} from "@s4tk/models/enums";
import {ResourceKey} from "@s4tk/models/types";
import {ParseStringsTextFile} from "./strings";

const logger = log4js.getLogger();

// function createNewStblPath() {
//     let myuuid = uuidv4();
//     let stblHash = hashing.fnv32(myuuid, true)
//     return `${toHex32(BinaryResourceType.StringTable).slice(2)}!80000000!${toHex(stblHash).slice(2)}.English.StringTable.binary`;
// }
//
// const entries = ParseStringsTextFile('strings.properties');
// function appendNewString(stringFile:string, textContents:string) {
//     let myuuid = uuidv4();
//     let stblHash = hashing.fnv32(myuuid, true)
//     let stringFileLine = `${toHex32(stblHash)}<!--${textContents}-->\n`;
//
//     fs.appendFileSync(stringFile, stringFileLine);
// }
// appendNewString('build/teststrings.txt','this is a new message');
