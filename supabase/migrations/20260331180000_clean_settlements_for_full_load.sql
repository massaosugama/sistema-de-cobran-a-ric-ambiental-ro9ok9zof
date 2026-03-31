-- 1. Limpeza da tabela de baixas (settlements) e reversões (contact_results via cascade)
-- Isso prepara o terreno para o usuário subir o "mega-arquivo" com o histórico completo, sem risco de duplicação.
TRUNCATE TABLE public.settlements CASCADE;

-- 2. Criação de uma rotina unificada para garantir a ordem estrita de execução pós-importação
-- Conforme alinhado, a limpeza (cleanup) DEVE ocorrer antes do processamento das conversões.
CREATE OR REPLACE FUNCTION public.execute_post_import_routines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1º: Limpeza de dados baseada no prazo de retenção (retention_days lido do app_settings)
  PERFORM public.cleanup_old_settlements();
  
  -- 2º: Processamento do motor de cálculo de conversões apenas nos dados que restaram e são elegíveis
  PERFORM public.process_conversions();
END;
$$;
