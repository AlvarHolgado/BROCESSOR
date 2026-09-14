import { describe, expect, it } from 'vitest';
import {
  extractCcaaCode,
  extractEmploymentType,
  extractMortgageType,
  extractName,
  extractNumber,
  extractNumberOrZeroForNegation,
  extractPropertyType,
  extractPropertyUsage,
  extractYesNo,
} from './extraction';

describe('extractYesNo', () => {
  it('recognizes affirmative replies per language', () => {
    expect(extractYesNo('sí, descarrega\'l', 'ca')).toBe(true);
    expect(extractYesNo('vale, adelante', 'es')).toBe(true);
    expect(extractYesNo('yes please', 'en')).toBe(true);
  });

  it('recognizes negative replies per language, even with a trailing clause', () => {
    expect(extractYesNo('no, ara no', 'ca')).toBe(false);
    expect(extractYesNo('no, gracias', 'es')).toBe(false);
    expect(extractYesNo('no thanks', 'en')).toBe(false);
  });

  it('checks negation before affirmation so "no, ..." never false-positives as yes', () => {
    expect(extractYesNo('no, si us plau no', 'ca')).toBe(false);
  });

  it('returns null when the reply gives no clear signal', () => {
    expect(extractYesNo('potser més tard', 'ca')).toBeNull();
  });
});

describe('extractNumber', () => {
  it('parses a plain integer', () => {
    expect(extractNumber('3500')).toBe(3500);
  });

  it('parses European-style grouping with a comma decimal', () => {
    expect(extractNumber('uns 2.500 euros al mes')).toBe(2500);
    expect(extractNumber('200.000')).toBe(200000);
    expect(extractNumber('1.234,56')).toBeCloseTo(1234.56);
  });

  it('parses Anglo-style grouping with a dot decimal', () => {
    expect(extractNumber('around $3,200')).toBe(3200);
    expect(extractNumber('1,234.56')).toBeCloseTo(1234.56);
  });

  it('parses a "k" shorthand as thousands', () => {
    expect(extractNumber('20k')).toBe(20000);
    expect(extractNumber('about 3k euros')).toBe(3000);
  });

  it('parses a "mil" shorthand as thousands', () => {
    expect(extractNumber('20 mil')).toBe(20000);
  });

  it('returns null when no number is present', () => {
    expect(extractNumber('no ho sé')).toBeNull();
    expect(extractNumber('')).toBeNull();
  });
});

describe('extractNumberOrZeroForNegation', () => {
  it('still extracts a real number when present', () => {
    expect(extractNumberOrZeroForNegation('150 euros', 'ca')).toBe(150);
  });

  it('treats a negation reply as 0, per language', () => {
    expect(extractNumberOrZeroForNegation('no, cap deute', 'ca')).toBe(0);
    expect(extractNumberOrZeroForNegation('no tenemos ninguna', 'es')).toBe(0);
    expect(extractNumberOrZeroForNegation("no, we don't have any", 'en')).toBe(0);
  });

  it('returns null when neither a number nor a recognized negation is present', () => {
    expect(extractNumberOrZeroForNegation('quina pregunta més difícil', 'ca')).toBeNull();
  });
});

describe('extractName', () => {
  it('title-cases a plain name', () => {
    expect(extractName('marc puig')).toBe('Marc Puig');
  });

  it('strips a common self-introduction prefix', () => {
    expect(extractName('em dic Laia Soler')).toBe('Laia Soler');
    expect(extractName('my name is John Smith')).toBe('John Smith');
  });

  it('rejects a numeric-only reply', () => {
    expect(extractName('35')).toBeNull();
  });

  it('rejects a reply containing a digit, even if mostly words (it is answering a different question, e.g. an age)', () => {
    expect(extractName('Té 35 anys')).toBeNull();
  });

  it('rejects a reply that reads like a sentence rather than a name', () => {
    expect(extractName('no ho sé encara, potser la setmana que ve')).toBeNull();
  });

  it('rejects an empty or too-short reply', () => {
    expect(extractName('')).toBeNull();
    expect(extractName('a')).toBeNull();
  });
});

describe('extractEmploymentType', () => {
  it('matches known categories per language', () => {
    expect(extractEmploymentType('sóc autònom', 'ca')).toBe('SELF_EMPLOYED');
    expect(extractEmploymentType('soy funcionario', 'es')).toBe('STATE_OFFICIAL');
    expect(extractEmploymentType('I am self-employed', 'en')).toBe('SELF_EMPLOYED');
    expect(extractEmploymentType('estic a l\'atur', 'ca')).toBe('UNEMPLOYED');
  });

  it('falls back to OTHER for a descriptive but unrecognized reply', () => {
    expect(extractEmploymentType('tinc una beca de recerca', 'ca')).toBe('OTHER');
  });

  it('returns null for a reply too short to be meaningful', () => {
    expect(extractEmploymentType('a', 'ca')).toBeNull();
  });
});

describe('extractPropertyType', () => {
  it('matches new build vs resale per language', () => {
    expect(extractPropertyType('és obra nova', 'ca')).toBe('NEW_BUILD');
    expect(extractPropertyType('es de segunda mano', 'es')).toBe('SECOND_HAND');
    expect(extractPropertyType('it is a resale property', 'en')).toBe('SECOND_HAND');
  });

  it('returns null when unrecognized', () => {
    expect(extractPropertyType('no ho sé', 'ca')).toBeNull();
  });
});

describe('extractPropertyUsage', () => {
  it('matches primary vs second home per language', () => {
    expect(extractPropertyUsage('serà el meu habitatge habitual', 'ca')).toBe('HABITUAL');
    expect(extractPropertyUsage('es una segunda residencia', 'es')).toBe('SECOND_HOME');
    expect(extractPropertyUsage('it will be a holiday home', 'en')).toBe('SECOND_HOME');
  });
});

describe('extractMortgageType', () => {
  it('matches fixed/variable/mixed per language', () => {
    expect(extractMortgageType('la vull fixa', 'ca')).toBe('FIXED');
    expect(extractMortgageType('quiero variable', 'es')).toBe('VARIABLE');
    expect(extractMortgageType('mixed please', 'en')).toBe('MIXED');
  });
});

describe('extractCcaaCode', () => {
  const candidates = [
    { code: 'MAD', names: ['Madrid'] },
    { code: 'CAT', names: ['Catalunya', 'Cataluña', 'Catalonia'] },
  ];

  it('matches case/diacritic-insensitively against any provided name variant', () => {
    expect(extractCcaaCode('vull comprar a MADRID', candidates)).toBe('MAD');
    expect(extractCcaaCode('en Catalunya', candidates)).toBe('CAT');
    expect(extractCcaaCode('in Catalonia', candidates)).toBe('CAT');
  });

  it('returns null when nothing matches', () => {
    expect(extractCcaaCode('no sé quina regió', candidates)).toBeNull();
  });
});
