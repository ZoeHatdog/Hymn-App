const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const mobileModules = path.resolve(projectRoot, "node_modules");
const monorepoModules = path.resolve(monorepoRoot, "node_modules");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [mobileModules, monorepoModules];

const singletonModulePattern =
  /^react(\/|$)|^react-native(\/|$)|^@react-native\/|^react-native-gesture-handler(\/|$)/;

function resolveFromPaths(moduleName, searchPaths) {
  for (const searchPath of searchPaths) {
    try {
      return require.resolve(moduleName, { paths: [searchPath] });
    } catch {
      // Try the next path.
    }
  }
  return null;
}

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (singletonModulePattern.test(moduleName)) {
    const filePath = resolveFromPaths(moduleName, [mobileModules, monorepoModules]);
    if (filePath) {
      return { filePath, type: "sourceFile" };
    }
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
