const path = require('path');

const testFiles = [
  './observerPattern.test.js',
  './riskIntegration.test.js',
  './LTVRiskStrategy.test.js',
  './authController.test.js',
  './loanController.test.js',
  './StandardPaymentProcessor.test.js',
  './CachedPriceOracle.test.js'
];

const isPromise = (value) => value && typeof value.then === 'function';

const queue = [];
const titleStack = [];
let currentBeforeEach = null;
let failures = 0;

global.describe = (title, fn) => {
  const previousBeforeEach = currentBeforeEach;
  currentBeforeEach = null;
  titleStack.push(title);
  fn();
  titleStack.pop();
  currentBeforeEach = previousBeforeEach;
};

global.beforeEach = (fn) => {
  currentBeforeEach = fn;
};

const register = (name, fn) => {
  queue.push({ suite: titleStack.join(' › '), name, fn, before: currentBeforeEach });
};

global.test = register;
global.it = register;

testFiles.forEach((file) => {
  try {
    require(path.resolve(__dirname, file));
  } catch (error) {
    failures += 1;
    console.error('Error cargando', file);
    console.error(error);
  }
});

(async () => {
  let lastSuite = null;

  for (const { suite, name, fn, before } of queue) {
    if (suite !== lastSuite) {
      console.log(suite);
      lastSuite = suite;
    }

    try {
      if (before) {
        const beforeResult = before();
        if (isPromise(beforeResult)) await beforeResult;
      }

      const result = fn();
      if (isPromise(result)) await result;

      console.log('  ✔', name);
    } catch (error) {
      failures += 1;
      console.error('  ✖', name);
      console.error(error);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} prueba(s) fallaron`);
    process.exit(1);
  }

  console.log('\n Todas las pruebas pasaron');
})();
