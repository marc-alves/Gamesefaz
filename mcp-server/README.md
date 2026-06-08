# gameSEFAZ MCP Server

Servidor MCP que conecta Claude ao banco de dados Supabase do gameSEFAZ.

## Setup

```bash
cd mcp-server
npm install
npm run build
npm start
```

## Conectar no Claude Code

No terminal:
```bash
claude mcp add --scope project --transport stdio gameSEFAZ "node /home/marcinho123/projects/gameSEFAZ/mcp-server/dist/server.js"
```

Depois autenticar:
```bash
claude /mcp
```

## Ferramentas Disponíveis

### 1. create_study_session
Registra uma sessão de estudo com respostas e calcula XP.

```
user_id, topic_id, platform_id, total_questions, correct_answers, answers (array)
```

### 2. update_user_topic_progress
Muda o status de um tópico para um usuário.

```
user_id, topic_id, status (none|tenho|revisando|dominado)
```

### 3. get_user_progress
Busca progresso do usuário em uma prova.

```
user_id, exam_id (opcional)
```

### 4. get_user_gamification
Busca dados de gamificação (XP, level, streak).

```
user_id, platform_id
```

### 5. list_topics
Lista todos os tópicos.

```
section_id (opcional) | exam_id (opcional)
```

### 6. award_achievement
Concede uma conquista a um usuário.

```
user_id, achievement_slug, session_id (opcional)
```

### 7. get_leaderboard
Busca leaderboard semanal.

```
platform_id, limit (opcional)
```

## Exemplo de Uso

```
"Registra a sessão do usuário X que respondeu 10 questões sobre o tópico Y com 8 acertos"
```

O MCP vai:
1. Criar a study_session
2. Registrar cada resposta
3. Calcular XP
4. Sincronizar gamification automaticamente (via trigger do Supabase)
