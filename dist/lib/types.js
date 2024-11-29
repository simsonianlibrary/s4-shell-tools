"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringTextFileEntry = exports.TuningData = void 0;
var TuningData = (function () {
    function TuningData(name, filename, key) {
        this.name = name;
        this.filename = filename;
        this.key = key;
    }
    return TuningData;
}());
exports.TuningData = TuningData;
var StringTextFileEntry = (function () {
    function StringTextFileEntry(hashId, contents) {
        this.hashId = hashId;
        this.contents = contents;
    }
    return StringTextFileEntry;
}());
exports.StringTextFileEntry = StringTextFileEntry;
//# sourceMappingURL=types.js.map