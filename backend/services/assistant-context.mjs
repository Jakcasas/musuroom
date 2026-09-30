const shorten = (text, limit) => text.slice(0, Math.max(0, limit)).replace(/[\uD800-\uDBFF]$/, '');

// Budget is measured on serialized document JSON, not an estimated token count.
export function assistantContext(documents, maxChars = 12000) {
  const perDocument = Math.floor((maxChars - 2) / documents.length) - 1;
  return documents.map(article => {
    const document = { ref: article.ref, title: article.title, summary: article.summary, body: article.body, limitation: article.limitation };
    const original = JSON.stringify(document);
    if (original.length <= perDocument) return document;
    document.truncated = true;
    for (const field of ['body', 'summary', 'title', 'limitation']) {
      let excess = JSON.stringify(document).length - perDocument;
      while (excess > 0 && document[field].length) {
        document[field] = shorten(document[field], document[field].length - excess);
        excess = JSON.stringify(document).length - perDocument;
      }
      if (excess <= 0) break;
    }
    return document;
  });
}
