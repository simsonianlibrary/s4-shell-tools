"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDuplicateTuningFiles = exports.findDuplicates = void 0;
var directory_tree_1 = __importDefault(require("directory-tree"));
var types_1 = require("./types");
var conversions_1 = require("./conversions");
var log4js_1 = __importDefault(require("log4js"));
var packages_1 = require("./packages");
var enums_1 = require("@s4tk/models/enums");
var logger = log4js_1.default.getLogger();
function findDuplicates(filenames) {
    var resourceMap = new Map();
    filenames.forEach(function (filename) {
        var packageFile = (0, packages_1.getPackage)(filename);
        packageFile.entries.forEach(function (entry) {
            if (entry.value.isXml()) {
                try {
                    var key = conversions_1.Conversions.generateKeyString(entry.key.type, entry.key.group, entry.key.instance);
                    var xml = entry.value;
                    var tuningName = xml.dom.children[0].name;
                    if (!resourceMap.get(key)) {
                        resourceMap.set(key, new Array());
                    }
                    var tuning = new types_1.TuningData(tuningName, filename, key);
                    resourceMap.get(key).push(tuning);
                }
                catch (e) {
                    console.error("Error parsing resource ".concat(filename, ":").concat(conversions_1.Conversions.generateKeyString(entry.key.type, entry.key.group, entry.key.instance)), e);
                }
            }
        });
    });
    var duplicatedCount = 0;
    resourceMap.forEach(function (value, key) {
        if (value.length > 1) {
            duplicatedCount++;
            var typeKey = key.substr(0, 8);
            logger.debug("\n".concat(enums_1.TuningResourceType[parseInt(typeKey, 16)], ": ").concat(key, " ").concat(value[0].name));
            value.forEach(function (tuningData) {
                console.log("".concat(tuningData.filename));
            });
        }
    });
    console.log("\nFound ".concat(duplicatedCount, " duplicated tuning resources"));
}
exports.findDuplicates = findDuplicates;
function findDuplicateTuningFiles(filepath) {
    var includeFiles = new Array();
    (0, directory_tree_1.default)(filepath, { extensions: /\.package/ }, function (item, _PATH, _stats) {
        includeFiles.push(item);
    });
    findDuplicates(includeFiles.map(function (a) { return a.path; }));
}
exports.findDuplicateTuningFiles = findDuplicateTuningFiles;
//# sourceMappingURL=scan.js.map