-- SCRIPT DE LIMPEZA DE DADOS DE TESTE (Admin e Massao)
-- Este script remove cirurgicamente os registros de histórico e follow-up associados 
-- aos usuários de teste. Ao remover o histórico, metadados como "falou com cliente" 
-- e status de telefones também são removidos automaticamente, já que são calculados 
-- dinamicamente com base no histórico.

DO $$
DECLARE
  target_user RECORD;
BEGIN
  -- Busca os usuários Admin e Massao
  FOR target_user IN 
    SELECT id, email, name FROM public.profiles 
    WHERE email ILIKE '%massao%' OR email ILIKE '%admin%' OR name ILIKE '%massao%' OR name ILIKE '%admin%'
  LOOP
    RAISE NOTICE 'Removendo registros para o usuário: % (%)', target_user.name, target_user.email;
    
    -- 1. Remover logs de auditoria relacionados a esses contatos
    DELETE FROM public.contact_history_audit 
    WHERE contact_id IN (
      SELECT id FROM public.contact_history WHERE operator_id = target_user.id
    );

    -- 2. Remover logs de contato e interações
    DELETE FROM public.contact_history WHERE operator_id = target_user.id;
    
    -- 3. Remover atividades de follow-up
    DELETE FROM public.follow_up_tasks WHERE operator_id = target_user.id;
    
  END LOOP;
END $$;
