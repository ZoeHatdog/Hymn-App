const path = require("path");
const { load } = require("@expo/env");

// Load monorepo root .env so EXPO_PUBLIC_* vars work when running from apps/mobile.
load(path.resolve(__dirname, "../.."));

module.exports = require("./app.json");
