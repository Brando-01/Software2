const path = require('path');

// Importamos el controlador
const { _factories } = require(path.resolve(__dirname, '../controllers/loanController'));

async function probarPagos() {
  console.log("Iniciando pruebas manuales de Préstamos...\n");

  const mockPaymentProcessor = {
    processPayment: async () => {
      return {
        loanStatus: 'paid',
        newRemainingBalance: 0,
        newLTV: 0
      };
    }
  };

  const payLoanHandler = _factories.payLoan(mockPaymentProcessor);

  // ---Prueba 1: Préstamo exitoso---
  console.log("Prueba 1: Intentando pagar un préstamo existente...");
  
  const reqExito = {
    params: { id: '1' }, 
    body: { amount: 100 },
    user: { id: 42 }
  };

  let respuestaFinal = null;
  let codigoEstado = null;
  
  const resExito = {
    status: function(code) { 
      codigoEstado = code; 
      return this; 
    },
    json: function(data) { 
      respuestaFinal = data; 
      return this; 
    }
  };

  await payLoanHandler(reqExito, resExito);

  if (respuestaFinal && respuestaFinal.success === true && respuestaFinal.loanStatus === 'paid') {
    console.log("✅ Éxito: El préstamo se pagó correctamente.");
  } else {
    console.log("❌ Falló: No se procesó el pago como se esperaba.", respuestaFinal);
  }

  // --- Prueba 2: Préstamo no encontrado (Error 404) ---
  console.log("\nPrueba 2: Intentando pagar un préstamo que no existe...");
  
  const reqError = {
    params: { id: '99999' }, 
    body: { amount: 30 },
    user: { id: 1 }
  };

  respuestaFinal = null;
  codigoEstado = null;

  const resError = {
    status: function(code) { 
      codigoEstado = code; 
      return this; 
    },
    json: function(data) { 
      respuestaFinal = data; 
      return this; 
    }
  };

  await payLoanHandler(reqError, resError);

  if (codigoEstado === 404) {
    console.log("✅ Éxito: El sistema detectó que el préstamo no existe (Error 404).");
  } else {
    console.log("❌ Falló: El sistema no manejó bien el error 404. Código recibido:", codigoEstado);
  }
}

probarPagos();
