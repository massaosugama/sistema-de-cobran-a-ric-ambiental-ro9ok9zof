DO $$
BEGIN
  -- Limpa as importações que ficaram "travadas" antes das melhorias de Circuit Breaker.
  UPDATE public.import_jobs
  SET 
    status = 'error',
    error_details = 'Processamento interrompido (Timeout do sistema anterior).',
    completed_at = NOW()
  WHERE status IN ('processing', 'pending')
    AND created_at < NOW() - INTERVAL '1 hour';
END $$;
