# RAJ GIER

Prywatna aplikacja PWA z grami dla dwojga — **Statki** i **Wykreślanka**.

## Gra z daleka (zalecane)

Na localhost dziala tylko w tej samej sieci. Zeby grac z roznych miejsc (rozne miasta, telefon na LTE itd.), wystarczy **wdrozyc aplikacje w internecie** — oboje wchodzicie na ten sam link.

### Opcja A: Render.com (darmowe, ~5 min)

1. Zaloz konto na [render.com](https://render.com)
2. Wgraj projekt na GitHub (repozytorium `raj-gier`)
3. W Render: **New → Blueprint** → wybierz repo (Render odczyta `render.yaml`)
4. Po wdrozeniu dostaniesz link, np. `https://raj-gier.onrender.com`
5. Wyslij link dziewczynie — oboje gracie z telefonu lub komputera

**Uwaga:** darmowy plan usypia serwer po ~15 min bez ruchu. Pierwsze wejscie moze trwac 30–60 s — to normalne.

### Opcja B: Szybki test bez wdrozenia (ngrok)

Jesli chcesz tylko przetestowac z daleka bez GitHuba:

```bash
npm run dev
# w drugim terminalu:
npx ngrok http 5173
```

Ngrok poda link typu `https://abc123.ngrok-free.app` — wyslij go partnerce. Dziala dopoki komputer i ngrok sa wlaczone.

---

## Lokalnie (ta sama siec Wi‑Fi)

```bash
npm install
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Jak grac

1. Otworz strone (lokalnie lub po wdrozeniu — ten sam link dla obojga)
2. Wpisz imie → **Utworz pokoj** (Ty) lub **Dolacz kodem** (partner)
3. Gospodarz wybiera gre: Statki albo Wykreslanka
4. Rywalizujcie!

## PWA — instalacja na telefonie

1. Otworz strone w Chrome (Android) lub Safari (iPhone)
2. Menu → **Dodaj do ekranu glownego**
3. Aplikacja dziala jak natywna!

## Produkcja (recznie)

```bash
npm run install:all
npm run build
npm start
```

Serwer serwuje frontend i WebSocket na jednym porcie (`PORT`, domyslnie 3001).

## Tech stack

- React + TypeScript + Vite + PWA
- Express + Socket.io (multiplayer na zywo)
