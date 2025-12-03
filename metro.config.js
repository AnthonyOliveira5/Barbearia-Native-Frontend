// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require('nativewind/metro');
 
// const config = getDefaultConfig(__dirname)
 
// module.exports = withNativeWind(config, { input: './global.css' })

// metro.config.js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 1. Mantemos a sua configuração para ignorar os testes
config.resolver.blockList = [
  ...config.resolver.blockList || [],
  /.*\.test\.(js|ts|tsx|jsx)$/,
  /.*jest-setup\.ts$/
];

// 2. Envolvemos a configuração com o withNativeWind
// O 'input' deve apontar para o seu arquivo CSS global
module.exports = withNativeWind(config, { input: "./global.css" });