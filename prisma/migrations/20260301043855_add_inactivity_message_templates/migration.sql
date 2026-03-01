-- Add global defaults (group_id = null) for inactivity warning templates.
-- Insert only if not present.

INSERT INTO "public"."group_config" ("group_id", "key", "value", "description", "language", "updated_at")
SELECT NULL, 'msg_inactive_warning_header', '⚠️ Membros inativos ({days}+ dias):', 'Cabeçalho do aviso de inatividade. Placeholder: {days}', 'pt-br', NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM "public"."group_config"
	WHERE "group_id" IS NULL AND "key" = 'msg_inactive_warning_header' AND "language" = 'pt-br'
);

INSERT INTO "public"."group_config" ("group_id", "key", "value", "description", "language", "updated_at")
SELECT NULL, 'msg_inactive_warning_line', '@{number} - Última mensagem: {lastMessage}', 'Linha do aviso de inatividade. Placeholders: {number}, {lastMessage}', 'pt-br', NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM "public"."group_config"
	WHERE "group_id" IS NULL AND "key" = 'msg_inactive_warning_line' AND "language" = 'pt-br'
);

INSERT INTO "public"."group_config" ("group_id", "key", "value", "description", "language", "updated_at")
SELECT NULL, 'msg_inactive_warning_footer', 'Permaneça ativo(a) para evitar remoção do grupo.', 'Rodapé do aviso de inatividade', 'pt-br', NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM "public"."group_config"
	WHERE "group_id" IS NULL AND "key" = 'msg_inactive_warning_footer' AND "language" = 'pt-br'
);

INSERT INTO "public"."group_config" ("group_id", "key", "value", "description", "language", "updated_at")
SELECT NULL, 'msg_inactive_warning_never', 'Nunca', 'Fallback de data para membros sem mensagem', 'pt-br', NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM "public"."group_config"
	WHERE "group_id" IS NULL AND "key" = 'msg_inactive_warning_never' AND "language" = 'pt-br'
);