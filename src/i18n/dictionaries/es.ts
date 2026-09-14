/**
 * Spanish (Castellano) UI + PDF dictionary — implements the same shape as
 * ca.ts (the canonical Dictionary type), so a missing/mismatched key fails
 * at compile time.
 */
import { choosePhrase } from '../../utils/grammar';
import type { Dictionary } from './ca';

export const es: Dictionary = {
  common: {
    brand: 'BROSSESSOR',
    stepLabel: (step, total) => `Paso ${step} de ${total}`,
    back: 'Atrás',
    continueDefault: 'Continuar',
    conjunction: 'y',
    completePreviousSteps: 'Completa los datos de los pasos anteriores para continuar.',
    taeAbbreviation: 'TAE',
  },

  languageSelect: {
    title: 'Elige tu idioma',
    subtitle: 'Selecciona el idioma en el que quieres hacer la simulación y recibir el informe.',
    cta: 'Continuar →',
  },

  screen1: {
    subtitle: 'Simulador hipotecario',
    cta: 'Empezar simulación →',
  },

  screen2: {
    intro: (n, vocative) => vocative + choosePhrase(n, 'introduce tus datos financieros.', 'introducid vuestros datos financieros.'),
    numberOfHoldersHeading: 'Número de titulares',
    holderCountOne: '1 titular',
    holderCountTwo: '2 titulares',
    holderCountMore: 'Más de 2',
    exactHolderCountLabel: 'Número exacto de titulares',
    whoAreYouHeading: '¿Quiénes sois?',
    whoAreYouHelper: 'Indica el nombre y apellidos y la edad de cada titular de la hipoteca.',
    holderNameLabel: (index) => `Nombre y apellidos Titular ${index + 1}`,
    holderAgeLabel: (index) => `Edad Titular ${index + 1}`,
    ageHint: (age) => `${age} años`,
    employmentHeading: (n) => choosePhrase(n, '¿Cuál es tu situación laboral?', '¿Cuál es la situación laboral de cada titular?'),
    employmentTypeLabel: (holderLabel) => `Situación laboral ${holderLabel}`,
    selectPlaceholder: '-- Selecciona --',
    employmentOtherLabel: (holderLabel) => `Explica la situación laboral de ${holderLabel}`,
    employmentOtherPlaceholder: 'p. ej. Excedencia, renta básica, ingresos por alquiler...',
    incomeHeading: 'Ingresos netos mensuales (€)',
    incomeHelper: 'Se sumarán automáticamente para calcular la capacidad de endeudamiento conjunta.',
    incomeFieldLabel: (holderLabel) => `${holderLabel} (€/mes)`,
    totalIncomeLabel: 'Total ingresos netos mensuales',
    debtsHeading: (n, vocative) => vocative + choosePhrase(n, '¿tienes deudas mensuales pendientes?', '¿tenéis deudas mensuales pendientes?'),
    pendingDebtsLabel: 'Deudas mensuales pendientes (€)',
    pendingDebtsRemainingLabel: 'Duración restante de las deudas (meses)',
    monthsHint: (months) => `${months} meses`,
    savingsHeading: (n, vocative) => vocative + choosePhrase(n, '¿cuántos ahorros tienes disponibles?', '¿cuántos ahorros tenéis disponibles?'),
    savingsLabel: 'Ahorros disponibles (€)',
    holderFallbackLabel: (index) => `Titular ${index + 1}`,
  },

  screen3: {
    intro: (n) => choosePhrase(n, 'Cuéntanos sobre la vivienda que quieres financiar.', 'Contadnos sobre la vivienda que queréis financiar.'),
    purchaseValueHeading: 'Precio de la vivienda (€)',
    purchaseValueLabel: 'Precio de la vivienda (€)',
    appraisalValueLabel: 'Valor de tasación (€)',
    propertyTypeLabel: 'Tipo de vivienda',
    propertyUsageHeading: 'Uso de la vivienda',
    ccaaHeading: 'Comunidad Autónoma',
    ccaaHelper: 'Determina los impuestos (ITP/AJD) aplicables a la operación.',
    ccaaLabel: 'Comunidad Autónoma',
    ltvHeading: 'Porcentaje de financiación deseado (%)',
    ltvHelper:
      'El TIN se determina automáticamente a partir de datos de mercado: no hace falta introducirlo. Este porcentaje solo aplica al cálculo con banco — el bróker siempre utiliza la máxima financiación que pueda conseguir.',
    ltvLabel: 'Porcentaje de financiación deseado (%)',
    ltvHint: (pct) => `${pct}%`,
    durationHeading: 'Plazo (años)',
    durationLabel: 'Plazo (años)',
    durationHint: (years) => `${years} años`,
    mortgageTypeHeading: 'Tipo de hipoteca',
    mortgageTypeLabel: 'Tipo de hipoteca',
    mortgageTypeComingSoon: 'Próximamente',
  },

  screen4: {
    intro: (n) =>
      choosePhrase(
        n,
        'Estas son las condiciones que un banco podría ofrecerte directamente para tu financiación, con y sin las bonificaciones habituales (nómina, seguros, etc.).',
        'Estas son las condiciones que un banco podría ofreceros directamente para vuestra financiación, con y sin las bonificaciones habituales (nómina, seguros, etc.).'
      ),
    noMarketData: 'No hay datos de TIN de mercado disponibles para esta modalidad — no se puede calcular la cuota.',
    continueCta: 'Explorar opción Bróker →',
  },

  screen5: {
    intro: (n) =>
      choosePhrase(
        n,
        'Un bróker negocia tu financiación con múltiples entidades simultáneamente, buscando las mejores condiciones disponibles en el mercado.',
        'Un bróker negocia vuestra financiación con múltiples entidades simultáneamente, buscando las mejores condiciones disponibles en el mercado.'
      ),
    emphasis:
      'Capaz de negociar financiaciones de hasta el 90% LTV o mejores condiciones de tipo para perfiles de riesgo más complejos que los bancos no aceptan directamente.',
    noMarketData: 'No hay datos de TIN de mercado disponibles para esta modalidad — no se puede calcular la cuota.',
    continueCta: 'Ver cuadro de amortización →',
  },

  screen6: {
    intro: (n) =>
      choosePhrase(
        n,
        'Consulta el cuadro de amortización mensual completo de tu hipoteca para la opción que elijas.',
        'Consulta el cuadro de amortización mensual completo de vuestra hipoteca para la opción que elijáis.'
      ),
    selectorAriaLabel: 'Selecciona la opción para ver su detalle de amortización',
    noAmortizationData: 'No hay datos de TIN de mercado disponibles para esta modalidad — no se puede calcular el cuadro de amortización.',
    continueCta: 'Finalizar y descargar informe PDF →',
  },

  screen7: {
    intro: (n) =>
      choosePhrase(
        n,
        'Descarga el informe en PDF con el detalle de tu simulación: las tres opciones, los impuestos y los gastos de formalización.',
        'Descarga el informe en PDF con el detalle de vuestra simulación: las tres opciones, los impuestos y los gastos de formalización.'
      ),
    downloadTitle: 'Informe completo',
    optionalLabel: 'Opcional',
    continueCta: 'Finalizar →',
  },

  screen8: {
    thankYou: (n) =>
      choosePhrase(
        n,
        'Gracias por confiar en BROSSESSOR para calcular tu financiación.',
        'Gracias por confiar en BROSSESSOR para calcular vuestra financiación.'
      ),
    restartCta: 'Nueva simulación',
  },

  offerCard: {
    pathLabels: {
      BANK_BONIFIED: 'Banco — bonificada',
      BANK_NON_BONIFIED: 'Banco — sin bonificar',
      BROKER: 'Bróker',
    },
    notAvailable: 'No disponible',
    tinTaeLabel: 'TIN / TAE',
    ltvLabel: 'LTV',
    ltvCapped: ' (solicitud limitada)',
    loanAmountLabel: 'Importe del préstamo',
    monthlyQuotaLabel: 'Cuota mensual',
    shortTermRiskLabel: 'Perfil de riesgo (DSTI a corto plazo)',
    totalCostLabel: 'Coste total del crédito',
    variableInitial: (rate, months) => `${rate}% TIN los primeros ${months} meses.`,
    variablePostInitial: (rate, month, condition) => `Euríbor + ${rate}% TIN a partir del mes ${month}, ${condition}.`,
    variableConditionMet: 'cumpliendo condiciones',
    variableConditionNotMet: 'sin cumplir condiciones',
    variableSiblingDifferential: (rate) => `Euríbor + ${rate}% TIN sin cumplir condiciones.`,
    variableTae: (rate) => `TAE Variable: ${rate}%`,
    variableReferenceIndexNote: () =>
      'Índice de referencia: Euríbor a 12 meses, con revisión periódica del tipo (habitualmente anual) según su evolución.',
    variableCapsFloorsNote: () =>
      'Esta oferta no especifica cláusulas de tipo mínimo (floor) ni máximo (cap) en la fuente de datos consultada.',
    variableDisclaimer: (n) =>
      choosePhrase(
        n,
        'Se trata de una estimación basada en el Euríbor actual — tu cuota podrá revisarse periódicamente según su evolución.',
        'Se trata de una estimación basada en el Euríbor actual — vuestra cuota podrá revisarse periódicamente según su evolución.'
      ),
    viabilityBothExceeded: (channel) =>
      `Financiación bancaria directa no viable (${channel}): el nivel de endeudamiento (DSTI) y el porcentaje de financiación (LTV) superan los límites estándar del banco.`,
    viabilityLtvExceeded: (channel) =>
      `Financiación bancaria directa no viable (${channel}): el porcentaje de financiación solicitado (LTV) supera el límite estándar del banco.`,
    viabilityDstiExceeded: (channel) =>
      `Financiación bancaria directa no viable (${channel}): el nivel de endeudamiento (DSTI) supera el límite estándar del banco.`,
    maxViableLoanLabel: 'Importe máximo viable con banco',
    maxViableLtvLabel: 'LTV máximo viable con banco',
    brokerAlternativeNote:
      'Consulta la alternativa de bróker en el siguiente paso: puede negociar financiaciones de hasta el 90% LTV o estructurar la operación para perfiles de riesgo más complejos.',
    differential: {
      title: 'Diferencial bróker vs. banco directo',
      baselineLabel: (channel: string) => `Comparado con: ${channel}`,
      noBaselineNote: 'No hay datos de mercado de ningún canal bancario directo para esta modalidad, así que no se puede calcular un diferencial.',
      tinLabel: 'Diferencia de TIN',
      taeLabel: 'Diferencia de TAE',
      ltvLabel: 'Diferencia de LTV máximo',
      quotaLabel: 'Diferencia de cuota mensual',
      totalCostLabel: 'Diferencia de coste total del crédito',
      betterSuffix: ' (mejor con el bróker)',
      worseSuffix: ' (mejor con el banco)',
      equalSuffix: ' (igual)',
      noAdvantageNote:
        'Con los datos de mercado actuales, el bróker no mejora el tipo ni el LTV del banco para esta modalidad concreta — su valor puede venir de otros factores (acceso a perfiles de riesgo que el banco rechaza directamente, negociación de comisiones).',
    },
  },

  riskBadge: {
    ariaLabel: (riskProfile, dstiLabel) => `Nivel de riesgo: ${riskProfile}, ratio DSTI ${dstiLabel}`,
  },

  temporalRisk: {
    shortTermLabel: 'A corto plazo (mientras pagas las deudas actuales):',
    longTermLabel: (duration) => `A largo plazo (a partir de ${duration}):`,
    improvesNote: 'Una vez liquidadas las deudas actuales, tu capacidad de endeudamiento mejora y la ratio DSTI baja.',
    persistentNote: 'Las deudas actuales no se habrán terminado de pagar cuando finalice la hipoteca: este nivel de riesgo se mantiene durante todo el plazo.',
    monthsDuration: (months) => `${months} meses`,
    yearsDuration: (years) => `${years} años`,
    yearsAndMonthsDuration: (years, months) => `${years} años y ${months} meses`,
  },

  initialContribution: {
    title: 'Aportación Inicial Total',
    ownCapitalLabel: 'Capital propio / Entrada',
    ownCapitalNote: (purchase, loan) => `Precio de la vivienda (${purchase}) − Importe de la hipoteca (${loan})`,
    taxesLabel: 'Impuestos (ITP / AJD según la comunidad autónoma)',
    itpProgressive: 'escala progresiva',
    itpLine: (rate, amount) => `ITP: ${rate} — ${amount}`,
    ajdLine: (rate, amount) => `AJD: ${rate} — ${amount}`,
    ajdUnavailable: 'AJD: dato no disponible para esta comunidad',
    noTaxesApplicable: 'No hay impuestos aplicables para esta combinación.',
    formalizationLabel: 'Gastos de formalización (Notaría, Registro, Gestoría)',
    formalizationNote: (notary, registry) =>
      `Notaría (compraventa): ${notary} · Registro (compraventa): ${registry} · Notaría, registro y gestoría (hipoteca): 0 € — a cargo del banco por ley (Ley 5/2019, LCCI)`,
    totalLabel: 'Total de fondos iniciales necesarios',
    notFullyFinanceableWarning: 'Los ahorros disponibles no cubren el precio de compra con esta opción.',
  },

  amortizationChart: {
    chartAriaLabel: (start, interest, years) =>
      `Gráfico de amortización: el capital pendiente empieza en ${start} y baja hasta 0 €, mientras los intereses acumulados suben hasta ${interest} a lo largo de ${years} años.`,
    principalLegend: 'Capital pendiente',
    interestLegend: 'Intereses acumulados',
    yearLabel: (year) => `Año ${year}`,
  },

  amortizationTable: {
    heading: 'Cuadro de amortización',
    viewGroupAriaLabel: 'Vista del cuadro',
    yearly: 'Anual',
    monthly: 'Mensual',
    fromYear: 'Desde el año',
    toYear: 'Hasta el año',
    periodHeader: 'Período',
    principalHeader: 'Capital amortizado',
    interestHeader: 'Intereses pagados',
    balanceHeader: 'Capital pendiente',
    noRowsMatch: 'Ningún período coincide con el filtro seleccionado.',
    previous: 'Anterior',
    pageLabel: (current, total) => `Página ${current} de ${total}`,
    next: 'Siguiente',
    yearPeriodLabel: (year) => `Año ${year}`,
    monthPeriodLabel: (month) => `Mes ${month}`,
  },

  savedScenarios: {
    legend: 'Escenarios guardados',
    nameLabel: 'Nombre del escenario',
    namePlaceholder: 'p. ej. Hipoteca fija 25 años',
    saveCta: 'Guardar la simulación actual',
    emptyState: 'Todavía no has guardado ningún escenario.',
    selectForCompareAria: (name) => `Selecciona ${name} para comparar`,
    savedOn: (date) => `Guardado el ${date}`,
    quotaSuffix: (amount) => `${amount}/mes (banco bonificado)`,
    quotaUnavailable: 'cuota no disponible',
    deleteCta: 'Eliminar',
    comparisonHeading: 'Comparativa de escenarios',
    clearSelectionCta: 'Limpiar selección',
    metricHeader: 'Métrica',
    monthlyQuotaMetric: 'Cuota mensual (banco bonificado)',
    ltvMetric: 'LTV efectivo (banco bonificado)',
    dstiMetric: 'Ratio DSTI a corto plazo (banco bonificado)',
    riskProfileMetric: 'Perfil de riesgo a corto plazo (banco bonificado)',
    notAvailable: 'No disponible',
  },

  exportButton: {
    downloadCta: 'Descargar informe PDF',
    errorMessage: 'No se ha podido generar el informe PDF. Vuelve a intentarlo.',
  },

  labels: {
    employmentType: {
      INDEFINITE: 'Indefinido',
      TEMPORARY: 'Temporal',
      SELF_EMPLOYED: 'Autónomo',
      STATE_OFFICIAL: 'Funcionario',
      RETIRED: 'Pensión / Jubilado',
      UNEMPLOYED: 'Desempleado',
      OTHER: 'Otros',
    },
    propertyType: {
      NEW_BUILD: 'Obra nueva',
      SECOND_HAND: 'Segunda mano',
    },
    propertyUsage: {
      HABITUAL: 'Vivienda habitual',
      SECOND_HOME: 'Segunda residencia',
    },
    mortgageType: {
      FIXED: 'Fija',
      VARIABLE: 'Variable',
      MIXED: 'Mixta',
    },
    riskProfile: {
      LOW: 'Riesgo bajo',
      MEDIUM: 'Riesgo moderado',
      HIGH: 'Riesgo elevado',
    },
  },

  validation: {
    numberOfHoldersInvalidType: () => 'Selecciona el número de titulares.',
    numberOfHoldersInt: () => 'El número de titulares debe ser un número entero.',
    numberOfHoldersMin: () => 'Debe haber como mínimo 1 titular.',
    numberOfHoldersMax: (max) => `Este simulador admite un máximo de ${max} titulares.`,
    holderNameRequired: () => 'El nombre y apellidos es obligatorio.',
    holderNamesMin: () => 'Indica el nombre y apellidos de cada titular.',
    holderAgeInvalid: () => 'Introduce una edad válida.',
    holderAgeInt: () => 'La edad debe ser un número entero.',
    holderAgeMin: (min) => `Debes tener como mínimo ${min} años.`,
    holderAgeMax: (max) => `La edad máxima admitida es ${max} años.`,
    holderAgesMin: () => 'Indica la edad de cada titular.',
    employmentTypeInvalid: () => 'Selecciona una situación laboral válida.',
    employmentTypesMin: () => 'Selecciona la situación laboral de cada titular.',
    incomeInvalid: () => 'Introduce un importe válido.',
    incomePositive: () => 'Los ingresos netos mensuales deben ser superiores a 0 €.',
    incomesMin: () => 'Indica los ingresos netos mensuales de cada titular.',
    amountInvalid: () => 'Introduce un importe válido.',
    pendingDebtsMin: () => 'Las deudas pendientes no pueden ser negativas.',
    debtsDurationInvalid: () => 'Introduce una duración válida.',
    debtsDurationInt: () => 'La duración debe ser un número entero de meses.',
    debtsDurationMin: () => 'La duración no puede ser negativa.',
    debtsDurationMax: () => 'Revisa la duración introducida: parece demasiado larga.',
    debtsDurationRequired: () => 'Indica la duración restante de las deudas actuales.',
    savingsMin: () => 'Los ahorros disponibles no pueden ser negativos.',
    propertyTypeInvalid: () => 'Selecciona un tipo de vivienda válido.',
    propertyUsageInvalid: () => 'Selecciona el uso de la vivienda.',
    ccaaRequired: () => 'Selecciona una Comunidad Autónoma.',
    ccaaInvalid: () => 'Selecciona una Comunidad Autónoma válida.',
    appraisalInvalid: () => 'Introduce un valor de tasación válido.',
    appraisalPositive: () => 'El valor de tasación debe ser superior a 0 €.',
    purchaseInvalid: () => 'Introduce un precio de compra válido.',
    purchasePositive: () => 'El precio de compra debe ser superior a 0 €.',
    mortgageTypeInvalid: () => 'Selecciona un tipo de hipoteca válido.',
    durationInvalid: () => 'Introduce un plazo válido.',
    durationInt: () => 'El plazo debe ser un número entero de años.',
    durationMin: (min) => `El plazo mínimo es de ${min} años.`,
    durationMax: (max) => `El plazo máximo es de ${max} años.`,
    ltvInvalid: () => 'Introduce un porcentaje válido.',
    ltvPositive: () => 'El porcentaje de financiación debe ser superior a 0%.',
    ltvMax: () => 'El porcentaje de financiación no puede superar el 100%.',
    holderNamesCrossCheck: () => 'Indica el nombre y apellidos de todos los titulares.',
    holderAgesCrossCheck: () => 'Indica la edad de todos los titulares.',
    employmentTypesCrossCheck: () => 'Indica la situación laboral de todos los titulares.',
    employmentOtherRequired: () => 'Explica brevemente la situación laboral.',
    incomesCrossCheck: () => 'Indica los ingresos netos mensuales de todos los titulares.',
  },

  chat: {
    assistantName: 'Àlvar',
    headerTitle: 'Àlvar · Asistente hipotecario',
    launcherAria: 'Abre el asistente virtual',
    closeAria: 'Cierra el asistente',
    minimizeAria: 'Minimiza el asistente',
    inputPlaceholder: 'Escribe tu respuesta...',
    inputAriaLabel: 'Mensaje para el asistente',
    sendCta: 'Enviar',
    typingLabel: 'escribiendo...',
    restartHint: (n) =>
      choosePhrase(
        n,
        'Puedes responder aquí o rellenar el formulario directamente — ambas opciones se mantienen sincronizadas.',
        'Podéis responder aquí o rellenar el formulario directamente — ambas opciones se mantienen sincronizadas.'
      ),
    needsReviewMessage: () => 'Parece que hay algún dato que revisar en el formulario — fíjate si hay algún aviso en rojo antes de continuar.',
    fallbackErrorMessage: () => 'Uy, se me ha liado un poco la respuesta. Disculpa — ¿puedes repetir tu última respuesta?',
    greetings: [
      (n) =>
        choosePhrase(
          n,
          '¡Hola! Soy Àlvar, el asistente virtual de BROSSESSOR. Te ayudo a rellenar la simulación hablando, como si fuera una conversación. ¿Empezamos?',
          '¡Hola! Soy Àlvar, el asistente virtual de BROSSESSOR. Os ayudo a rellenar la simulación hablando, como si fuera una conversación. ¿Empezamos?'
        ),
      (n) =>
        choosePhrase(
          n,
          '¡Bienvenido/a! Me llamo Àlvar y soy tu asistente hipotecario de BROSSESSOR. Puedo ir preguntándote los datos e irlos rellenando yo mismo en el formulario. ¿Lo hacemos?',
          '¡Bienvenidos! Me llamo Àlvar y soy vuestro asistente hipotecario de BROSSESSOR. Puedo ir preguntándoos los datos e irlos rellenando yo mismo en el formulario. ¿Lo hacemos?'
        ),
      (n) =>
        choosePhrase(
          n,
          '¡Hola, soy Àlvar! Cuéntame tu situación con tus propias palabras y yo me encargo de rellenar el formulario. También puedes editarlo tú mismo cuando quieras.',
          '¡Hola, soy Àlvar! Contadme vuestra situación con vuestras propias palabras y yo me encargo de rellenar el formulario. También podéis editarlo vosotros mismos cuando queráis.'
        ),
      (n) =>
        choosePhrase(
          n,
          '¡Buenos días! Me llamo Àlvar y estoy aquí para facilitarte la simulación. Hablemos un rato y dejemos la hipoteca bien encaminada.',
          '¡Buenos días! Me llamo Àlvar y estoy aquí para facilitaros la simulación. Hablemos un rato y dejemos la hipoteca bien encaminada.'
        ),
    ],
    acknowledgments: [
      '¡Perfecto, lo apunto! ✅',
      'Entendido, ya lo tengo.',
      '¡Genial, gracias!',
      '¡Anotado!',
      'Muy bien, seguimos.',
      '¡Hecho! Un dato menos.',
      'De acuerdo, ya está guardado.',
      'Entendido, ¡lo dejo guardado!',
      'Genial, ya tengo ese dato.',
      'Marcado, ¡gracias!',
      'Recibido, lo tengo apuntado.',
      'Muy buena, ya lo tengo.',
      '¡Guardado! Seguimos.',
      'Perfecto, un paso más cerca.',
      'De acuerdo, apuntado y seguimos.',
    ],
    transitions: [
      'Vamos con la siguiente...',
      'Pasamos a la siguiente pregunta.',
      'Continuamos...',
      'Una cosa más:',
      'De acuerdo, ahora...',
      'Seguimos adelante.',
      'Va, seguimos con esto:',
      'Y ahora, para acabar este bloque...',
      'Vamos avanzando:',
      'Un paso más:',
      'Sigo preguntando:',
      'Muy bien, ahora toca esto:',
    ],
    clarifications: [
      (n) => choosePhrase(n, 'Perdona, no lo he terminado de entender. ¿Lo puedes escribir de nuevo?', 'Perdonad, no lo he terminado de entender. ¿Lo podéis escribir de nuevo?'),
      (n) => choosePhrase(n, 'Hmm, no estoy seguro. ¿Me puedes dar el valor otra vez?', 'Hmm, no estoy seguro. ¿Me podéis dar el valor otra vez?'),
      (n) => choosePhrase(n, 'No he podido interpretarlo bien — prueba a responderlo de otra manera.', 'No he podido interpretarlo bien — probad a responderlo de otra manera.'),
      (n) => choosePhrase(n, 'Disculpa, ¿lo puedes repetir por favor?', 'Disculpad, ¿lo podéis repetir por favor?'),
    ],
    manualEditNotices: [
      (n) =>
        choosePhrase(
          n,
          'Veo que has actualizado un dato directamente en el formulario — sin problema, continuamos desde aquí.',
          'Veo que habéis actualizado un dato directamente en el formulario — sin problema, continuamos desde aquí.'
        ),
      () => 'Perfecto, he visto el cambio en el formulario. ¡Seguimos!',
      (n) => choosePhrase(n, 'De acuerdo, me adapto al valor que has puesto en el formulario.', 'De acuerdo, me adapto al valor que habéis puesto en el formulario.'),
    ],
    askViewBreakdown: (n) =>
      choosePhrase(
        n,
        '¡Genial, ya tengo todos los datos que necesito! Antes de cerrar, ¿quieres ver el desglose detallado de condiciones y el cuadro de amortización?',
        '¡Genial, ya tengo todos los datos que necesito! Antes de cerrar, ¿queréis ver el desglose detallado de condiciones y el cuadro de amortización?'
      ),
    breakdownShown: () => 'Aquí tienes el desglose detallado y el cuadro de amortización completo. Échale un vistazo con calma.',
    askDownloadPdf: (n) =>
      choosePhrase(
        n,
        '¿Quieres que te genere y descargue ahora mismo el informe en PDF con el resumen de la simulación?',
        '¿Queréis que os genere y descargue ahora mismo el informe en PDF con el resumen de la simulación?'
      ),
    pdfDownloadStarted: () => '¡Aquí tienes tu informe en PDF — ya se está descargando! 📄',
    pdfDeclined: () => 'Sin problema, no descargaremos ningún informe ahora.',
    closingThanks: (n) =>
      choosePhrase(
        n,
        'Ha sido un placer ayudarte. Muchas gracias por confiar en BROSSESSOR — ¡que vaya muy bien con tu hipoteca!',
        'Ha sido un placer ayudaros. Muchas gracias por confiar en BROSSESSOR — ¡que vaya muy bien con vuestra hipoteca!'
      ),
    questions: {
      numberOfHolders: () => 'Para empezar, ¿cuántos titulares habrá en la hipoteca?',
      holderName: (index) => `¿Cómo se llama el titular ${index + 1}?`,
      holderAge: (name) => `¿Cuántos años tiene ${name}?`,
      employmentType: (name) => `¿Cuál es la situación laboral de ${name}? (indefinido, temporal, autónomo, funcionario, jubilado, en paro...)`,
      employmentOtherDetail: (name) => `Explícame brevemente la situación laboral de ${name}.`,
      holderIncome: (name) => `¿Qué ingresos netos mensuales tiene ${name}?`,
      pendingDebts: (n) => choosePhrase(n, '¿Tienes deudas mensuales pendientes (préstamos, tarjetas...)? Si no tienes, di 0.', '¿Tenéis deudas mensuales pendientes (préstamos, tarjetas...)? Si no tenéis, decid 0.'),
      pendingDebtsRemainingMonths: () => '¿Cuántos meses quedan para terminar de pagar esas deudas?',
      availableSavings: (n) => choosePhrase(n, '¿Cuántos ahorros tienes disponibles para la entrada y los gastos?', '¿Cuántos ahorros tenéis disponibles para la entrada y los gastos?'),
      purchaseValue: () => '¿Cuál es el precio de compra de la vivienda?',
      appraisalValue: () => '¿Y cuál es el valor de tasación?',
      propertyType: () => '¿Es obra nueva o segunda mano?',
      propertyUsage: (n) => choosePhrase(n, '¿Será tu vivienda habitual o una segunda residencia?', '¿Será vuestra vivienda habitual o una segunda residencia?'),
      ccaa: () => '¿En qué Comunidad Autónoma está la vivienda?',
      requestedLtvPercentage: (n) => choosePhrase(n, '¿Qué porcentaje de financiación te gustaría pedir al banco?', '¿Qué porcentaje de financiación os gustaría pedir al banco?'),
      durationYears: (n) => choosePhrase(n, '¿A cuántos años te gustaría el plazo de la hipoteca?', '¿A cuántos años os gustaría el plazo de la hipoteca?'),
      mortgageType: (n) => choosePhrase(n, '¿La quieres a tipo fijo o variable?', '¿La queréis a tipo fijo o variable?'),
    },
    glossary: {
      resumeBridge: () => '¡Espero que te ayude! Volvamos a donde estábamos:',
      LTV: () =>
        'El LTV (Loan to Value) es el porcentaje del valor de la vivienda que te financia el banco. Por ejemplo, un LTV del 80% significa que te prestan el 80% y que tú debes aportar el 20% restante (más impuestos y gastos) de tu bolsillo. Los bancos suelen limitarse al 80% para la vivienda habitual; un bróker puede llegar a negociar hasta el 90%, o excepcionalmente más.',
      DSTI: () =>
        'El DSTI (Debt Service to Income) es el porcentaje de tus ingresos netos que se destina a pagar deudas cada mes (incluida la cuota de la hipoteca). En este simulador, hasta un 35% se considera un nivel de riesgo bajo, y por encima del 40% ya se considera riesgo alto — los bancos suelen ser reacios a aprobar operaciones por encima de esos umbrales.',
      RATE_TYPE_RISK: () =>
        'A tipo fijo, la cuota no cambia nunca durante todo el préstamo, aunque suba el Euríbor — más tranquilidad, normalmente con un TIN de entrada algo más alto. A tipo variable, la cuota se revisa periódicamente según el Euríbor, así que puede subir o bajar — suele empezar con un TIN más bajo, pero asumes el riesgo de que suba. El tipo mixto combina unos primeros años a tipo fijo y después pasa a variable.',
    },
  },

  pdf: {
    title: 'Informe de Simulación Hipotecaria',
    generatedOn: (date) => `Generado el ${date}`,
    personalizedFor: (n) => choosePhrase(n, 'Simulación personalizada para ti.', 'Simulación personalizada para vosotros.'),
    section1Title: '1. Perfil del solicitante',
    profileCardTitle: 'Titulares y situación financiera',
    numberOfHoldersLabel: 'Número de titulares',
    holderLine: (index) => `Titular ${index + 1}`,
    employmentStatusLabel: (name) => `Situación laboral — ${name}`,
    incomeLabel: (name) => `Ingresos netos mensuales — ${name}`,
    totalIncomeLabel: 'Total ingresos netos mensuales',
    pendingDebtsLabel: 'Deudas mensuales pendientes',
    pendingDebtsWithMonths: (months) => ` (${months} meses restantes)`,
    savingsLabel: 'Ahorros disponibles',
    section2Title: '2. Vivienda y financiación',
    operationCardTitle: 'Datos de la operación',
    propertyTypeLabel: 'Tipo de vivienda',
    propertyUsageLabel: 'Uso de la vivienda',
    ccaaLabel: 'Comunidad Autónoma',
    appraisalValueLabel: 'Valor de tasación',
    purchaseValueLabel: 'Precio de compra',
    mortgageTypeLabel: 'Tipo de hipoteca',
    durationLabel: 'Plazo',
    durationYearsSuffix: (years) => `${years} años`,
    section3Title: '3. Comparativa Banco vs. Bróker',
    tinTaeLabel: 'TIN / TAE',
    notAvailable: 'No disponible',
    ltvLabel: 'LTV',
    ltvCappedSuffix: (requested) => ` (solicitud limitada a ${requested}%)`,
    loanAmountLabel: 'Importe del préstamo',
    monthlyQuotaLabel: 'Cuota mensual',
    initialContributionLabel: 'Aportación inicial necesaria',
    totalCostLabel: 'Coste total del crédito',
    dstiShortTermLabel: 'Ratio DSTI',
    dstiShortTermLabelDual: 'Ratio DSTI (corto plazo)',
    dstiLongTermLabel: 'Ratio DSTI (largo plazo)',
    notFullyFinanceableWarning: 'Atención: los ahorros disponibles no cubren el precio de compra con este LTV.',
    bankNotViableWarning: (maxAmount, maxLtv) =>
      `Financiación bancaria directa no viable — importe máximo viable: ${maxAmount} (LTV máximo viable: ${maxLtv}%). Considera la opción de bróker.`,
    marketDataUnavailable: 'Dato de mercado no disponible',
    quotaNotComputable: 'No se puede calcular la cuota para esta modalidad con los datos de mercado disponibles.',
    section4Title: '4. Impuestos y gastos de formalización',
    taxCardTitle: 'Impuestos y gastos',
    taxableBaseLabel: 'Base imponible',
    itpLabel: (rate) => `ITP (${rate})`,
    itpProgressiveBrackets: 'Escala progresiva',
    ajdLabel: (rate) => `AJD (${rate})`,
    ajdUnavailable: 'No disponible para esta comunidad',
    ajdFallbackLabel: 'AJD',
    totalTaxLabel: 'Total impuestos',
    notaryPurchaseLabel: 'Notaría (compraventa)',
    registryPurchaseLabel: 'Registro (compraventa)',
    mortgageFormalizationLabel: 'Notaría, registro y gestoría (hipoteca)',
    mortgageFormalizationValue: '0 € — a cargo del banco (LCCI art. 14.1.e)',
    totalFormalizationLabel: 'Total gastos de formalización',
    disclaimer: 'Este informe es una simulación orientativa basada en los datos introducidos y en referencias de mercado, y no constituye una oferta vinculante.',
    thanksHeading: 'Agradecimientos por parte de BROSSESSOR',
    thanksBody: (n) =>
      choosePhrase(
        n,
        'Muchas gracias por confiar en BROSSESSOR para simular tu financiación hipotecaria. Esperamos que este informe te ayude a tomar la decisión con más seguridad.',
        'Muchas gracias por confiar en BROSSESSOR para simular vuestra financiación hipotecaria. Esperamos que este informe os ayude a tomar la decisión con más seguridad.'
      ),
  },
};
