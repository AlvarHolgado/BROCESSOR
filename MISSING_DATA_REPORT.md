# Informe de Dades Extretes i Dades Pendents — `mortgageData.json`

Aquest informe documenta l'extracció de dades realitzada sobre tots els documents disponibles a `/docs` (17 fitxers .docx, .xlsx i .pdf dins de `TREBALL DE RECERCA`) per poblar `/src/data/mortgageData.json`, en compliment estricte de la `RULE 1` de `.clauderules`: cap xifra ha estat estimada, interpolada ni inventada. Nomes s'ha volcat allo que apareixia explícitament en un document font.

---

## 1. Camps poblats correctament (amb font)

### 1.1 Impostos autonomics — `ccaaTaxRates`

| CCAA | ITP | AJD | Document font |
|---|---|---|---|
| Andalusia | 7% | — | `ESTUDI MERCAT HIPOTEQUES/MERCAT HIPOTECARI EXCL.xlsx`, full "DADES EXTRA" |
| Arago | 8% | — | idem |
| Asturies | 8% | — | idem |
| Illes Balears | 8% | — | idem |
| Canaries | 6,5% | — | idem |
| Cantabria | 10% | — | idem |
| Castella-La Manxa | 9% | — | idem |
| Castella i Lleo | 8% | — | idem (vegeu nota d'ambiguitat al §3) |
| Catalunya | 10% | — | idem |
| Extremadura | 8% | — | idem |
| Galicia | 10% | — | idem |
| Madrid | 6% | 0,75% | ITP: idem. AJD: `INFORMACIÓ COMPLETA.docx` (cita "Guía Fiscal (2026, junio). ITP Madrid 2026: cuánto pagas (6 %) y AJD 0,75 %") |
| Murcia | 8% | — | `MERCAT HIPOTECARI EXCL.xlsx`, full "DADES EXTRA" |
| Navarra | 6% | — | idem |
| Pais Basc | 4% | 0% | ITP: idem. AJD: `INFORMACIÓ COMPLETA.docx` (taula comparativa Espanya/UK: "AJD entre 0 % (País Vasco) y 1,5-2 %") |
| La Rioja | 7% | — | `MERCAT HIPOTECARI EXCL.xlsx`, full "DADES EXTRA" |

Font original citada dins l'Excel per a tota la taula d'ITP: aurora-homes.es, *Impuestos en la compra de vivienda* (2025).

### 1.2 Tipus base de mercat — `baselineMarketRates`

| Camp | Valor | Document font |
|---|---|---|
| `euriborReference.value` | 1,96% (desembre 2025) | `MERCAT HIPOTECARI EXCL.xlsx`, full "Inflació i BCE" (font citada: euribor-rates.eu) |
| `byMortgageType.FIXED.tin` | 2,95% (mitjana anual 2025) | `MERCAT HIPOTECARI EXCL.xlsx`, full "DADES EXTRA" (font: INE, Estadística d'Hipoteques) |
| `byMortgageType.FIXED.tae` | 3,48% (mitjana anual 2025) | idem |
| `byMortgageType.VARIABLE.tae` | 3,21% (mitjana anual 2025) | idem |

### 1.3 Ofertes bancaries — `bankOffers` (9 entrades: 3 bancs × fix/variable/mixta)

Font principal: `PART TEÒRICA/ESTUDI MERCAT HIPOTEQUES/ESTUDI MERCAT HIPOTEQUES_.xlsx`, fulls "BANCS SB" (sense bonificar), "BANCS B" (bonificat) i "COMP+CONC" (LTV i quotes consolidades). Simuladors oficials citats: bancsabadell.com, caixabank.es, ing.es.

| Banc | Tipus | TIN no bonificat | TIN bonificat | LTV maxim |
|---|---|---|---|---|
| Banc Sabadell | Fixa | 3,60% | 2,60% | 80% |
| Banc Sabadell | Variable (1r any) | 2,35% | 1,35% | 80% |
| Banc Sabadell | Mixta (3 primers anys) | 2,45% | 1,55% | 80% |
| CaixaBank | Fixa | 3,85% | 2,85% | 80% |
| ING | Fixa (25 anys) | 4,35% | 3,95% | 80% |
| ING | Variable (1r any) | 2,65% | 2,25% | 80% |
| ING | Mixta (5 primers anys) | 2,90% | 2,50% | 80% |

Els trams "resta d'anys" (diferencial sobre Euribor) de les hipoteques variables i mixtes s'han conservat com a camp `note` dins de cada entrada, ja que l'esquema `RateConditions` nomes admet un TIN/TAE/quota únics i aquesta informació periodica no s'ha volgut descartar.

### 1.4 Ofertes de bróker — `brokerOffers`

Fonts: `ESTUDI MERCAT HIPOTEQUES_.xlsx` (full "BROKER" i "COMP+CONC") i `PART PRÀCTICA/SIMULADOR PT.1` → `ESTUDIO HOMTER.pdf` (oferta real emesa per Alcaring 3000 S.L. / Homter, Nº Registre D056 Banc d'Espanya, per a una compra de 250.000 € a Catalunya).

| Bróker | TIN negociat | Honoraris | LTV maxim |
|---|---|---|---|
| Homter | 2,20% | 5.990 € (fixos) | 90% |
| Finnco | 2,46% | 4.800 € (fixos) | 90% |
| Finkers | 2,15% | 5.560 € (fixos) | 94% |

Per a Homter, `additionalCosts.taxes` (25.000 €) i `additionalCosts.expenses` (2.650 € = notaria/gestoria/registre 2.200 € + tasació 450 €) provenen del desglossament exacte de `ESTUDIO HOMTER.pdf`, pagina 1. **Atencio:** aquesta xifra es una instancia concreta (habitatge de 250.000 € a Catalunya, ITP 10%), no una taula generica de despeses per a qualsevol operacio.

---

## 2. Camps que queden a `null` — pendents d'introduccio manual

### 2.1 Impostos autonomics

- **ITP — Comunitat Valenciana, Ceuta, Melilla:** ~~cap document de `/docs` conté un tipus d'ITP explícit per a aquestes 3 jurisdiccions~~ **RESOLT el 2026-08-24.** L'usuari va autoritzar explícitament una recerca web dedicada (fora de `/docs`) per completar les 19 jurisdiccions senceres, no nomes aquestes 3 — vegeu la secció 5 més avall.
- **AJD**: totes les CCAA excepte Madrid i Pais Basc — segueix pendent. `/docs` nomes conté aquestes dues xifres puntuals; no hi ha cap taula completa d'AJD per CCAA, i la recerca del 2026-08-24 es va centrar nomes en ITP.

### 2.2 Tipus base de mercat

- `byMortgageType.VARIABLE.differentialOverEuribor`: cap document indica un diferencial mitja de mercat (nomes hi ha el TIN/TAE variable mitja i l'Euribor per separat; calcular-lo per diferencia seria una estimacio derivada, prohibida per la `RULE 1`).
- `byMortgageType.MIXED.*` (tots 3 camps): cap font aporta una mitjana de mercat per a hipoteques mixtes; nomes hi ha dades d'ofertes puntuals de bancs concrets (ja recollides a `bankOffers`).

### 2.3 Ofertes bancaries

- **CaixaBank — Variable i Mixta**: els simuladors citats (caixabank.es) nomes es van consultar per a la modalitat fixa; `/docs` no conté cap TIN/TAE/quota per a CaixaBank a tipus variable o mixt.
- `riskProfile` (LOW/MEDIUM/HIGH): cap dels 3 bancs analitzats te un perfil de risc assignat explícitament als documents.
- `linkedProducts` (llista de productes vinculats per obtenir la bonificacio): els fulls de calcul indiquen quines quotes son "bonificades" pero no enumeren els productes concrets exigits per Sabadell, CaixaBank o ING (nomes es coneix el llistat per a l'oferta d'Homter — vegeu `ESTUDIO HOMTER.pdf`, pagina 2 — que correspon a l'entitat bancaria subjacent negociada pel bróker, no a una oferta directa de banc).
- `durationYears` de CaixaBank Variable/Mixta: sense dades, per manca d'oferta consultada.

### 2.4 Ofertes de bróker

- `negotiatedRates.tae` per als 3 brokers: cap oferta oficial (Homter, Finnco, Finkers) publica una TAE explícita. El full `AMORTITZAR O INVERTIR.xlsx` conté una "TAE estimat" del 2,63% per a Homter, pero esta etiquetada explícitament com a estimacio interna de l'autor del treball, no com una xifra oficial del bróker — **per aixo NO s'ha volcat al JSON**, en compliment estricte de la prohibicio d'estimacions de la `RULE 1`.
- `additionalCosts` (taxes/expenses) de Finnco i Finkers: nomes es coneix el total de "despeses inicials" agregat (32.500 € i 23.260 € respectivament, taula "COMP+CONC"), que barreja impostos, despeses i possiblement part de l'entrada; com que no es pot desglossar sense assumir un criteri de repartiment, s'ha deixat en `null` en lloc d'estimar la particio.

---

## 3. Notes de qualitat de dades (ambiguitats detectades, no bloquejants)

- **Castella i Lleo (ITP)**: el full "DADES EXTRA" de `MERCAT HIPOTECARI EXCL.xlsx` mostra dos valors adjacents (8% i 7,8%) sense etiqueta que els diferenciï. S'ha volcat el primer (8%, tipus general) al JSON; recomanem verificar si el 7,8% correspon a un tram reduit (p. ex. habitatge habitual) abans de llançar el simulador.
- **Finkers (LTV maxim)**: el full "BROKER" indica un finançament del 90%, mentre que els fulls "COMP+CONC" i `ESTÀNDARDS PER A L'ESTUDI D'HIPOTEQUES.docx` indiquen 94%. S'ha volcat 94% (la xifra que apareix corroborada a 2 fonts independents dins de `/docs`), pero recomanem confirmar-ho directament amb Finkers.es.
- **Comissio dels brokers**: `MODEL DE NEGOCI _.docx` esmenta que el mercat de "pagament a exit" en general oscil·la entre l'1% i el 5% del capital del prestec, pero aquesta xifra es generica de mercat (font: aiminver.com) i no s'ha aplicat a Homter/Finnco/Finkers perque cadascun ja te un honorari fix explícit i verificat.

---

## 4. Resum numeric

- Camps `itpPercentage`/`itpBrackets` de `ccaaTaxRates` poblats: **19 de 19** (des del 2026-08-24, vegeu secció 5). `ajdPercentage` segueix pendent per a 17 de 19.
- Ofertes bancaries completes (amb totes les modalitats): **2 de 3 bancs** (Sabadell i ING complets; CaixaBank nomes Fixa).
- Ofertes de bróker: **3 de 3**, totes amb TIN, honoraris i LTV; TAE pendent als 3.

Abans de llançar el simulador en produccio, cal completar manualment els camps llistats a la seccio 2, seguint els passos descrits a [`DATA_ENTRY_GUIDE.md`](DATA_ENTRY_GUIDE.md).

---

## 5. Ampliacio 2026-08-24: ITP complet (19 jurisdiccions, tipus general + reduits)

A peticio explícita de l'usuari, i com a **excepcio puntual** a `RULE 1` (que normalment reserva l'omplenat de `/src/data` a una persona consultant fonts oficials manualment), Claude va executar una recerca web dedicada per completar `ccaaTaxRates` amb:

1. El tipus general d'ITP de les 3 jurisdiccions que quedaven a `null` (Comunitat Valenciana, Ceuta, Melilla).
2. Els trams progressius complets on la CCAA no aplica un tipus fix (`itpBrackets`): Aragó, Astúries, Illes Balears, Cantabria, Castella i Lleó, Catalunya, Extremadura, Comunitat Valenciana.
3. Els tipus reduïts i bonificacions per collectiu (joves, família nombrosa, discapacitat, VPO, violència de gènere, monoparentalitat, despoblació rural) a `reducedRates`, cadascun amb el seu `status` de verificació i les seves fonts.

Aquesta ampliació **no** prové de `/docs` (a diferencia de la resta d'aquest informe): prové d'una recerca web feta el 2026-08-24 contra fonts oficials (BOE, agencies tributaries autonomiques/forals) i, quan calia, fonts fiscals privades explícitament marcades com a `unverified`. El dossier complet amb totes les cites es troba a [`docs/ITP_CCAA_2025_2026.html`](docs/ITP_CCAA_2025_2026.html); les mateixes fonts estan tambe incrustades camp a camp dins `mortgageData.json` (`sources[]` per CCAA).

**Aquesta excepcio no es indefinida.** Qualsevol ampliacio futura de `/src/data` per aquesta via (recerca de Claude en lloc d'introduccio manual) torna a requerir confirmacio explicita de l'usuari abans d'escriure's al fitxer — no s'ha de donar per aprovada automaticament nomes perque ja va passar aquest cop.

Pendent de revisio abans de producció (`status: "unverified"` o `"not-found"` a `reducedRates`): VPO a Andalusia/Cantabria/Castella i Lleó/Catalunya; discapacitat a Canàries/Madrid; violència de gènere a Cantabria/Castella-La Manxa/Castella i Lleó/Extremadura/Múrcia/La Rioja/País Basc; monoparentalitat a Galícia/Extremadura; i el tipus general reduit de vivenda habitual (7%) d'Extremadura, la vigencia del qual despres de la Llei 2/2026 no s'ha pogut confirmar.
