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
