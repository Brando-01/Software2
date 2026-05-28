
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_estado_fecha 
ON "loans" (id, status, end_date);