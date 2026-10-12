import { normalize } from './core.js';
const stopWords = new Set(
  'la gi cua va cho toi minh ban ve co the nao tai sao mot nhung duoc khong bao nhieu hay voi tu xin hoi'.split(
    ' ',
  ),
);
export function retrieve(question, articles) {
  const tokens = [
    ...new Set(
      normalize(question)
        .split(' ')
        .filter((w) => w.length > 1 && !stopWords.has(w)),
    ),
  ];
  const ranked = articles
    .map((article) => {
      const heading = normalize([article.title, ...article.tags].join(' ')).split(' ');
      const text = normalize(`${article.summary} ${article.body}`).split(' ');
      return {
        article,
        score: tokens.reduce(
          (sum, word) => sum + (heading.includes(word) ? 3 : text.includes(word) ? 1 : 0),
          0,
        ),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked
    .filter((x) => x.score >= ranked[0].score * 0.5)
    .slice(0, 3)
    .map((x) => x.article);
}
