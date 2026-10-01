function normalized(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
}

function match(text, terms) {
  const words=' '+text+' ';
  return terms.filter(term => words.includes(' '+normalized(term)+' '));
}

function choose(text, dictionary) {
  const value = normalized(text);
  const ranked = Object.entries(dictionary)
    .map(([key, terms]) => ({ key, matched: match(value, terms) }))
    .filter(item => item.matched.length)
    .sort((a, b) => b.matched.length - a.matched.length || a.key.localeCompare(b.key));
  if (!ranked.length || (ranked[1] && ranked[0].matched.length === ranked[1].matched.length)) {
    return { key: 'other', matchedTerms: ranked.flatMap(item => item.matched).slice(0, 6) };
  }
  return { key: ranked[0].key, matchedTerms: ranked[0].matched.slice(0, 6) };
}

const sensoryTerms = Object.freeze({
  color: ['mau', 'sac', 'vang', 'nau', 'do dam', 'do nhat', 'appearance', 'color'],
  aroma: ['mui', 'thom', 'huong', 'aroma', 'smell'],
  umami: ['umami', 'vi ngon', 'ngot thit', 'dam da', 'savory'],
  aftertaste: ['hau vi', 'luu vi', 'dang', 'chat', 'aftertaste'],
  overall: ['tong the', 'hai long', 'ua thich', 'chap nhan', 'overall']
});

const knowledgeTerms = Object.freeze({
  ingredients: ['nguyen lieu', 'nam an', 'phu pham nam', 'bao ngu', 'nam huong', 'ingredient', 'mushroom'],
  flavor: ['umami', 'mui', 'thom', 'huong vi', 'vi ngon', 'flavor', 'aroma'],
  safety: ['an toan', 'hoat do nuoc', 'bao quan', 'vi sinh', 'on dinh', 'food safety', 'water activity'],
  methods: ['phuong phap', 'quy trinh', 'thiet ke', 'thi nghiem', 'can bang khoi luong', 'method', 'study design']
});

export function localSensoryClassification(comment, labels, reason) {
  const result = choose(comment, sensoryTerms);
  return {
    mode: 'local', source: 'keyword_rules', reason,
    key: result.key, label: labels[result.key], confidence: null, probabilities: null,
    matched_terms: result.matchedTerms, requires_review: true,
    message: 'Phân loại cục bộ theo từ khóa; cần người vận hành kiểm tra trước khi sử dụng.'
  };
}

export function localKnowledgeClassification(document, reason) {
  const data = document?.data ?? {};
  const result = choose([data.title, data.summary, data.body, data.limitation, ...(data.tags ?? [])].join(' '), knowledgeTerms);
  return {
    mode: 'local', source: 'keyword_rules', reason,
    topic: result.key, confidence: null, probabilities: null,
    matched_terms: result.matchedTerms, requires_review: true,
    rubric_version: 'knowledge-topic-local-1',
    message: 'Phân loại cục bộ theo từ khóa; cần người vận hành kiểm tra trước khi sử dụng.'
  };
}
