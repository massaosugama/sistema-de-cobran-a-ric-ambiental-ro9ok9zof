-- Força a recarga do schema cache do PostgREST para garantir reconhecimento da coluna "valor_retidas_em_aberto" em endpoints RPC/REST.
NOTIFY pgrst, 'reload schema';
