import { Document, DocStatus, Suggestion, SuggestionType, Severity, RiskReport } from './types';

export const MOCK_DOCS: Document[] = [
  {
    id: '1',
    title: 'uzaktan_egitim_okuryazarlik.docx',
    status: DocStatus.NEEDS_REVIEW,
    lastEdited: 'Just now',
    wordCount: 452,
    content: `
      <h2>Uzaktan Eğitim Süreçlerinde Dijital Okuryazarlık ile Akademik Başarı Arasındaki İlişki</h2>
      <h3>Özet</h3>
      <p>Son yıllarda uzaktan eğitim uygulamalarının yaygınlaşması, öğrencilerin dijital ortamlarda öğrenme süreçlerine daha aktif biçimde katılmalarını zorunlu hale getirmiştir. Bu bağlamda dijital okuryazarlık kavramı, öğrencilerin çevrim içi öğrenme ortamlarında başarılı olabilmeleri açısından önemli bir değişken olarak öne çıkmaktadır.</p>
      <p>Bu çalışmada, üniversite öğrencilerinin dijital okuryazarlık düzeyleri ile akademik başarıları arasındaki ilişkinin incelenmesi amaçlanmıştır. Nicel araştırma yöntemlerinden ilişkisel tarama modelinin kullanıldığı araştırmaya, Türkiye'deki çeşitli üniversitelerde öğrenim gören 450 lisans öğrencisi katılmıştır. Veri toplama aracı olarak "Dijital Okuryazarlık Ölçeği" ve öğrencilerin genel akademik not ortalamaları (GNO) kullanılmıştır.</p>
      <p>Analiz sonuçları, öğrencilerin dijital okuryazarlık seviyelerinin orta düzeyin üzerinde olduğunu göstermektedir (p < .05). Ayrıca, regresyon analizi sonuçlarına göre dijital okuryazarlık, akademik başarının anlamlı bir yordayıcısıdır.</p>
    `
  },
  {
    id: '2',
    title: 'ai_ethics_in_healthcare.docx',
    status: DocStatus.REVIEWED,
    lastEdited: '2h ago',
    wordCount: 2105,
    content: `
      <h2>Ethical Implications of AI in Healthcare Diagnostics</h2>
      <h3>Abstract</h3>
      <p>Artificial intelligence (AI) is rapidly transforming the landscape of medical diagnostics. While the potential for improved accuracy is significant, ethical concerns remain regarding data privacy and algorithmic bias. This paper explores these dimensions.</p>
      <p>We utilized a qualitative approach, interviewing 15 medical practitioners. The results suggest that while doctors trust AI for image recognition, they are hesitant about black-box algorithms making final decisions.</p>
    `
  }
];

export const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 's1',
    type: SuggestionType.GRAMMAR,
    severity: Severity.HIGH,
    originalText: "katılmalarını",
    suggestedText: "katılımlarını",
    explanation: "Using 'katılımlarını' (their participation) is more noun-focused and formal than the verbal noun 'katılmalarını' in this context."
  },
  {
    id: 's2',
    type: SuggestionType.CLARITY,
    severity: Severity.MEDIUM,
    originalText: "önemli bir değişken olarak öne çıkmaktadır",
    suggestedText: "kritik bir belirleyicidir",
    explanation: "The phrase is slightly repetitive. 'Kritik bir belirleyicidir' is more direct and academic."
  },
  {
    id: 's3',
    type: SuggestionType.APA,
    severity: Severity.HIGH,
    originalText: "p < .05",
    suggestedText: "p < .05",
    explanation: "Ensure exact spacing around the operator. APA 7 requires spaces around mathematical operators (p < .05)."
  },
  {
    id: 's4',
    type: SuggestionType.STYLE,
    severity: Severity.LOW,
    originalText: "kullanılmıştır",
    suggestedText: "tercih edilmiştir",
    explanation: "To avoid repetition of 'kullanılmıştır' at the end of consecutive sentences, consider 'tercih edilmiştir' or restructuring."
  }
];

export const MOCK_RISK_REPORT: RiskReport = {
  score: 'B+',
  label: 'Good start',
  warnings: [
    'Abstract lacks specific statistical values (r or beta coefficients) despite mentioning regression.',
    'Sample selection method is not clearly defined in the summary.',
    'Ensure consistency in decimal separators (use dots for English, commas for Turkish context if submitting to TR journal, but check specific journal guidelines).'
  ]
};
