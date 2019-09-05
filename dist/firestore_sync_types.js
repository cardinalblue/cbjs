"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = __importStar(require("lodash"));
var util_1 = require("./util");
function fieldToStringNullable(field) {
    if (typeof field == "string")
        return field;
    return null;
}
exports.fieldToStringNullable = fieldToStringNullable;
function fieldToString(field, _default) {
    if (_default === void 0) { _default = util_1.BLANK; }
    if (typeof field == "string")
        return field;
    return _default;
}
exports.fieldToString = fieldToString;
function fieldUpdate(value, to) {
    if (!_.isEqual(value, to.value)) {
        to.next(value);
    }
}
exports.fieldUpdate = fieldUpdate;
