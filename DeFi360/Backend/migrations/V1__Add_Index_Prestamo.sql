
CREATE INDEX IF NOT EXISTS idx_prestamo_usuario_estado_fecha 
ON "loans" (borrower_id, status, end_date);