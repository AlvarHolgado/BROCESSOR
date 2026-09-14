/**
 * Picks between second-person-singular ("tu") and second-person-plural
 * ("vosaltres") Catalan phrasing depending on the number of mortgage
 * holders. This is a lookup over pre-written variants, not a grammatical
 * conjugator — callers supply both forms of each phrase.
 */
export function choosePhrase(numberOfHolders: number, singular: string, plural: string): string {
  return numberOfHolders > 1 ? plural : singular;
}

/**
 * Joins the holders' entered names into a locale-style address label (e.g.
 * "Marc", "Marc i Laia", "Marc, Laia i Jordi"), for headings that can
 * address the holder(s) by name once identity has been entered. Returns an
 * empty string when any holder's name is still blank, so callers can fall
 * back to pronoun-based phrasing via choosePhrase. `conjunction` is the
 * localized word for "and" (e.g. Dictionary['common']['conjunction']).
 */
export function buildAddressLabel(holderNames: string[], numberOfHolders: number, conjunction: string): string {
  const names = holderNames.slice(0, numberOfHolders).map((name) => name.trim());
  if (numberOfHolders <= 0 || names.length !== numberOfHolders || names.some((name) => name === '')) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  return `${names.slice(0, -1).join(', ')} ${conjunction} ${names[names.length - 1]}`;
}
