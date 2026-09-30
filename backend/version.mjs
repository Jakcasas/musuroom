import packageInfo from '../package.json' with { type: 'json' };
export const releaseInfo = Object.freeze({ app: 'musuroom', release: 'Musuroom 1', version: packageInfo.version });
