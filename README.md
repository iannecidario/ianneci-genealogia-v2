# IANNECE di Aquilonia. Storia di una famiglia

Nuova versione sperimentale e indipendente dell’applicazione genealogica Iannece, basata sull’interfaccia generata con Google Stitch.

La base grafica usa HTML, CSS (Tailwind CSS via CDN) e JavaScript. Home, Persone, Albero, Rami, Cronologia e Scheda persona utilizzano i dati reali di Airtable tramite API protette. Sono disponibili ricerca, filtri, navigazione genealogica, matrimoni multipli e collegamenti tra familiari.

L’accesso ad Airtable avviene esclusivamente tramite Cloudflare Pages Functions. Il browser interroga `/api/persone`, `/api/persona` e `/api/rami`; il token non viene mai inviato al frontend.

## Configurazione Airtable

La base configurata è `IANNECE GENEALOGIA` e la tabella utilizzata è `PERSONE`. Impostare in Cloudflare Pages, nella sezione **Settings → Variables and Secrets**, la variabile segreta:

- `AIRTABLE_TOKEN`: Personal Access Token con accesso in lettura alla base.

La variabile opzionale `AIRTABLE_BASE_ID` può sovrascrivere l’identificativo predefinito. Per lo sviluppo locale copiare `.dev.vars.example` in `.dev.vars` e inserire il token; `.dev.vars` è escluso da Git.

## Avvio locale

```sh
npx wrangler pages dev .
```

Aprire quindi l’indirizzo locale mostrato da Wrangler. Un semplice server statico non esegue le Pages Functions.
