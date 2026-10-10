/** True for the testing build served at /beta. */
export const isBeta = import.meta.env.BASE_URL === "/beta/";

/** Production keys stay unchanged so existing saved plans keep working. */
export function storageKey(name: string) {
  return isBeta ? `dpacer:beta:${name}` : `dpacer:${name}`;
}
