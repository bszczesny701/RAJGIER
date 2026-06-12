# RAJ GIER

Prywatna aplikacja PWA z grami dla dwojga — **Statki**, **Wykreślanka**, **Krzyżówka** i **Sudoku**.

## Gra z daleka (zalecane)

Na localhost dziala tylko w tej samej sieci. Zeby grac z roznych miejsc, wystarczy wdrozyc aplikacje w internecie — oboje wchodzicie na ten sam link.

**Deploy:** [Render.com](https://render.com) → Blueprint z repo → link np. `https://rajgier.onrender.com`

## Lokalnie

```bash
npm install
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Jak grac

1. Otworz strone (lokalnie lub online — ten sam link dla obojga)
2. Wpisz imie → **Utworz pokoj** lub **Dolacz kodem**
3. Gospodarz wybiera gre
4. Rywalizujcie!

### Gry

| Gra | Zasady |
|-----|--------|
| **Statki** | Ustaw flote, zatop statki rywala |
| **Wykreślanka** | Kto pierwszy znajdzie slowa na planszy |
| **Krzyzowka** | Ta sama krzyzowka — kto wiecej hasel odgadnie |
| **Sudoku** | Ta sama plansza — kto szybciej uklada |

## PWA na telefonie

Chrome/Safari → **Dodaj do ekranu glownego**

## Produkcja

```bash
npm run install:all
npm run build
npm start
```
