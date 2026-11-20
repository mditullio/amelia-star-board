// ─────────────────────────────────────────────
//  Écran du calcul posé en colonnes, étape par étape
// ─────────────────────────────────────────────
const Colonne = (() => {
  const $ = id => document.getElementById(id);

  let ex, etapes, idx, errEtape, errTotal, rappels, cases, fini, aideVisible;

  // Petits chiffres colorés pour les consignes
  const cU = x => `<span class="nu">${x}</span>`;   // unités (vert)
  const cD = x => `<span class="nd">${x}</span>`;   // dizaines (bleu)
  const cR = x => `<span class="nr">${x}</span>`;   // retenue / emprunt (orange)

  // ── Liste des étapes guidées ──────────────────
  function construireEtapes(e) {
    const s = [];
    if (e.op === '+') {
      const su = e.aU + e.bU, ret = su >= 10;
      s.push({
        cible: 'resU', attendu: su % 10, col: 'U',
        texte: `Colonne des unités : ${cU(e.aU)} + ${cU(e.bU)} = ?`,
        astuce: ret ? 'Si ça fait 10 ou plus, écris seulement le chiffre des unités !'
                    : 'On commence toujours par la droite 👉',
      });
      if (ret) {
        s.push({
          cible: 'ret', attendu: 1, col: 'D',
          texte: `${cU(e.aU)} + ${cU(e.bU)} = ${su} ! Tu as écrit ${cU(su % 10)}, et on <b>retient ${cR(1)} dizaine</b>. Écris la retenue en haut ✏️`,
          astuce: '10 unités = 1 dizaine',
        });
      }
      const termes = [...(ret ? [cR(1)] : []), cD(e.aT), e.bT !== null ? cD(e.bT) : 'rien'];
      s.push({
        cible: 'resT', attendu: e.aT + (e.bT || 0) + (ret ? 1 : 0), col: 'D',
        texte: `Colonne des dizaines : ${termes.join(' + ')} = ?`,
        astuce: ret ? 'N\'oublie pas la retenue !' : '',
      });
    } else {
      const emp = e.aU < e.bU;
      if (emp) {
        s.push({
          cible: 'newT', attendu: e.aT - 1, col: 'D', apres: 'barrer',
          texte: `Unités : ${cU(e.aU)} − ${cU(e.bU)}… impossible, ${e.aU} est plus petit que ${e.bU} ! On <b>emprunte 1 dizaine</b> : ${cD(e.aT)} − 1 = ?`,
          astuce: `Écris le nouveau nombre de dizaines au-dessus du ${e.aT}`,
        });
        s.push({
          cible: 'pref', attendu: 1, col: 'U',
          texte: `La dizaine empruntée devient 10 unités. Écris le ${cR(1)} devant le ${cU(e.aU)} pour faire ${cU(e.aU + 10)} !`,
          astuce: '1 dizaine = 10 unités',
        });
      }
      const haut = emp ? e.aU + 10 : e.aU;
      s.push({
        cible: 'resU', attendu: haut - e.bU, col: 'U',
        texte: `Colonne des unités : ${cU(haut)} − ${cU(e.bU)} = ?`,
        astuce: emp ? '' : 'On commence toujours par la droite 👉',
      });
      const t = emp ? e.aT - 1 : e.aT;
      s.push({
        cible: 'resT', attendu: t - (e.bT || 0), col: 'D',
        texte: `Colonne des dizaines : ${cD(t)} − ${e.bT !== null ? cD(e.bT) : 'rien'} = ?`,
        astuce: emp ? `Attention : il reste ${t} dizaines, plus ${e.aT} !` : '',
      });
    }
    return s;
  }

  // ── Dessin de la grille ───────────────────────
  function construireGrille(e) {
    const sous = e.op === '-';
    const emp = sous && e.aU < e.bU;
    const ret = !sous && e.aU + e.bU >= 10;
    let caseHaut = '';
    if (ret) caseHaut = '<div class="case petite retenue" data-id="ret"></div>';
    if (emp) caseHaut = '<div class="case petite emprunt" data-id="newT"></div>';

    $('grille').innerHTML = `
      <div class="cel"></div>
      <div class="cel entete col-D">D</div>
      <div class="cel entete col-U">U</div>

      <div class="cel rang-blocs"></div>
      <div class="cel col-D rang-blocs"><div class="blocs blocs-D" id="blocs-D"></div></div>
      <div class="cel col-U rang-blocs"><div class="blocs blocs-U" id="blocs-U"></div></div>
      <div class="legende-blocs rang-blocs" id="blocs-legende"></div>

      <div class="cel rang-haut"></div>
      <div class="cel col-D rang-haut">${caseHaut}</div>
      <div class="cel col-U rang-haut"></div>

      <div class="cel"></div>
      <div class="cel col-D"><span class="chiffre nd" id="hautT">${e.aT}</span></div>
      <div class="cel col-U"><span class="porte-unite">${emp ? '<div class="case petite prefixe" data-id="pref"></div>' : ''}<span class="chiffre nu">${e.aU}</span></span></div>

      <div class="cel op">${sous ? '−' : '+'}</div>
      <div class="cel col-D"><span class="chiffre nd">${e.bT !== null ? e.bT : ''}</span></div>
      <div class="cel col-U"><span class="chiffre nu">${e.bU}</span></div>

      <div class="ligne"></div>

      <div class="cel"></div>
      <div class="cel col-D"><div class="case" data-id="resT"></div></div>
      <div class="cel col-U"><div class="case" data-id="resU"></div></div>
    `;
    cases = {};
    $('grille').querySelectorAll('[data-id]').forEach(c => { cases[c.dataset.id] = c; });
  }

  function bulle(texte, astuce) {
    $('bulle-texte').innerHTML = texte;
    $('bulle-astuce').innerHTML = astuce || '';
  }

  function activer() {
    const et = etapes[idx];
    Object.values(cases).forEach(c => c.classList.remove('active'));
    cases[et.cible].classList.add('active');
    $('grille').dataset.col = et.col;
    bulle(et.texte, et.astuce);
    if (rappels.etape) rappels.etape();
  }

  // ── Départ d'un exercice ──────────────────────
  function demarrer(exercice, cb) {
    ex = exercice;
    rappels = cb || {};
    etapes = construireEtapes(ex);
    idx = 0; errEtape = 0; errTotal = 0; fini = false; aideVisible = false;
    Blocs.arreter();
    construireGrille(ex);
    $('grille').classList.remove('aide');
    activer();
  }

  // ── Saisie d'un chiffre ───────────────────────
  function saisir(n) {
    if (fini || !etapes) return;
    const et = etapes[idx], c = cases[et.cible];
    clearTimeout(c._minuteur);
    c.classList.remove('faux');

    if (n === et.attendu) {
      c.textContent = n;
      c.classList.remove('active', 'fantome');
      c.classList.add('ok');
      Son.bon();
      if (et.apres === 'barrer') $('hautT').classList.add('barre');
      idx++;
      errEtape = 0;
      if (idx >= etapes.length) terminer(); else activer();
      return;
    }

    errEtape++;
    errTotal++;
    Son.faux();
    c.textContent = n;
    void c.offsetWidth;            // relance l'animation
    c.classList.add('faux');
    c._minuteur = setTimeout(() => {
      if (c.classList.contains('ok')) return;
      c.classList.remove('faux');
      c.textContent = errEtape >= 3 ? et.attendu : '';
    }, 650);

    if (errEtape === 1) {
      $('bulle-astuce').innerHTML = 'Presque ! Essaie encore 💪';
    } else if (errEtape === 2) {
      $('bulle-astuce').innerHTML = 'Regarde les blocs pour t\'aider 👀';
      if (!aideVisible) aide();
    } else {
      $('bulle-astuce').innerHTML = 'Recopie le chiffre qui apparaît dans la case ✨';
      c.classList.add('fantome');
    }
  }

  function terminer() {
    fini = true;
    $('grille').dataset.col = '';
    cases.resT.classList.add('gagne');
    cases.resU.classList.add('gagne');
    const op = ex.op === '+' ? '+' : '−';
    bulle(`Bravo ! ${ex.a} ${op} ${ex.b} = <b>${ex.res}</b> 🎉`,
          errTotal === 0 ? 'Parfait, aucune erreur ! 🌟' : 'Bien joué !');
    Son.bravo();
    if (rappels.fini) rappels.fini(errTotal);
  }

  // ── Aide visuelle (barres et cubes) ───────────
  function aide() {
    if (!ex) return;
    if (aideVisible) {
      aideVisible = false;
      Blocs.arreter();
      $('grille').classList.remove('aide');
      return;
    }
    aideVisible = true;
    $('grille').classList.add('aide');
    Blocs.lancer(ex, $('blocs-D'), $('blocs-U'), $('blocs-legende'));
  }

  function texteBulle() {
    return $('bulle-texte').textContent + ' ' + $('bulle-astuce').textContent;
  }

  return { demarrer, saisir, aide, texteBulle, estFini: () => fini };
})();
