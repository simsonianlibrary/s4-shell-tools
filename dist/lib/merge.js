"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeTarget = void 0;
var models_1 = require("@s4tk/models");
var hashing_1 = require("@s4tk/hashing");
var packages_1 = require("./packages");
var enums_1 = require("@s4tk/models/enums");
var uuid_1 = require("uuid");
var multimaps_1 = require("@teppeis/multimaps");
var setHighByte = enums_1.StringTableLocale.setHighByte;
var getLocale = enums_1.StringTableLocale.getLocale;
var log4js_1 = __importDefault(require("log4js"));
var logger = log4js_1.default.getLogger();
var MergeTarget = (function () {
    function MergeTarget(project, data) {
        this.project = project;
        this.name = data.name;
        this.combineStrings = data.combineStrings;
        this.stblId = data.stblId;
        this.stblHashKey = data.stblHashKey;
        this.files = data.files;
    }
    MergeTarget.prototype.mergePackageFilesToPath = function (packagePaths, outputPath, aggregateStringTables) {
        logger.debug("--combineStrings == ".concat(aggregateStringTables));
        var donorBuffers = packagePaths.map(function (path) { return models_1.Package.from((0, packages_1.getBuffer)(path)); });
        var targetPackage = this.mergePackages(donorBuffers, aggregateStringTables);
        var duplicateKeys = targetPackage.findRepeatedKeys();
        if (duplicateKeys === null || duplicateKeys === void 0 ? void 0 : duplicateKeys.length) {
            throw (new Error("DUPLICATE TUNING RESOURCES FOUND: ".concat(duplicateKeys)));
        }
        (0, packages_1.savePackage)(targetPackage, outputPath);
    };
    MergeTarget.prototype.mergePackages = function (packages, aggregateStringTables) {
        var _this = this;
        var pkg = new models_1.Package();
        if (aggregateStringTables) {
            var stringResources_1 = new Array();
            packages.forEach(function (donorPackage) {
                var nonStringResources = _this.filterStringTables(donorPackage, false);
                stringResources_1 = stringResources_1.concat(_this.filterStringTables(donorPackage, true));
                pkg.addAll(nonStringResources);
            });
            stringResources_1 = this.mergeStringResourcesByLanguage(stringResources_1);
            pkg.addAll(stringResources_1);
        }
        else {
            packages.forEach(function (donorPackage) {
                pkg.addAll(donorPackage.entries);
            });
        }
        return pkg;
    };
    MergeTarget.prototype.mergeStringResourcesByLanguage = function (stringResources) {
        var _this = this;
        var newStringTableId = (0, hashing_1.fnv64)((0, uuid_1.v4)(), true);
        var stringMap = new multimaps_1.ArrayMultimap();
        stringResources.forEach(function (stringEntry) {
            var localeCode = getLocale(stringEntry.key.instance);
            for (var _i = 0, _a = stringEntry.value.entries; _i < _a.length; _i++) {
                var entry = _a[_i];
                stringMap.put(localeCode, entry);
            }
        });
        var stblList = new Array();
        Array.from(stringMap.keys()).forEach(function (localeCode) {
            var stringEntries = stringMap.get(localeCode);
            var stbl = new models_1.StringTableResource();
            stbl.addAll(stringEntries);
            stbl = _this.removeDuplicateStrings(stbl);
            var stblId = setHighByte(localeCode, newStringTableId);
            var resourceKeyPair = {
                key: { type: enums_1.BinaryResourceType.StringTable, group: 0x00000000, instance: stblId },
                value: stbl
            };
            stblList.push(resourceKeyPair);
        });
        var enStrings = this.getStringTableByLocale(stblList, enums_1.StringTableLocale.English);
        var allNonEnLocaleCodes = Object.values(enums_1.StringTableLocale).filter(function (val) { return (val != 0 && !isNaN(Number(val))); });
        if (enStrings) {
            allNonEnLocaleCodes.forEach(function (localeCode) {
                var nonEnStbl = _this.getStringTableByLocale(stblList, localeCode);
                if (!nonEnStbl) {
                    var emptyStbl = new models_1.StringTableResource();
                    var instId = setHighByte(localeCode, newStringTableId);
                    var newStblKey = {
                        type: enums_1.BinaryResourceType.StringTable,
                        group: 0,
                        instance: instId
                    };
                    nonEnStbl = { key: newStblKey, value: emptyStbl };
                }
                enStrings.value.entries.forEach(function (stringEntry) {
                    if (!nonEnStbl.value.entries.find(function (nonEnStbl) { return nonEnStbl.key == stringEntry.key; })) {
                        nonEnStbl.value.add(stringEntry.key, stringEntry.value);
                    }
                });
            });
        }
        return stblList;
    };
    MergeTarget.prototype.getStringTableByLocale = function (stringTables, locale) {
        return stringTables.find(function (resourceKeyPair) {
            return getLocale(resourceKeyPair.key.instance) == locale;
        });
    };
    MergeTarget.prototype.removeDuplicateStrings = function (stringTable) {
        var entriesKeys = new Set(stringTable.entries.map(function (entry) { return entry.key; }));
        var newStbl = new models_1.StringTableResource();
        Array.from(entriesKeys).forEach(function (key) {
            var uniqueEntry = stringTable.getByKey(key);
            newStbl.add(key, uniqueEntry.value);
        });
        return newStbl;
    };
    MergeTarget.prototype.filterStringTables = function (pkg, include) {
        return models_1.Package.extractResources(pkg.getBuffer(), {
            resourceFilter: function (type, _group, _inst) {
                if (include) {
                    return type === enums_1.BinaryResourceType.StringTable;
                }
                else {
                    return type !== enums_1.BinaryResourceType.StringTable;
                }
            }
        });
    };
    return MergeTarget;
}());
exports.MergeTarget = MergeTarget;
//# sourceMappingURL=merge.js.map