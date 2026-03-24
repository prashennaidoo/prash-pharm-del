const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub out html2pdf.js and jspdf — both use AMD-style require() calls
// that Metro's transformer cannot handle. The web version loads html2pdf
// from CDN at runtime instead (see lib/html2pdf.web.ts).
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'html2pdf.js' || moduleName === 'jspdf') {
    return {
      filePath: path.join(__dirname, 'lib/html2pdf.ts'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
