"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStringsInPackage = exports.printStringCountsInPackage = exports.dumpStrings = exports.stblToProperties = exports.buildStringsPackage = exports.parseStringsTextFile = void 0;
var types_1 = require("./types");
var fs_1 = __importDefault(require("fs"));
var models_1 = require("@s4tk/models");
var enums_1 = require("@s4tk/models/enums");
var util_1 = require("./util");
var log4js_1 = __importDefault(require("log4js"));
var packages_1 = require("./packages");
var properties_reader_1 = __importDefault(require("properties-reader"));
var conversions_1 = require("./conversions");
var logger = log4js_1.default.getLogger();
function parseStringsTextFile(filename) {
    logger.debug("opening strings file: ".concat(filename));
    var file = fs_1.default.readFileSync(filename, { encoding: 'utf8' });
    var lines = file.split('\n').filter(function (l) { return l; });
    return lines.flatMap(function (line) {
        var columns = line.split('=', 1);
        if (columns.length != 2) {
            logger.warn("Skipping malformatted line: ".concat(line));
            return [];
        }
        var entryData = new types_1.StringTextFileEntry(columns[0], columns[1]);
        return [entryData];
    });
}
exports.parseStringsTextFile = parseStringsTextFile;
function buildStringsPackage(outputPath, propertyFilePaths, overrideInstanceId) {
    if (overrideInstanceId === void 0) { overrideInstanceId = null; }
    logger.debug("-- buildStringsPackage:Start");
    try {
        var packageFile_1 = new models_1.Package();
        propertyFilePaths = propertyFilePaths.filter(function (path) { return path.endsWith('.properties'); });
        logger.trace("Strings files: ".concat(propertyFilePaths));
        propertyFilePaths.forEach(function (propertyFilePath) {
            var mergedStbl = new models_1.StringTableResource();
            var properties = (0, properties_reader_1.default)(propertyFilePath);
            properties.each(function (key, value) {
                mergedStbl.add(parseInt(key, 16), value.toString());
            });
            var instanceId;
            if (overrideInstanceId) {
                instanceId = overrideInstanceId;
            }
            else {
                instanceId = conversions_1.Conversions.numToHex64Str((0, util_1.parseKeyFromPath)(propertyFilePath).instance);
            }
            var resourceKey = {
                type: enums_1.BinaryResourceType.StringTable,
                group: parseInt('80000000', 16),
                instance: conversions_1.Conversions.strToBigInt(instanceId)
            };
            logger.trace("adding STBL : ".concat(conversions_1.Conversions.keyToString(resourceKey)));
            packageFile_1.add(resourceKey, mergedStbl);
        });
        logger.trace("writing strings package to disk");
        var packageBuffer = packageFile_1.getBuffer();
        fs_1.default.writeFileSync(outputPath, packageBuffer);
    }
    catch (e) {
        logger.error("buildStringsPackage:ERROR:".concat(e));
    }
    logger.debug("-- buildStringsPackage:Done");
}
exports.buildStringsPackage = buildStringsPackage;
function extractTable(stringTable, key) {
    var rows = new Array();
    logger.debug("STBL ".concat(conversions_1.Conversions.toHex(key.instance), " has ").concat(stringTable.size, " strings"));
    for (var _i = 0, _a = stringTable.entries; _i < _a.length; _i++) {
        var entry = _a[_i];
        rows.push([conversions_1.Conversions.numToStblRef(entry.key), entry.value].join('='));
    }
    return rows;
}
function stblToProperties(keyPair) {
    var stringTable = keyPair.value;
    var key = keyPair.key;
    var lines = extractTable(stringTable, key);
    return lines.join('\n');
}
exports.stblToProperties = stblToProperties;
function dumpStrings(filename, outputDirectory) {
    var stringTables = models_1.Package.extractResources((0, packages_1.getBuffer)(filename), {
        resourceFilter: function (type, _group, _inst) {
            return type === enums_1.BinaryResourceType.StringTable;
        }
    });
    logger.info("Found ".concat(stringTables.length, " STBL resources"));
    for (var _i = 0, stringTables_1 = stringTables; _i < stringTables_1.length; _i++) {
        var keyPair = stringTables_1[_i];
        var output = stblToProperties(keyPair);
        var stblFilename = (0, util_1.generateS4SResourceFilename)(enums_1.BinaryResourceType.StringTable, 80000000, keyPair.key.instance);
        var outfile = "".concat(outputDirectory, "/").concat(stblFilename, ".properties");
        fs_1.default.writeFileSync(outfile, output);
    }
}
exports.dumpStrings = dumpStrings;
function printStringCountsInPackage(filename) {
    var stringTables = models_1.Package.extractResources((0, packages_1.getBuffer)(filename), {
        resourceFilter: function (type, _group, _inst) {
            return type === enums_1.BinaryResourceType.StringTable;
        }
    });
    logger.info("Found ".concat(stringTables.length, " STBL resources"));
    console.log('InstanceKey       \tLanguage         \tStringCount');
    console.log('==================\t=================\t===========');
    for (var _i = 0, stringTables_2 = stringTables; _i < stringTables_2.length; _i++) {
        var entry = stringTables_2[_i];
        var stringTable = entry.value;
        console.log([
            conversions_1.Conversions.toHex(entry.key.instance),
            (0, util_1.LocaleName)(entry.key.instance).padEnd(17, ' '),
            stringTable.size
        ].join('\t'));
    }
}
exports.printStringCountsInPackage = printStringCountsInPackage;
function printStringsInPackage(filename) {
    var stringTables = models_1.Package.extractResources((0, packages_1.getBuffer)(filename), {
        resourceFilter: function (type, _group, _inst) {
            return type === enums_1.BinaryResourceType.StringTable;
        }
    });
    logger.info("Found ".concat(stringTables.length, " STBL resources"));
    for (var _i = 0, stringTables_3 = stringTables; _i < stringTables_3.length; _i++) {
        var keyPair = stringTables_3[_i];
        var stringTable = keyPair.value;
        var key = keyPair.key;
        printTable(stringTable, key);
    }
}
exports.printStringsInPackage = printStringsInPackage;
function printTable(stringTable, key) {
    logger.info("STBL ".concat(conversions_1.Conversions.toHex(key.instance), " has ").concat(stringTable.size, " strings"));
    for (var _i = 0, _a = stringTable.entries; _i < _a.length; _i++) {
        var entry = _a[_i];
        console.log("".concat(conversions_1.Conversions.numToStblRef(entry.key), "<!--").concat(entry.value, "-->"));
    }
}
//# sourceMappingURL=strings.js.map