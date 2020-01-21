"use strict";
exports.__esModule = true;
var ng_ts_dummy_transformer_1 = require("./ng-ts-dummy-transformer");
var webpack_1 = require("@ngtools/webpack");
function findAngularCompilerPlugin(webpackCfg) {
    return webpackCfg.plugins.find(function (plugin) { return plugin instanceof webpack_1.AngularCompilerPlugin; });
}
// The AngularCompilerPlugin has nog public API to add transformations, user private API _transformers instead.
function addTransformerToAngularCompilerPlugin(acp, transformer) {
    acp._transformers = [transformer].concat(acp._transformers);
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
        addTransformerToAngularCompilerPlugin(angularCompilerPlugin, ng_ts_dummy_transformer_1.dummyTransformer);
        return cfg;
    },
    post: function () {
        // This hook is not used in our example
    }
};
