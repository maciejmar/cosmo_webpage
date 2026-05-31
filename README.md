# Cosmopolish Webpage

Repozytorium zawiera aplikację Angular w katalogu `cosmopolish-app` oraz pipeline CI/CD do automatycznego wdrażania na serwer przez SSH.

## Wymagania

- Node.js 20+
- npm
- Angular CLI (opcjonalnie globalnie)

## Uruchomienie lokalne

```bash
cd cosmopolish-app
npm ci
npm start
```

Aplikacja będzie dostępna pod `http://localhost:4200`.

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
