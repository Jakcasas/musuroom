import { mongoFailureCode } from './mongo-store.mjs';

const safeReasons = new Set([
  'atlas_authentication_failed', 'atlas_permission_denied', 'atlas_tls_failed',
  'atlas_network_unavailable', 'atlas_database_name_invalid', 'connection_unavailable',
]);
export function databaseFailure(error) {
  if (safeReasons.has(error?.code)) return error.code;
  const reason = mongoFailureCode(error);
  if (reason !== 'connection_unavailable') return reason;
  if (['MongoNetworkError', 'MongoNetworkTimeoutError', 'MongoOperationTimeoutError',
    'MongoTopologyClosedError', 'MongoNotConnectedError', 'MongoPoolClearedError'].includes(error?.name))
    return 'atlas_network_unavailable';
  if (['08000', '08003', '08006', '57P01', 'ECONNRESET'].includes(error?.code))
    return 'connection_unavailable';
  return null;
}

// Record transitions only. Never log driver messages, credentials, query strings or form content.
export function createHealthReporter(log = entry => console.error(JSON.stringify(entry))) {
  let previous = 'ok';
  return (error) => {
    const state = error ? (databaseFailure(error) || 'connection_unavailable') : 'ok';
    if (state === previous) return;
    previous = state;
    log({ event: 'database_health', state: state === 'ok' ? 'recovered' : 'unavailable', reason: state });
  };
}

export function startHealthMonitor(check, report, intervalMs = 60000) {
  let stopped = false;
  let timer;
  let active = Promise.resolve();
  const run = async () => {
    try { await check(); if(!stopped)report(); } catch (error) { if(!stopped)report(error); }
    if (!stopped) schedule();
  };
  const schedule = () => { timer = setTimeout(() => { active=run(); }, intervalMs); timer.unref(); };
  schedule();
  return () => { stopped = true; clearTimeout(timer); return active; };
}
