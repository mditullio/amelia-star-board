// ─────────────────────────────────────────────
//  Niveaux et générateur d'exercices
// ─────────────────────────────────────────────
const Niveaux = (() => {
  const hasard = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Construit un exercice avec ses chiffres séparés (D = dizaines, U = unités)
  function fabrique(a, b, op) {
    return {
      a, b, op,
      aT: Math.floor(a / 10), aU: a % 10,
      bT: b >= 10 ? Math.floor(b / 10) : null, bU: b % 10,
      res: op === '+' ? a + b : a - b,
    };
  }

  const LISTE = [
    {
      num: 1, op: '+', nom: 'Additions sans retenue', exemple: '13 + 5',
      gen() {
        for (;;) {
          const a = hasard(10, 89), b = hasard(1, 9);
          if (a % 10 + b <= 9) return fabrique(a, b, '+');
        }
      },
    },
    {
      num: 2, op: '+', nom: 'Grandes additions sans retenue', exemple: '44 + 25',
      gen() {
        for (;;) {
          const a = hasard(10, 88), b = hasard(10, 88);
          if (a % 10 + b % 10 <= 9 && a + b <= 99) return fabrique(a, b, '+');
        }
      },
    },
    {
      num: 3, op: '+', nom: 'Additions avec retenue', exemple: '44 + 27',
      gen() {
        for (;;) {
          const petit = Math.random() < 0.35;            // parfois 14 + 6
          const a = hasard(10, 89), b = petit ? hasard(2, 9) : hasard(10, 89);
          if (a % 10 + b % 10 >= 10 && a + b <= 99) return fabrique(a, b, '+');
        }
      },
    },
    {
      num: 4, op: '-', nom: 'Petites soustractions', exemple: '15 − 4',
      gen() {
        for (;;) {
          const a = hasard(11, 59), b = hasard(1, 9);
          if (a % 10 >= b) return fabrique(a, b, '-');
        }
      },
    },
    {
      num: 5, op: '-', nom: 'Grandes soustractions sans emprunt', exemple: '57 − 23',
      gen() {
        for (;;) {
          const a = hasard(21, 99), b = hasard(10, 89);
          if (a % 10 >= b % 10 && Math.floor(a / 10) > Math.floor(b / 10)) return fabrique(a, b, '-');
        }
      },
    },
    {
      num: 6, op: '-', nom: 'Soustractions avec emprunt', exemple: '52 − 27',
      gen() {
        for (;;) {
          const petit = Math.random() < 0.35;            // parfois 43 − 8
          const a = hasard(20, 99), b = petit ? hasard(2, 9) : hasard(10, 89);
          const dizainesRestantes = Math.floor(a / 10) - 1 - Math.floor(b / 10);
          if (a % 10 < b % 10 && dizainesRestantes >= 1) return fabrique(a, b, '-');
        }
      },
    },
  ];

  // Série de n exercices tous différents
  function serie(num, n) {
    const niveau = LISTE[num - 1], vus = new Set(), liste = [];
    let essais = 0;
    while (liste.length < n && essais < 500) {
      essais++;
      const ex = niveau.gen(), cle = ex.a + ex.op + ex.b;
      if (vus.has(cle)) continue;
      vus.add(cle);
      liste.push(ex);
    }
    return liste;
  }

  return { LISTE, serie, total: LISTE.length };
})();
