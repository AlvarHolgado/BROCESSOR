/**
 * Catalan (canonical/default) UI + PDF dictionary. This is the reference
 * shape every other language dictionary must satisfy — see Dictionary in
 * this same file's exported type, and es.ts/en.ts which implement it.
 * Content here is a direct extraction of the strings that used to be
 * hardcoded across the wizard's screens, unchanged in wording.
 */
import { choosePhrase } from '../../utils/grammar';

export const ca = {
  common: {
    brand: 'BROSSESSOR',
    stepLabel: (step: number, total: number) => `Pas ${step} de ${total}`,
    back: 'Enrere',
    continueDefault: 'Continuar',
    conjunction: 'i',
    completePreviousSteps: 'Completa les dades dels passos anteriors per continuar.',
    /** "Taxa Anual Equivalent" abbreviation — kept as "TAE" for CAT/ES since it's the Spanish-regulated product's own term, translated to "APR" for EN to match that market's convention. */
    taeAbbreviation: 'TAE',
  },

  languageSelect: {
    title: 'Tria el teu idioma',
    subtitle: 'Selecciona l’idioma en què vols fer la simulació i rebre l’informe.',
    cta: 'Continuar →',
  },

  screen1: {
    subtitle: 'Simulador hipotecari',
    cta: 'Començar simulació →',
  },

  screen2: {
    intro: (n: number, vocative: string) =>
      vocative + choosePhrase(n, 'introdueix les teves dades financeres.', 'introduïu les vostres dades financeres.'),
    numberOfHoldersHeading: 'Nombre de titulars',
    holderCountOne: '1 titular',
    holderCountTwo: '2 titulars',
    holderCountMore: 'Més de 2',
    exactHolderCountLabel: 'Nombre exacte de titulars',
    whoAreYouHeading: 'Qui sou?',
    whoAreYouHelper: 'Indica el nom i cognoms i l’edat de cada titular de la hipoteca.',
    holderNameLabel: (index: number) => `Nom i cognoms Titular ${index + 1}`,
    holderAgeLabel: (index: number) => `Edat Titular ${index + 1}`,
    ageHint: (age: number) => `${age} anys`,
    employmentHeading: (n: number) => choosePhrase(n, 'Quina és la teva situació laboral?', 'Quina és la situació laboral de cada titular?'),
    employmentTypeLabel: (holderLabel: string) => `Situació laboral ${holderLabel}`,
    selectPlaceholder: '-- Selecciona --',
    employmentOtherLabel: (holderLabel: string) => `Explica la situació laboral de ${holderLabel}`,
    employmentOtherPlaceholder: 'p. ex. Excedència, renda bàsica, ingressos per lloguer...',
    incomeHeading: 'Ingressos nets mensuals (€)',
    incomeHelper: 'Se sumaran automàticament per calcular la capacitat d’endeutament conjunta.',
    incomeFieldLabel: (holderLabel: string) => `${holderLabel} (€/mes)`,
    totalIncomeLabel: 'Total ingressos nets mensuals',
    debtsHeading: (n: number, vocative: string) => vocative + choosePhrase(n, 'tens deutes mensuals pendents?', 'teniu deutes mensuals pendents?'),
    pendingDebtsLabel: 'Deutes mensuals pendents (€)',
    pendingDebtsRemainingLabel: 'Durada restant dels deutes (mesos)',
    monthsHint: (months: number) => `${months} mesos`,
    savingsHeading: (n: number, vocative: string) => vocative + choosePhrase(n, 'quants estalvis tens disponibles?', 'quants estalvis teniu disponibles?'),
    savingsLabel: 'Estalvis disponibles (€)',
    holderFallbackLabel: (index: number) => `Titular ${index + 1}`,
  },

  screen3: {
    intro: (n: number) => choosePhrase(n, 'Parla’ns de l’habitatge que vols finançar.', 'Parleu-nos de l’habitatge que voleu finançar.'),
    purchaseValueHeading: 'Preu de l’habitatge (€)',
    purchaseValueLabel: 'Preu de l’habitatge (€)',
    appraisalValueLabel: 'Valor de taxació (€)',
    propertyTypeLabel: 'Tipus d’habitatge',
    propertyUsageHeading: 'Ús de l’habitatge',
    ccaaHeading: 'Comunitat Autònoma',
    ccaaHelper: 'Determina els impostos (ITP/AJD) aplicables a l’operació.',
    ccaaLabel: 'Comunitat Autònoma',
    ltvHeading: 'Percentatge de finançament desitjat (%)',
    ltvHelper:
      'El TIN es determina automàticament a partir de dades de mercat: no cal introduir-lo. Aquest percentatge només aplica al càlcul amb banc — el broker adapta el finançament al perfil: el màxim possible dins d’un esforç sostenible si el banc no pot finançar l’operació, o el sol·licitat amb les condicions més econòmiques si és viable.',
    ltvLabel: 'Percentatge de finançament desitjat (%)',
    ltvHint: (pct: number) => `${pct}%`,
    durationHeading: 'Termini (anys)',
    durationLabel: 'Termini (anys)',
    durationHint: (years: number) => `${years} anys`,
    mortgageTypeHeading: 'Tipus d’hipoteca',
    mortgageTypeLabel: 'Tipus d’hipoteca',
    mortgageTypeComingSoon: 'Properament',
  },

  screen4: {
    intro: (n: number) =>
      choosePhrase(
        n,
        'Aquestes són les condicions que un banc et podria oferir directament per al teu finançament, amb i sense les bonificacions habituals (nòmina, assegurances, etc.).',
        'Aquestes són les condicions que un banc us podria oferir directament per al vostre finançament, amb i sense les bonificacions habituals (nòmina, assegurances, etc.).'
      ),
    noMarketData: 'No hi ha dades de TIN de mercat disponibles per a aquesta modalitat — no es pot calcular la quota.',
    continueCta: 'Explorar opció Broker →',
  },

  screen5: {
    intro: (n: number) =>
      choosePhrase(
        n,
        'Un broker negocia el teu finançament amb múltiples entitats simultàniament, buscant les millors condicions disponibles al mercat.',
        'Un broker negocia el vostre finançament amb múltiples entitats simultàniament, buscant les millors condicions disponibles al mercat.'
      ),
    strategy: {
      maxFinancingTitle: 'Estratègia del broker: màxim finançament',
      maxFinancingWhy: (reasons: string) =>
        `El banc directe no pot finançar aquesta operació tal com es planteja (${reasons}). Per això el broker prioritza aconseguir el major percentatge de finançament possible, acceptant un endeutament superior al 35% habitual dels bancs sempre que continuï sent sostenible.`,
      reasonLtv: 'el percentatge de finançament sol·licitat supera el límit del banc',
      reasonDsti: (threshold: string) => `la ràtio d’endeutament (DSTI) superaria el ${threshold}`,
      reasonSavings: 'els estalvis disponibles més el finançament màxim del banc no cobreixen el preu de compra i els costos',
      structureWithExtra: (ceilingLtv: string, loan: string, actualLtv: string, extra: string, contributionSaving: string) =>
        `Estructura: el broker negocia l’operació amb un límit de ${ceilingLtv} de LTV (el màxim del canal) i la finança amb un préstec de ${loan} (${actualLtv} de LTV real), és a dir, ${extra} més que el banc; l’aportació inicial es redueix en ${contributionSaving}.`,
      structureNoExtra: (ceilingLtv: string, loan: string, actualLtv: string) =>
        `Estructura: el broker negocia l’operació amb un límit de ${ceilingLtv} de LTV (el màxim del canal); el préstec resultant és de ${loan} (${actualLtv} de LTV real), el mateix import que amb el banc.`,
      sustainabilityLimited: (ceilingLtv: string, dstiFull: string, limit: string, loan: string, actualLtv: string) =>
        `Al límit de ${ceilingLtv} de LTV, la ràtio d’endeutament (DSTI) arribaria al ${dstiFull}, per sobre del ${limit} que el broker considera sostenible. Per això limita el préstec a ${loan} (${actualLtv} de LTV real): el màxim finançament que manté l’esforç dins del ${limit}.`,
      conditionDstiWithin: (dsti: string, threshold: string) =>
        `Amb aquest import, la ràtio d’endeutament (DSTI) és del ${dsti}, dins del límit del ${threshold}.`,
      conditionDstiAboveGreen: (dsti: string, green: string, limit: string) =>
        `Amb aquest import, la ràtio d’endeutament (DSTI) és del ${dsti}: per sobre del ${green} habitual dels bancs, però dins del ${limit} que el broker considera sostenible (risc moderat). L’aprovació dependrà de l’anàlisi de risc de l’entitat financera.`,
      conditionDstiAboveLimit: (dsti: string, limit: string) =>
        `Amb aquest import, la ràtio d’endeutament (DSTI) seria del ${dsti}, per sobre del ${limit} que el broker considera sostenible: amb el nivell de deutes actual l’operació no es pot viabilitzar de manera sostenible.`,
      conditionNotFullyFinanceable:
        'Fins i tot amb el màxim finançament sostenible del broker, els estalvis disponibles no cobreixen la totalitat de l’entrada i els costos.',
      conditionApproval: (ltv: string) =>
        `El ${ltv} de LTV és la convenció de mercat del canal broker, no una garantia: l’aprovació final depèn de l’entitat financera.`,
      feesNote: 'Els honoraris del broker no estan inclosos en aquest càlcul.',
      lowestCostTitle: 'Estratègia del broker: condicions més econòmiques',
      lowestCostWhy: (loan: string, ltv: string, dsti: string) =>
        `El finançament bancari directe és viable amb aquest perfil, així que el broker no augmenta l’endeutament: manté el finançament necessari (préstec de ${loan}, ${ltv} de LTV real, ràtio d’endeutament DSTI del ${dsti}) i busca la combinació de condicions més econòmica del mercat.`,
      lowestCostSaving: (quota: string, cost: string) =>
        `Resultat: ${quota} menys de quota mensual i ${cost} menys de cost total del crèdit respecte al banc directe.`,
      lowestCostNoSaving:
        'Amb les dades de mercat actuals, el broker no millora la quota ni el cost total del banc directe per a aquesta modalitat.',
    },
    noMarketData: 'No hi ha dades de TIN de mercat disponibles per a aquesta modalitat — no es pot calcular la quota.',
    continueCta: 'Veure taula d’amortització →',
  },

  screen6: {
    intro: (n: number) =>
      choosePhrase(
        n,
        'Consulta el quadre d’amortització mensual complet de la teva hipoteca per a l’opció que triïs.',
        'Consulteu el quadre d’amortització mensual complet de la vostra hipoteca per a l’opció que trieu.'
      ),
    selectorAriaLabel: 'Selecciona l’opció per veure’n el detall d’amortització',
    noAmortizationData: 'No hi ha dades de TIN de mercat disponibles per a aquesta modalitat — no es pot calcular el quadre d’amortització.',
    continueCta: 'Finalitzar i descarregar informe PDF →',
  },

  screen7: {
    intro: (n: number) =>
      choosePhrase(
        n,
        'Descarrega l’informe en PDF amb el detall de la teva simulació: les tres opcions, els impostos i les despeses de formalització.',
        'Descarregueu l’informe en PDF amb el detall de la vostra simulació: les tres opcions, els impostos i les despeses de formalització.'
      ),
    downloadTitle: 'Informe complet',
    optionalLabel: 'Opcional',
    continueCta: 'Finalitzar →',
  },

  screen8: {
    thankYou: (n: number) =>
      choosePhrase(
        n,
        'Gràcies per confiar en BROSSESSOR per calcular el teu finançament.',
        'Gràcies per confiar en BROSSESSOR per calcular el vostre finançament.'
      ),
    restartCta: 'Nova simulació',
  },

  offerCard: {
    pathLabels: {
      BANK_BONIFIED: 'Banc — bonificat',
      BANK_NON_BONIFIED: 'Banc — sense bonificar',
      BROKER: 'Broker',
    },
    notAvailable: 'No disponible',
    tinTaeLabel: 'TIN / TAE',
    ltvLabel: 'LTV',
    ltvCapped: ' (sol·licitud limitada)',
    loanAmountLabel: 'Import del préstec',
    monthlyQuotaLabel: 'Quota mensual',
    shortTermRiskLabel: 'Perfil de risc (DSTI a curt termini)',
    totalCostLabel: 'Cost total del crèdit',
    variableInitial: (rate: string, months: number) => `${rate}% TIN els primers ${months} mesos.`,
    variablePostInitial: (rate: string, month: number, condition: string) =>
      `Euríbor + ${rate}% TIN a partir del mes ${month}, ${condition}.`,
    variableConditionMet: 'complint condicions',
    variableConditionNotMet: 'sense complir condicions',
    variableSiblingDifferential: (rate: string) => `Euríbor + ${rate}% TIN sense complir condicions.`,
    variableTae: (rate: string) => `TAE Variable: ${rate}%`,
    variableReferenceIndexNote: () =>
      'Índex de referència: Euríbor a 12 mesos, amb revisió periòdica del tipus (habitualment anual) segons la seva evolució.',
    variableCapsFloorsNote: () =>
      'Aquesta oferta no especifica clàusules de tipus mínim (floor) ni màxim (cap) a la font de dades consultada.',
    variableDisclaimer: (n: number) =>
      choosePhrase(
        n,
        'Es tracta d’una estimació basada en l’Euríbor actual — la teva quota es podrà revisar periòdicament segons la seva evolució.',
        'Es tracta d’una estimació basada en l’Euríbor actual — la vostra quota es podrà revisar periòdicament segons la seva evolució.'
      ),
    justificationBothExceeded: (channel: string, adjustedLtv: string, dstiThreshold: string) =>
      `Oferta ${channel} ajustada automàticament: el LTV s’ha limitat al ${adjustedLtv} (màxim d’aquest banc) i l’import s’ha reduït per mantenir la ràtio d’endeutament (DSTI) per sota del ${dstiThreshold}, ja que la sol·licitud original superava tots dos límits.`,
    justificationLtvExceeded: (channel: string, adjustedLtv: string) =>
      `Oferta ${channel} ajustada automàticament al ${adjustedLtv} de LTV, el màxim que permet aquest banc — el percentatge sol·licitat el superava.`,
    justificationDstiExceeded: (channel: string, adjustedLtv: string, dstiThreshold: string) =>
      `Capacitat d’endeutament ajustada al ${adjustedLtv} de LTV per mantenir la ràtio d’endeutament (DSTI) de l’oferta ${channel} per sota del ${dstiThreshold}.`,
    brokerAlternativeNote:
      'Vegeu l’alternativa de broker al pas següent: pot negociar finançaments de fins al 90% LTV o estructurar l’operació per a perfils de risc més complexos.',
    differential: {
      title: 'Diferencial broker vs. banc directe',
      baselineLabel: (channel: string) => `Comparat amb: ${channel}`,
      noBaselineNote: 'No hi ha dades de mercat de cap canal bancari directe per a aquesta modalitat, així que no es pot calcular un diferencial.',
      tinLabel: 'Diferència de TIN',
      taeLabel: 'Diferència de TAE',
      ltvLabel: 'Diferència de LTV màxim',
      loanLabel: 'Diferència d’import finançat',
      differentLoansNote:
        'La quota i el cost total no es comparen directament perquè el broker i el banc financen imports diferents: la diferència reflectiria sobretot el finançament addicional, no quin canal és més econòmic.',
      quotaLabel: 'Diferència de quota mensual',
      totalCostLabel: 'Diferència de cost total del crèdit',
      betterSuffix: ' (millor amb el broker)',
      worseSuffix: ' (millor amb el banc)',
      equalSuffix: ' (igual)',
      noAdvantageNote:
        'Amb les dades de mercat actuals, el broker no millora el tipus ni el LTV del banc per a aquesta modalitat concreta — el seu valor pot venir d’altres factors (accés a perfils de risc que el banc rebutja directament, negociació de comissions).',
    },
  },

  riskBadge: {
    ariaLabel: (riskProfile: string, dstiLabel: string) => `Nivell de risc: ${riskProfile}, ràtio DSTI ${dstiLabel}`,
  },

  temporalRisk: {
    shortTermLabel: 'A curt termini (mentre pagues els deutes actuals):',
    longTermLabel: (duration: string) => `A llarg termini (a partir de ${duration}):`,
    improvesNote: 'Un cop liquidats els deutes actuals, la teva capacitat d’endeutament millora i la ràtio DSTI baixa.',
    persistentNote: 'Els deutes actuals no s’hauran acabat de pagar quan finalitzi la hipoteca: aquest nivell de risc es manté durant tot el termini.',
    monthsDuration: (months: number) => `${months} mesos`,
    yearsDuration: (years: number) => `${years} anys`,
    yearsAndMonthsDuration: (years: number, months: number) => `${years} anys i ${months} mesos`,
  },

  initialContribution: {
    title: 'Aportació Inicial Total',
    ownCapitalLabel: 'Capital propi / Entrada',
    ownCapitalNote: (purchase: string, loan: string) => `Preu de l’habitatge (${purchase}) − Import de la hipoteca (${loan})`,
    taxesLabel: 'Impostos (ITP / AJD segons la comunitat autònoma)',
    itpProgressive: 'escala progressiva',
    itpLine: (rate: string, amount: string) => `ITP: ${rate} — ${amount}`,
    ajdLine: (rate: string, amount: string) => `AJD: ${rate} — ${amount}`,
    ajdUnavailable: 'AJD: dada no disponible per a aquesta comunitat',
    noTaxesApplicable: 'No hi ha impostos aplicables per a aquesta combinació.',
    formalizationLabel: 'Despeses de formalització (Notaria, Registre, Gestoria)',
    formalizationNote: (notary: string, registry: string) =>
      `Notaria (compravenda): ${notary} · Registre (compravenda): ${registry} · Notaria, registre i gestoria (hipoteca): 0 € — a càrrec del banc per llei (Llei 5/2019, LCCI)`,
    totalLabel: 'Total fons inicials necessaris',
    notFullyFinanceableWarning: 'Els estalvis disponibles no cobreixen els impostos, les despeses i l’entrada que requereix aquesta opció.',
    totalExcludesUnavailableTax:
      'Aquest total NO inclou l’AJD, ja que no hi ha dades oficials disponibles per a aquesta comunitat autònoma — el cost real d’aquesta operació podria ser superior al mostrat.',
  },

  savingsAllocation: {
    title: 'Distribució dels estalvis',
    availableLabel: 'Estalvis disponibles',
    costsLabel: 'Impostos i despeses de formalització',
    downPaymentLabel: 'Entrada coberta amb estalvis',
    loanLabel: 'Préstec (LTV real)',
    surplusLabel: 'Estalvis sobrants',
    shortfallLabel: 'Falten per cobrir',
    note: 'Els estalvis cobreixen primer els impostos i les despeses de formalització; amb la resta es paga l’entrada i el préstec cobreix la resta del preu. La taxació no s’hi inclou (no hi ha dades oficials d’aquest cost).',
  },

  amortizationChart: {
    chartAriaLabel: (start: string, interest: string, years: number) =>
      `Gràfic d’amortització: el capital pendent comença en ${start} i baixa fins a 0 €, mentre els interessos acumulats pugen fins a ${interest} al llarg de ${years} anys.`,
    principalLegend: 'Capital pendent',
    interestLegend: 'Interessos acumulats',
    yearLabel: (year: number) => `Any ${year}`,
  },

  amortizationTable: {
    heading: 'Quadre d’amortització',
    viewGroupAriaLabel: 'Vista del quadre',
    yearly: 'Anual',
    monthly: 'Mensual',
    fromYear: 'Des de l’any',
    toYear: 'Fins a l’any',
    periodHeader: 'Període',
    principalHeader: 'Capital amortitzat',
    interestHeader: 'Interessos pagats',
    balanceHeader: 'Capital pendent',
    noRowsMatch: 'Cap període coincideix amb el filtre seleccionat.',
    previous: 'Anterior',
    pageLabel: (current: number, total: number) => `Pàgina ${current} de ${total}`,
    next: 'Següent',
    yearPeriodLabel: (year: number) => `Any ${year}`,
    monthPeriodLabel: (month: number) => `Mes ${month}`,
  },

  savedScenarios: {
    legend: 'Escenaris desats',
    nameLabel: 'Nom de l’escenari',
    namePlaceholder: 'p. ex. Hipoteca fixa 25 anys',
    saveCta: 'Desa la simulació actual',
    emptyState: 'Encara no has desat cap escenari.',
    selectForCompareAria: (name: string) => `Selecciona ${name} per comparar`,
    savedOn: (date: string) => `Desat el ${date}`,
    quotaSuffix: (amount: string) => `${amount}/mes (banc bonificat)`,
    quotaUnavailable: 'quota no disponible',
    deleteCta: 'Elimina',
    comparisonHeading: 'Comparativa d’escenaris',
    clearSelectionCta: 'Neteja selecció',
    metricHeader: 'Mètrica',
    monthlyQuotaMetric: 'Quota mensual (banc bonificat)',
    ltvMetric: 'LTV efectiu (banc bonificat)',
    dstiMetric: 'Ràtio DSTI a curt termini (banc bonificat)',
    riskProfileMetric: 'Perfil de risc a curt termini (banc bonificat)',
    notAvailable: 'No disponible',
  },

  exportButton: {
    downloadCta: 'Descarregar informe PDF',
    errorMessage: 'No s’ha pogut generar l’informe PDF. Torna-ho a provar.',
  },

  labels: {
    employmentType: {
      INDEFINITE: 'Indefinit',
      TEMPORARY: 'Temporal',
      SELF_EMPLOYED: 'Autònom',
      STATE_OFFICIAL: 'Funcionari',
      RETIRED: 'Pensió / Jubilat',
      UNEMPLOYED: 'Atur',
      OTHER: 'Altres',
    },
    propertyType: {
      NEW_BUILD: 'Obra nova',
      SECOND_HAND: 'Segona mà',
    },
    propertyUsage: {
      HABITUAL: 'Habitatge habitual',
      SECOND_HOME: 'Segona residència',
    },
    mortgageType: {
      FIXED: 'Fix',
      VARIABLE: 'Variable',
      MIXED: 'Mixt',
    },
    riskProfile: {
      LOW: 'Risc baix',
      MEDIUM: 'Risc moderat',
      HIGH: 'Risc elevat',
    },
  },

  validation: {
    numberOfHoldersInvalidType: () => 'Selecciona el nombre de titulars.',
    numberOfHoldersInt: () => 'El nombre de titulars ha de ser un número enter.',
    numberOfHoldersMin: () => 'Hi ha d’haver com a mínim 1 titular.',
    numberOfHoldersMax: (max: number) => `Aquest simulador admet un màxim de ${max} titulars.`,
    holderNameRequired: () => 'El nom i cognoms és obligatori.',
    holderNamesMin: () => 'Indica el nom i cognoms de cada titular.',
    holderAgeInvalid: () => 'Introdueix una edat vàlida.',
    holderAgeInt: () => 'L’edat ha de ser un número enter.',
    holderAgeMin: (min: number) => `Has de tenir com a mínim ${min} anys.`,
    holderAgeMax: (max: number) => `L’edat màxima admesa és ${max} anys.`,
    holderAgesMin: () => 'Indica l’edat de cada titular.',
    employmentTypeInvalid: () => 'Selecciona una situació laboral vàlida.',
    employmentTypesMin: () => 'Selecciona la situació laboral de cada titular.',
    incomeInvalid: () => 'Introdueix un import vàlid.',
    incomePositive: () => 'Els ingressos nets mensuals han de ser superiors a 0 €.',
    incomesMin: () => 'Indica els ingressos nets mensuals de cada titular.',
    amountInvalid: () => 'Introdueix un import vàlid.',
    pendingDebtsMin: () => 'Els deutes pendents no poden ser negatius.',
    debtsDurationInvalid: () => 'Introdueix una durada vàlida.',
    debtsDurationInt: () => 'La durada ha de ser un nombre enter de mesos.',
    debtsDurationMin: () => 'La durada no pot ser negativa.',
    debtsDurationMax: () => 'Revisa la durada introduïda: sembla massa llarga.',
    debtsDurationRequired: () => 'Indica la durada restant dels deutes actuals.',
    savingsMin: () => 'Els estalvis disponibles no poden ser negatius.',
    propertyTypeInvalid: () => 'Selecciona un tipus d’habitatge vàlid.',
    propertyUsageInvalid: () => 'Selecciona l’ús de l’habitatge.',
    ccaaRequired: () => 'Selecciona una Comunitat Autònoma.',
    ccaaInvalid: () => 'Selecciona una Comunitat Autònoma vàlida.',
    appraisalInvalid: () => 'Introdueix un valor de taxació vàlid.',
    appraisalPositive: () => 'El valor de taxació ha de ser superior a 0 €.',
    purchaseInvalid: () => 'Introdueix un preu de compra vàlid.',
    purchasePositive: () => 'El preu de compra ha de ser superior a 0 €.',
    mortgageTypeInvalid: () => 'Selecciona un tipus d’hipoteca vàlid.',
    durationInvalid: () => 'Introdueix un termini vàlid.',
    durationInt: () => 'El termini ha de ser un nombre enter d’anys.',
    durationMin: (min: number) => `El termini mínim és de ${min} anys.`,
    durationMax: (max: number) => `El termini màxim és de ${max} anys.`,
    ltvInvalid: () => 'Introdueix un percentatge vàlid.',
    ltvPositive: () => 'El percentatge de finançament ha de ser superior a 0%.',
    ltvMax: () => 'El percentatge de finançament no pot superar el 100%.',
    holderNamesCrossCheck: () => 'Indica el nom i cognoms de tots els titulars.',
    holderAgesCrossCheck: () => 'Indica l’edat de tots els titulars.',
    employmentTypesCrossCheck: () => 'Indica la situació laboral de tots els titulars.',
    employmentOtherRequired: () => 'Explica breument la situació laboral.',
    incomesCrossCheck: () => 'Indica els ingressos nets mensuals de tots els titulars.',
  },

  chat: {
    assistantName: 'Àlvar',
    headerTitle: 'Àlvar · Assistent hipotecari',
    launcherAria: 'Obre l’assistent virtual',
    closeAria: 'Tanca l’assistent',
    minimizeAria: 'Minimitza l’assistent',
    expandAria: 'Amplia el xat a pantalla completa',
    collapseAria: 'Tanca la pantalla completa (Esc)',
    fullscreenHint: 'Prem Esc per tornar a la vista normal.',
    userLabel: 'Tu',
    summaryShow: 'Veure resum',
    summaryHide: 'Amaga el resum',
    summary: {
      title: 'Resum de la simulació',
      empty: 'Encara no hi ha dades. Les aniràs veient aquí a mesura que responguis.',
      holdersHeading: 'Titulars',
      perMonth: '/mes',
      economyHeading: 'Situació econòmica',
      debtsLabel: 'Deutes mensuals',
      savingsLabel: 'Estalvis',
      propertyHeading: 'Habitatge',
      priceLabel: 'Preu',
      appraisalLabel: 'Taxació',
      typeLabel: 'Tipus',
      usageLabel: 'Ús',
      ccaaLabel: 'Comunitat',
      financingHeading: 'Finançament',
      requestedLtvLabel: 'Finançament sol·licitat',
      termLabel: 'Termini',
      mortgageTypeLabel: 'Tipus d’hipoteca',
      resultsHeading: 'Resultat',
    },
    inputPlaceholder: 'Escriu la teva resposta...',
    inputAriaLabel: 'Missatge per a l’assistent',
    sendCta: 'Envia',
    typingLabel: 'escrivint...',
    restartHint: (n: number) =>
      choosePhrase(
        n,
        'Pots respondre aquí o omplir el formulari directament — les dues opcions es mantenen sincronitzades.',
        'Podeu respondre aquí o omplir el formulari directament — les dues opcions es mantenen sincronitzades.'
      ),
    needsReviewMessage: () =>
      'Sembla que hi ha alguna dada que cal revisar al formulari — fixa’t si hi ha algun avís en vermell abans de continuar.',
    fallbackErrorMessage: () =>
      'Uix, se m’ha embolicat una mica la resposta. Disculpa’m — pots repetir la teva última resposta?',
    greetings: [
      (n: number) =>
        choosePhrase(
          n,
          'Hola! Sóc l’Àlvar, l’assistent virtual de BROSSESSOR. T’ajudo a omplir la simulació parlant, com si fos una conversa. Comencem?',
          'Hola! Sóc l’Àlvar, l’assistent virtual de BROSSESSOR. Us ajudo a omplir la simulació parlant, com si fos una conversa. Comencem?'
        ),
      (n: number) =>
        choosePhrase(
          n,
          'Ei, benvingut/da! Em dic Àlvar i sóc el teu assistent hipotecari de BROSSESSOR. Puc anar-te preguntant les dades i les vaig omplint jo mateix al formulari. Fem-ho?',
          'Ei, benvinguts! Em dic Àlvar i sóc el vostre assistent hipotecari de BROSSESSOR. Puc anar-vos preguntant les dades i les vaig omplint jo mateix al formulari. Fem-ho?'
        ),
      (n: number) =>
        choosePhrase(
          n,
          'Hola, sóc l’Àlvar! Em pots explicar la teva situació amb les teves paraules i jo m’encarrego d’omplir el formulari. També pots editar-lo tu mateix quan vulguis.',
          'Hola, sóc l’Àlvar! Em podeu explicar la vostra situació amb les vostres paraules i jo m’encarrego d’omplir el formulari. També podeu editar-lo vosaltres mateixos quan vulgueu.'
        ),
      (n: number) =>
        choosePhrase(
          n,
          'Bon dia! Em dic Àlvar i estic aquí per fer-te més fàcil la simulació. Parlem una estona i deixem la hipoteca ben encaminada.',
          'Bon dia! Em dic Àlvar i estic aquí per fer-vos més fàcil la simulació. Parlem una estona i deixem la hipoteca ben encaminada.'
        ),
    ],
    acknowledgments: [
      'Perfecte, ho apunto! ✅',
      'Entès, ja ho tinc.',
      'Genial, gràcies!',
      'Anotat!',
      'Molt bé, seguim.',
      'Fet! Una dada menys.',
      'D’acord, ja està guardat.',
      'Entès! Deixem això guardat...',
      'Genial, ja tinc aquesta dada.',
      'Marcat, gràcies!',
      'Rebut, ho tinc apuntat.',
      'Molt ben pensat, ja ho tinc.',
      'Guardat! Anem fent.',
      'Perfecte, un pas més a prop.',
      'D’acord, apuntat i seguim.',
    ],
    transitions: [
      'Anem amb la següent...',
      'Passem a la següent pregunta.',
      'Continuem...',
      'Una cosa més:',
      'D’acord, ara...',
      'Seguim endavant.',
      'Va, seguim amb això:',
      'I ara, per acabar aquest bloc...',
      'Anem avançant:',
      'Un pas més:',
      'Segueixo preguntant:',
      'Molt bé, ara toca això:',
    ],
    clarifications: [
      (n: number) =>
        choosePhrase(n, 'Perdona, no ho he acabat d’entendre. Ho pots tornar a escriure?', 'Perdoneu, no ho he acabat d’entendre. Ho podeu tornar a escriure?'),
      (n: number) =>
        choosePhrase(n, 'Hmm, no n’estic segur. Em pots donar el valor una altra vegada?', 'Hmm, no n’estic segur. Em podeu donar el valor una altra vegada?'),
      (n: number) =>
        choosePhrase(n, 'No he pogut interpretar-ho bé — prova de respondre-ho d’una altra manera.', 'No he pogut interpretar-ho bé — proveu de respondre-ho d’una altra manera.'),
      (n: number) => choosePhrase(n, 'Disculpa, pots repetir-ho si et plau?', 'Disculpeu, podeu repetir-ho si us plau?'),
    ],
    manualEditNotices: [
      (n: number) =>
        choosePhrase(
          n,
          'Veig que has actualitzat una dada directament al formulari — cap problema, continuem des d’aquí.',
          'Veig que heu actualitzat una dada directament al formulari — cap problema, continuem des d’aquí.'
        ),
      () => 'Perfecte, he vist el canvi al formulari. Seguim!',
      (n: number) =>
        choosePhrase(n, 'D’acord, m’adapto al valor que has posat al formulari.', 'D’acord, m’adapto al valor que heu posat al formulari.'),
    ],
    askViewBreakdown: (n: number) =>
      choosePhrase(
        n,
        'Genial, ja tinc totes les dades que necessito! Abans de tancar, vols veure el desglossament detallat de condicions i el quadre d’amortització?',
        'Genial, ja tinc totes les dades que necessito! Abans de tancar, voleu veure el desglossament detallat de condicions i el quadre d’amortització?'
      ),
    breakdownShown: () => 'Aquí tens el desglossament detallat i el quadre d’amortització complet. Fes-hi una ullada amb calma.',
    askDownloadPdf: (n: number) =>
      choosePhrase(
        n,
        'Vols que et generi i descarregui ara mateix l’informe en PDF amb el resum de la simulació?',
        'Voleu que us generi i descarregui ara mateix l’informe en PDF amb el resum de la simulació?'
      ),
    pdfDownloadStarted: () => 'Aquí tens el teu informe en PDF — ja s’està descarregant! 📄',
    pdfDeclined: () => 'Cap problema, no descarregarem cap informe ara.',
    closingThanks: (n: number) =>
      choosePhrase(
        n,
        'Ha estat un plaer ajudar-te. Moltes gràcies per confiar en BROSSESSOR — que vagi molt bé amb la teva hipoteca!',
        'Ha estat un plaer ajudar-vos. Moltes gràcies per confiar en BROSSESSOR — que vagi molt bé amb la vostra hipoteca!'
      ),
    questions: {
      numberOfHolders: () => 'Per començar, quants titulars hi haurà a la hipoteca?',
      holderName: (index: number) => `Com es diu el titular ${index + 1}?`,
      holderAge: (name: string) => `Quants anys té ${name}?`,
      employmentType: (name: string) => `Quina és la situació laboral de ${name}? (indefinit, temporal, autònom, funcionari, jubilat, atur...)`,
      employmentOtherDetail: (name: string) => `Explica’m breument la situació laboral de ${name}.`,
      holderIncome: (name: string) => `Quins ingressos nets mensuals té ${name}?`,
      pendingDebts: (n: number) =>
        choosePhrase(n, 'Tens deutes mensuals pendents (préstecs, targetes...)? Si no en tens, digues 0.', 'Teniu deutes mensuals pendents (préstecs, targetes...)? Si no en teniu, digueu 0.'),
      pendingDebtsRemainingMonths: () => 'Quants mesos queden per acabar de pagar aquests deutes?',
      availableSavings: (n: number) =>
        choosePhrase(n, 'Quants estalvis tens disponibles per a l’entrada i les despeses?', 'Quants estalvis teniu disponibles per a l’entrada i les despeses?'),
      purchaseValue: () => 'Quin és el preu de compra de l’habitatge?',
      appraisalValue: () => 'I quin és el valor de taxació?',
      propertyType: () => 'És obra nova o segona mà?',
      propertyUsage: (n: number) =>
        choosePhrase(n, 'Serà el teu habitatge habitual o una segona residència?', 'Serà el vostre habitatge habitual o una segona residència?'),
      ccaa: () => 'A quina Comunitat Autònoma es troba l’habitatge?',
      requestedLtvPercentage: (n: number) =>
        choosePhrase(n, 'Quin percentatge de finançament voldries demanar al banc?', 'Quin percentatge de finançament voldríeu demanar al banc?'),
      durationYears: (n: number) =>
        choosePhrase(n, 'A quants anys voldries el termini de la hipoteca?', 'A quants anys voldríeu el termini de la hipoteca?'),
      mortgageType: (n: number) => choosePhrase(n, 'La vols a tipus fix o variable?', 'La voleu a tipus fix o variable?'),
    },
    glossary: {
      resumeBridge: () => 'Espero que t’ajudi! Tornem a on érem:',
      LTV: () =>
        'El LTV (Loan to Value) és el percentatge del valor de l’habitatge que et finança el banc. Per exemple, un LTV del 80% vol dir que et presten el 80% i que tu has de posar el 20% restant (més impostos i despeses) de la teva butxaca. Els bancs solen limitar-se al 80% per a l’habitatge habitual; un broker pot arribar a negociar fins al 90%, o excepcionalment més.',
      DSTI: () =>
        'El DSTI (Debt Service to Income) és el percentatge dels teus ingressos nets que es destina a pagar deutes cada mes (la quota de la hipoteca inclosa). En aquest simulador, fins a un 35% es considera un nivell de risc baix, i per sobre del 40% ja es considera risc alt — els bancs solen ser reticents a aprovar operacions per sobre d’aquests llindars.',
      RATE_TYPE_RISK: () =>
        'A tipus fix, la quota no canvia mai durant tot el préstec, encara que pugi l’Euríbor — més tranquil·litat, normalment amb un TIN d’entrada una mica més alt. A tipus variable, la quota es revisa periòdicament segons l’Euríbor, així que pot pujar o baixar — sol començar amb un TIN més baix, però assumeixes el risc que pugi. El tipus mixt combina uns primers anys a tipus fix i després passa a variable.',
    },
  },

  pdf: {
    title: 'Informe de Simulació Hipotecària',
    generatedOn: (date: string) => `Generat el ${date}`,
    personalizedFor: (n: number) => choosePhrase(n, 'Simulació personalitzada per a tu.', 'Simulació personalitzada per a vosaltres.'),
    section1Title: '1. Perfil del sol·licitant',
    profileCardTitle: 'Titulars i situació financera',
    numberOfHoldersLabel: 'Nombre de titulars',
    holderLine: (index: number) => `Titular ${index + 1}`,
    employmentStatusLabel: (name: string) => `Situació laboral — ${name}`,
    incomeLabel: (name: string) => `Ingressos nets mensuals — ${name}`,
    totalIncomeLabel: 'Total ingressos nets mensuals',
    pendingDebtsLabel: 'Deutes mensuals pendents',
    pendingDebtsWithMonths: (months: number) => ` (${months} mesos restants)`,
    savingsLabel: 'Estalvis disponibles',
    section2Title: '2. Habitatge i finançament',
    operationCardTitle: 'Dades de l’operació',
    propertyTypeLabel: 'Tipus d’habitatge',
    propertyUsageLabel: 'Ús de l’habitatge',
    ccaaLabel: 'Comunitat Autònoma',
    appraisalValueLabel: 'Valor de taxació',
    purchaseValueLabel: 'Preu de compra',
    mortgageTypeLabel: 'Tipus d’hipoteca',
    durationLabel: 'Termini',
    durationYearsSuffix: (years: number) => `${years} anys`,
    section3Title: '3. Comparativa Banc vs. Broker',
    tinTaeLabel: 'TIN / TAE',
    notAvailable: 'No disponible',
    ltvLabel: 'LTV',
    ltvCappedSuffix: (requested: string) => ` (sol·licitud limitada a ${requested}%)`,
    loanAmountLabel: 'Import del préstec',
    monthlyQuotaLabel: 'Quota mensual',
    initialContributionLabel: 'Aportació inicial necessària',
    totalCostLabel: 'Cost total del crèdit',
    dstiShortTermLabel: 'Ràtio DSTI',
    dstiShortTermLabelDual: 'Ràtio DSTI (curt termini)',
    dstiLongTermLabel: 'Ràtio DSTI (llarg termini)',
    notFullyFinanceableWarning: 'Atenció: els estalvis disponibles no cobreixen els impostos, les despeses i l’entrada que requereix aquest LTV.',
    marketDataUnavailable: 'Dada de mercat no disponible',
    quotaNotComputable: 'No es pot calcular la quota per a aquesta modalitat amb les dades de mercat disponibles.',
    section4Title: '4. Impostos i despeses de formalització',
    taxCardTitle: 'Impostos i despeses',
    taxableBaseLabel: 'Base imposable',
    itpLabel: (rate: string) => `ITP (${rate})`,
    itpProgressiveBrackets: 'Escala progressiva',
    ajdLabel: (rate: string) => `AJD (${rate})`,
    ajdUnavailable: 'No disponible per a aquesta comunitat',
    ajdFallbackLabel: 'AJD',
    totalTaxLabel: 'Total impostos',
    notaryPurchaseLabel: 'Notaria (compravenda)',
    registryPurchaseLabel: 'Registre (compravenda)',
    mortgageFormalizationLabel: 'Notaria, registre i gestoria (hipoteca)',
    mortgageFormalizationValue: '0 € — a càrrec del banc (LCCI art. 14.1.e)',
    totalFormalizationLabel: 'Total despeses de formalització',
    disclaimer: 'Aquest informe és una simulació orientativa basada en les dades introduïdes i en referències de mercat, i no constitueix una oferta vinculant.',
    thanksHeading: 'Agraïments per part de BROSSESSOR',
    thanksBody: (n: number) =>
      choosePhrase(
        n,
        'Moltes gràcies per confiar en BROSSESSOR per simular el teu finançament hipotecari. Esperem que aquest informe t’ajudi a prendre la decisió amb més seguretat.',
        'Moltes gràcies per confiar en BROSSESSOR per simular el vostre finançament hipotecari. Esperem que aquest informe us ajudi a prendre la decisió amb més seguretat.'
      ),
  },
};

export type Dictionary = typeof ca;
