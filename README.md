# shared-style

Gemeinsames Erscheinungsbild für jobpilot: Design-Tokens, Grundlagen und die Bausteine `jp-*` als CSS. Genutzt von `desktop`, `web`, `admin` und `extension`; es ersetzt die bisherigen byte-gleichen Kopien von `jobpilot.css`. Maßgeblich für Werte und Aussehen ist die desktop-app, die ihrerseits der mobile-app folgt (Farben aus `src/theme/colors.ts`, Maße aus `src/ui/*`).

Das Paket liegt in der GitHub-Organisation `jobpilot-org` und wird ausschließlich über GitHub Packages veröffentlicht, nicht auf npmjs. Es enthält kein JavaScript, sondern nur Stylesheets und das App-Icon – ein Bundler lädt es als globale Gestaltung, nicht als Modul.

## Installation

In den Apps mit exakter Version, damit eine Änderung am Paket bewusst ankommt:

```bash
npm install @jobpilot-org/shared-style@0.1.0 --save-exact
```

`.npmrc` im Consumer-Repo (kein Token im Klartext, die Umgebungsvariable setzt das Token):

```ini
@jobpilot-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`NODE_AUTH_TOKEN` ist ein GitHub-Token mit `read:packages` (für Veröffentlichungen `write:packages`). In CI reicht `GITHUB_TOKEN` mit `packages: read`.

## Exporte

| Subpath           | Inhalt                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `.` / `index.css` | Vollständiges Stylesheet: importiert `tokens.css`, `base.css` und `components.css` in dieser Reihenfolge                                   |
| `tokens.css`      | Design-Tokens: Farben, Status- und Avatarfarben, Schriften, Breiten; hell/dunkel über `light-dark()`                                       |
| `base.css`        | Grundlagen: Reset, `body`, Links, Fokusring, `.jp-visually-hidden`                                                                         |
| `components.css`  | Bausteine: Top-Bar, Tabs, Seitenkopf, Buttons, Chips, Formulare, Suche, Segmented Control, Karten, Zeilen, Callout, Badges, Avatare, Toast |
| `assets/icon.png` | App-Icon (weißes „j.“ auf `#176B4A`), byte-gleich zu `desktop/assets/icon.png`                                                             |

```js
import '@jobpilot-org/shared-style/index.css';
import './styles.css';
```

**Reihenfolge:** erst das Paket, dann die eigenen Styles der App. Eigene Regeln einer App überschreiben damit die gemeinsamen, ohne dass die gemeinsame Datei angefasst werden muss. Wer nur einen Teil braucht, importiert die einzelnen Module in derselben Reihenfolge (`tokens.css`, `base.css`, `components.css`).

Das vollständige Stylesheet ist als `sideEffects` markiert (`**/*.css`), damit Bundler globale Regeln nicht wegoptimieren.

## Assets

Das Icon wird nicht automatisch eingebunden – es ist ein Angebot. Apps, die es nutzen wollen, verweisen auf `@jobpilot-org/shared-style/assets/icon.png` oder übernehmen es in ihren eigenen Icon-Pfad; die desktop-app nutzt weiterhin ihr eigenes `assets/icon.png`, das byte-gleich ist.

## Entwicklung

```bash
npm ci                  # Abhängigkeiten (nur Prettier, aus npmjs)
npm test                # node --test – prüft Exports, Tokens, Bausteine, Import-Reihenfolge, Icon
npm run check           # Tests + Formatprüfung – vor "fertig" ausführen
npm run format          # Prettier über alle Dateien
npm run format:check    # prüft nur die Formatierung (in `npm run check` enthalten)
npm pack --dry-run      # zeigt, was veröffentlicht würde (src/, assets/, README, LICENSE, CHANGELOG)
```

Die Tests in `test/package.test.mjs` laufen mit dem Test-Runner von Node und brauchen außer Prettier keine Abhängigkeit. `.github/workflows/check.yml` führt `npm ci`, `npm run check` und `npm pack --dry-run` bei jedem Push auf `develop`/`main` und bei Pull Requests aus.

## Veröffentlichen

1. `version` in `package.json` erhöhen (SemVer, unter 1.0 = noch nicht offiziell veröffentlicht) und `CHANGELOG.md` ergänzen.
2. Auf `develop` committen und pushen.
3. In GitHub unter _Actions → Publish → Run workflow_ auslösen. Der Workflow veröffentlicht mit `packages: write`; `publishConfig.registry` zeigt auf `https://npm.pkg.github.com`, und `prepublishOnly` schickt jedes `npm publish` noch einmal durch `npm run check`.
4. Danach in den Consumern die exakte Version nachziehen.

Ein fehlerhaftes Paket wird nicht überschrieben: GitHub Packages erlaubt das Veröffentlichen einer Version nur einmal. Stattdessen eine neue Patch-Version veröffentlichen.
