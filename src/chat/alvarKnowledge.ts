/**
 * Àlvar's knowledge base: a curated set of mortgage-education Q&A entries
 * covering the topics buyers most commonly ask about (interest rate types,
 * Euríbor, commissions, taxes, ITP, formalization fees, viability/DSTI/LTV,
 * and how to use the simulator itself). This is a CONTENT/reference asset —
 * it is not yet wired into ChatAssistant's live free-text matching (see
 * chat/glossary.ts for the existing, carefully collision-tested pattern a
 * future integration should follow: check candidate topics BEFORE
 * resolveAnswer, gate ambiguous keywords behind an explicit question cue,
 * and never let a side-question hijack a real field answer).
 *
 * Written in Catalan only, matching this codebase's canonical-language
 * convention (see i18n/dictionaries/ca.ts, the shape every other language
 * dictionary implements) — a Spanish/English version should be added the
 * same way those dictionaries were: full translations of these same
 * entries, not new content, once this canonical set is reviewed.
 *
 * Every answer is either (a) a well-established, generic fact about how
 * Spanish mortgages work (index types, legal cost allocation, standard
 * terminology) or (b) a figure ALREADY sourced and used elsewhere in this
 * codebase (the DSTI 35%/40% thresholds in engine/scoring.ts, the 80%/90%
 * LTV ceilings in data/marketRates.json, the LCCI Art. 14.1.e cost
 * allocation already cited in engine/formalizationCosts.ts). Per .clauderules
 * Rule 1 (Zero Data Hallucination), no NEW numeric market benchmark is
 * introduced here, and several entries explicitly flag where BROSSESSOR's
 * own calculation does NOT model something (e.g. bank/broker commissions
 * have no line item anywhere in /engine) so Àlvar never implies the
 * simulator accounts for a cost it doesn't.
 */

export type KnowledgeCategory =
  | 'FIXED_RATE'
  | 'VARIABLE_RATE'
  | 'MIXED_RATE'
  | 'EURIBOR'
  | 'COMMISSIONS'
  | 'TAXES_GENERAL'
  | 'ITP'
  | 'FORMALIZATION_FEES'
  | 'VIABILITY'
  | 'SIMULATOR_USAGE';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  /** Representative phrasing of the question, in Catalan. */
  question: string;
  answer: string;
  /** Lowercase keyword fragments a future chat-matching layer could use to detect this entry in free text — see the module doc comment above. */
  keywords: string[];
}

export const ALVAR_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ---------------------------------------------------------------------
  // FIXED_RATE
  // ---------------------------------------------------------------------
  {
    id: 'fixed-001',
    category: 'FIXED_RATE',
    question: 'Què és una hipoteca a tipus fix?',
    answer:
      'És una hipoteca on el TIN (tipus d’interès nominal) queda fixat des del primer dia i no canvia mai durant tot el termini, encara que pugi o baixi l’Euríbor. La teva quota mensual és sempre la mateixa.',
    keywords: ['hipoteca fix', 'tipus fix', 'que es fix'],
  },
  {
    id: 'fixed-002',
    category: 'FIXED_RATE',
    question: 'Quin és l’avantatge principal d’una hipoteca fixa?',
    answer:
      'La previsibilitat total: saps exactament què pagaràs cada mes durant tot el préstec, sense sorpreses si l’Euríbor puja. Això facilita molt planificar el pressupost familiar a llarg termini.',
    keywords: ['avantatge fix', 'per que triar fix'],
  },
  {
    id: 'fixed-003',
    category: 'FIXED_RATE',
    question: 'Quin és el desavantatge d’una hipoteca fixa?',
    answer:
      'Normalment el TIN d’entrada és una mica més alt que el d’una variable en el mateix moment, ja que el banc assumeix tot el risc que l’Euríbor pugi durant els propers 20-30 anys.',
    keywords: ['desavantatge fix', 'inconvenient fix'],
  },
  {
    id: 'fixed-004',
    category: 'FIXED_RATE',
    question: 'Una hipoteca fixa és sempre més cara que una variable?',
    answer:
      'No necessàriament: depèn de com evolucioni l’Euríbor durant tota la vida del préstec. Si l’Euríbor puja molt, la variable pot acabar costant més; si es manté baix, la fixa pot sortir més cara. Ningú pot predir-ho amb certesa.',
    keywords: ['fixa mes cara', 'fix vs variable cost'],
  },
  {
    id: 'fixed-005',
    category: 'FIXED_RATE',
    question: 'Es pot passar d’una hipoteca fixa a variable més endavant?',
    answer:
      'Sí, mitjançant una novació (modificar les condicions amb el mateix banc) o una subrogació (canviar de banc), encara que sol comportar despeses i, de vegades, una comissió. No és un canvi automàtic ni gratuït.',
    keywords: ['canviar de fix a variable', 'novacio', 'subrogacio'],
  },
  {
    id: 'fixed-006',
    category: 'FIXED_RATE',
    question: 'Una hipoteca fixa té algun tipus de revisió?',
    answer:
      'No, aquest és precisament el seu tret distintiu: el TIN no es revisa mai, ni a l’alça ni a la baixa, independentment de l’evolució de l’Euríbor o de qualsevol altre índex.',
    keywords: ['revisio hipoteca fixa'],
  },
  {
    id: 'fixed-007',
    category: 'FIXED_RATE',
    question: 'Qui sol triar una hipoteca fixa?',
    answer:
      'Persones que valoren la seguretat i la tranquil·litat per sobre de tot, o que tenen un pressupost familiar molt ajustat on una pujada de quota seria difícil d’assumir.',
    keywords: ['qui tria fixa', 'perfil hipoteca fixa'],
  },
  {
    id: 'fixed-008',
    category: 'FIXED_RATE',
    question: 'El TIN d’una hipoteca fixa inclou ja totes les despeses?',
    answer:
      'No: el TIN és només el tipus d’interès. La TAE (Taxa Anual Equivalent) sí que incorpora comissions i altres despeses associades, i és la xifra més útil per comparar ofertes entre bancs.',
    keywords: ['tin vs tae fixa'],
  },
  {
    id: 'fixed-009',
    category: 'FIXED_RATE',
    question: 'Amortitzar anticipadament una hipoteca fixa té algun límit legal?',
    answer:
      'Sí: la Llei 5/2019 (LCCI) limita la comissió que et pot cobrar el banc per amortització anticipada en hipoteques a tipus fix a un màxim del 2% del capital amortitzat durant els primers 10 anys, i de l’1,5% a partir d’aleshores.',
    keywords: ['amortitzacio anticipada fixa', 'comissio amortitzacio fixa', 'lcci fixa'],
  },
  {
    id: 'fixed-010',
    category: 'FIXED_RATE',
    question: 'Com veig si em convé més una hipoteca fixa al simulador?',
    answer:
      'Selecciona "Fix" a la pregunta del tipus d’hipoteca i BROSSESSOR calcularà la teva quota, el cost total del crèdit i el perfil de risc amb el TIN de mercat corresponent, perquè ho puguis comparar directament amb l’opció variable o mixta.',
    keywords: ['simulador tipus fix', 'com simular fix'],
  },

  // ---------------------------------------------------------------------
  // VARIABLE_RATE
  // ---------------------------------------------------------------------
  {
    id: 'variable-001',
    category: 'VARIABLE_RATE',
    question: 'Què és una hipoteca a tipus variable?',
    answer:
      'És una hipoteca on el TIN es calcula sumant un índex de referència (habitualment l’Euríbor a 12 mesos) més un diferencial fix que estableix el banc. La quota es revisa periòdicament segons com evoluciona aquest índex.',
    keywords: ['hipoteca variable', 'que es variable'],
  },
  {
    id: 'variable-002',
    category: 'VARIABLE_RATE',
    question: 'Cada quant es revisa la quota d’una hipoteca variable?',
    answer:
      'El més habitual al mercat espanyol és una revisió anual, encara que alguns contractes preveuen revisions semestrals. La revisió recalcula el TIN amb el valor més recent de l’Euríbor en aquell moment.',
    keywords: ['revisio hipoteca variable', 'cada quant es revisa'],
  },
  {
    id: 'variable-003',
    category: 'VARIABLE_RATE',
    question: 'Què és el "diferencial" en una hipoteca variable?',
    answer:
      'És el marge fix que el banc suma a l’Euríbor per calcular el teu TIN (per exemple, "Euríbor + 0,60%"). A diferència de l’Euríbor, el diferencial sí que és fix i no canvia durant tot el préstec, tret que compleixis o deixis de complir condicions de bonificació.',
    keywords: ['diferencial variable', 'que es diferencial'],
  },
  {
    id: 'variable-004',
    category: 'VARIABLE_RATE',
    question: 'Per què les hipoteques variables solen tenir un "primer any" amb un TIN diferent?',
    answer:
      'Molts bancs ofereixen un TIN fix i reduït durant els primers 12 mesos (un "tipus d’entrada") com a reclam comercial, i a partir del segon any ja s’aplica la fórmula Euríbor + diferencial de manera habitual.',
    keywords: ['tin primer any variable', 'tipus entrada'],
  },
  {
    id: 'variable-005',
    category: 'VARIABLE_RATE',
    question: 'Pot pujar molt la quota d’una hipoteca variable?',
    answer:
      'Sí, si l’Euríbor puja de manera significativa la teva quota pujarà proporcionalment en la propera revisió. És el risc principal d’aquest tipus d’hipoteca, i per això és important valorar si el teu pressupost podria absorbir una pujada abans de triar-la.',
    keywords: ['pujada quota variable', 'risc variable'],
  },
  {
    id: 'variable-006',
    category: 'VARIABLE_RATE',
    question: 'Existeixen clàusules de tipus mínim (floor) o màxim (cap) en les hipoteques variables?',
    answer:
      'Poden existir, encara que des de la sentència del Tribunal Suprem de 2013 i la normativa posterior les clàusules "sòl" abusives (no informades amb transparència) es consideren nul·les. Cada oferta ho hauria d’indicar explícitament al contracte; el simulador no dóna per fet que n’hi hagi cap tret que la font de dades ho especifiqui.',
    keywords: ['clausula sol', 'floor cap variable'],
  },
  {
    id: 'variable-007',
    category: 'VARIABLE_RATE',
    question: 'Quin límit té la comissió per amortització anticipada en una variable?',
    answer:
      'Segons la Llei 5/2019 (LCCI), en una hipoteca variable la comissió per amortització anticipada per motius financers no pot superar el 0,25% del capital amortitzat durant els primers 3 anys, o el 0,15% durant els primers 5 anys (segons el règim triat pel banc en signar), i és 0% a partir d’aleshores.',
    keywords: ['comissio amortitzacio variable', 'lcci variable'],
  },
  {
    id: 'variable-008',
    category: 'VARIABLE_RATE',
    question: 'Què vol dir "hipoteca bonificada" en una variable?',
    answer:
      'Vol dir que el diferencial que pagues és més baix a canvi de contractar productes vinculats amb el banc (assegurances, domiciliació de nòmina, plans de pensions...). Si en algun moment deixes de complir aquestes condicions, el diferencial puja al tipus "sense bonificar".',
    keywords: ['hipoteca bonificada', 'variable bonificada'],
  },
  {
    id: 'variable-009',
    category: 'VARIABLE_RATE',
    question: 'És obligatori contractar les assegurances vinculades per obtenir la bonificació?',
    answer:
      'No és obligatori per llei, però si no les contractes normalment perds la bonificació i el teu diferencial (i per tant el TIN) puja al tipus estàndard. És una decisió comercial teva sospesar l’estalvi del diferencial contra el cost real d’aquests productes.',
    keywords: ['assegurances vinculades', 'obligatori bonificacio'],
  },
  {
    id: 'variable-010',
    category: 'VARIABLE_RATE',
    question: 'Com calcula BROSSESSOR la quota d’una hipoteca variable?',
    answer:
      'El simulador utilitza el TIN de mercat vigent (Euríbor + diferencial, segons si és bonificada o no) per calcular la quota amb el sistema d’amortització francès, exactament igual que amb una hipoteca fixa, ja que la quota d’una variable es manté constant fins a la propera revisió.',
    keywords: ['simulador variable', 'com calcula quota variable'],
  },

  // ---------------------------------------------------------------------
  // MIXED_RATE
  // ---------------------------------------------------------------------
  {
    id: 'mixed-001',
    category: 'MIXED_RATE',
    question: 'Què és una hipoteca mixta?',
    answer:
      'Combina els dos mons: durant un període inicial (normalment entre 3 i 15 anys, segons el banc) el TIN és fix, i un cop passat aquest tram, la hipoteca passa a funcionar com una variable (Euríbor + diferencial) fins al final del termini.',
    keywords: ['hipoteca mixta', 'que es mixta'],
  },
  {
    id: 'mixed-002',
    category: 'MIXED_RATE',
    question: 'Quin avantatge té una hipoteca mixta?',
    answer:
      'T’ofereix la tranquil·litat d’un tipus fix durant els primers anys (normalment quan el pressupost familiar sol estar més ajustat, per exemple després d’haver comprat l’habitatge) i, a canvi, sol tenir un TIN inicial més competitiu que una fixa a tot el termini.',
    keywords: ['avantatge mixta'],
  },
  {
    id: 'mixed-003',
    category: 'MIXED_RATE',
    question: 'Què passa quan acaba el tram fix d’una hipoteca mixta?',
    answer:
      'La hipoteca passa automàticament a variable: a partir d’aquell moment el TIN es recalcula com Euríbor + el diferencial pactat "per a la resta d’anys", i la quota es revisarà periòdicament igual que en una hipoteca variable normal.',
    keywords: ['fi tram fix mixta', 'que passa despres tram fix'],
  },
  {
    id: 'mixed-004',
    category: 'MIXED_RATE',
    question: 'Quant dura normalment el tram fix d’una hipoteca mixta?',
    answer:
      'Varia molt segons l’entitat i l’oferta concreta: n’hi ha amb trams de 3, 5, 10 o fins a 15 anys de tipus fix. La durada exacta sempre l’estableix el contracte de cada banc, no hi ha un estàndard únic al mercat.',
    keywords: ['durada tram fix mixta'],
  },
  {
    id: 'mixed-005',
    category: 'MIXED_RATE',
    question: 'Els límits legals d’amortització anticipada s’apliquen igual a una hipoteca mixta?',
    answer:
      'Sí, però de manera diferenciada per tram: durant el període fix s’apliquen els límits de les hipoteques fixes (2%/1,5%) i, un cop la hipoteca passa a variable, s’apliquen els límits de les variables (0,25%/0,15%), segons la Llei 5/2019 (LCCI).',
    keywords: ['amortitzacio anticipada mixta'],
  },
  {
    id: 'mixed-006',
    category: 'MIXED_RATE',
    question: 'Per a qui sol ser interessant una hipoteca mixta?',
    answer:
      'Per a qui vol combinar estabilitat als primers anys (quan les despeses inicials solen ser més altes) amb la possibilitat de beneficiar-se d’un Euríbor baix més endavant, assumint el risc d’una quota variable a partir d’aleshores.',
    keywords: ['perfil hipoteca mixta'],
  },
  {
    id: 'mixed-007',
    category: 'MIXED_RATE',
    question: 'Es pot saber per endavant quina quota tindré després del tram fix d’una mixta?',
    answer:
      'No amb exactitud, perquè depèn de com estigui l’Euríbor en aquell moment futur, que ningú pot predir. El que sí és fix des del principi és el diferencial que s’hi sumarà, indicat al contracte.',
    keywords: ['quota futura mixta'],
  },
  {
    id: 'mixed-008',
    category: 'MIXED_RATE',
    question: 'BROSSESSOR mostra el tram fix i el tram variable d’una hipoteca mixta?',
    answer:
      'El simulador calcula la quota amb el TIN del tram vigent segons les dades de mercat disponibles per a la modalitat mixta, i quan la font de dades ho permet, mostra per separat la durada del tram fix i el diferencial aplicable un cop finalitzat.',
    keywords: ['simulador mixta', 'com mostra tram fix'],
  },

  // ---------------------------------------------------------------------
  // EURIBOR
  // ---------------------------------------------------------------------
  {
    id: 'euribor-001',
    category: 'EURIBOR',
    question: 'Què és l’Euríbor?',
    answer:
      'És l’Euro Interbank Offered Rate: el tipus d’interès mitjà al qual els principals bancs europeus es presten diners entre ells. És l’índex de referència que la immensa majoria d’hipoteques variables espanyoles utilitzen per calcular el seu TIN.',
    keywords: ['que es euribor', 'euribor definicio'],
  },
  {
    id: 'euribor-002',
    category: 'EURIBOR',
    question: 'Quin Euríbor s’utilitza normalment en les hipoteques?',
    answer:
      'Gairebé totes les hipoteques variables espanyoles utilitzen l’Euríbor a 12 mesos com a índex de referència, ja que és el termini que millor s’ajusta a una revisió anual de la quota.',
    keywords: ['euribor 12 mesos'],
  },
  {
    id: 'euribor-003',
    category: 'EURIBOR',
    question: 'Qui fixa l’Euríbor?',
    answer:
      'No el fixa cap govern ni banc central directament: resulta de la mitjana de les cotitzacions diàries que un panell de bancs europeus reporta, i el publica l’European Money Markets Institute (EMMI). Sí que està molt influït per la política de tipus d’interès del Banc Central Europeu.',
    keywords: ['qui fixa euribor'],
  },
  {
    id: 'euribor-004',
    category: 'EURIBOR',
    question: 'Per què l’Euríbor puja o baixa?',
    answer:
      'Principalment per les decisions de política monetària del Banc Central Europeu (pujar o baixar els tipus d’interès oficials per controlar la inflació) i per les expectatives del mercat sobre cap on aniran aquests tipus en el futur.',
    keywords: ['per que puja euribor', 'per que baixa euribor'],
  },
  {
    id: 'euribor-005',
    category: 'EURIBOR',
    question: 'Com afecta l’Euríbor la meva quota si tinc una hipoteca fixa?',
    answer:
      'No l’afecta gens: en una hipoteca a tipus fix el TIN no depèn de l’Euríbor en cap moment, per això és precisament l’opció que t’aïlla completament de les seves variacions.',
    keywords: ['euribor hipoteca fixa'],
  },
  {
    id: 'euribor-006',
    category: 'EURIBOR',
    question: 'On puc consultar el valor actual de l’Euríbor?',
    answer:
      'Es publica diàriament i es recull en el butlletí mensual del Banc d’Espanya, a més de múltiples webs financeres especialitzades. El valor rellevant per a la teva revisió sol ser la mitjana mensual oficial del mes anterior a la data de revisió del teu contracte.',
    keywords: ['on consultar euribor'],
  },
  {
    id: 'euribor-007',
    category: 'EURIBOR',
    question: 'L’Euríbor pot ser negatiu?',
    answer:
      'Sí, de fet ho va ser durant diversos anys (aproximadament entre 2016 i 2022), quan el Banc Central Europeu va mantenir tipus d’interès molt baixos. En aquell període, algunes hipoteques amb diferencials baixos van arribar a tenir un TIN pràcticament nul.',
    keywords: ['euribor negatiu'],
  },
  {
    id: 'euribor-008',
    category: 'EURIBOR',
    question: 'Quina relació hi ha entre l’Euríbor i el diferencial del meu banc?',
    answer:
      'El teu TIN en una hipoteca variable és sempre la suma d’aquests dos elements: TIN = Euríbor (variable, el fixa el mercat) + diferencial (fix, el fixa el teu contracte). Només l’Euríbor canvia amb el temps; el diferencial es manté constant tret que canviïn les condicions de bonificació.',
    keywords: ['relacio euribor diferencial'],
  },

  // ---------------------------------------------------------------------
  // COMMISSIONS
  // ---------------------------------------------------------------------
  {
    id: 'commission-001',
    category: 'COMMISSIONS',
    question: 'Què és la comissió d’obertura?',
    answer:
      'És una comissió única que alguns bancs cobren en formalitzar el préstec, per cobrir els costos d’estudi i tramitació de l’operació. Des de la Llei 5/2019 (LCCI) ha de ser una única comissió (no es poden acumular diverses comissions d’estudi, obertura, etc. per separat), i molts productes actuals directament no la cobren.',
    keywords: ['comissio obertura'],
  },
  {
    id: 'commission-002',
    category: 'COMMISSIONS',
    question: 'BROSSESSOR inclou la comissió d’obertura al càlcul de la quota o del cost total?',
    answer:
      'No: el simulador no modela cap comissió bancària o de broker com a partida numèrica pròpia. El "Cost total del crèdit" que mostra inclou el capital, els interessos, els impostos i les despeses de formalització (notaria i registre), però no cap comissió, ja que depèn de cada oferta concreta i no forma part de les dades de mercat que el simulador utilitza.',
    keywords: ['simulador comissio obertura', 'cost total inclou comissio'],
  },
  {
    id: 'commission-003',
    category: 'COMMISSIONS',
    question: 'Què és la comissió per amortització anticipada?',
    answer:
      'És l’import que el banc pot cobrar-te si retornes part o tot el préstec abans del previst. Els seus límits màxims estan fixats per llei (Llei 5/2019, LCCI) i varien segons si la hipoteca és fixa o variable — vegeu les preguntes específiques sobre fixes i variables.',
    keywords: ['comissio amortitzacio anticipada general'],
  },
  {
    id: 'commission-004',
    category: 'COMMISSIONS',
    question: 'Què és la comissió per subrogació?',
    answer:
      'És la que es pot aplicar quan canvies la teva hipoteca d’un banc a un altre (subrogació d’acreedor) o quan un comprador assumeix la hipoteca existent d’un venedor. Els seus límits també estan regulats per llei i han disminuït molt des de la LCCI de 2019.',
    keywords: ['comissio subrogacio'],
  },
  {
    id: 'commission-005',
    category: 'COMMISSIONS',
    question: 'Els brokers hipotecaris cobren comissió?',
    answer:
      'Sí, normalment cobren uns honoraris per la seva feina de negociació i intermediació amb els bancs, ja sigui com a import fix o com a percentatge sobre l’import del préstec. Aquest cost és independent del que pugui cobrar el banc i BROSSESSOR no el calcula, ja que depèn de l’acord concret amb cada broker.',
    keywords: ['comissio broker', 'honoraris broker'],
  },
  {
    id: 'commission-006',
    category: 'COMMISSIONS',
    question: 'Existeix una comissió per no domiciliar la nòmina?',
    answer:
      'No sol existir com a "comissió" pròpiament dita, però és habitual que no domiciliar la nòmina et faci perdre la bonificació del diferencial, cosa que en la pràctica encareix el TIN encara que no aparegui com una línia de cost separada.',
    keywords: ['comissio no domiciliar nomina'],
  },
  {
    id: 'commission-007',
    category: 'COMMISSIONS',
    question: 'Hi ha comissió per emetre certificats o duplicats?',
    answer:
      'Alguns bancs sí que cobren petites quantitats per emetre certificats (per exemple, de deute pendent o d’interessos pagats), tot i que solen ser imports menors comparats amb la resta de despeses de la hipoteca.',
    keywords: ['comissio certificats'],
  },
  {
    id: 'commission-008',
    category: 'COMMISSIONS',
    question: 'On he de mirar per saber quines comissions té la meva oferta?',
    answer:
      'Sempre a la Fitxa Europea d’Informació Normalitzada (FEIN) que el banc t’ha de lliurar obligatòriament abans de signar, on han de constar totes les comissions aplicables de manera clara i comparable.',
    keywords: ['fein comissions', 'on veure comissions'],
  },
  {
    id: 'commission-009',
    category: 'COMMISSIONS',
    question: 'La TAE inclou les comissions?',
    answer:
      'Sí, la TAE (Taxa Anual Equivalent) està dissenyada precisament per incorporar el TIN més les comissions i altres costos associats en un únic percentatge, per facilitar la comparació real entre ofertes.',
    keywords: ['tae inclou comissions'],
  },
  {
    id: 'commission-010',
    category: 'COMMISSIONS',
    question: 'Puc negociar les comissions amb el banc?',
    answer:
      'Sí, moltes comissions (especialment l’obertura) són negociables, sobretot si tens un bon perfil creditici o si un broker gestiona l’operació negociant-la amb diverses entitats simultàniament.',
    keywords: ['negociar comissions'],
  },

  // ---------------------------------------------------------------------
  // TAXES_GENERAL
  // ---------------------------------------------------------------------
  {
    id: 'tax-001',
    category: 'TAXES_GENERAL',
    question: 'Quins impostos he de pagar en comprar un habitatge?',
    answer:
      'Depèn de si és obra nova o segona mà: l’obra nova tributa per IVA (impost estatal, no calculat per BROSSESSOR) més AJD, mentre que la segona mà tributa per ITP. Tots dos són impostos autonòmics amb tipus diferents segons la comunitat autònoma on es trobi l’habitatge.',
    keywords: ['impostos compra habitatge'],
  },
  {
    id: 'tax-002',
    category: 'TAXES_GENERAL',
    question: 'Per què els impostos varien tant entre comunitats autònomes?',
    answer:
      'Perquè l’ITP i l’AJD són impostos cedits a les comunitats autònomes, i cada una té competència per fixar el seu propi tipus dins d’uns marges legals, cosa que fa que la mateixa operació pugui tributar de manera diferent segons on es trobi l’habitatge.',
    keywords: ['per que varien impostos ccaa'],
  },
  {
    id: 'tax-003',
    category: 'TAXES_GENERAL',
    question: 'Què és la base imposable per calcular l’impost?',
    answer:
      'Habitualment és el preu de compravenda de l’habitatge, encara que en alguns casos l’administració pot revisar-lo i aplicar un valor de referència cadastral si el considera més alt que el preu declarat.',
    keywords: ['base imposable impost'],
  },
  {
    id: 'tax-004',
    category: 'TAXES_GENERAL',
    question: 'Els impostos de compra es poden finançar dins la hipoteca?',
    answer:
      'No directament: la banca sol limitar el finançament a un percentatge del valor de l’habitatge (típicament fins al 80% amb un banc, o fins al 90% amb un broker), de manera que els impostos i altres despeses solen haver de pagar-se amb estalvis propis, no amb el préstec hipotecari. Per això BROSSESSOR destina primer els teus estalvis a cobrir impostos i despeses i, amb la resta, calcula l’entrada i el LTV resultant.',
    keywords: ['finançar impostos amb hipoteca'],
  },
  {
    id: 'tax-005',
    category: 'TAXES_GENERAL',
    question: 'BROSSESSOR calcula automàticament els impostos?',
    answer:
      'Sí: en indicar la comunitat autònoma i el tipus d’habitatge (obra nova o segona mà), el simulador aplica automàticament l’escala d’ITP o AJD corresponent segons les dades fiscals amb font oficial per a aquella comunitat.',
    keywords: ['simulador calcula impostos'],
  },
  {
    id: 'tax-006',
    category: 'TAXES_GENERAL',
    question: 'Què passa si l’AJD d’una comunitat no està disponible al simulador?',
    answer:
      'BROSSESSOR ho indica explícitament com a "dada no disponible" en comptes d’inventar-se una xifra: seguint el principi de zero estimació de dades del projecte, només es mostren imports quan hi ha una font oficial i verificada per a aquella comunitat.',
    keywords: ['ajd no disponible', 'dada no disponible impost'],
  },
  {
    id: 'tax-007',
    category: 'TAXES_GENERAL',
    question: 'Els impostos de compra es poden deduir a la declaració de la renda?',
    answer:
      'En general no hi ha una deducció estatal per l’ITP/AJD pagat en comprar l’habitatge habitual, tret que t’acullis a règims transitoris antics (per a compres anteriors a 2013) o a deduccions autonòmiques específiques que algunes comunitats ofereixen per a determinats col·lectius.',
    keywords: ['deduir impostos renda'],
  },
  {
    id: 'tax-008',
    category: 'TAXES_GENERAL',
    question: 'Qui ha de pagar els impostos de la compravenda, el comprador o el venedor?',
    answer:
      'En l’ITP i l’AJD, el subjecte passiu (qui ha de pagar) és sempre el comprador. El venedor, en canvi, pot haver de tributar per la plusvàlua municipal i per l’increment patrimonial a la seva pròpia declaració de la renda.',
    keywords: ['qui paga impostos compravenda'],
  },

  // ---------------------------------------------------------------------
  // ITP
  // ---------------------------------------------------------------------
  {
    id: 'itp-001',
    category: 'ITP',
    question: 'Què és l’ITP?',
    answer:
      'L’Impost sobre Transmissions Patrimonials (ITP) grava la compra d’habitatges de segona mà (usats). El paga sempre el comprador, i el seu tipus el fixa cada comunitat autònoma, ja sigui com un percentatge fix o mitjançant una escala progressiva per trams de preu.',
    keywords: ['que es itp', 'itp definicio'],
  },
  {
    id: 'itp-002',
    category: 'ITP',
    question: 'L’ITP s’aplica també a l’obra nova?',
    answer:
      'No: l’obra nova tributa per IVA (un impost estatal), no per ITP. L’ITP només s’aplica a transmissions de segona mà, és a dir, habitatges que ja han tingut un propietari anterior.',
    keywords: ['itp obra nova'],
  },
  {
    id: 'itp-003',
    category: 'ITP',
    question: 'Com sé quin tipus d’ITP m’aplica?',
    answer:
      'Depèn de la comunitat autònoma on estigui l’habitatge: algunes apliquen un tipus fix únic i altres una escala progressiva amb tipus creixents segons trams de preu. BROSSESSOR ho calcula automàticament un cop indiques la comunitat autònoma i el preu de compra.',
    keywords: ['quin tipus itp aplica'],
  },
  {
    id: 'itp-004',
    category: 'ITP',
    question: 'Què vol dir que l’ITP és "progressiu per trams"?',
    answer:
      'Vol dir que el tipus impositiu augmenta a mesura que el preu de l’habitatge supera certs llindars, i cada tram tributa només per la part del preu que hi cau (de manera similar a com funciona l’IRPF), no per tot el valor de l’habitatge al tipus més alt.',
    keywords: ['itp progressiu trams', 'itp escala'],
  },
  {
    id: 'itp-005',
    category: 'ITP',
    question: 'Hi ha tipus reduïts d’ITP per a joves o famílies nombroses?',
    answer:
      'Moltes comunitats autònomes sí que preveuen tipus reduïts per a col·lectius com joves, famílies nombroses, persones amb discapacitat o famílies monoparentals, sempre que es compleixin els requisits d’edat, ingressos o altres condicions que estableixi cada normativa autonòmica.',
    keywords: ['itp reduit joves', 'itp familia nombrosa'],
  },
  {
    id: 'itp-006',
    category: 'ITP',
    question: 'Selecciono Catalunya i el simulador no em mostra l’import de l’ITP: què passa?',
    answer:
      'Catalunya sí que té dades d’ITP completes i verificades a BROSSESSOR (escala progressiva vigent des del 27/06/2025, amb tipus del 10% al 13% segons el preu). Si l’import no apareix, revisa que el tipus d’habitatge estigui marcat com "Segona mà" (l’ITP no aplica a obra nova) i que el preu de compra estigui informat correctament; si el problema persisteix, pot tractar-se d’un error puntual de la interfície que convé reportar.',
    keywords: ['catalunya itp no surt', 'cataluna itp error', 'itp catalunya no funciona'],
  },
  {
    id: 'itp-007',
    category: 'ITP',
    question: 'Quin és el tipus general d’ITP a Catalunya?',
    answer:
      'Des del 27/06/2025, Catalunya aplica una escala progressiva: 10% fins a 600.000 €, 11% entre 600.000 € i 900.000 €, 12% entre 900.000 € i 1.500.000 €, i 13% per a la part que superi 1.500.000 €. A més, existeix un tipus agreujat del 20% per a "grans tenidors" d’habitatge.',
    keywords: ['itp catalunya tipus', 'itp catalunya percentatge'],
  },
  {
    id: 'itp-008',
    category: 'ITP',
    question: 'Catalunya té tipus reduïts d’ITP?',
    answer:
      'Sí: per exemple, joves fins a 35 anys, famílies nombroses, persones amb una discapacitat igual o superior al 65%, famílies monoparentals i víctimes de violència de gènere poden aplicar un tipus reduït del 5%, sempre que compleixin els límits de renda i altres condicions establertes.',
    keywords: ['itp catalunya reduit', 'itp catalunya joves'],
  },
  {
    id: 'itp-009',
    category: 'ITP',
    question: 'L’ITP es paga d’un cop o es pot ajornar?',
    answer:
      'Amb caràcter general s’ha d’autoliquidar i pagar en el termini que marca cada comunitat autònoma des de la signatura de l’escriptura (normalment 30 dies hàbils), encara que algunes administracions preveuen mecanismes d’ajornament o fraccionament en casos justificats.',
    keywords: ['pagar itp ajornar'],
  },
  {
    id: 'itp-010',
    category: 'ITP',
    question: 'Què passa si no pago l’ITP a temps?',
    answer:
      'L’administració tributària pot aplicar recàrrecs i interessos de demora, i en casos greus fins i tot iniciar un procediment executiu de cobrament. A més, sense l’ITP liquidat no es pot inscriure l’habitatge al Registre de la Propietat.',
    keywords: ['no pagar itp', 'recarrecs itp'],
  },

  // ---------------------------------------------------------------------
  // FORMALIZATION_FEES
  // ---------------------------------------------------------------------
  {
    id: 'formalization-001',
    category: 'FORMALIZATION_FEES',
    question: 'Quines despeses de formalització té una hipoteca?',
    answer:
      'Principalment notaria i registre de la propietat per a l’escriptura de compravenda, més la taxació de l’habitatge. Les despeses de notaria, registre i gestoria de l’escriptura d’HIPOTECA (no de la compravenda) les assumeix per llei l’entitat prestadora, no tu.',
    keywords: ['despeses formalitzacio hipoteca'],
  },
  {
    id: 'formalization-002',
    category: 'FORMALIZATION_FEES',
    question: 'Per què el banc ha de pagar la notaria de la hipoteca i jo no?',
    answer:
      'Ho estableix la Llei 5/2019 (LCCI), article 14.1.e: els aranzels notarials i registrals de l’escriptura de préstec hipotecari, així com la gestoria associada, van a càrrec del prestador (el banc), no del prestatari. Només la taxació de l’immoble continua sent a càrrec teu.',
    keywords: ['qui paga notaria hipoteca', 'lcci notaria'],
  },
  {
    id: 'formalization-003',
    category: 'FORMALIZATION_FEES',
    question: 'Què inclou la notaria de la compravenda?',
    answer:
      'És l’honorari del notari per redactar i autoritzar l’escriptura pública de compravenda, calculat segons un aranzel oficial que depèn principalment del preu de l’habitatge.',
    keywords: ['notaria compravenda'],
  },
  {
    id: 'formalization-004',
    category: 'FORMALIZATION_FEES',
    question: 'Què és el registre de la propietat i per què he de pagar-lo?',
    answer:
      'És l’organisme on s’inscriu oficialment que ets el nou propietari de l’habitatge, cosa que et dóna seguretat jurídica davant de tercers. El cost d’inscriure l’escriptura de compravenda també segueix un aranzel oficial basat en el preu de l’immoble.',
    keywords: ['registre propietat compravenda'],
  },
  {
    id: 'formalization-005',
    category: 'FORMALIZATION_FEES',
    question: 'Què és la taxació i qui la paga?',
    answer:
      'És l’informe d’un professional homologat que determina el valor de mercat de l’habitatge, imprescindible perquè el banc calculi quant et pot finançar. Per llei, la paga sempre el comprador (prestatari), no el banc.',
    keywords: ['taxacio habitatge', 'qui paga taxacio'],
  },
  {
    id: 'formalization-006',
    category: 'FORMALIZATION_FEES',
    question: 'BROSSESSOR calcula el cost de la taxació?',
    answer:
      'No: el simulador no inclou un import de taxació al seu càlcul, ja que no existeix cap barem oficial i verificat per a aquest cost al conjunt de dades utilitzades. Consulta directament amb la teva entitat o taxador quin honorari aplicarien al teu cas.',
    keywords: ['simulador taxacio cost'],
  },
  {
    id: 'formalization-007',
    category: 'FORMALIZATION_FEES',
    question: 'Què fa una gestoria en el procés de compra?',
    answer:
      'S’encarrega de tramitar el pagament d’impostos, la inscripció al registre i altres gestions administratives derivades de la compravenda i de la hipoteca, alliberant-te d’haver-ho de fer tu mateix davant de cada organisme.',
    keywords: ['gestoria compravenda funcio'],
  },
  {
    id: 'formalization-008',
    category: 'FORMALIZATION_FEES',
    question: 'La gestoria de la hipoteca la pago jo?',
    answer:
      'No: igual que la notaria i el registre de l’escriptura d’hipoteca, la gestoria d’aquesta escriptura també va a càrrec del banc des de la Llei 5/2019 (LCCI). Sí que pots optar per una gestoria pròpia per a la part de la compravenda si ho prefereixes, i en aquest cas el cost seria teu.',
    keywords: ['qui paga gestoria hipoteca'],
  },
  {
    id: 'formalization-009',
    category: 'FORMALIZATION_FEES',
    question: 'Quant costa aproximadament formalitzar una hipoteca?',
    answer:
      'Depèn molt del preu de l’habitatge, ja que notaria i registre segueixen aranzels progressius. BROSSESSOR calcula l’import exacte de notaria i registre de la compravenda a partir del preu que indiquis, segons el barem oficial vigent.',
    keywords: ['quant costa formalitzar hipoteca'],
  },
  {
    id: 'formalization-010',
    category: 'FORMALIZATION_FEES',
    question: 'On veig el desglossament de despeses de formalització al simulador?',
    answer:
      'A l’apartat "Aportació Inicial Total" de cada opció (banc o broker) trobaràs desglossat quant correspon a notaria i quant a registre de la compravenda, a més dels impostos i el capital propi necessari.',
    keywords: ['on veure despeses formalitzacio simulador'],
  },

  // ---------------------------------------------------------------------
  // VIABILITY
  // ---------------------------------------------------------------------
  {
    id: 'viability-001',
    category: 'VIABILITY',
    question: 'Què és el DSTI?',
    answer:
      'El Debt Service to Income és el percentatge dels teus ingressos nets mensuals que destines a pagar deutes, incloent-hi la quota de la hipoteca. Com més baix sigui, més marge tens i menys risc financer assumeixes.',
    keywords: ['que es dsti'],
  },
  {
    id: 'viability-002',
    category: 'VIABILITY',
    question: 'Quin DSTI es considera de risc baix a BROSSESSOR?',
    answer:
      'Fins a un 35% es classifica com a risc baix. Entre el 35% i el 40% es considera risc mitjà, i per sobre del 40% risc alt: els bancs solen ser molt reticents a aprovar operacions per sobre d’aquest darrer llindar.',
    keywords: ['dsti risc baix', 'dsti llindars'],
  },
  {
    id: 'viability-003',
    category: 'VIABILITY',
    question: 'Què és el LTV?',
    answer:
      'El Loan to Value és el percentatge del valor de l’habitatge que et finança el banc. Un LTV del 80% vol dir que et presten el 80% del valor i que has d’aportar tu la resta (20%) més els impostos i despeses.',
    keywords: ['que es ltv'],
  },
  {
    id: 'viability-004',
    category: 'VIABILITY',
    question: 'Quin LTV màxim ofereix normalment un banc?',
    answer:
      'Els bancs solen limitar-se al 80% del valor de l’habitatge habitual, seguint el criteri estàndard del Banc d’Espanya, encara que en alguns casos puntuals (per exemple, per a habitatges propietat del mateix banc) poden arribar a percentatges superiors.',
    keywords: ['ltv maxim banc'],
  },
  {
    id: 'viability-005',
    category: 'VIABILITY',
    question: 'Per què un broker pot arribar a un LTV més alt que un banc?',
    answer:
      'Perquè negocia amb múltiples entitats simultàniament i pot estructurar l’operació per a perfils que un banc no acceptaria directament, arribant fins al 90% (o, excepcionalment, més) del valor de l’habitatge en alguns casos.',
    keywords: ['broker ltv mes alt'],
  },
  {
    id: 'viability-006',
    category: 'VIABILITY',
    question: 'Què passa si el meu DSTI és massa alt?',
    answer:
      'El banc pot denegar-te l’operació o oferir-te’n una de reduïda (menys import o més termini per abaixar la quota). BROSSESSOR no rebutja l’operació: quan una opció no és viable amb banc directe, ajusta automàticament l’oferta a l’import màxim que sí acceptaria i t’explica el motiu de la reducció.',
    keywords: ['dsti massa alt', 'que passa dsti alt'],
  },
  {
    id: 'viability-007',
    category: 'VIABILITY',
    question: 'El DSTI es calcula sobre ingressos bruts o nets?',
    answer:
      'Sobre ingressos nets mensuals (el que realment reps al compte), no sobre el salari brut, ja que és la xifra que reflecteix la teva capacitat real de pagament.',
    keywords: ['dsti ingressos bruts nets'],
  },
  {
    id: 'viability-008',
    category: 'VIABILITY',
    question: 'Els deutes actuals (préstecs, targetes) afecten la viabilitat?',
    answer:
      'Sí, i molt: es compten dins del DSTI juntament amb la futura quota hipotecària. BROSSESSOR distingeix entre el DSTI "immediat" (mentre encara pagues aquests deutes) i el DSTI "a llarg termini" (un cop liquidats), ja que la teva capacitat real millora quan s’acaben.',
    keywords: ['deutes actuals viabilitat'],
  },
  {
    id: 'viability-009',
    category: 'VIABILITY',
    question: 'Com millora la meva viabilitat si tinc més estalvis?',
    answer:
      'Amb més estalvis necessites finançar un import menor (un LTV més baix), la qual cosa redueix la quota mensual i, per tant, el teu DSTI, millorant les possibilitats de ser acceptat i les condicions que et poden oferir.',
    keywords: ['estalvis milloren viabilitat'],
  },
  {
    id: 'viability-010',
    category: 'VIABILITY',
    question: 'Si tinc dos titulars, com es calcula la viabilitat?',
    answer:
      'Se sumen els ingressos nets de tots els titulars per calcular la capacitat total, i també es sumen els seus deutes pendents, de manera que el DSTI reflecteix la situació financera conjunta de la unitat familiar que sol·licita la hipoteca.',
    keywords: ['viabilitat dos titulars'],
  },
  {
    id: 'viability-011',
    category: 'VIABILITY',
    question: 'Un allargament del termini millora la viabilitat?',
    answer:
      'Sol millorar-la a curt termini, ja que allargar el termini redueix la quota mensual i, per tant, el DSTI. A canvi, pagaràs més interessos totals durant la vida del préstec, així que és un equilibri entre viabilitat immediata i cost total.',
    keywords: ['allargar termini viabilitat'],
  },
  {
    id: 'viability-012',
    category: 'VIABILITY',
    question: 'Com veig si la meva operació és viable al simulador?',
    answer:
      'A les pantalles de resultats, BROSSESSOR mostra el perfil de risc (DSTI) de cada opció i, si el finançament directe amb banc no és viable, ajusta l’oferta a l’import i al LTV màxims que sí acceptaria i t’explica per què, a més de suggerir-te l’alternativa de broker.',
    keywords: ['com veure viabilitat simulador'],
  },

  // ---------------------------------------------------------------------
  // SIMULATOR_USAGE
  // ---------------------------------------------------------------------
  {
    id: 'usage-001',
    category: 'SIMULATOR_USAGE',
    question: 'Qui ets tu, Àlvar?',
    answer:
      'Sóc l’assistent virtual de BROSSESSOR. T’ajudo a omplir la simulació hipotecària conversant amb tu, com si fóssim al despatx d’un assessor, i vaig emplenant jo mateix el formulari a mesura que em respons.',
    keywords: ['qui ets alvar', 'que fas alvar'],
  },
  {
    id: 'usage-002',
    category: 'SIMULATOR_USAGE',
    question: 'Puc omplir el formulari directament en lloc de xatejar amb tu?',
    answer:
      'Sí, totalment: el xat i el formulari comparteixen exactament les mateixes dades, així que pots respondre’m aquí, omplir els camps directament, o combinar totes dues opcions com et sigui més còmode en cada moment.',
    keywords: ['omplir formulari sense xat'],
  },
  {
    id: 'usage-003',
    category: 'SIMULATOR_USAGE',
    question: 'Què passa si m’equivoco en una resposta?',
    answer:
      'No passa res: pots corregir el valor directament al camp del formulari en qualsevol moment, i jo detectaré el canvi i continuaré la conversa des d’aquest nou valor, sense perdre la resta de dades ja introduïdes.',
    keywords: ['corregir resposta equivocada'],
  },
  {
    id: 'usage-004',
    category: 'SIMULATOR_USAGE',
    question: 'Quines dades em demanaràs?',
    answer:
      'Primer les del perfil dels titulars (nombre, noms, edats, situació laboral i ingressos), després els deutes i estalvis, i finalment les dades de l’habitatge i del finançament que vols (preu, comunitat autònoma, LTV, termini i tipus d’hipoteca).',
    keywords: ['quines dades demana simulador'],
  },
  {
    id: 'usage-005',
    category: 'SIMULATOR_USAGE',
    question: 'Quant triga a fer-se la simulació?',
    answer:
      'Normalment un parell de minuts si respons seguit: un cop tinc totes les dades necessàries, el càlcul de les tres opcions (banc bonificat, banc sense bonificar i broker) és instantani.',
    keywords: ['quant triga simulacio'],
  },
  {
    id: 'usage-006',
    category: 'SIMULATOR_USAGE',
    question: 'Què són les tres opcions que compara el simulador?',
    answer:
      'Compara finançament directe amb banc amb condicions bonificades, finançament directe amb banc sense bonificar, i l’alternativa d’un broker que negocia amb múltiples entitats: si el banc no pot finançar l’operació, el broker prioritza el màxim finançament possible (fins a un LTV superior), acceptant un endeutament per sobre del 35% dels bancs però sense superar el 40%; si és viable, prioritza les condicions més econòmiques sense augmentar l’endeutament.',
    keywords: ['tres opcions simulador comparar'],
  },
  {
    id: 'usage-007',
    category: 'SIMULATOR_USAGE',
    question: 'Puc veure el quadre d’amortització complet?',
    answer:
      'Sí: un cop completades les dades, pots consultar el quadre d’amortització mes a mes o any a any per a qualsevol de les tres opcions, amb el detall de capital amortitzat, interessos pagats i capital pendent.',
    keywords: ['quadre amortitzacio complet'],
  },
  {
    id: 'usage-008',
    category: 'SIMULATOR_USAGE',
    question: 'Com descarrego l’informe en PDF?',
    answer:
      'Un cop la simulació estigui completa, jo mateix et preguntaré si vols que et generi el PDF, o també pots prémer el botó "Descarregar informe PDF" a la pantalla corresponent en qualsevol moment.',
    keywords: ['descarregar informe pdf', 'com descarregar pdf'],
  },
  {
    id: 'usage-009',
    category: 'SIMULATOR_USAGE',
    question: 'Què inclou l’informe en PDF?',
    answer:
      'Inclou el perfil dels titulars, les dades de l’operació, la comparativa completa de les tres opcions (banc bonificat, banc sense bonificar i broker), el desglossament d’impostos i despeses de formalització, i un resum final.',
    keywords: ['que inclou pdf informe'],
  },
  {
    id: 'usage-010',
    category: 'SIMULATOR_USAGE',
    question: 'Puc desar diverses simulacions per comparar-les més tard?',
    answer:
      'Sí, a la pantalla de descàrrega hi ha un apartat "Escenaris desats" on pots guardar la simulació actual amb un nom, i comparar-ne diverses una al costat de l’altra quan en tinguis almenys dues de guardades.',
    keywords: ['desar simulacions comparar'],
  },
  {
    id: 'usage-011',
    category: 'SIMULATOR_USAGE',
    question: 'Puc fer servir el simulador en castellà o anglès?',
    answer:
      'Sí, pots triar l’idioma (català, castellà o anglès) a la primera pantalla, i tant el formulari com jo mateix ens adaptem completament a l’idioma escollit durant tota la simulació.',
    keywords: ['idioma simulador castella angles'],
  },
  {
    id: 'usage-012',
    category: 'SIMULATOR_USAGE',
    question: 'Puc tornar a començar una simulació des de zero?',
    answer:
      'Sí, a la pantalla final trobaràs el botó "Nova simulació", que reinicia totes les dades del formulari perquè puguis començar-ne una de completament nova.',
    keywords: ['reiniciar simulacio nova'],
  },
  {
    id: 'usage-013',
    category: 'SIMULATOR_USAGE',
    question: 'Puc preguntar-te dubtes generals mentre omplo el formulari?',
    answer:
      'Sí, si et sorgeix un dubte sobre algun concepte (per exemple, què és el LTV o la diferència entre tipus fix i variable) mentre estàs responent una pregunta, te’l puc aclarir i després continuem exactament des d’on ho havíem deixat.',
    keywords: ['preguntar dubtes mentre formulari'],
  },
  {
    id: 'usage-014',
    category: 'SIMULATOR_USAGE',
    question: 'Les dades que introdueixo al simulador queden guardades en algun servidor?',
    answer:
      'No: BROSSESSOR funciona íntegrament al teu navegador, sense enviar les teves dades personals o financeres a cap servidor extern. Els escenaris desats es guarden localment al teu propi dispositiu.',
    keywords: ['dades guardades servidor privacitat'],
  },
];

export function getKnowledgeByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
  return ALVAR_KNOWLEDGE_BASE.filter((entry) => entry.category === category);
}
