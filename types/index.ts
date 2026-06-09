export type Status = 'none' | 'tenho' | 'revisando' | 'dominado';

export interface Prova {
  id: string;
  label: string;
  badge: string;
  meta: string;
}

export interface Section {
  name: string;
  topics: string[];
}

export interface TopicProgress {
  provaId: string;
  sectionIndex: number;
  topicIndex: number;
  status: Status;
}

export interface ProvaWithSections extends Prova {
  sections: Section[];
}

// ========== TIPOS ALINHADOS COM SCHEMA SUPABASE ==========

export interface Question {
  id?: string;
  topic_id?: string;
  source?: 'baked' | 'fcc_original' | 'ai_generated';
  question_text: string;
  explanation_html: string;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  is_active?: boolean;
}

export interface QuestionAlternative {
  id?: string;
  question_id?: string;
  sort_order: number; // 0=A, 1=B, 2=C, 3=D
  text: string;
  is_correct: boolean;
}

export interface QuestionWithAlternatives extends Question {
  alternatives: QuestionAlternative[];
}

// Legacy - mantido para compatibilidade
export interface Questao {
  id?: string;
  enunciado: string;
  resposta: string;
  dica: string;
  nivel: 1 | 2 | 3;
  topico?: string;
}

export interface QuestaoComMetadata extends Questao {
  provaId: string;
  sectionIndex: number;
  topicIndex: number;
}
