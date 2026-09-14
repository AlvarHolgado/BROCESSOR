# Guia d'Entrada de Dades — `mortgageData.json`

## Per què aquest fitxer esta buit?

BROSSESSOR aplica un principi estricte de **Zero Estimacio de Dades** (vegeu `RULE 1` a `.clauderules`). Cap tipus d'interes, impost o comissio pot ser inventat, estimat o suposat pel sistema. Per aixo, `/src/data/mortgageData.json` es distribueix com un **esquema estructural buit**, amb tots els valors numerics a `null`.

Tu, com a persona responsable de les dades, has d'omplir cada valor manualment, consultant sempre fonts oficials i verificables (Agencia Tributaria de cada Comunitat Autonoma, fullets de condicions del banc, contracte de mediacio del broker, etc.). No copiis mai xifres d'aquesta guia com a valors reals — els exemples que hi trobaras son nomes il·lustratius del **format**, no del **valor**.

---

## 0. Benchmarks Globals vs. Perfils de Cas d'Estudi — distincio critica

Abans de tocar cap camp, cal entendre que `mortgageData.json` nomes pot contenir **una** categoria de dades: benchmarks globals. Mai perfils de cas d'estudi.

| | **Benchmark Global de Mercat** | **Perfil de Cas d'Estudi** |
|---|---|---|
| **Que es** | Una xifra oficial, agregada i representativa de tot el mercat (o de tota una CCAA): Euribor oficial, tipus mitjans publicats per l'INE/Banc d'Espanya, taules fiscals per CCAA. | Una oferta concreta que un banc o bróker ha emes per a un client, propietat i perfil economic especifics (p. ex. una simulacio del Banc Sabadell per a una compra de 250.000 € a Catalunya amb 2 titulars de 2.365 €/mes). |
| **On viu** | `mortgageData.json` — `ccaaTaxRates` i `baselineMarketRates`. Aquests son els valors per defecte que el simulador fa servir quan encara no hi ha cap oferta concreta introduida per l'usuari. | **Mai** com a valor per defecte del fitxer de dades. Nomes com a input puntual que un usuari introdueix ell mateix a l'assistent (Pantalles 4-5), o com a exemple de prova documentat fora de `/src/data` (p. ex. a `MISSING_DATA_REPORT.md`). |
| **Per que importa** | Es la referencia neutral que qualsevol usuari veu abans d'introduir les seves propies ofertes — ha de ser representativa del mercat en general, no d'una entitat concreta. | Barrejar una oferta puntual d'un bróker o banc concret amb els valors "per defecte" esbiaixaria el simulador cap a aquella entitat i trencaria la neutralitat que exigeix `.clauderules`. |
| **Exemple correcte** | `baselineMarketRates.byMortgageType.FIXED.tae = 3.48` (mitjana nacional 2025 publicada per l'INE). | La cotitzacio d'Homter (`ESTUDIO HOMTER.pdf`) amb TIN 2,2% per a un immoble de 250.000 € — util per validar el motor de calcul amb un cas real, pero **no** s'ha de copiar a `bankOffers` com a valor per defecte. |

**Regla practica:** `bankOffers` i `brokerOffers` neixen com a arrays buits (`[]`) i **han de continuar buits** fins que hi hagi una xifra agregada i oficialment publicada (p. ex. un informe del Banc d'Espanya amb la mitjana de diverses entitats). Una oferta individual —per molt ben documentada i verificada que estigui— no es un benchmark: es un cas d'estudi, i s'ha de mantenir fora d'aquest fitxer.

---

## 1. Impostos autonomics: `ccaaTaxRates`

Cada entrada de l'array `ccaaTaxRates` representa una Comunitat Autonoma (o ciutat autonoma). Des del 2026-08-24 l'esquema admet tipus progressius per trams i tipus reduits per collectiu — vegeu els tipus TypeScript a [`src/types/ccaaTax.ts`](src/types/ccaaTax.ts) per a la definicio formal completa.

| Camp | Tipus | Descripcio |
|---|---|---|
| `code` | `string` | Codi intern de 3 lletres de la CCAA. **No el modifiquis** — s'utilitza per relacionar la propietat amb el seu impost a la resta de l'aplicacio. |
| `name` | `string` | Nom de la CCAA en catala. **No el modifiquis.** |
| `itpPercentage` | `number \| null` | Tipus general **simplificat**: quan la CCAA no te trams, es el tipus unic; quan en te (`itpBrackets` no es `null`), es el tipus del primer tram, nomes com a xifra de referencia rapida. |
| `itpBrackets` | `{upTo, rate}[] \| null` | Escala progressiva completa per trams de preu, quan la CCAA no aplica un tipus fix (p. ex. Catalunya, Aragó, Cantabria...). `upTo: null` marca el darrer tram (sense limit superior). `null` sencer si la CCAA te tipus fix. |
| `ajdPercentage` | `number \| null` | Actes Juridics Documentats, en percentatge, aplicable a l'habitatge d'**obra nova** i a l'escriptura d'hipoteca. |
| `generalNote` | `string \| null` | Bonificacio o tipus reduit general aplicable a qualsevol comprador (no lligat a cap collectiu), quan n'hi ha. |
| `cautionNote` | `string \| null` | Discrepancia detectada entre fonts, o benefici addicional rellevant no cobert pels camps estructurats. |
| `reducedRates` | `ReducedItpRate[]` | Llista de tipus reduits/bonificacions per collectiu (joves, familia nombrosa, discapacitat, VPO, violencia de genere...). Cada entrada inclou `category`, `label`, el tipus (`rate`, `rateBrackets` o `bonusPercentage` — nomes un d'ells s'omple), els limits (`priceLimit`, `ageLimit`, `disabilityMinPercentage`, `incomeLimitIndividual`, `incomeLimitJoint`), `notes` i un `status` (`verified` / `unverified` / `not-found` / `not-applicable`) que indica el grau de certesa de la font. |
| `sources` | `{label, url}[]` | Fonts oficials (o, en el seu defecte, fiscals fiables) consultades per a tota l'entrada. |

**Excepcio documentada a `RULE 1`:** el 2026-08-24, l'usuari va autoritzar explicitament (i puntualment) que aquest fitxer es poblés amb dades obtingudes per Claude mitjancant recerca web verificada (no nomes introduides manualment per una persona), sempre que cada camp quedés citat amb la seva font i el seu `status` de verificacio. Aquesta excepcio **no es permanent**: qualsevol ampliacio futura d'aquest tipus torna a requerir confirmacio explicita de l'usuari abans d'escriure's al fitxer. Vegeu [`docs/ITP_CCAA_2025_2026.html`](docs/ITP_CCAA_2025_2026.html) per al dossier de recerca complet.

### Passos per omplir o ampliar una CCAA manualment

1. Localitza la CCAA on es troba l'immoble dins l'array `ccaaTaxRates`.
2. Cerca el tipus general d'ITP vigent al web oficial de l'Agencia Tributaria autonomica (o foral). Si hi ha trams, omple `itpBrackets` sencer i deixa `itpPercentage` com el tipus del primer tram.
3. Per a cada collectiu amb tipus reduit (joves, familia nombrosa, discapacitat, VPO, violencia de genere...), afegeix una entrada a `reducedRates` amb la font, els limits exactes i el `status` honest (`unverified` si nomes ho confirma una font privada, `not-found` si no s'ha trobat, `not-applicable` si una font oficial confirma que no existeix).
4. Substitueix `null` pel valor numeric (utilitza punt decimal, no coma: `7.5`, no `7,5`).
5. Afegeix sempre la font (`sources`) i, si escau, la data de vigencia de la normativa.

### Exemple de format (valors fictius, NOMES il·lustratius)

```json
{
  "code": "MAD",
  "name": "Madrid",
  "itpPercentage": 6,
  "itpBrackets": null,
  "ajdPercentage": 0.75,
  "generalNote": null,
  "cautionNote": null,
  "reducedRates": [
    {
      "category": "FAMILIA_NUMEROSA",
      "label": "Familias numerosas",
      "rate": 4,
      "rateBrackets": null,
      "bonusPercentage": null,
      "priceLimit": 250000,
      "ageLimit": null,
      "disabilityMinPercentage": null,
      "incomeLimitIndividual": null,
      "incomeLimitJoint": null,
      "notes": null,
      "status": "verified"
    }
  ],
  "sources": [
    { "label": "BOE — Decreto Legislativo 1/2010", "url": "https://www.boe.es/..." }
  ]
}
```

---

## 2. Tipus base del mercat: `baselineMarketRates`

Aquest bloc serveix per fixar una referencia general del mercat (Euribor i mitjanes per tipus d'hipoteca), independent d'un banc concret.

| Camp | Tipus | Descripcio |
|---|---|---|
| `euriborReference.value` | `number \| null` | Valor de l'Euribor de referencia (mitjana mensual oficial), en percentatge. |
| `euriborReference.asOfDate` | `string \| null` | Data de publicacio del valor anterior, en format `YYYY-MM-DD`. |
| `byMortgageType.FIXED.tin` | `number \| null` | TIN mitja de mercat per a hipoteques a tipus **fix**. |
| `byMortgageType.FIXED.tae` | `number \| null` | TAE mitjana de mercat per a hipoteques a tipus **fix**. |
| `byMortgageType.VARIABLE.differentialOverEuribor` | `number \| null` | Diferencial mitja que els bancs sumen a l'Euribor en hipoteques **variables**. |
| `byMortgageType.VARIABLE.tae` | `number \| null` | TAE mitjana estimada per a hipoteques variables (Euribor + diferencial). |
| `byMortgageType.MIXED.fixedPeriodYears` | `number \| null` | Anys que dura el tram fix en una hipoteca **mixta**. |
| `byMortgageType.MIXED.fixedPeriodTin` | `number \| null` | TIN aplicable durant el tram fix. |
| `byMortgageType.MIXED.postFixedDifferentialOverEuribor` | `number \| null` | Diferencial sobre Euribor aplicable un cop finalitzat el tram fix. |

### Passos

1. Consulta la publicacio oficial mensual de l'Euribor (Banc d'Espanya) i introdueix el valor i la data.
2. Recull dades de tipus mitjans de mercat de fonts contrastades (comparadors oficials, informes del Banc d'Espanya) si vols mantenir aquest bloc com a referencia general.
3. Si no disposes d'una font verificable per a algun camp, **deixa'l en `null`**. No estimis mai un valor "raonable".

---

## 3. Ofertes bancaries: `bankOffers`

**Recorda la seccio 0: aquest array ha de contenir nomes benchmarks agregats i oficials, mai la cotitzacio d'un sol banc per a un sol client.** Si el que tens a les mans es una simulacio puntual (p. ex. la pantalla d'un simulador web amb un TIN concret per a un import i termini concrets), aixo es un cas d'estudi — guarda'l fora de `/src/data` (vegeu seccio 0) i no l'afegeixis aqui.

`bankOffers` es un array. Cada entrada representa un benchmark agregat per a una combinacio banc/tipus d'hipoteca — o be es queda buit (`[]`) si encara no existeix cap font agregada.

| Camp | Tipus | Descripcio |
|---|---|---|
| `bankName` | `string \| null` | Nom de l'entitat, **o** una etiqueta agregada com `"Mitjana Banc d'Espanya"` si la font ja es una mitjana de diverses entitats. |
| `mortgageType` | `"FIXED" \| "VARIABLE" \| "MIXED"` | Modalitat d'hipoteca a la qual s'aplica aquesta entrada. |
| `durationYears` | `number \| null` | Termini en anys al qual correspon la xifra. |
| `nonBonifiedRates.tin` / `.tae` / `.monthlyQuota` | `number \| null` | Condicions sense bonificar. |
| `bonifiedRates.tin` / `.tae` / `.monthlyQuota` | `number \| null` | Condicions bonificades. |
| `bonifiedRates.linkedProducts` | `string[]` | Productes vinculats necessaris per obtenir la bonificacio. |
| `maxLtvPercentage` | `number \| null` | LTV maxim que permet aquest benchmark. |
| `riskProfile` | `"LOW" \| "MEDIUM" \| "HIGH" \| null` | Nomes si la font ho especifica explicitament. |

### Passos

1. Confirma que la font es un benchmark agregat (informe del Banc d'Espanya, mitjana publicada per un comparador amb metodologia transparent, etc.) i **no** l'oferta d'un sol banc a un sol client.
2. Si nomes tens ofertes individuals disponibles, **no les afegeixis aqui**: documenta-les com a cas d'estudi (seccio 0) i deixa `bankOffers` en `[]`.
3. Si tens un benchmark agregat legitim, afegeix una entrada per cada combinacio banc/modalitat, seguint l'exemple de format.

### Exemple de format (valors fictius, NOMES il·lustratius)

```json
{
  "bankName": "Mitjana Banc d'Espanya",
  "mortgageType": "FIXED",
  "durationYears": 30,
  "nonBonifiedRates": { "tin": 3.45, "tae": 3.90, "monthlyQuota": 950.20 },
  "bonifiedRates": {
    "tin": 2.95,
    "tae": 3.30,
    "monthlyQuota": 890.15,
    "linkedProducts": ["Domiciliacio de nomina", "Assegurança de vida", "Assegurança de la llar"]
  },
  "maxLtvPercentage": 80,
  "riskProfile": null
}
```

---

## 4. Ofertes de broker: `brokerOffers`

**Mateixa regla que a la seccio 3.** Un array buit (`[]`) es el valor per defecte correcte fins que existeixi un benchmark agregat i oficial del sector d'intermediacio (p. ex. un informe sectorial amb l'honorari mitjà del mercat, no l'honorari d'un broker concret per a un client concret).

| Camp | Tipus | Descripcio |
|---|---|---|
| `brokerName` | `string \| null` | Nom del broker, **o** una etiqueta agregada (p. ex. `"Mitjana sector intermediacio"`). |
| `negotiatedRates.tin` / `.tae` / `.monthlyQuota` | `number \| null` | Condicions negociades benchmark. |
| `durationYears` | `number \| null` | Termini en anys al qual correspon la xifra. |
| `brokerFees.feeType` | `"FIXED" \| "PERCENTAGE" \| null` | Import fix o percentual. |
| `brokerFees.fixedFeeAmount` | `number \| null` | Import fix, en EUR (nomes si `feeType` es `"FIXED"`). |
| `brokerFees.percentageFeeOverLoan` | `number \| null` | Percentatge sobre el capital (nomes si `feeType` es `"PERCENTAGE"`). |
| `additionalCosts.taxes` / `.expenses` | `number \| null` | Nomes si la font es un desglossament agregat, no una factura individual. |
| `maxLtvPercentage` | `number \| null` | LTV maxim benchmark. |

### Passos

1. Confirma que la font es un benchmark agregat sectorial i no la cotitzacio d'un broker concret per a un client concret (com les d'Homter, Finnco o Finkers documentades a `MISSING_DATA_REPORT.md`, que son casos d'estudi, no benchmarks).
2. Si nomes disposes de cotitzacions individuals, deixa `brokerOffers` en `[]` i documenta-les com a cas d'estudi.
3. Si tens un benchmark agregat legitim, afegeix-lo seguint l'exemple de format.

### Exemple de format (valors fictius, NOMES il·lustratius)

```json
{
  "brokerName": "Mitjana sector intermediacio",
  "negotiatedRates": { "tin": 2.80, "tae": 3.10, "monthlyQuota": 870.40 },
  "durationYears": 30,
  "brokerFees": { "feeType": "PERCENTAGE", "fixedFeeAmount": null, "percentageFeeOverLoan": 1.5 },
  "additionalCosts": { "taxes": null, "expenses": null },
  "maxLtvPercentage": 85
}
```

---

## 5. Bones practiques

- **Mai copiis els valors d'exemple d'aquesta guia** al fitxer real de dades: son nomes plantilles de format.
- Utilitza sempre el punt (`.`) com a separador decimal dins el JSON, encara que a la interficie es mostri amb coma (`3,45%`).
- Si un valor no es pot verificar amb una font oficial en el moment d'omplir el fitxer, deixa'l en `null`. Un `null` es una dada pendent i honesta; un valor inventat es una font d'error financer.
- Revisa periodicament les dades introduides, ja que impostos autonomics, Euribor i ofertes bancaries canvien amb el temps.
- Documenta sempre la font i la data de consulta de cada dada fora del JSON (per exemple, en un full de control intern), per poder auditar l'origen de cada xifra.
