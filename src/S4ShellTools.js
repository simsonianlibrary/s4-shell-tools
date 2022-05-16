#!/usr/bin/env ts-node
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.S4ShellTools = void 0;
var commander_ts_1 = require("commander-ts");
var printStrings_1 = require("./lib/printStrings");
var printStringCounts_1 = require("./lib/printStringCounts");
var findDuplicates_1 = require("./lib/findDuplicates");
var buildPackage_1 = require("./lib/buildPackage");
var log4js_1 = __importDefault(require("log4js"));
var util_1 = require("./lib/util");
var logger = log4js_1["default"].getLogger();
logger.level = "info";
var S4ShellTools = (function () {
    function S4ShellTools() {
    }
    S4ShellTools.prototype.run = function () {
        console.log("run");
    };
    S4ShellTools.prototype['ls-strings'] = function (sourcePath, outputFile) {
        console.log("Listing Strings in: ".concat(sourcePath));
        console.log("Output File: ".concat(outputFile));
        (0, printStrings_1.printStrings)(sourcePath);
    };
    S4ShellTools.prototype['string-summary'] = function (sourcePath) {
        console.log("Listing Strings in: ".concat(sourcePath));
        (0, printStringCounts_1.printStringCounts)(sourcePath);
    };
    S4ShellTools.prototype['find-duplicate-tuning'] = function (sourcePath) {
        console.log("Looking for duplicated tuning resources in: ".concat(sourcePath));
        (0, findDuplicates_1.findDuplicateTuningFiles)(sourcePath);
    };
    S4ShellTools.prototype.build = function (buildConfigPath) {
        console.log("Building Project: ".concat(buildConfigPath));
        (0, buildPackage_1.build)(buildConfigPath);
        console.log('Done Building Project');
    };
    S4ShellTools.prototype['add-string'] = function (stringsTxt, textContents) {
        (0, util_1.appendNewString)(stringsTxt, textContents);
    };
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('sourcePath')),
        __param(1, (0, commander_ts_1.optionalArg)('outputFile'))
    ], S4ShellTools.prototype, "ls-strings");
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('sourcePath'))
    ], S4ShellTools.prototype, "string-summary");
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('sourcePath'))
    ], S4ShellTools.prototype, "find-duplicate-tuning");
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('buildConfigPath'))
    ], S4ShellTools.prototype, "build");
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('stringsTxt')),
        __param(1, (0, commander_ts_1.requiredArg)('textContents'))
    ], S4ShellTools.prototype, "add-string");
    S4ShellTools = __decorate([
        (0, commander_ts_1.program)(),
        (0, commander_ts_1.version)('1.0.0'),
        (0, commander_ts_1.description)('Prints the English Strings in a Package'),
        (0, commander_ts_1.usage)('--help')
    ], S4ShellTools);
    return S4ShellTools;
}());
exports.S4ShellTools = S4ShellTools;
var s4modtools = new S4ShellTools();
//# sourceMappingURL=S4ShellTools.js.map