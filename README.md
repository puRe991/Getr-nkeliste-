# Getränkekasse

Eine produktionsreife, mobile-first Progressive Web App für Freiwillige Feuerwehren, um Papier-Getränkelisten durch eine schnelle digitale Kasse zu ersetzen.

## Funktionen

- **2-Klick-Buchung:** Mitglied auswählen, Getränk antippen, fertig.
- **PWA:** installierbar auf Android, iPhone und Desktop, inklusive Service Worker und App-Manifest.
- **Android APK:** native Android-Hülle über Capacitor, inklusive Gradle-Projekt und Debug-APK-Build-Skript.
- **Offline vorbereitet:** Buchungen werden in IndexedDB gepuffert und automatisch synchronisiert.
- **Supabase Backend:** Auth, PostgreSQL, Row Level Security, RPC für atomare Buchungen.
- **Adminbereich:** Mitglieder, Getränke, Preise, Bestände, Monatsübersicht, CSV-Export und QR-Codes.
- **Dashboard:** offene Beträge, meistverkaufte Getränke, Lagerwarnungen und letzte Buchungen.
- **Deployment:** direkt auf Vercel hostbar.

## Tech Stack

- React, TypeScript, Vite
- TailwindCSS und shadcn/ui-inspirierte Komponenten
- Supabase Auth und Database
- TanStack Query und TanStack Table
- react-hook-form und zod
- recharts, lucide-react, vite-plugin-pwa
- Capacitor für Android/APK-Builds

## Lokale Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Danach läuft die App standardmäßig unter `http://localhost:5173`.

## Environment Variablen

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_APP_NAME=Getränkekasse
```

Keine Service-Role-Keys im Frontend verwenden. Der Anon-Key ist öffentlich und wird durch Row Level Security abgesichert.

## Supabase Einrichtung

1. Neues Supabase-Projekt erstellen.
2. In Supabase SQL Editor die Migrationen aus `supabase/migrations/001_initial_schema.sql` und `supabase/migrations/002_password_auth.sql` ausführen.
3. Optional die Beispieldaten aus `supabase/seeds/seed.sql` ausführen.
4. In **Authentication → Providers → Email** sowohl Passwort-Login als auch Magic Links aktivieren.
5. In **Authentication → URL Configuration** die lokale URL und später die Vercel-Domain eintragen.
6. Die Edge Function für die Admin-Benutzererstellung deployen: `supabase functions deploy admin-create-user`. Sie läuft mit dem automatisch bereitgestellten Service-Role-Key der Function-Runtime – dieser landet nie im Frontend.
7. Den ersten Admin in der Tabelle `public.users` mit `auth_user_id` des Supabase-Auth-Benutzers verknüpfen (für alle weiteren Mitglieder übernimmt das Admin-Formular die Verknüpfung automatisch).

### Tabellen

- `users`: Mitglieder, E-Mail, Rollen, Aktivstatus und Kontostand.
- `drinks`: Getränke, Preis, Bestand, Aktivstatus und Icon.
- `transactions`: unveränderliche Buchungshistorie mit Preis zum Buchungszeitpunkt.
- `settings`: zentrale JSON-Konfiguration.

### Passwort-Login und Benutzerverwaltung

- Anmeldung ist per Passwort oder Magic Link möglich (Umschalter auf der Login-Seite).
- Legt ein Admin im Adminbereich ein neues Mitglied an, erstellt eine Edge Function (`admin-create-user`, läuft mit Service-Role-Key serverseitig) automatisch einen Supabase-Auth-Account mit zufällig generiertem Startpasswort. Das Passwort wird dem Admin einmalig angezeigt und muss sicher an das Mitglied weitergegeben werden.
- Neue Accounts sind mit `must_change_password` markiert; nach dem Login zeigt die App einen Hinweisbanner mit Link zu **Konto → Passwort ändern** (`/konto`), bis das Mitglied ein eigenes Passwort gesetzt hat.
- Jeder angemeldete Benutzer kann sein Passwort jederzeit über das Schlüssel-Icon im Header ändern.

### Rollenmodell

- `admin`: Benutzer verwalten, Getränke und Preise ändern, Guthaben korrigieren, Statistiken und Exporte nutzen.
- `mitglied`: Daten lesen und über die sichere RPC-Funktion Buchungen auslösen.

Row Level Security ist für alle Tabellen aktiv. Schreibzugriffe auf Stammdaten sind Admins vorbehalten; Buchungen laufen über eine transaktionale PostgreSQL-Funktion.

## Vercel Deployment

1. Repository mit Vercel verbinden.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Environment Variablen aus `.env.example` in Vercel setzen.
6. Vercel-Domain in Supabase Auth Redirect URLs eintragen.
7. Deployment starten.

## Installation auf Geräten

### Ohne APK als PWA

- Android/Chrome: Menü → „Zum Startbildschirm hinzufügen“.
- iPhone/Safari: Teilen → „Zum Home-Bildschirm“.
- Desktop/Chrome/Edge: Installationssymbol in der Adressleiste.

Die App nutzt einen Service Worker für statische Assets und Network-First-Caching für Supabase-Anfragen. Offline-Buchungen werden lokal in IndexedDB gespeichert und bei wiederhergestellter Verbindung synchronisiert.

### Android APK bauen

Für eine installierbare Android-App ist Capacitor eingerichtet. Es gibt zwei Wege zur APK-Datei:

#### APK automatisch über GitHub Actions erstellen

1. In GitHub den Tab **Actions** öffnen.
2. Den Workflow **Build Android APK** auswählen.
3. **Run workflow** starten oder einen Pull Request/Push abwarten.
4. Nach erfolgreichem Lauf das Artifact **getraenkekasse-debug-apk** herunterladen.
5. Die enthaltene `app-debug.apk` auf das Android-Gerät kopieren und installieren.

#### APK lokal erstellen

Voraussetzung ist ein lokales Android-SDK bzw. Android Studio mit Java- und Gradle-Unterstützung.

Hinweis: Das Repository enthält bewusst keine binären Build-Artefakte und keinen Gradle-Wrapper-JAR. Die APK wird lokal oder in GitHub Actions erzeugt und dort als Artifact bereitgestellt.

```bash
npm install
npm run android:apk
```

Das Debug-APK liegt danach unter:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Für die Installation auf einem Android-Gerät muss ggf. „Unbekannte Apps installieren“ erlaubt werden. Für produktive Verteilung sollte zusätzlich ein signierter Release-Build über Android Studio oder Gradle erstellt werden.

Nützliche Befehle:

```bash
npm run android:sync  # Web-App bauen und in das Android-Projekt kopieren
npm run android:open  # Android-Projekt in Android Studio öffnen
```

## Entwicklung

```bash
npm run typecheck
npm run lint
npm run build
```

## Architektur

```text
src/
  components/   Wiederverwendbare UI und Layout
  features/     Fachliche Module wie Kasse, Dashboard, Admin, Offline, QR
  hooks/        Daten- und Auth-Hooks
  lib/          Konfiguration, Utils, Validierung
  pages/        Routen-Seiten
  services/     Supabase API und IndexedDB
  stores/       Reserviert für spätere lokale Stores
  types/        Domänen- und Datenbanktypen
supabase/
  migrations/   SQL Schema, RLS, Funktionen
  seeds/        Beispieldaten
```

## Hinweise für den Betrieb

- Preise nur über Admins ändern, da Transaktionen den historischen Buchungspreis speichern.
- Lagerwarnung greift standardmäßig ab 12 Einheiten.
- Für kleine Wehren reicht Vercel + Supabase Free Tier in der Regel aus.
- Für zukünftige Erweiterungen sind NFC, mehrere Standorte, Inventar, Essen, Dienstabendmodus und Push Notifications architektonisch vorbereitet, aber bewusst nicht implementiert.
