# Cosmopolish Webpage

Repozytorium zawiera:

- `cosmopolish-app` – frontend (Angular),
- `cosmopolish-api` – backend (Node.js + Express): logowanie admina (JWT), zapis treści strony, upload zdjęć,
- pipeline CI/CD do automatycznego wdrażania na serwer przez SSH.

## Architektura

```
przeglądarka ──► nginx ──┬─► /            pliki Angulara (SSH_TARGET_DIR)
                         ├─► /api/*       cosmopolish-api (127.0.0.1:3001)
                         └─► /uploads/*   cosmopolish-api (zdjęcia wgrane przez admina)
```

- Treść strony jest publiczna (`GET /api/content`). Zapis (`PUT /api/content/:lang`) i upload zdjęć (`POST /api/uploads/images`) wymagają tokenu JWT admina.
- Nie ma publicznej rejestracji – konta adminów zakłada się na serwerze poleceniem `npm run create-admin`. Hasła są przechowywane jako hash bcrypt w `data/users.json`.
- Treść obu języków to jeden dokument JSON (`data/content.json`).
- **Historia wersji:** każdy zapis tworzy wersję w `data/versions/` (kto, kiedy, z jakiego IP). W panelu admina: „Historia wersji” → „Przywróć”. Trzymane jest ostatnie 200 wersji **oraz** ostatnia wersja każdego dnia dla każdego języka, bez limitu, więc seria zapisów nie wypchnie stanów z poprzednich dni.
- **Dziennik zdarzeń** (`data/audit.log`, JSON w każdej linii, rotacja po 5 MB): logowania udane, nieudane i zablokowane, zapisy, przywrócenia, uploady i wysłane alerty, z IP klienta i przeglądarką. Widoczny w panelu admina.
- **Alert e-mail** przy każdym logowaniu konta z adresu IP, z którego to konto wcześniej się nie logowało (znane IP są w `data/users.json`). Wymaga SMTP, patrz sekrety niżej.
- Struktura treści należy do frontendu (`src/app/models/site-content.ts`). Nowe sekcje i rodzaje materiałów (teksty, zdjęcia, linki do filmów) **nie wymagają zmian w backendzie**: backend waliduje ogólnie rozmiar i typy, a każde pole kończące się na `Url` (`imageUrl`, `videoUrl`, …) musi być linkiem `http(s)` albo ścieżką `/uploads/…`.
- Filmy nie są wgrywane ani osadzane – zapisuje się tylko link.
- Zdjęcia: JPG, PNG, GIF, WebP (typ sprawdzany po zawartości pliku, bez SVG), domyślnie maks. 8 MB (`MAX_UPLOAD_MB`).

## Wymagania

- Node.js 20.12+
- npm
- Angular CLI (opcjonalnie globalnie)

## Uruchomienie lokalne

Backend (pierwszy terminal):

```bash
cd cosmopolish-api
npm ci
cp .env.example .env          # ustaw JWT_SECRET (min. 32 znaki)
npm run create-admin -- admin # zapyta o hasło
npm run dev
```

Frontend (drugi terminal):

```bash
cd cosmopolish-app
npm ci
npm start
```

Aplikacja będzie dostępna pod `http://localhost:4200`. `ng serve` przekazuje `/api` i `/uploads` do `http://127.0.0.1:3001` (`proxy.conf.json`).

Testy backendu: `cd cosmopolish-api && npm test`.

## Konta adminów

Na serwerze, w katalogu API:

```bash
npm run create-admin -- <login>            # nowe konto albo zmiana hasła
npm run create-admin -- <login> --remove   # usunięcie konta (jego tokeny przestają działać)
```

Token jest ważny `JWT_EXPIRES_IN` (domyślnie 8h). `npm run revoke-sessions` generuje nowy `JWT_SECRET` i przeładowuje API, co natychmiast wylogowuje wszystkich.

## Co robić przy nieuprawnionej zmianie treści

1. **Odetnij dostęp**, na serwerze w katalogu API:
   ```bash
   npm run create-admin -- <login>   # nowe hasło przejętego konta (albo: <login> --remove)
   npm run revoke-sessions           # wylogowuje wszystkich, także intruza
   ```
2. **Sprawdź, co się stało:** w panelu admina otwórz „Dziennik zdarzeń”, który pokazuje kto, kiedy i z jakiego IP. Możesz też przejrzeć plik bezpośrednio: `tail -50 data/audit.log`.
3. **Przywróć treść:** „Historia wersji” → „Przywróć” przy ostatniej dobrej wersji, osobno dla każdego języka.
4. Opcjonalnie usuń zdjęcia wgrane przez intruza: ich nazwy są w dzienniku (`upload.image`), a pliki w `uploads/`.

## Build produkcyjny

```bash
cd cosmopolish-app
npm run build -- --configuration production
```

Artefakty trafiają do:

`cosmopolish-app/dist/cosmopolish-app/browser`

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`

- `CI` uruchamia się na `push` i `pull_request` do gałęzi `dev_server`
- `CD` (deploy) uruchamia się na `push` / `workflow_dispatch` (nie na PR)
- Build jest kopiowany na serwer przez `scp`, a następnie publikowany przez `ssh`

### Wymagane sekrety GitHub

- `SSH_HOST` (np. `95.158.64.196`)
- `SSH_PORT` (domyślnie `2222`, jeśli nie podasz secreta)
- `SSH_USERNAME`
- `SSH_PRIVATE_KEY` (pełny prywatny klucz SSH)
- `SSH_TARGET_DIR` (docelowy katalog na serwerze, np. `/var/www/cosmopolish`)
- `SSH_API_DIR` (opcjonalnie; katalog backendu na serwerze, domyślnie `/opt/cosmopolish-api` dla roota, `~/cosmopolish-api` dla innego użytkownika)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` (+ opcjonalnie `ADMIN_USERNAME_2`, `ADMIN_PASSWORD_2`) – konta adminów zakładane przy deployu, hasło min. 10 znaków
- zmienna (Variables, nie Secrets) `SITE_URL` – opcjonalnie, domyślnie `https://cosmopolish.mathe.pl`

Alerty e-mail (opcjonalne; bez nich wszystko działa, tylko maile nie wychodzą):

| Sekret | Przykład | Uwagi |
|---|---|---|
| `SMTP_HOST` | `smtp.gmail.com` | wymagany do włączenia alertów |
| `SMTP_PORT` | `587` lub `465` | domyślnie `587` |
| `SMTP_SECURE` | `false` dla 587, `true` dla 465 | domyślnie `false` |
| `SMTP_USER` | `alerty@twojadomena.pl` | login do skrzynki |
| `SMTP_PASS` | hasło / hasło aplikacji | dla Gmaila: „hasło do aplikacji”, nie zwykłe hasło |
| `MAIL_FROM` | `CosmoPolish <alerty@twojadomena.pl>` | domyślnie `SMTP_USER` |
| `ALERT_EMAIL_TO` | `ty@example.com,drugi@example.com` | wymagany, kilka adresów po przecinku |

Workflow wpisuje je do `.env` na serwerze przy każdym deployu. Puste sekrety są pomijane, więc ręczne ustawienia w `.env` zostają.

### Co workflow robi sam na serwerze (job `deploy-api`)

Wszystkie kroki można bezpiecznie powtarzać przy każdym deployu:

- sprawdza wersję Node.js (wymagane 20.12+),
- używa istniejącego `pm2`; jeśli go brak, instaluje globalnie albo (bez uprawnień) do `~/.local`. Jako root włącza autostart przez systemd, jako zwykły użytkownik wypisuje ostrzeżenie z jednorazowym poleceniem `sudo ... pm2 startup`,
- rozpakowuje API do `SSH_API_DIR`,
- przy pierwszym deployu tworzy `.env` z losowym `JWT_SECRET` (`chmod 600`); później go nie zmienia,
- `npm ci --omit=dev`,
- wpisuje ustawienia SMTP z sekretów do `.env` (tylko te niepuste),
- zakłada konta z sekretów `ADMIN_*`, **tylko jeśli jeszcze nie istnieją**. Hasło zmienione później przez `npm run create-admin` nie zostanie nadpisane. Zmiana sekretu nie zmienia więc hasła istniejącego konta,
- uruchamia albo przeładowuje API w pm2 i sprawdza `GET /api/health` na serwerze,
- na końcu sprawdza `SITE_URL/api/health` przez nginx. Jeśli nginx nie jest skonfigurowany, pojawia się tylko ostrzeżenie, deploy się nie wywraca.

Workflow nadpisuje tylko `src/`, `scripts/` i pliki `package*.json`. Katalogi `data/`, `uploads/` i plik `.env` zostają na serwerze. **Uwzględnij je w backupach serwera.**

Jedyny krok ręczny: konfiguracja nginx (sekcja niżej).

## Deploy ręczny (awaryjnie)

```bash
cd cosmopolish-app
npm run build -- --configuration production
scp -P 2222 -r dist/cosmopolish-app/browser/* USER@HOST:/var/www/cosmopolish/
```

## Nginx (domena)

Przykładowa konfiguracja dla `cosmopolish.mathe.pl`:

```nginx
server {
    listen 80;
    server_name cosmopolish.mathe.pl;

    root /var/www/cosmopolish;
    index index.html;

    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Po konfiguracji:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d cosmopolish.mathe.pl
```

## Najczęstsze problemy

- `can't connect without a private SSH key or password`  
  Brak lub zła wartość `SSH_PRIVATE_KEY`.

- `dial tcp ... i/o timeout`  
  Zły host/port albo blokada firewalla (SSH).

- `Permission denied` przy deployu  
  Użytkownik SSH nie ma praw do `SSH_TARGET_DIR`.
