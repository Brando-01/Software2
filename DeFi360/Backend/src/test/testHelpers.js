const path = require('path');

function setMock(moduleRelPath, exportValue) {
  const resolved = require.resolve(moduleRelPath);
  delete require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportValue
  };
}

function clearMock(moduleRelPath) {
  const resolved = require.resolve(moduleRelPath);
  delete require.cache[resolved];
}

module.exports = {
  setMock,
  clearMock
};
