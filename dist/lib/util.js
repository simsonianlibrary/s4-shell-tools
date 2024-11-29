"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidXML = exports.TuningTypeName = exports.LocaleName = exports.generateS4SResourceFilename = exports.generateResourceFilenameFromKey = exports.canImportFile = exports.parseKeyFromPath = exports.loadYamlFile = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var enums_1 = require("@s4tk/models/enums");
var log4js_1 = __importDefault(require("log4js"));
var js_yaml_1 = __importDefault(require("js-yaml"));
var libxmljs_1 = __importDefault(require("libxmljs"));
var conversions_1 = require("./conversions");
var logger = log4js_1.default.getLogger();
function loadYamlFile(path) {
    var yamlFileContents = fs_1.default.readFileSync(path, 'utf8');
    return js_yaml_1.default.load(yamlFileContents);
}
exports.loadYamlFile = loadYamlFile;
function parseKeyFromPath(filepath) {
    logger.trace("Parsing resource key from: ".concat(filepath));
    var _a = path_1.default.basename(filepath, path_1.default.extname(filepath)).split('.')[0].split('!'), type = _a[0], group = _a[1], instanceId = _a[2];
    if (!(type && group && instanceId)) {
        throw (new Error("Invalid filename format: ".concat(filepath, " => ").concat([type, group, instanceId])));
    }
    return { type: parseInt(type, 16), group: parseInt(group, 16), instance: conversions_1.Conversions.strToBigInt(instanceId) };
}
exports.parseKeyFromPath = parseKeyFromPath;
function canImportFile(filename) {
    if (!filename.endsWith('.xml')) {
        logger.trace("Skipping non-XML file: ".concat(filename));
        return false;
    }
    var resourceKey = parseKeyFromPath(filename);
    if (enums_1.BinaryResourceType[resourceKey.type]) {
        logger.trace("Is Binary Resource Type");
        return true;
    }
    else if (TuningTypeName(resourceKey.type)) {
        logger.trace("Is Tuning Resource Type");
        return true;
    }
    logger.warn("Skipping unhandled file type! Try importing it with S4Studio: ".concat(filename));
    return false;
}
exports.canImportFile = canImportFile;
function generateResourceFilenameFromKey(resourceKey) {
    return generateS4SResourceFilename(resourceKey.type, resourceKey.group, resourceKey.instance);
}
exports.generateResourceFilenameFromKey = generateResourceFilenameFromKey;
function generateS4SResourceFilename(type, group, instance) {
    var keyString = conversions_1.Conversions.generateKeyString(type, group, instance);
    var resourceTypeName = enums_1.BinaryResourceType[type];
    switch (type) {
        case enums_1.BinaryResourceType.StringTable:
            var languageName = LocaleName(instance);
            return "".concat(keyString, ".").concat(languageName, ".").concat(resourceTypeName, ".binary");
        case enums_1.BinaryResourceType.SimData:
            return "".concat(keyString, ".").concat(resourceTypeName, ".xml");
        case enums_1.BinaryResourceType.CombinedTuning:
        case enums_1.BinaryResourceType.DstImage:
            return "".concat(keyString, ".").concat(resourceTypeName, ".binary");
        default:
            var tuningResourceTypeName = TuningTypeName(type);
            if (tuningResourceTypeName) {
                return "".concat(keyString, ".").concat(tuningResourceTypeName, ".xml");
            }
            else {
                logger.warn("Unknown resource type: ".concat(keyString));
                return "".concat(keyString, ".Unknown.binary");
            }
    }
}
exports.generateS4SResourceFilename = generateS4SResourceFilename;
function LocaleName(value) {
    return enums_1.StringTableLocale[enums_1.StringTableLocale.getLocale(value)];
}
exports.LocaleName = LocaleName;
function TuningTypeName(value) {
    var _a;
    return (_a = enums_1.TuningResourceType[value]) === null || _a === void 0 ? void 0 : _a.toString();
}
exports.TuningTypeName = TuningTypeName;
function isValidXML(text) {
    try {
        libxmljs_1.default.parseXml(text);
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isValidXML = isValidXML;
//# sourceMappingURL=util.js.map