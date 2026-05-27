DO $$
BEGIN
  INSERT INTO public.system_documentation (route, title, content)
  VALUES 
    ('/dashboard', 'Visão Geral da Dívida', 'Oferece à gestão uma visão macro e estratégica do cenário financeiro, apresentando o montante total da inadimplência e o estado geral da carteira.'),
    ('/strategic-dashboard', 'Análise da Equipe', 'Funciona como o termômetro da operação, monitorando produtividade e desempenho individual para identificar gargalos.'),
    ('/reports', 'Relatórios', 'O registro histórico do sistema, criado para auditorias detalhadas e exportação de dados para análise externa.'),
    ('/reversions', 'Reversões', 'Valida o sucesso financeiro ao cruzar atendimentos realizados com as baixas efetivas no banco de dados.'),
    ('/queue', 'Fila Rápida', 'O motor da operação, desenhada para agilizar o contato, registro e transição entre atendimentos.'),
    ('/follow-up', 'Follow-up', 'A agenda inteligente para gerenciar retornos prometidos, garantindo que nenhum compromisso de negociação seja esquecido.'),
    ('/strategic-queue', 'Fila Estratégias', 'Permite uma atuação cirúrgica em grupos específicos de dívidas, priorizando esforços táticos.'),
    ('/legal-queue', 'Fila Jurídico', 'O canal de escalonamento para casos que esgotaram a via administrativa.'),
    ('/cut-queue', 'Fila Corte', 'Organiza o fluxo de ordens de serviço para interrupção de fornecimento por inadimplência.'),
    ('/recut-queue', 'Fila Re-Corte', 'Monitora casos de reincidência, garantindo a eficácia da suspensão do serviço.'),
    ('/ferrule-queue', 'Fila Ferrule', 'Destinada a intervenções complexas diretamente na rede.'),
    ('/checar-serasa', 'Checar Serasa', 'Garante a conformidade externa, cruzando dados internos com os órgãos de proteção ao crédito.'),
    ('/check-terms', 'Checar Termos', 'Centraliza a guarda e gestão de termos de confissão de dívida assinados, garantindo segurança jurídica.'),
    ('/cadastral-updates', 'Atualizar Cadastros', 'Focada na higiene de dados, corrigindo informações de contato para aumentar a eficiência das abordagens.'),
    ('/billing-dashboard', 'Gestão de Leituras', 'Monitora o progresso das rotas de leitura em campo para evitar impactos no fluxo de caixa.'),
    ('/reading-rhythm', 'Ritmo de Leitura', 'Indicador de velocidade para garantir o cumprimento do cronograma mensal de faturamento.'),
    ('/strategic-assignment', 'Atribuição Estratégica', 'Ferramenta de distribuição de carga de trabalho para os operadores.'),
    ('/strategic-assignment-ii', 'Atribuição Estratégica II', 'Gestão avançada para movimentação de grandes volumes de registros entre filas.'),
    ('/billing-dispatches', 'Disparos de Cobrança', 'Automatiza a geração do arquivo necessário para alimentar o sistema CRM Wetalkie, dentro dos padrões exigidos, para realizarmos disparos em massa de mensagens de cobrança.'),
    ('/import', 'Importação', 'Rotina diária de carga de arquivos para sincronizar o sistema com os dados do GIS.'),
    ('/import-ii', 'Importação II (Nuvem)', 'Processamento robusto de arquivos massivos, evitando sobrecarga na interface do usuário.'),
    ('/settings', 'Configurações', 'O painel central de administração para parâmetros de segurança, perfis de acesso e regras do sistema.')
  ON CONFLICT (route) DO UPDATE SET 
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    updated_at = NOW();
END $$;
