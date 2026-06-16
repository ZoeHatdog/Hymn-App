const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const mobileModules = path.resolve(projectRoot, "node_modules");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  mobileModules,
  path.resolve(monorepoRoot, "node_modules"),
];

// Hoisted root deps can install older copies that break the native runtime.
const singletonModulePattern =
  /^react(\/|$)|^react-native(\/|$)|^@react-native\//;

function resolveFromMobileModules(moduleName) {
  return require.resolve(moduleName, { paths: [mobileModules] });
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (singletonModulePattern.test(moduleName)) {
    try {
      return {
        filePath: resolveFromMobileModules(moduleName),
        type: "sourceFile",
      };
    } catch {
      // Fall back to default resolution if not installed in the app workspace.
    }
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
