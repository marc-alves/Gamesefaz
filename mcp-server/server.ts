import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "gameSEFAZ",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// FERRAMENTAS DO MCP
// ============================================================================

const tools: Tool[] = [
  {
    name: "create_study_session",
    description:
      "Criar uma nova sessão de estudo com respostas. Retorna session_id e XP ganho.",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_id: {
          type: "string",
          description: "UUID do usuário",
        },
        topic_id: {
          type: "string",
          description: "UUID do tópico",
        },
        platform_id: {
          type: "string",
          description: "UUID da plataforma (sefaz_ce_b02)",
        },
        total_questions: {
          type: "number",
          description: "Total de questões na sessão",
        },
        correct_answers: {
          type: "number",
          description: "Quantidade de respostas corretas",
        },
        answers: {
          type: "array",
          description: "Array de respostas individuais",
          items: {
            type: "object",
            properties: {
              question_index: { type: "number" },
              question_text: { type: "string" },
              chosen_index: { type: "number" },
              correct_index: { type: "number" },
              is_correct: { type: "boolean" },
              time_to_answer_ms: { type: "number" },
            },
            required: [
              "question_index",
              "question_text",
              "chosen_index",
              "correct_index",
              "is_correct",
            ],
          },
        },
        source: {
          type: "string",
          enum: ["baked", "ai_generated", "user_created"],
          description: "Fonte do conteúdo",
        },
      },
      required: [
        "user_id",
        "topic_id",
        "platform_id",
        "total_questions",
        "correct_answers",
        "answers",
      ],
    },
  },

  {
    name: "update_user_topic_progress",
    description: "Atualizar status de progresso de um usuário em um tópico",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "UUID do usuário" },
        topic_id: { type: "string", description: "UUID do tópico" },
        status: {
          type: "string",
          enum: ["none", "tenho", "revisando", "dominado"],
          description: "Novo status",
        },
      },
      required: ["user_id", "topic_id", "status"],
    },
  },

  {
    name: "get_user_progress",
    description: "Buscar progresso do usuário em todos os tópicos de uma prova",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "UUID do usuário" },
        exam_id: {
          type: "string",
          description: "UUID da prova (opcional - se vazio, retorna todas)",
        },
      },
      required: ["user_id"],
    },
  },

  {
    name: "get_user_gamification",
    description: "Buscar dados de gamificação do usuário (XP, level, streak)",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "UUID do usuário" },
        platform_id: { type: "string", description: "UUID da plataforma" },
      },
      required: ["user_id", "platform_id"],
    },
  },

  {
    name: "list_topics",
    description: "Listar todos os tópicos de uma prova/seção",
    inputSchema: {
      type: "object" as const,
      properties: {
        section_id: {
          type: "string",
          description: "UUID da seção (opcional)",
        },
        exam_id: {
          type: "string",
          description: "UUID da prova (opcional)",
        },
      },
    },
  },

  {
    name: "award_achievement",
    description: "Conceder uma conquista a um usuário",
    inputSchema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "UUID do usuário" },
        achievement_slug: { type: "string", description: "Slug da conquista" },
        session_id: {
          type: "string",
          description: "UUID da sessão (opcional)",
        },
      },
      required: ["user_id", "achievement_slug"],
    },
  },

  {
    name: "get_leaderboard",
    description: "Buscar leaderboard semanal de uma plataforma",
    inputSchema: {
      type: "object" as const,
      properties: {
        platform_id: { type: "string", description: "UUID da plataforma" },
        limit: { type: "number", description: "Limite de resultados" },
      },
      required: ["platform_id"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_study_session": {
        const {
          user_id,
          topic_id,
          platform_id,
          total_questions,
          correct_answers,
          answers,
          source = "baked",
        } = args as Record<string, unknown>;

        const wrong_answers = (total_questions as number) - (correct_answers as number);
        const accuracy_pct =
          (total_questions as number) > 0
            ? Math.round(
                ((correct_answers as number) / (total_questions as number)) * 100 * 100
              ) / 100
            : 0;
        const is_perfect =
          (total_questions as number) > 0 &&
          (correct_answers as number) === (total_questions as number);

        const { data: session, error: sessionError } = await supabase
          .from("study_sessions")
          .insert([
            {
              user_id,
              topic_id,
              platform_id,
              source,
              total_questions,
              correct_answers,
              wrong_answers,
              accuracy_pct,
              is_perfect,
              xp_earned: 0,
              xp_breakdown: {},
              completed_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        const sessionId = (session as Record<string, unknown>).id;

        const answersData = (answers as Array<Record<string, unknown>>).map(
          (answer) => ({
            session_id: sessionId,
            ...answer,
            created_at: new Date().toISOString(),
          })
        );

        const { error: answersError } = await supabase
          .from("session_answers")
          .insert(answersData);

        if (answersError) throw answersError;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  session_id: sessionId,
                  total_questions,
                  correct_answers,
                  accuracy_pct,
                  is_perfect,
                  message: "Sessão de estudo criada com sucesso",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_user_topic_progress": {
        const { user_id, topic_id, status } = args as Record<string, unknown>;

        const { data: existing } = await supabase
          .from("user_topic_progress")
          .select()
          .eq("user_id", user_id)
          .eq("topic_id", topic_id)
          .single();

        if (existing) {
          const { error } = await supabase
            .from("user_topic_progress")
            .update({
              status,
              status_updated_at: new Date().toISOString(),
            })
            .eq("user_id", user_id)
            .eq("topic_id", topic_id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_topic_progress")
            .insert([
              {
                user_id,
                topic_id,
                status,
                status_updated_at: new Date().toISOString(),
              },
            ]);

          if (error) throw error;
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  user_id,
                  topic_id,
                  status,
                  message: "Progresso atualizado com sucesso",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_user_progress": {
        const { user_id, exam_id } = args as Record<string, unknown>;

        let query = supabase
          .from("v_user_exam_progress")
          .select("*")
          .eq("user_id", user_id);

        if (exam_id) {
          query = query.eq("exam_id", exam_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        };
      }

      case "get_user_gamification": {
        const { user_id, platform_id } = args as Record<string, unknown>;

        const { data, error } = await supabase
          .from("v_user_gam_summary")
          .select("*")
          .eq("user_id", user_id)
          .eq("platform_id", platform_id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data || {}, null, 2),
            },
          ],
        };
      }

      case "list_topics": {
        const { section_id, exam_id } = args as Record<string, unknown>;

        let query = supabase.from("topics").select("*");

        if (section_id) {
          query = query.eq("section_id", section_id);
        }

        const { data, error } = await query.order("sort_order");

        if (error) throw error;

        // Filter by exam if needed (do it in JS to avoid complex joins)
        let filtered = data;
        if (exam_id && !section_id) {
          const { data: sections } = await supabase
            .from("sections")
            .select("id")
            .eq("exam_id", exam_id);

          const sectionIds = new Set(
            (sections || []).map((s) => (s as Record<string, unknown>).id)
          );
          filtered = (data || []).filter((t) =>
            sectionIds.has((t as Record<string, unknown>).section_id)
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(filtered || [], null, 2),
            },
          ],
        };
      }

      case "award_achievement": {
        const { user_id, achievement_slug, session_id } = args as Record<
          string,
          unknown
        >;

        const { data: achievement } = await supabase
          .from("achievement_definitions")
          .select("id")
          .eq("slug", achievement_slug)
          .single();

        if (!achievement) {
          throw new Error(`Achievement not found: ${achievement_slug}`);
        }

        const { error } = await supabase
          .from("user_achievements")
          .insert([
            {
              user_id,
              achievement_id: (achievement as Record<string, unknown>).id,
              session_id,
              earned_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  user_id,
                  achievement_slug,
                  message: "Conquista concedida com sucesso",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_leaderboard": {
        const { platform_id, limit = 10 } = args as Record<string, unknown>;

        const { data, error } = await supabase
          .from("leaderboard_weekly")
          .select("*")
          .eq("platform_id", platform_id)
          .limit(limit as number)
          .order("rank_position");

        if (error) throw error;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("gameSEFAZ MCP Server running on stdio");
}

main().catch(console.error);
