const path = require('path');

const testFiles = [
  './riskIntegration.test.js',
  './LTVRiskStrategy.test.js',         
  './authController.test.js',          
  './loanController.test.js',          
  './StandardPaymentProcessor.test.js' 
];

let failures = 0;
let currentBeforeEach = null;

function isPromise(value) {
  return value && typeof value.then === 'function';
}

global.describe = (title, fn) => {
  console.log(`\n▶ ${title}`);
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
    console.error('    ↳', error.message);
  }
};

testFiles.forEach((file) => {
  try {
    require(path.resolve(__dirname, file));
  } catch (error) {
    failures += 1;
    console.error(`\n✖ Error cargando archivo: ${file}`);
    console.error(error.message);
  }
});

process.on('exit', () => {
  if (failures > 0) {
    console.error(`\n❌ FALLO: ${failures} prueba(s) fallaron.`);
    process.exitCode = 1;
  } else {
    console.log('\n✅ ÉXITO: Todas las pruebas pasaron (Regla de Kent Beck cumplida).');
  }
});