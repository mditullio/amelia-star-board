// ─────────────────────────────────────────────
//  Aide visuelle : barres (dizaines) et cubes (unités)
//  posées au-dessus de leur colonne.
// ─────────────────────────────────────────────
const Blocs = (() => {
  let jeton = 0;   // change à chaque nouvelle animation pour annuler la précédente
  const pause = ms => new Promise(r => setTimeout(r, ms));

  function element(cls) {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  }
  const barre = (extra = '') => element('bloc-dix ' + extra);
  const cube = (extra = '') => element('bloc-un ' + extra);

  async function lancer(ex, zoneD, zoneU, legende) {
    const moi = ++jeton;
    const vivant = () => moi === jeton;
    zoneD.innerHTML = '';
    zoneU.innerHTML = '';

    if (ex.op === '+') {
      for (let i = 0; i < ex.aT; i++) zoneD.append(barre('a'));
      for (let i = 0; i < (ex.bT || 0); i++) zoneD.append(barre('b'));
      for (let i = 0; i < ex.aU; i++) zoneU.append(cube('a'));
      for (let i = 0; i < ex.bU; i++) zoneU.append(cube('b'));
      legende.textContent = `Voici ${ex.a} et ${ex.b} : les barres sont des dizaines, les cubes des unités.`;

      if (ex.aU + ex.bU >= 10) {
        await pause(2200); if (!vivant()) return;
        const dix = [...zoneU.children].slice(0, 10);
        dix.forEach(c => c.classList.add('groupe'));
        legende.textContent = 'Il y a plus de 10 cubes ! On en prend 10…';
        await pause(1600); if (!vivant()) return;
        dix.forEach(c => c.classList.add('part'));
        await pause(600); if (!vivant()) return;
        dix.forEach(c => c.remove());
        zoneD.prepend(barre('nouveau'));
        legende.textContent = '10 cubes = 1 barre ! C\'est la retenue : elle va chez les dizaines.';
        await pause(2600); if (!vivant()) return;
      } else {
        await pause(2200); if (!vivant()) return;
      }
      legende.textContent = 'Compte les barres et les cubes 😊';
    } else {
      for (let i = 0; i < ex.aT; i++) zoneD.append(barre('a'));
      for (let i = 0; i < ex.aU; i++) zoneU.append(cube('a'));
      legende.textContent = `Voici ${ex.a} : ${ex.aT} barres et ${ex.aU} cubes.`;
      await pause(2200); if (!vivant()) return;

      if (ex.aU < ex.bU) {
        const derniere = zoneD.lastElementChild;
        derniere.classList.add('groupe');
        legende.textContent = `Pas assez de cubes pour en enlever ${ex.bU}… On casse 1 barre !`;
        await pause(1800); if (!vivant()) return;
        derniere.classList.add('part');
        await pause(600); if (!vivant()) return;
        derniere.remove();
        const nouveaux = [];
        for (let i = 0; i < 10; i++) nouveaux.push(cube('nouveau'));
        zoneU.prepend(...nouveaux);
        legende.textContent = `1 barre = 10 cubes ! Maintenant il y a ${ex.aU + 10} cubes.`;
        await pause(2600); if (!vivant()) return;
      }

      const cubes = [...zoneU.children], barres = [...zoneD.children];
      cubes.slice(cubes.length - ex.bU).forEach(c => c.classList.add('enleve'));
      barres.slice(barres.length - (ex.bT || 0)).forEach(b => b.classList.add('enleve'));
      legende.textContent = `On enlève ${ex.b}. Compte ce qui reste 😊`;
    }
  }

  function arreter() { jeton++; }

  return { lancer, arreter };
})();
