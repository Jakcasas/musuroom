const maxResponseBytes = 65536;

export async function readProviderJson(response, signal) {
  signal.throwIfAborted();
  const length = Number(response.headers?.get('content-length'));
  if (length > maxResponseBytes) throw new Error('response_too_large');
  if (!response.body?.getReader) {
    const data = await response.json();
    if (Buffer.byteLength(JSON.stringify(data)) > maxResponseBytes) throw new Error('response_too_large');
    return data;
  }
  const reader = response.body.getReader();
  const abort = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > maxResponseBytes) throw new Error('response_too_large');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally {
    signal.removeEventListener('abort', abort);
    reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function withProviderDeadline(task, timeout) {
  const controller = new AbortController();
  let timer;
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('provider_timeout')); }, timeout);
    });
    return await Promise.race([task(controller.signal), deadline]);
  } finally {
    clearTimeout(timer); controller.abort();
  }
}
