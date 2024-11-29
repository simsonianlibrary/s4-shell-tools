"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeResourceEntry = exports.getPackage = exports.savePackage = exports.getBuffer = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var models_1 = require("@s4tk/models");
var util_1 = require("./util");
var enums_1 = require("@s4tk/models/enums");
var log4js_1 = __importDefault(require("log4js"));
var logger = log4js_1.default.getLogger();
var cachedBuffers = {};
function getBuffer(filename) {
    try {
        if (!cachedBuffers[filename]) {
            var filepath = path_1.default.resolve(process.cwd(), filename);
            cachedBuffers[filename] = fs_1.default.readFileSync(filepath);
        }
        return cachedBuffers[filename];
    }
    catch (e) {
        logger.error("Could not open file: ".concat(filename, ":").concat(e));
    }
}
exports.getBuffer = getBuffer;
function savePackage(pkg, outputPath) {
    var buffer = pkg.getBuffer();
    fs_1.default.writeFileSync(outputPath, buffer);
}
exports.savePackage = savePackage;
function getPackage(filename, options) {
    return models_1.Package.from(getBuffer(filename), options);
}
exports.getPackage = getPackage;
function makeResourceEntry(filepath) {
    logger.trace("Creating resource key from ".concat(filepath));
    var resource;
    var resourceKey = (0, util_1.parseKeyFromPath)(filepath);
    if (resourceKey.type == enums_1.BinaryResourceType.SimData) {
        var stringContents = getBuffer(filepath).toString();
        if (!(0, util_1.isValidXML)(stringContents)) {
            throw (new Error("File contains invalid XML: ".concat(filepath)));
        }
        resource = models_1.SimDataResource.fromXml(stringContents);
    }
    else if (enums_1.TuningResourceType[resourceKey.type]) {
        var stringContents = getBuffer(filepath).toString();
        if (!(0, util_1.isValidXML)(stringContents)) {
            throw (new Error("File contains invalid XML: ".concat(filepath)));
        }
        resource = new models_1.XmlResource(stringContents);
    }
    else {
        resource = models_1.RawResource.from(getBuffer(filepath));
    }
    return {
        key: resourceKey,
        value: resource,
    };
}
exports.makeResourceEntry = makeResourceEntry;
//# sourceMappingURL=packages.js.map