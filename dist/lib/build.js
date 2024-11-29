"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildProject = exports.build = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var fast_glob_1 = __importDefault(require("fast-glob"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var log4js_1 = __importDefault(require("log4js"));
var models_1 = require("@s4tk/models");
var strings_1 = require("./strings");
var packages_1 = require("./packages");
var util_1 = require("./util");
var merge_1 = require("./merge");
var log = log4js_1.default.getLogger();
function build(configPath) {
    log.trace("PWD=".concat(process.env.PWD));
    try {
        var config = new BuildProject(configPath);
        config.buildProject();
    }
    catch (e) {
        log.error("Error building project:".concat(configPath, ": ").concat(e));
        console.log(e.stackTrace);
    }
}
exports.build = build;
var BuildProject = (function () {
    function BuildProject(configPath) {
        var data = (0, util_1.loadYamlFile)(configPath);
        this._outputDir = data.output;
        this._excludePatterns = data.exclude;
        this._packages = data.packages;
        this._stringPackages = data.strings;
        this._merges = data.merges;
        this._project = path_1.default.dirname(configPath);
        log.info("Project path: ".concat(this.getProject()));
    }
    BuildProject.prototype.getProject = function () {
        return this._project;
    };
    BuildProject.prototype.getOutputDirectory = function () {
        return path_1.default.resolve(this._project, this._outputDir);
    };
    BuildProject.prototype.resolveProjectPath = function (outputFilename) {
        return path_1.default.resolve(this.getProject(), outputFilename);
    };
    BuildProject.prototype.resolveOutputPath = function (outputFilename) {
        return path_1.default.resolve(this.getOutputDirectory(), outputFilename);
    };
    BuildProject.prototype.getExcludePatterns = function () {
        return this._excludePatterns ? this._excludePatterns : [];
    };
    BuildProject.prototype.getPackages = function () {
        return this._packages ? this._packages : [];
    };
    BuildProject.prototype.getStringPackages = function () {
        return this._stringPackages ? this._stringPackages : [];
    };
    BuildProject.prototype.getMerges = function () {
        return this._merges ? this._merges : [];
    };
    BuildProject.prototype.ensureBuildDirectory = function () {
        fs_extra_1.default.ensureDirSync(this.getOutputDirectory());
    };
    BuildProject.prototype.buildProject = function () {
        this.ensureBuildDirectory();
        log.debug("Packages: ".concat(JSON.stringify(this.getPackages())));
        log.info("buildProject:Start");
        this.buildPackages();
        this.buildStrings();
        this.mergePackages();
        log.info("buildProject:Done");
    };
    BuildProject.prototype.buildPackage = function (filepaths, outputPath) {
        log.debug("-- buildPackage:Start");
        try {
            var resources_1 = new Array();
            filepaths.forEach(function (filepath) {
                if ((0, util_1.canImportFile)(filepath)) {
                    var entry = (0, packages_1.makeResourceEntry)(filepath);
                    resources_1.push(entry);
                }
                else if (!filepath.endsWith('.properties')) {
                    log.warn("Cannot import file type: ".concat(filepath));
                }
            });
            log.trace("using build files:".concat(JSON.stringify(filepaths)));
            var outputPackage = new models_1.Package(resources_1);
            log.info("Included ".concat(outputPackage.entries.length, " resources"));
            var packageBuffer = outputPackage.getBuffer();
            log.trace("Package Buffer: ".concat(packageBuffer.length, " bytes"));
            log.trace("writing output file: ".concat(outputPath));
            fs_1.default.writeFileSync(outputPath, packageBuffer);
        }
        catch (e) {
            log.fatal("buildPackage:ERROR");
            throw (e);
        }
        log.debug("-- buildPackage:Done");
    };
    BuildProject.prototype.excludePatterns = function (filenames, exclude) {
        return filenames.filter(function (value) {
            var matches = exclude.filter(function (pattern) {
                return value.includes(pattern);
            });
            if (matches.length) {
                log.trace("Excluded: ".concat(value));
            }
            return matches.length == 0;
        });
    };
    BuildProject.prototype.buildPackages = function () {
        var _this = this;
        log.debug("- buildPackages:Start");
        try {
            this.getPackages().forEach(function (packageToBuild) {
                var _a;
                var globPatterns = new Array();
                (_a = packageToBuild.files) === null || _a === void 0 ? void 0 : _a.forEach(function (filePattern) {
                    var pathPattern = path_1.default.resolve(_this.getProject(), filePattern);
                    globPatterns.push(pathPattern);
                });
                log.trace("".concat(packageToBuild.name, " globs: ").concat(JSON.stringify(_this.getPackages())));
                log.trace("".concat(packageToBuild.name, " exclude: ").concat(_this.getExcludePatterns()));
                var filepaths = _this.excludePatterns(fast_glob_1.default.sync(globPatterns), _this.getExcludePatterns());
                log.debug("".concat(packageToBuild.name, ": ").concat(filepaths.length, " files"));
                var outputPath = _this.resolveOutputPath(packageToBuild.name);
                log.trace("Building ".concat(outputPath));
                _this.buildPackage(filepaths, outputPath);
                log.info("Built package ".concat(outputPath));
            });
        }
        catch (e) {
            log.fatal("buildPackages:ERROR:".concat(e));
            throw (e);
        }
        log.debug("- buildPackages:Done");
    };
    BuildProject.prototype.buildStrings = function () {
        var _this = this;
        log.debug("- buildStrings:Start");
        try {
            var globPatterns_1 = new Array();
            this.getStringPackages().forEach(function (stringPackage) {
                stringPackage.files.forEach(function (tuningFile) {
                    globPatterns_1.push(_this.resolveProjectPath(tuningFile));
                });
                var filepaths = fast_glob_1.default.sync(globPatterns_1);
                _this.resolveOutputPath('strings_package.package');
                var packageName = stringPackage.name ? stringPackage.name : "strings_package-".concat(new Date().getTime(), ".package");
                (0, strings_1.buildStringsPackage)(_this.resolveOutputPath(packageName), filepaths, stringPackage.instanceId);
            });
        }
        catch (e) {
            log.fatal("buildStrings:ERROR:".concat(e));
            throw (e);
        }
        log.debug("- buildStrings:Done");
    };
    BuildProject.prototype.mergePackages = function () {
        var _this = this;
        log.info("merging packages");
        log.debug("- mergePackages:Start");
        try {
            this.getMerges().forEach(function (mergeTargetData) {
                var mergeTarget = new merge_1.MergeTarget(_this, mergeTargetData);
                var outputFile = _this.resolveOutputPath(mergeTarget.name);
                var donorPaths = mergeTargetData.files.map(function (filename) { return _this.resolveProjectPath(filename); });
                mergeTarget.mergePackageFilesToPath(donorPaths, outputFile, mergeTarget.combineStrings);
            });
        }
        catch (e) {
            log.fatal("mergePackages:ERROR:".concat(e));
            throw (e);
        }
        log.debug("- mergePackages:Done");
    };
    return BuildProject;
}());
exports.BuildProject = BuildProject;
//# sourceMappingURL=build.js.map