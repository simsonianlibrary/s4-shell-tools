"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversions = void 0;
var Conversions = (function () {
    function Conversions() {
    }
    Conversions.toHex = function (value) {
        return "0x".concat(value.toString(16).toUpperCase().padStart(16, '0'));
    };
    Conversions.numToHex64Str = function (value) {
        return "".concat(value.toString(16).toUpperCase().padStart(16, '0'));
    };
    Conversions.strToBigInt = function (hexValue) {
        if (Number.isNaN(hexValue)) {
            throw ("StringHexToBigInt: Invalid string value to convert big decimal: ".concat(hexValue));
        }
        return BigInt("0x".concat(hexValue));
    };
    Conversions.numToStblRef = function (value) {
        return "0x".concat(value.toString(16).toUpperCase().padStart(8, '0'));
    };
    Conversions.numToHex32Str = function (value) {
        return "".concat(value.toString(16).toUpperCase().padStart(8, '0'));
    };
    Conversions.generateKeyString = function (type, group, inst) {
        return "".concat(Conversions.numToHex32Str(type), "!").concat(Conversions.numToHex32Str(group), "!").concat(Conversions.numToHex64Str(inst));
    };
    Conversions.keyToString = function (resourceKey) {
        return Conversions.generateKeyString(resourceKey.type, resourceKey.group, resourceKey.instance);
    };
    return Conversions;
}());
exports.Conversions = Conversions;
//# sourceMappingURL=conversions.js.map