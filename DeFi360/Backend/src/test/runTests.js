const path = require('path');
const testFiles = [
  './LTVRiskStrategy.test.js',
  './loanController.test.js',
  './StandardPaymentProcessor.test.js'
];

let failures = 0;
let currentBeforeEach = null;

function isPromise(value) {
  return value && typeof value.then === 'function';
}

global.describe = (title, fn) => {
  console.log(title);
  currentBeforeEach = null;
  fn();
};

global.beforeEach = (fn) => {
  currentBeforeEach = fn;
};

global.test = async (name, fn) => {
  try {
    if (currentBeforeEach) {
      const beforeResult = currentBeforeEach();
      if (isPromise(beforeResult)) {
        await beforeResult;
      }
    }

    const result = fn();
    if (isPromise(result)) {
      await result;
    }

    console.log('  ✔', name);
  } catch (error) {
    failures += 1;
    console.error('  ✖', name);
    console.error(error);
  }
};

testFiles.forEach((file) => {
  try {
    require(path.resolve(__dirname, file));
  } catch (error) {
    failures += 1;
    console.error('Error cargando', file);
    console.error(error);
  }
});

if (failures > 0) {
  console.error(`\n${failures} prueba(s) fallaron`);
  process.exit(1);
}

console.log('\nTodas las pruebas pasaron');
