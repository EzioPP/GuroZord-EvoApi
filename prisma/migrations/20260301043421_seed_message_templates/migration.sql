-- Seed default message templates (groupId = null → global fallback)
-- These are the basic/plain pt-br defaults. For fancier templates, apply per-group via the app.

INSERT INTO "public"."group_config" ("group_id", "key", "value", "description", "language", "updated_at")
VALUES
  (NULL, 'msg_welcome_rules', E'Regras do grupo:\n- Respeite todos os membros.\n- Proibido spam e propaganda.\n- Proibido conteúdo impróprio.\n- Siga as orientações dos administradores.\n\nQuem descumprir será removido.', 'Texto das regras de boas-vindas', 'pt-br', NOW()),
  (NULL, 'msg_welcome_single', E'Bem-vindo(a) ao grupo!\n\n{rules}', 'Mensagem de boas-vindas (1 pessoa). Placeholder: {rules}', 'pt-br', NOW()),
  (NULL, 'msg_welcome_batch', E'Bem-vindos(as), {mentions}!\n\n{rules}', 'Mensagem de boas-vindas (várias). Placeholders: {mentions}, {rules}', 'pt-br', NOW()),
  (NULL, 'msg_top_empty', 'Nenhum membro ativo ainda.', 'Mensagem quando ranking está vazio', 'pt-br', NOW()),
  (NULL, 'msg_top_header', 'TOP 10 - Membros Mais Ativos', 'Cabeçalho do ranking', 'pt-br', NOW()),
  (NULL, 'msg_top_subheader', 'Ranking da Semana', 'Subcabeçalho do ranking', 'pt-br', NOW()),
  (NULL, 'msg_top_line', E'{medal}{ordinal} – {number}{emoji} ({count} mensagens)', 'Formato de cada linha. Placeholders: {medal}, {ordinal}, {number}, {emoji}, {count}', 'pt-br', NOW()),
  (NULL, 'msg_top_footer', 'Continue participando para subir no ranking!', 'Rodapé do ranking', 'pt-br', NOW()),
  (NULL, 'msg_top_medals', '["🥇","🥈","🥉"]', 'Medalhas do ranking (JSON array)', 'pt-br', NOW()),
  (NULL, 'msg_top_emojis', '["","","","","","","","","",""]', 'Emojis por posição (JSON array, vazio = sem emoji)', 'pt-br', NOW()),
  (NULL, 'msg_top_ordinals', '["1º","2º","3º","4º","5º","6º","7º","8º","9º","10º"]', 'Ordinais do ranking (JSON array)', 'pt-br', NOW());
