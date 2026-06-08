-- =============================================================================
-- GAMIFICATION DATABASE SCHEMA
-- Suporta: SEFAZ Tracker (atual) + extensível para qualquer plataforma futura
-- Engine: PostgreSQL 15+
-- Autor: Arquitetura gerada para Mércio Jr.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSÕES
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- busca textual em topic_name
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- índices para ranges de data

-- =============================================================================
-- BLOCO 1: USUÁRIOS E IDENTIDADE
-- =============================================================================

CREATE TABLE users (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT          UNIQUE,                              -- clerk/supabase auth uid
  email         TEXT          UNIQUE NOT NULL,
  display_name  TEXT          NOT NULL,
  avatar_url    TEXT,
  locale        TEXT          NOT NULL DEFAULT 'pt-BR',
  timezone      TEXT          NOT NULL DEFAULT 'America/Fortaleza',
  metadata      JSONB         NOT NULL DEFAULT '{}',              -- extensível
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================================
-- BLOCO 2: CATÁLOGO DE PLATAFORMAS / CONTEXTOS
-- =============================================================================
-- Um "contexto" é qualquer domínio de estudo ou jogo: SEFAZ-CE, SEFAZ-SP,
-- idiomas, quiz de matemática, etc. Desacopla a gamificação do conteúdo.

CREATE TABLE platforms (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT          UNIQUE NOT NULL,                    -- 'sefaz_ce_b02', 'enem_2026'
  name          TEXT          NOT NULL,
  description   TEXT,
  icon_url      TEXT,
  config        JSONB         NOT NULL DEFAULT '{}',              -- ex: {"max_score":200,"passing_score":150}
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Insere a plataforma atual
INSERT INTO platforms (slug, name, description, config) VALUES (
  'sefaz_ce_b02',
  'SEFAZ-CE · B02 Auditor-Fiscal de TI',
  'Concurso FCC 2026 · Cargo B02 · Provas 01-02/08/2026',
  '{"banca":"FCC","cargo":"B02","provas_date":"2026-08-01","salary_brl":16136.64,"vacancies":15}'
);

-- =============================================================================
-- BLOCO 3: ESTRUTURA DE CONTEÚDO (PROVAS → SEÇÕES → TÓPICOS)
-- =============================================================================

CREATE TABLE exams (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  slug            TEXT        NOT NULL,                          -- 'gerais', 'especificos', 'discursiva'
  label           TEXT        NOT NULL,
  badge           TEXT,                                          -- 'Peso 2 · 80q'
  exam_date       DATE,
  exam_period     TEXT,                                          -- 'manhã', 'tarde'
  weight          NUMERIC(4,2) NOT NULL DEFAULT 1,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, slug)
);

CREATE TABLE sections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         UUID        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE topics (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID        NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  sort_order      SMALLINT    NOT NULL DEFAULT 0,
  has_baked_content BOOLEAN   NOT NULL DEFAULT false,            -- conteúdo embutido vs IA fallback
  difficulty_level SMALLINT   CHECK (difficulty_level BETWEEN 1 AND 5),
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice trigram para busca fuzzy de tópico por nome
CREATE INDEX idx_topics_name_trgm ON topics USING GIN (name gin_trgm_ops);

-- =============================================================================
-- BLOCO 4: SISTEMA DE XP E LEVELING (GENÉRICO)
-- =============================================================================

CREATE TABLE xp_config (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     UUID        NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  config_key      TEXT        NOT NULL,                          -- 'xp_per_correct', 'xp_lesson_bonus', etc
  config_value    NUMERIC     NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform_id, config_key)
);

-- Valores do tracker atual
-- Serão inseridos após ter o platform_id real
-- Exemplo (substituir com UUID real):
-- INSERT INTO xp_config (platform_id, config_key, config_value, description) VALUES
-- ('...uuid...', 'xp_per_correct',    10, 'XP por questão correta'),
-- ('...uuid...', 'xp_lesson_bonus',   20, 'XP ao concluir lição'),
-- ('...uuid...', 'xp_perfect_bonus',  15, 'Bônus por gabaritar'),
-- ('...uuid...', 'daily_goal_xp',     50, 'Meta XP diária'),
-- ('...uuid...', 'xp_per_level',     120, 'XP necessário por nível');

-- =============================================================================
-- BLOCO 5: PROGRESSO DO USUÁRIO POR TÓPICO (TOPIC STATUS)
-- =============================================================================
-- Equivale ao localStorage sefaz_{prova}_{section}_{topic}

CREATE TYPE topic_status AS ENUM ('none', 'tenho', 'revisando', 'dominado');

CREATE TABLE user_topic_progress (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  status          topic_status  NOT NULL DEFAULT 'none',
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

-- Histórico de mudanças de status (audit log)
CREATE TABLE user_topic_status_history (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  old_status      topic_status,
  new_status      topic_status  NOT NULL,
  changed_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  triggered_by    TEXT                                           -- 'manual', 'lesson_perfect', 'lesson_pass'
);

-- Índice composto para dashboard
CREATE INDEX idx_utp_user_status ON user_topic_progress (user_id, status);
CREATE INDEX idx_utp_topic ON user_topic_progress (topic_id);

-- =============================================================================
-- BLOCO 6: SESSÕES DE ESTUDO / LESSONS
-- =============================================================================

CREATE TYPE lesson_phase AS ENUM ('teoria', 'pratica', 'resultado');
CREATE TYPE lesson_source AS ENUM ('baked', 'ai_generated', 'user_created');

CREATE TABLE study_sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID          NOT NULL REFERENCES topics(id),
  platform_id     UUID          NOT NULL REFERENCES platforms(id),
  source          lesson_source NOT NULL DEFAULT 'baked',
  -- Resultado
  total_questions SMALLINT      NOT NULL DEFAULT 0,
  correct_answers SMALLINT      NOT NULL DEFAULT 0,
  wrong_answers   SMALLINT      NOT NULL DEFAULT 0,
  accuracy_pct    NUMERIC(5,2)  GENERATED ALWAYS AS (
                    CASE WHEN total_questions > 0
                    THEN ROUND(correct_answers::NUMERIC / total_questions * 100, 2)
                    ELSE 0 END
                  ) STORED,
  is_perfect      BOOLEAN       GENERATED ALWAYS AS (
                    total_questions > 0 AND correct_answers = total_questions
                  ) STORED,
  -- XP ganho nesta sessão
  xp_earned       SMALLINT      NOT NULL DEFAULT 0,
  xp_breakdown    JSONB         NOT NULL DEFAULT '{}',           -- {"correct":30,"bonus":20,"perfect":15}
  -- Tempo
  started_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_seconds INT          GENERATED ALWAYS AS (
                    EXTRACT(EPOCH FROM (completed_at - started_at))::INT
                  ) STORED
);

-- Detalhamento por questão respondida
CREATE TABLE session_answers (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID          NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  question_index  SMALLINT      NOT NULL,
  question_text   TEXT          NOT NULL,                        -- snapshot imutável
  chosen_index    SMALLINT      NOT NULL,
  correct_index   SMALLINT      NOT NULL,
  is_correct      BOOLEAN       NOT NULL,
  time_to_answer_ms INT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_platform ON study_sessions (user_id, platform_id, started_at DESC);
CREATE INDEX idx_sessions_topic ON study_sessions (topic_id);

-- =============================================================================
-- BLOCO 7: GAMIFICAÇÃO – XP, STREAK, LEVELS
-- =============================================================================

-- Tabela mestre de saldo de XP por usuário/plataforma
CREATE TABLE user_gamification (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id     UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  total_xp        INT           NOT NULL DEFAULT 0,
  current_level   SMALLINT      NOT NULL DEFAULT 1,
  streak_days     SMALLINT      NOT NULL DEFAULT 0,
  last_study_date DATE,
  daily_xp        INT           NOT NULL DEFAULT 0,
  daily_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform_id)
);

-- Ledger de XP (append-only, nunca deletar)
CREATE TABLE xp_ledger (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id     UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  session_id      UUID          REFERENCES study_sessions(id),
  amount          SMALLINT      NOT NULL,                        -- pode ser negativo (penalidade futura)
  reason          TEXT          NOT NULL,                        -- 'lesson_correct', 'perfect_bonus', 'daily_bonus', 'achievement'
  metadata        JSONB         NOT NULL DEFAULT '{}',
  earned_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_ledger_user_platform ON xp_ledger (user_id, platform_id, earned_at DESC);

-- Histórico diário de streak (permite reconstruir calendário de atividade)
CREATE TABLE study_calendar (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id     UUID          NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  study_date      DATE          NOT NULL,
  xp_earned       INT           NOT NULL DEFAULT 0,
  sessions_count  SMALLINT      NOT NULL DEFAULT 0,
  goal_reached    BOOLEAN       NOT NULL DEFAULT false,
  UNIQUE (user_id, platform_id, study_date)
);

CREATE INDEX idx_calendar_user ON study_calendar (user_id, platform_id, study_date DESC);

-- =============================================================================
-- BLOCO 8: COROAS (CROWN SYSTEM) – extensível para qualquer badge futuro
-- =============================================================================

CREATE TYPE crown_tier AS ENUM ('bronze', 'prata', 'ouro', 'diamante', 'platina');

CREATE TABLE user_topic_crowns (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  completions     SMALLINT      NOT NULL DEFAULT 0,              -- nº de vezes que completou a lição
  current_tier    crown_tier,                                    -- NULL = sem coroa
  tier_updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);

CREATE INDEX idx_crowns_user ON user_topic_crowns (user_id, current_tier);

-- =============================================================================
-- BLOCO 9: ACHIEVEMENTS / CONQUISTAS (genérico, qualquer gamificação futura)
-- =============================================================================

CREATE TABLE achievement_definitions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     UUID          REFERENCES platforms(id),        -- NULL = global
  slug            TEXT          UNIQUE NOT NULL,
  name            TEXT          NOT NULL,
  description     TEXT,
  icon            TEXT,                                          -- emoji ou url
  condition_type  TEXT          NOT NULL,                        -- 'streak', 'xp_total', 'topics_mastered', 'perfect_lessons', 'custom'
  condition_value JSONB         NOT NULL DEFAULT '{}',           -- {"threshold":7} para streak de 7 dias
  xp_reward       SMALLINT      NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE user_achievements (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  UUID          NOT NULL REFERENCES achievement_definitions(id),
  earned_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  session_id      UUID          REFERENCES study_sessions(id),
  UNIQUE (user_id, achievement_id)                               -- cada conquista uma só vez
);

-- =============================================================================
-- BLOCO 10: CONTEÚDO DINÂMICO (para substituir o CONTENT_BANK hardcoded)
-- =============================================================================

CREATE TABLE content_cards (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  title           TEXT          NOT NULL,
  body_html       TEXT          NOT NULL,
  highlight       TEXT,                                          -- texto do "→ guarde isto"
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        UUID          NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  source          TEXT          NOT NULL DEFAULT 'baked',        -- 'baked', 'fcc_original', 'ai_generated'
  question_text   TEXT          NOT NULL,
  explanation_html TEXT         NOT NULL,
  difficulty      SMALLINT      CHECK (difficulty BETWEEN 1 AND 5),
  tags            TEXT[]        NOT NULL DEFAULT '{}',
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE question_alternatives (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID          NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order      SMALLINT      NOT NULL,                        -- 0=A, 1=B, 2=C, 3=D
  text            TEXT          NOT NULL,
  is_correct      BOOLEAN       NOT NULL DEFAULT false
);

-- Garante exatamente 1 alternativa correta por questão
CREATE UNIQUE INDEX idx_one_correct_per_question
  ON question_alternatives (question_id) WHERE is_correct = true;

CREATE INDEX idx_questions_topic ON questions (topic_id, is_active);

-- =============================================================================
-- BLOCO 11: LEADERBOARD (futuro multi-usuário)
-- =============================================================================

CREATE MATERIALIZED VIEW leaderboard_weekly AS
SELECT
  ug.platform_id,
  ug.user_id,
  u.display_name,
  u.avatar_url,
  COALESCE(SUM(xl.amount), 0) AS weekly_xp,
  DENSE_RANK() OVER (PARTITION BY ug.platform_id ORDER BY COALESCE(SUM(xl.amount), 0) DESC) AS rank_position
FROM user_gamification ug
JOIN users u ON u.id = ug.user_id
LEFT JOIN xp_ledger xl
  ON xl.user_id = ug.user_id
  AND xl.platform_id = ug.platform_id
  AND xl.earned_at >= date_trunc('week', now())
GROUP BY ug.platform_id, ug.user_id, u.display_name, u.avatar_url;

CREATE UNIQUE INDEX idx_leaderboard_weekly_pk ON leaderboard_weekly (platform_id, user_id);

-- Refresh automático via pg_cron (requer extensão ou job externo):
-- SELECT cron.schedule('refresh-leaderboard', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly');

-- =============================================================================
-- BLOCO 12: FUNÇÕES E TRIGGERS
-- =============================================================================

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at          BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gamification_updated_at   BEFORE UPDATE ON user_gamification FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_content_cards_updated_at  BEFORE UPDATE ON content_cards    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Função: recomputa level a partir de XP
CREATE OR REPLACE FUNCTION compute_level(p_xp INT, p_xp_per_level INT DEFAULT 120)
RETURNS SMALLINT LANGUAGE sql IMMUTABLE AS $$
  SELECT (FLOOR(p_xp::NUMERIC / p_xp_per_level) + 1)::SMALLINT;
$$;

-- Trigger: após insert no xp_ledger, atualiza user_gamification
CREATE OR REPLACE FUNCTION sync_gamification_on_xp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_xp_per_level INT;
BEGIN
  -- Busca config de XP por nível para a plataforma
  SELECT config_value::INT INTO v_xp_per_level
  FROM xp_config
  WHERE platform_id = NEW.platform_id AND config_key = 'xp_per_level';

  v_xp_per_level := COALESCE(v_xp_per_level, 120);

  INSERT INTO user_gamification (user_id, platform_id, total_xp, current_level, daily_xp, daily_date)
  VALUES (NEW.user_id, NEW.platform_id, NEW.amount, compute_level(NEW.amount, v_xp_per_level), NEW.amount, v_today)
  ON CONFLICT (user_id, platform_id) DO UPDATE SET
    total_xp      = user_gamification.total_xp + NEW.amount,
    current_level = compute_level(user_gamification.total_xp + NEW.amount, v_xp_per_level),
    daily_xp      = CASE
                      WHEN user_gamification.daily_date = v_today
                      THEN user_gamification.daily_xp + NEW.amount
                      ELSE NEW.amount
                    END,
    daily_date    = v_today,
    updated_at    = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_xp_ledger_sync
  AFTER INSERT ON xp_ledger
  FOR EACH ROW EXECUTE FUNCTION sync_gamification_on_xp();

-- Trigger: registra histórico de mudança de status de tópico
CREATE OR REPLACE FUNCTION log_topic_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO user_topic_status_history (user_id, topic_id, old_status, new_status, triggered_by)
    VALUES (NEW.user_id, NEW.topic_id, OLD.status, NEW.status, NEW.status_updated_at::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_topic_status_history
  AFTER UPDATE ON user_topic_progress
  FOR EACH ROW EXECUTE FUNCTION log_topic_status_change();

-- Função: calcula streak atual de um usuário (sem depender de cache)
CREATE OR REPLACE FUNCTION get_current_streak(p_user_id UUID, p_platform_id UUID)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
  v_streak INT := 0;
  v_date   DATE := CURRENT_DATE;
  v_found  BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM study_calendar
      WHERE user_id = p_user_id AND platform_id = p_platform_id AND study_date = v_date
    ) INTO v_found;
    EXIT WHEN NOT v_found;
    v_streak := v_streak + 1;
    v_date   := v_date - 1;
  END LOOP;
  RETURN v_streak;
END;
$$;

-- =============================================================================
-- BLOCO 13: VIEWS ÚTEIS PARA O APP
-- =============================================================================

-- Progresso geral de um usuário por prova
CREATE OR REPLACE VIEW v_user_exam_progress AS
SELECT
  utp.user_id,
  e.platform_id,
  e.id         AS exam_id,
  e.label      AS exam_label,
  e.slug       AS exam_slug,
  COUNT(t.id)                                                       AS total_topics,
  COUNT(*) FILTER (WHERE utp.status = 'dominado')                   AS dominados,
  COUNT(*) FILTER (WHERE utp.status = 'revisando')                  AS revisando,
  COUNT(*) FILTER (WHERE utp.status = 'tenho')                      AS tenho_material,
  COUNT(*) FILTER (WHERE utp.status = 'none' OR utp.status IS NULL) AS nao_estudados,
  ROUND(
    COUNT(*) FILTER (WHERE utp.status = 'dominado')::NUMERIC /
    NULLIF(COUNT(t.id), 0) * 100, 1
  )                                                                  AS pct_dominado
FROM exams e
JOIN sections s ON s.exam_id = e.id
JOIN topics t ON t.section_id = s.id
LEFT JOIN user_topic_progress utp ON utp.topic_id = t.id
GROUP BY utp.user_id, e.platform_id, e.id, e.label, e.slug;

-- Resumo de gamificação para o header do app
CREATE OR REPLACE VIEW v_user_gam_summary AS
SELECT
  ug.user_id,
  ug.platform_id,
  ug.total_xp,
  ug.current_level,
  ug.streak_days,
  ug.daily_xp,
  ug.daily_date,
  COALESCE(xpc_goal.config_value::INT, 50)   AS daily_goal_xp,
  COALESCE(xpc_lvl.config_value::INT,  120)  AS xp_per_level,
  (ug.total_xp % COALESCE(xpc_lvl.config_value::INT, 120))       AS xp_into_level,
  COALESCE((SELECT COUNT(*) FROM user_topic_crowns utc
            WHERE utc.user_id = ug.user_id AND utc.current_tier IS NOT NULL), 0) AS topics_with_crown
FROM user_gamification ug
LEFT JOIN xp_config xpc_goal ON xpc_goal.platform_id = ug.platform_id AND xpc_goal.config_key = 'daily_goal_xp'
LEFT JOIN xp_config xpc_lvl  ON xpc_lvl.platform_id  = ug.platform_id AND xpc_lvl.config_key  = 'xp_per_level';

-- =============================================================================
-- BLOCO 14: ROW LEVEL SECURITY (Supabase-ready)
-- =============================================================================

ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification       ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger               ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_calendar          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_crowns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements       ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê/edita apenas seus dados
CREATE POLICY "users_own_row"    ON users                     FOR ALL USING (id = auth.uid());
CREATE POLICY "utp_own"          ON user_topic_progress       FOR ALL USING (user_id = auth.uid());
CREATE POLICY "utsh_own"         ON user_topic_status_history FOR ALL USING (user_id = auth.uid());
CREATE POLICY "sessions_own"     ON study_sessions            FOR ALL USING (user_id = auth.uid());
CREATE POLICY "answers_own"      ON session_answers           FOR ALL
  USING (session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid()));
CREATE POLICY "gam_own"          ON user_gamification         FOR ALL USING (user_id = auth.uid());
CREATE POLICY "xp_own"           ON xp_ledger                 FOR ALL USING (user_id = auth.uid());
CREATE POLICY "calendar_own"     ON study_calendar            FOR ALL USING (user_id = auth.uid());
CREATE POLICY "crowns_own"       ON user_topic_crowns         FOR ALL USING (user_id = auth.uid());
CREATE POLICY "achievements_own" ON user_achievements         FOR ALL USING (user_id = auth.uid());

-- Conteúdo e catálogo são públicos (read-only)
CREATE POLICY "platforms_public"  ON platforms              FOR SELECT USING (true);
CREATE POLICY "exams_public"      ON exams                  FOR SELECT USING (true);
CREATE POLICY "sections_public"   ON sections               FOR SELECT USING (true);
CREATE POLICY "topics_public"     ON topics                 FOR SELECT USING (true);
CREATE POLICY "cards_public"      ON content_cards          FOR SELECT USING (is_active = true);
CREATE POLICY "questions_public"  ON questions              FOR SELECT USING (is_active = true);
CREATE POLICY "alts_public"       ON question_alternatives  FOR SELECT USING (true);
