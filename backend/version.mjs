import packageInfo from '../package.json' with { type: 'json' };
export const releaseInfo = Object.freeze({ app: 'musuroom', release: packageInfo.displayName, version: packageInfo.version });
