-- Tarea 12: Agregar índice compuesto en tabla PRESTAMO para optimizar Monitor de Riesgo
-- Justificación Kent Beck: Diseño simple. Responde a la query real del ciclo de pago.

CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_estado_fecha 
ON "loans" (id_usuario_prestatario, estado, fecha_vencimiento);