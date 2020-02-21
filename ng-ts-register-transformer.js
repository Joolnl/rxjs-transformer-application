"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var rxjs_transformer_1 = require("./transformer/rxjs_transformer");
var webpack_1 = require("@ngtools/webpack");
function findAngularCompilerPlugin(webpackCfg) {
    return webpackCfg.plugins.find(function (plugin) { return plugin instanceof webpack_1.AngularCompilerPlugin; });
}
// The AngularCompilerPlugin has nog public API to add transformations, user private API _transformers instead.
function addTransformerToAngularCompilerPlugin(acp, transformer) {
    acp._transformers = __spreadArrays([transformer], acp._transformers);
}
exports["default"] = {
    pre: function () {
        // This hook is not used in our example
    },
    // This hook is used to manipulate the webpack configuration
    config: function (cfg) {
        // Find the AngularCompilerPlugin in the webpack configuration
        var angularCompilerPlugin = findAngularCompilerPlugin(cfg);
        if (!angularCompilerPlugin) {
            console.error('Could not inject the typescript transformer: Webpack AngularCompilerPlugin not found');
            return;
        }
        addTransformerToAngularCompilerPlugin(angularCompilerPlugin, rxjs_transformer_1.dummyTransformer);
        return cfg;
    },
    post: function () {
        // This hook is not used in our example
    }
};
