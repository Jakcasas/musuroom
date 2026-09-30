import { readProviderJson } from './provider-response.mjs';
const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
// One gateway per application: chat and sensory interpretation share the same budget.
// Only counters/timestamps are retained; requests and answers are never cached.
export function createModelGateway(config, fetchImpl = fetch, { now = Date.now } = {}) {
  let active = 0;
  let blockedUntil = 0;
  const concurrency = config.aiConcurrency ?? 2;
  const cooldown = config.aiCooldownMs ?? 30000;
  const failure = (reason, wait = cooldown) => {
    blockedUntil = Math.max(blockedUntil, now() + wait);
    return { reason, ...(blockedUntil > now() ? { retry_after: Math.ceil((blockedUntil - now()) / 1000) } : {}) };
  };
  return async ({ messages, temperature, maxTokens = config.maxTokens }) => {
    if (config.provider !== 'openrouter') return { reason: 'ai_disabled' };
    if (now() < blockedUntil) return { reason: 'provider_cooldown', retry_after: Math.ceil((blockedUntil - now()) / 1000) };
    if (active >= concurrency) return { reason: 'ai_busy' };
    active++;
    const controller = new AbortController();
    let timer;
    try {
      const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('provider_timeout')); }, config.timeout);
      });
      const operation = (async () => {
        const response = await fetchImpl(endpoint, {
          method: 'POST', redirect: 'error', signal: controller.signal,
          headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: config.model, temperature, max_tokens: Math.min(maxTokens, config.maxTokens), messages })
        });
        if (!response.ok) {
          response.body?.cancel?.().catch(() => {});
          const raw = response.headers?.get('retry-after');
          const requestedWait = raw == null ? 0 : /^\d+(?:\.\d+)?$/.test(raw) ? Number(raw) * 1000 : Date.parse(raw) - now();
          return failure('provider_unavailable', Math.max(cooldown, Math.min(120000, Number.isFinite(requestedWait) ? Math.max(0, requestedWait) : 0)));
        }
        const data = await readProviderJson(response, controller.signal);
        // HTTP 200 can still contain a provider error or a truncated completion.
        const choice = data?.choices?.[0];
        if (data?.error || choice?.error || (choice?.finish_reason != null && choice.finish_reason !== 'stop') || typeof choice?.message?.content !== 'string' || !choice.message.content.trim()) {
          return failure('invalid_response');
        }
        return { text: choice.message.content };
      })();
      return await Promise.race([operation, deadline]);
    } catch {
      return failure('provider_unavailable');
    } finally {
      clearTimeout(timer);
      controller.abort();
      active--;
    }
  };
}
