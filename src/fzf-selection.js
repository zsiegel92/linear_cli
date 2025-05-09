"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSelections = getUserSelections;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var os_1 = require("os");
var path_1 = require("path");
function getTempFilePath() {
    return __awaiter(this, arguments, void 0, function (prefix) {
        var tempDir;
        if (prefix === void 0) { prefix = "myapp-"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), prefix))];
                case 1:
                    tempDir = _a.sent();
                    return [2 /*return*/, (0, path_1.join)(tempDir, "somefile.tmp")];
            }
        });
    });
}
function getUserSelections(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var tmpSel, tmpPrev, locked, monitor, previewCmd, args, child, out, _c, _d, _e, chunk, e_1_1, code, chosenIds;
        var _this = this;
        var _f, e_1, _g, _h;
        var items = _b.items, _j = _b.fzfArgs, fzfArgs = _j === void 0 ? [
            "--cycle",
            "--no-sort",
            "--bind",
            // let the user scroll the preview with Alt-↑/↓/u/d
            "alt-up:preview-up,alt-down:preview-down,alt-u:preview-page-up,alt-d:preview-page-down",
        ] : _j, getPreview = _b.getPreview;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    if (!items.length)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, getTempFilePath()];
                case 1:
                    tmpSel = _k.sent();
                    return [4 /*yield*/, getTempFilePath()];
                case 2:
                    tmpPrev = _k.sent();
                    // create the files so `cat` has something to read the first time
                    return [4 /*yield*/, Promise.all([fs_1.promises.writeFile(tmpSel, ""), fs_1.promises.writeFile(tmpPrev, "")])];
                case 3:
                    // create the files so `cat` has something to read the first time
                    _k.sent();
                    locked = false;
                    monitor = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                        var hovered_1, item, preview, fullPreview, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (locked)
                                        return [2 /*return*/];
                                    _b.label = 1;
                                case 1:
                                    _b.trys.push([1, 7, , 8]);
                                    return [4 /*yield*/, fs_1.promises.readFile(tmpSel, "utf8")];
                                case 2:
                                    hovered_1 = (_b.sent()).trim();
                                    if (!hovered_1) return [3 /*break*/, 6];
                                    item = items.find(function (i) { return i.id === hovered_1; });
                                    if (!item)
                                        return [2 /*return*/];
                                    return [4 /*yield*/, getPreview(item)];
                                case 3:
                                    preview = _b.sent();
                                    fullPreview = preview;
                                    if (item.previewPrefix) {
                                        fullPreview = "".concat(item.previewPrefix, "\n\n").concat(preview);
                                    }
                                    if (item.previewSuffix) {
                                        fullPreview = "".concat(preview, "\n\n").concat(item.previewSuffix);
                                    }
                                    // wait 2s
                                    // await new Promise((resolve) => setTimeout(resolve, 2000))
                                    return [4 /*yield*/, fs_1.promises.writeFile(tmpPrev, fullPreview)];
                                case 4:
                                    // wait 2s
                                    // await new Promise((resolve) => setTimeout(resolve, 2000))
                                    _b.sent();
                                    // wipe the request so we don’t re-render the same thing
                                    return [4 /*yield*/, fs_1.promises.writeFile(tmpSel, "")];
                                case 5:
                                    // wipe the request so we don’t re-render the same thing
                                    _b.sent();
                                    _b.label = 6;
                                case 6: return [3 /*break*/, 8];
                                case 7:
                                    _a = _b.sent();
                                    return [3 /*break*/, 8];
                                case 8: return [2 /*return*/];
                            }
                        });
                    }); }, 10);
                    previewCmd = [
                        "SEL=\"".concat(tmpSel, "\""),
                        "PREV=\"".concat(tmpPrev, "\""),
                        "bash -c '",
                        "  echo \"$1\" > \"$SEL\";",
                        "  while [[ -s \"$SEL\" ]]; do sleep 0.01; done;",
                        "  cat \"$PREV\"",
                        "' -- {1}",
                    ].join(" ");
                    args = __spreadArray(__spreadArray([], fzfArgs, true), [
                        "--delimiter= ",
                        "--with-nth=2..", // show only the ‘display’ column in the list
                        "--preview",
                        previewCmd,
                    ], false);
                    child = (0, child_process_1.spawn)("fzf", args, {
                        stdio: ["pipe", "pipe", "inherit"],
                    });
                    // stream the list:  “id display”
                    child.stdin.write(items.map(function (i) { return "".concat(i.id, " ").concat(i.display); }).join("\n"));
                    child.stdin.end();
                    out = "";
                    _k.label = 4;
                case 4:
                    _k.trys.push([4, 9, 10, 15]);
                    _c = true, _d = __asyncValues(child.stdout);
                    _k.label = 5;
                case 5: return [4 /*yield*/, _d.next()];
                case 6:
                    if (!(_e = _k.sent(), _f = _e.done, !_f)) return [3 /*break*/, 8];
                    _h = _e.value;
                    _c = false;
                    chunk = _h;
                    out += chunk;
                    _k.label = 7;
                case 7:
                    _c = true;
                    return [3 /*break*/, 5];
                case 8: return [3 /*break*/, 15];
                case 9:
                    e_1_1 = _k.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 15];
                case 10:
                    _k.trys.push([10, , 13, 14]);
                    if (!(!_c && !_f && (_g = _d.return))) return [3 /*break*/, 12];
                    return [4 /*yield*/, _g.call(_d)];
                case 11:
                    _k.sent();
                    _k.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 14: return [7 /*endfinally*/];
                case 15: return [4 /*yield*/, new Promise(function (r) { return child.on("close", r); })];
                case 16:
                    code = _k.sent();
                    clearInterval(monitor);
                    if (code === 1 || code === 130)
                        return [2 /*return*/, []]; // cancel / ESC
                    if (code !== 0)
                        throw new Error("fzf exited with ".concat(code));
                    chosenIds = out
                        .trim()
                        .split("\n")
                        .map(function (l) { return l.split(" ")[0]; });
                    return [2 /*return*/, items.filter(function (i) { return chosenIds.includes(i.id); })];
            }
        });
    });
}
