import type { Questao } from '@/types';

// DIREITO TRIBUTÁRIO - Crédito tributário
export const QUESTOES_CREDITO_TRIBUTARIO: Questao[] = [
  {
    id: 'dt-ct-001',
    enunciado: 'Maria recebeu uma notificação da Fazenda cobrando ICMS que não havia declarado. O procedimento administrativo que constitui oficialmente esse crédito tributário chama-se ___.',
    resposta: 'lançamento',
    dica: 'CTN art. 142 — procedimento privativo da autoridade administrativa',
    nivel: 1,
    topico: 'Crédito tributário — lançamento, suspensão, extinção, exclusão',
  },
  {
    id: 'dt-ct-002',
    enunciado: 'João entrou com recurso administrativo contra o auto de infração da SEFAZ. Enquanto o recurso é analisado, a exigibilidade do crédito tributário está ___.',
    resposta: 'suspensa',
    dica: 'CTN art. 151 — reclamações e recursos suspendem a exigibilidade',
    nivel: 1,
    topico: 'Crédito tributário — lançamento, suspensão, extinção, exclusão',
  },
  {
    id: 'dt-ct-003',
    enunciado: 'A Fazenda Estadual concedeu dispensa do pagamento de IPVA para veículos adaptados para pessoas com deficiência. Esse benefício que impede a constituição do crédito tributário chama-se ___.',
    resposta: 'isenção',
    dica: 'CTN art. 175 — isenção exclui o tributo, anistia exclui a penalidade',
    nivel: 1,
    topico: 'Crédito tributário — lançamento, suspensão, extinção, exclusão',
  },
  {
    id: 'dt-ct-004',
    enunciado: 'Carlos percebeu que havia cometido uma infração tributária e, antes de qualquer fiscalização, procurou a Fazenda e pagou o tributo com juros. Esse instituto que exclui a multa chama-se ___.',
    resposta: 'denúncia espontânea',
    dica: 'CTN art. 138 — exclui a multa mas não os juros de mora',
    nivel: 2,
    topico: 'Crédito tributário — lançamento, suspensão, extinção, exclusão',
  },
  {
    id: 'dt-ct-005',
    enunciado: 'A empresa foi incorporada por outra. A responsabilidade pelo pagamento dos tributos devidos pela empresa incorporada antes da operação é da ___.',
    resposta: 'incorporadora',
    dica: 'CTN art. 132 — responsabilidade por sucessão empresarial',
    nivel: 2,
    topico: 'Crédito tributário — lançamento, suspensão, extinção, exclusão',
  },
];

// ADMINISTRAÇÃO E GOVERNANÇA PÚBLICA - Governança organizacional
export const QUESTOES_GOVERNANCA: Questao[] = [
  {
    id: 'agp-gov-001',
    enunciado: 'O administrador público publicou uma portaria regulamentando o uso de veículos oficiais. Ele exerceu o poder ___ da Administração Pública.',
    resposta: 'regulamentar',
    dica: 'Poder regulamentar — competência para editar atos normativos secundários',
    nivel: 1,
    topico: 'Governança organizacional — conceito, princípios e instâncias',
  },
  {
    id: 'agp-gov-002',
    enunciado: 'A SEFAZ-CE identificou que um servidor cometeu infração e iniciou o procedimento formal para apurar a falta e aplicar sanção. Esse procedimento chama-se ___.',
    resposta: 'processo administrativo disciplinar',
    dica: 'PAD — instrumento de apuração de infrações funcionais',
    nivel: 1,
    topico: 'Governança organizacional — conceito, princípios e instâncias',
  },
  {
    id: 'agp-gov-003',
    enunciado: 'O plano que define as diretrizes, objetivos e metas da Administração para um período de quatro anos chama-se ___.',
    resposta: 'Plano Plurianual',
    dica: 'PPA — CF/88 art. 165, I — vigência de 4 anos',
    nivel: 1,
    topico: 'Governança organizacional — conceito, princípios e instâncias',
  },
  {
    id: 'agp-gov-004',
    enunciado: 'A ISO 31000:2018 estabelece diretrizes para gestão de riscos. O modelo que divide as responsabilidades de controle em três camadas é chamado de modelo de ___ linhas.',
    resposta: 'três',
    dica: 'Modelo de três linhas — gestão, controles internos e auditoria interna',
    nivel: 2,
    topico: 'Governança organizacional — conceito, princípios e instâncias',
  },
  {
    id: 'agp-gov-005',
    enunciado: 'Ana sofreu assédio moral de seu chefe no ambiente de trabalho. A convenção internacional da OIT que trata de violência e assédio no trabalho é a de número ___.',
    resposta: '190',
    dica: 'Convenção OIT 190/2019 — violência e assédio no mundo do trabalho',
    nivel: 2,
    topico: 'Governança organizacional — conceito, princípios e instâncias',
  },
];

// LÍNGUA PORTUGUESA - Concordância nominal e verbal
export const QUESTOES_PORTUGUES: Questao[] = [
  {
    id: 'lp-cov-001',
    enunciado: 'Na frase "Os documentos foram entregues à autoridade competente", o verbo "foram entregues" está na voz ___.',
    resposta: 'passiva',
    dica: 'Voz passiva analítica — auxiliar ser/estar + particípio',
    nivel: 1,
    topico: 'Concordância nominal e verbal',
  },
  {
    id: 'lp-cov-002',
    enunciado: 'Na frase "Havia muitos erros no lançamento", o verbo "havia" no sentido de existir é ___ e não vai ao plural.',
    resposta: 'impessoal',
    dica: 'Haver impessoal = existir — sempre singular',
    nivel: 1,
    topico: 'Concordância nominal e verbal',
  },
  {
    id: 'lp-cov-003',
    enunciado: 'Na frase "Trata-se de documentos sigilosos", o pronome "se" indica que o verbo está na voz ___.',
    resposta: 'passiva sintética',
    dica: 'Voz passiva sintética — verbo + se (partícula apassivadora)',
    nivel: 2,
    topico: 'Concordância nominal e verbal',
  },
  {
    id: 'lp-cov-004',
    enunciado: 'A frase "O auditor aspirava ___ cargo de diretor" exige a preposição "a" porque aspirar no sentido de desejar é verbo de regência ___.',
    resposta: 'indireta',
    dica: 'Aspirar (desejar) → aspirar A algo. Aspirar (absorver) → sem preposição',
    nivel: 2,
    topico: 'Concordância nominal e verbal',
  },
  {
    id: 'lp-cov-005',
    enunciado: 'Em "Embora o servidor ___ cometido a infração, não houve punição", o verbo deve estar no subjuntivo: ___.',
    resposta: 'tenha',
    dica: 'Embora exige sempre modo subjuntivo',
    nivel: 2,
    topico: 'Concordância nominal e verbal',
  },
];

// MATEMÁTICA/ESTATÍSTICA - Juros compostos
export const QUESTOES_MATEMATICA: Questao[] = [
  {
    id: 'mat-jc-001',
    enunciado: 'Pedro aplicou R$ 2.000 a juros simples de 3% ao mês por 4 meses. O montante ao final é R$ ___.',
    resposta: '2240',
    dica: 'M = C(1 + it) = 2000 × (1 + 0,03 × 4) = 2000 × 1,12 = 2240',
    nivel: 1,
    topico: 'Juros compostos — montante, capitalização contínua',
  },
  {
    id: 'mat-jc-002',
    enunciado: 'No sistema Price, as prestações são ___ e os juros diminuem ao longo do tempo enquanto a amortização aumenta.',
    resposta: 'iguais',
    dica: 'Sistema Price (francês) — prestações constantes',
    nivel: 1,
    topico: 'Juros compostos — montante, capitalização contínua',
  },
  {
    id: 'mat-jc-003',
    enunciado: 'No Sistema de Amortização Constante, as parcelas de amortização são ___ e as prestações totais diminuem ao longo do tempo.',
    resposta: 'iguais',
    dica: 'SAC — amortização constante, prestação decrescente',
    nivel: 1,
    topico: 'Juros compostos — montante, capitalização contínua',
  },
  {
    id: 'mat-jc-004',
    enunciado: 'Ana aplicou R$ 1.000 a juros compostos de 10% ao ano por 2 anos. O montante final é R$ ___.',
    resposta: '1210',
    dica: 'M = C(1+i)^n = 1000 × (1,1)² = 1000 × 1,21 = 1210',
    nivel: 1,
    topico: 'Juros compostos — montante, capitalização contínua',
  },
  {
    id: 'mat-jc-005',
    enunciado: 'A taxa que produz o mesmo montante que a taxa nominal quando aplicada no mesmo período é chamada de taxa ___.',
    resposta: 'efetiva',
    dica: 'Taxa efetiva — equivalente à nominal considerando capitalização real',
    nivel: 2,
    topico: 'Juros compostos — montante, capitalização contínua',
  },
];

// ECONOMIA - Conceitos fundamentais
export const QUESTOES_ECONOMIA: Questao[] = [
  {
    id: 'eco-cfem-001',
    enunciado: 'O governo impôs um imposto sobre bebidas alcoólicas e a arrecadação caiu porque o consumo despencou. Esse imposto tem demanda muito ___ ao preço.',
    resposta: 'elástica',
    dica: 'Elasticidade-preço alta — consumidor é sensível ao preço',
    nivel: 1,
    topico: 'Conceitos fundamentais e equilíbrio de mercado',
  },
  {
    id: 'eco-cfem-002',
    enunciado: 'Bens que não têm rival no consumo e não excluem ninguém de usá-los são chamados de bens ___.',
    resposta: 'públicos',
    dica: 'Bens públicos — não rivais e não excludentes. Ex: segurança nacional',
    nivel: 1,
    topico: 'Conceitos fundamentais e equilíbrio de mercado',
  },
  {
    id: 'eco-cfem-003',
    enunciado: 'A fábrica despeja resíduos no rio prejudicando pescadores sem pagar por isso. Em economia, esse custo não compensado é chamado de ___.',
    resposta: 'externalidade negativa',
    dica: 'Externalidade negativa — custo imposto a terceiros sem compensação',
    nivel: 1,
    topico: 'Conceitos fundamentais e equilíbrio de mercado',
  },
  {
    id: 'eco-cfem-004',
    enunciado: 'A regra de Ramsey recomenda tributar mais os bens com demanda menos ___ para minimizar o peso morto.',
    resposta: 'elástica',
    dica: 'Regra de Ramsey — alíquota inversamente proporcional à elasticidade',
    nivel: 2,
    topico: 'Conceitos fundamentais e equilíbrio de mercado',
  },
  {
    id: 'eco-cfem-005',
    enunciado: 'Quando o governo aumenta os gastos públicos e a renda total cresce mais do que o aumento original dos gastos, esse fenômeno é chamado de efeito ___.',
    resposta: 'multiplicador',
    dica: 'Multiplicador keynesiano — M = 1/(1-PMgC)',
    nivel: 2,
    topico: 'Conceitos fundamentais e equilíbrio de mercado',
  },
];

export const QUESTOES_MOCK: Record<string, Questao[]> = {
  'Crédito tributário — lançamento, suspensão, extinção, exclusão': QUESTOES_CREDITO_TRIBUTARIO,
  'Governança organizacional — conceito, princípios e instâncias': QUESTOES_GOVERNANCA,
  'Concordância nominal e verbal': QUESTOES_PORTUGUES,
  'Juros compostos — montante, capitalização contínua': QUESTOES_MATEMATICA,
  'Conceitos fundamentais e equilíbrio de mercado': QUESTOES_ECONOMIA,
};
