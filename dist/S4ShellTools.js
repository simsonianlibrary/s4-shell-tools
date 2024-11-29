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
Object.defineProperty(exports, "__esModule", { value: true });
exports.S4ShellTools = void 0;
var commander_ts_1 = require("commander-ts");
var scan_1 = require("./lib/scan");
var build_1 = require("./lib/build");
var merge_1 = require("./lib/merge");
var log4js_1 = __importDefault(require("log4js"));
var strings_1 = require("./lib/strings");
var path_1 = __importDefault(require("path"));
var logger = log4js_1.default.getLogger();
logger.level = "trace";
var S4ShellTools = (function () {
    function S4ShellTools() {
        this.debug = false;
        this.trace = false;
    }
    S4ShellTools.prototype.run = function () {
    };
    S4ShellTools.prototype.build = function () {
        var _a;
        var options = this.opts();
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        var config = options.config ? options.config : "./build.yml";
        var projectPath = path_1.default.resolve(process.cwd(), config);
        logger.info("Building Project: ".concat(projectPath));
        (0, build_1.build)(projectPath);
        logger.info('Done Building Project');
    };
    S4ShellTools.prototype.merge = function (packagePaths) {
        var _a;
        var options = this.opts();
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        var output = options.output ? options.output : "./build";
        var mergeData = {
            name: output,
            files: packagePaths,
            combineStrings: options.combineStrings
        };
        var mergeTarget = new merge_1.MergeTarget(null, mergeData);
        mergeTarget.mergePackageFilesToPath(packagePaths, output, options.combineStrings);
    };
    S4ShellTools.prototype['dump-strings'] = function (packageFile) {
        var _a;
        var options = this.opts();
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        var output = options.output ? options.output : "./build";
        (0, strings_1.dumpStrings)(packageFile, output);
    };
    S4ShellTools.prototype['import-property-files'] = function (propertyFiles) {
        var _a;
        var options = this.opts();
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        var output = options.output ? options.output : "./build/strings.package";
        (0, strings_1.buildStringsPackage)(output, propertyFiles);
    };
    S4ShellTools.prototype['string-summary'] = function (sourcePath) {
        var _a;
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        logger.info("Listing entry counts per STBL in: ".concat(sourcePath));
        (0, strings_1.printStringCountsInPackage)(sourcePath);
    };
    S4ShellTools.prototype['find-duplicate-tuning'] = function (sourcePath) {
        var _a;
        setLogLevel((_a = this.parent) === null || _a === void 0 ? void 0 : _a.opts());
        logger.info("Looking for duplicated tuning resources in: ".concat(sourcePath));
        (0, scan_1.findDuplicateTuningFiles)(sourcePath);
    };
    __decorate([
        (0, commander_ts_1.option)('--debug')
    ], S4ShellTools.prototype, "debug", void 0);
    __decorate([
        (0, commander_ts_1.option)('--trace')
    ], S4ShellTools.prototype, "trace", void 0);
    __decorate([
        (0, commander_ts_1.command)(),
        (0, commander_ts_1.commandOption)('--config <configPath>')
    ], S4ShellTools.prototype, "build", null);
    __decorate([
        (0, commander_ts_1.command)(),
        (0, commander_ts_1.commandOption)('--combineStrings'),
        (0, commander_ts_1.commandOption)('--output <output>'),
        __param(0, (0, commander_ts_1.variadicArg)('packagePaths'))
    ], S4ShellTools.prototype, "merge", null);
    __decorate([
        (0, commander_ts_1.command)(),
        (0, commander_ts_1.commandOption)('--output <output>'),
        __param(0, (0, commander_ts_1.requiredArg)('packageFile'))
    ], S4ShellTools.prototype, "dump-strings", null);
    __decorate([
        (0, commander_ts_1.command)(),
        (0, commander_ts_1.commandOption)('--output <output>'),
        __param(0, (0, commander_ts_1.variadicArg)('propertyFiles'))
    ], S4ShellTools.prototype, "import-property-files", null);
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('sourcePath'))
    ], S4ShellTools.prototype, "string-summary", null);
    __decorate([
        (0, commander_ts_1.command)(),
        __param(0, (0, commander_ts_1.requiredArg)('sourcePath'))
    ], S4ShellTools.prototype, "find-duplicate-tuning", null);
    S4ShellTools = __decorate([
        (0, commander_ts_1.program)(),
        (0, commander_ts_1.version)('1.0.0'),
        (0, commander_ts_1.description)('Tools to build and manage a Sims 4 .package file'),
        (0, commander_ts_1.usage)('--help')
    ], S4ShellTools);
    return S4ShellTools;
}());
exports.S4ShellTools = S4ShellTools;
function setLogLevel(options) {
    var logLevel = (options === null || options === void 0 ? void 0 : options.trace) ? "TRACE" : ((options === null || options === void 0 ? void 0 : options.debug) ? "DEBUG" : "INFO");
    switch (logLevel.toUpperCase()) {
        case 'INFO':
            logger.level = "INFO";
            break;
        case 'DEBUG':
            logger.level = "DEBUG";
            break;
        case 'TRACE':
            logger.level = "TRACE";
            break;
        default:
            logger.warn("Unknown log level specified: ".concat(logLevel, ". Must be one of [INFO,DEBUG,TRACE]"));
    }
}
var s4shelltools = new S4ShellTools();
//# sourceMappingURL=S4ShellTools.js.map