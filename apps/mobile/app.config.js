const path = require("path");
const { load } = require("@expo/env");

// Load monorepo root .env so EXPO_PUBLIC_* vars work when running from apps/mobile.
load(path.resolve(__dirname, "../.."));

// Return the static app.json config object Expo passes in, so both files stay in sync.
module.exports = ({ config }) => config;
