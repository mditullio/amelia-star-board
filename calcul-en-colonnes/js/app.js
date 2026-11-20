// ─────────────────────────────────────────────
//  Application : écrans, sessions, coin des parents
// ─────────────────────────────────────────────
const App = (() => {
  const $ = id => document.getElementById(id);
  const d = Stockage.charger();
  let session = null;

  Son.activer(d.son);

  function sauver() { Stockage.sauver(d); }

  function montrer(nom) {
    document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('actif', e.id === 'ecran-' + nom));
  }
  const ecranActif = nom => $('ecran-' + nom).classList.contains('actif');

  // ── Accueil ───────────────────────────────────
  function majAccueil() {
    const niv = Niveaux.LISTE[d.niveau - 1];
    $('acc-etoiles').textContent = d.etoiles;
    $('acc-niveau-num').textContent = `Niveau ${niv.num}`;
    $('acc-niveau-nom').textContent = niv.nom;
    $('acc-niveau-ex').textContent = niv.exemple;

    $('chemin').innerHTML = Niveaux.LISTE.map(n => {
      const etat = n.num < d.niveau ? 'passe' : n.num === d.niveau ? 'ici' : 'futur';
      const signe = n.op === '+' ? '+' : '−';
      return `<div class="pas ${etat}" title="${n.nom}">
                <span class="pas-num">${n.num < d.niveau ? '✓' : n.num}</span>
                <span class="pas-op">${signe}</span>
              </div>`;
    }).join('<div class="trait"></div>');
    montrer('accueil');
  }

  // ── Session ───────────────────────────────────
  function demarrerSession() {
    session = {
      niveau: d.niveau,
      liste: Niveaux.serie(d.niveau, d.nbEx),
      idx: 0, erreurs: 0, sansFaute: 0,
    };
    const niv = Niveaux.LISTE[d.niveau - 1];
    $('jeu-niveau').textContent = `Niveau ${niv.num} · ${niv.nom}`;
    montrer('jeu');
    lancerExercice();
  }

  function majProgression() {
    $('progression').innerHTML = session.liste.map((_, i) => {
      const cls = i < session.idx ? 'fait' : i === session.idx ? 'encours' : '';
      return `<span class="point ${cls}">${i < session.idx ? '⭐' : ''}</span>`;
    }).join('');
  }

  function lancerExercice() {
    $('btn-suivant').classList.add('cache');
    $('btn-aide').classList.remove('cache');
    majProgression();
    Colonne.demarrer(session.liste[session.idx], {
      fini: exerciceFini,
      etape: () => { if (d.voix) Voix.dire(Colonne.texteBulle()); },
    });
  }

  function exerciceFini(erreurs) {
    session.erreurs += erreurs;
    if (erreurs === 0) session.sansFaute++;
    d.etoiles++;
    const st = d.stats[session.niveau];
    st.exercices++;
    st.erreurs += erreurs;
    sauver();

    // l'étoile de cet exercice apparaît dans la barre du haut
    const points = $('progression').children;
    points[session.idx].classList.add('fait', 'pop');
    points[session.idx].textContent = '⭐';

    $('btn-aide').classList.add('cache');
    $('btn-suivant').classList.remove('cache');
    if (d.voix) Voix.dire(Colonne.texteBulle());
  }

  function suivant() {
    session.idx++;
    if (session.idx >= session.liste.length) finSession();
    else lancerExercice();
  }

  function finSession() {
    const n = session.liste.length;
    const bonne = session.erreurs <= Math.floor(n / 4);
    const st = d.stats[session.niveau];
    st.sessions++;

    d.bonnesSuite = bonne ? d.bonnesSuite + 1 : 0;
    let message;
    if (d.auto && d.bonnesSuite >= 2 && d.niveau < Niveaux.total) {
      d.niveau++;
      d.bonnesSuite = 0;
      message = `🚀 Nouveau niveau débloqué :<br><b>${Niveaux.LISTE[d.niveau - 1].nom}</b> !`;
    } else if (bonne) {
      message = session.erreurs === 0 ? 'Aucune erreur, incroyable ! 🌟' : 'Super, presque aucune erreur !';
    } else {
      message = 'Bien travaillé ! On continue à s\'entraîner 💪';
    }

    d.historique.unshift({
      date: new Date().toISOString(), niveau: session.niveau,
      exercices: n, erreurs: session.erreurs,
    });
    d.historique = d.historique.slice(0, 15);
    sauver();

    $('fin-etoiles').innerHTML = Array.from({ length: n }, (_, i) =>
      `<span style="animation-delay:${i * 0.12}s">⭐</span>`).join('');
    $('fin-message').innerHTML = message;
    lancerConfettis();
    Son.fanfare();
    montrer('fin');
  }

  function lancerConfettis() {
    const couleurs = ['#ff7eb6', '#ffd23f', '#7ad3ff', '#9b5de5', '#4cd38a', '#ff9f43'];
    $('confettis').innerHTML = Array.from({ length: 70 }, () => {
      const c = couleurs[Math.floor(Math.random() * couleurs.length)];
      return `<i style="left:${Math.random() * 100}%;background:${c};
                animation-delay:${(Math.random() * 1.5).toFixed(2)}s;
                animation-duration:${(2.5 + Math.random() * 2).toFixed(2)}s;
                transform:rotate(${Math.floor(Math.random() * 360)}deg)"></i>`;
    }).join('');
  }

  // ── Pavé numérique ────────────────────────────
  function construirePave() {
    const ordre = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    $('pave').innerHTML = ordre.map(n =>
      `<button class="touche${n === 0 ? ' zero' : ''}" data-n="${n}">${n}</button>`).join('');
    $('pave').addEventListener('click', e => {
      const t = e.target.closest('.touche');
      if (!t) return;
      t.blur();
      Colonne.saisir(Number(t.dataset.n));
    });
  }

  // ── Coin des parents ──────────────────────────
  function ouvrirParents() {
    $('p-niveau').innerHTML = Niveaux.LISTE.map(n =>
      `<option value="${n.num}" ${n.num === d.niveau ? 'selected' : ''}>${n.num}. ${n.nom} (${n.exemple})</option>`).join('');
    $('p-nbex').value = String(d.nbEx);
    $('p-auto').checked = d.auto;
    $('p-voix').checked = d.voix;
    $('p-son').checked = d.son;

    $('p-stats').innerHTML =
      '<tr><th>Niveau</th><th>Sessions</th><th>Calculs</th><th>Erreurs / calcul</th></tr>' +
      Niveaux.LISTE.map(n => {
        const s = d.stats[n.num];
        const moy = s.exercices ? (s.erreurs / s.exercices).toFixed(1) : '–';
        return `<tr class="${n.num === d.niveau ? 'actuel' : ''}"><td>${n.num}. ${n.nom}</td>
                <td>${s.sessions}</td><td>${s.exercices}</td><td>${moy}</td></tr>`;
      }).join('');

    $('p-historique').innerHTML = d.historique.length
      ? d.historique.map(h => {
          const date = new Date(h.date).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' });
          return `<li><span>${date}</span><span>Niveau ${h.niveau}</span>
                  <span>${h.exercices} calculs</span><span>${h.erreurs} erreur${h.erreurs > 1 ? 's' : ''}</span></li>`;
        }).join('')
      : '<li class="vide">Aucune session pour le moment.</li>';

    $('parents').classList.remove('cache');
  }

  function fermerParents() {
    $('parents').classList.add('cache');
    majAccueil();
  }

  function brancherParents() {
    const btn = $('btn-parents');
    let minuteur = null;
    const annuler = () => { clearTimeout(minuteur); btn.classList.remove('appui'); };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.classList.add('appui');
      minuteur = setTimeout(() => { annuler(); ouvrirParents(); }, 1200);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, annuler));
    btn.addEventListener('contextmenu', e => e.preventDefault());

    $('btn-fermer-parents').addEventListener('click', fermerParents);
    $('parents').addEventListener('click', e => { if (e.target.id === 'parents') fermerParents(); });

    $('p-niveau').addEventListener('change', e => { d.niveau = Number(e.target.value); d.bonnesSuite = 0; sauver(); });
    $('p-nbex').addEventListener('change', e => { d.nbEx = Number(e.target.value); sauver(); });
    $('p-auto').addEventListener('change', e => { d.auto = e.target.checked; sauver(); });
    $('p-voix').addEventListener('change', e => { d.voix = e.target.checked; sauver(); });
    $('p-son').addEventListener('change', e => { d.son = e.target.checked; Son.activer(d.son); sauver(); });
    $('p-reset').addEventListener('click', () => {
      if (!confirm('Effacer toutes les étoiles et les progrès d\'Amelia ?')) return;
      Object.assign(d, Stockage.defaut());
      Son.activer(d.son);
      sauver();
      ouvrirParents();
    });
  }

  // ── Clavier ───────────────────────────────────
  function clavier(e) {
    if (!$('parents').classList.contains('cache')) {
      if (e.key === 'Escape') fermerParents();
      return;
    }
    if (ecranActif('jeu')) {
      if (/^[0-9]$/.test(e.key)) { Colonne.saisir(Number(e.key)); return; }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (Colonne.estFini()) suivant();
      }
    } else if (ecranActif('accueil') && e.key === 'Enter') {
      e.preventDefault();
      demarrerSession();
    } else if (ecranActif('fin') && e.key === 'Enter') {
      e.preventDefault();
      demarrerSession();
    }
  }

  // ── Démarrage ─────────────────────────────────
  function init() {
    construirePave();
    brancherParents();
    $('btn-jouer').addEventListener('click', demarrerSession);
    $('btn-encore').addEventListener('click', demarrerSession);
    $('btn-fin-maison').addEventListener('click', majAccueil);
    $('btn-maison').addEventListener('click', () => { Blocs.arreter(); Voix.taire(); majAccueil(); });
    $('btn-suivant').addEventListener('click', suivant);
    $('btn-aide').addEventListener('click', e => { e.currentTarget.blur(); Colonne.aide(); });
    $('btn-voix').addEventListener('click', e => { e.currentTarget.blur(); Voix.dire(Colonne.texteBulle()); });
    if (!Voix.dispo) $('btn-voix').classList.add('cache');
    document.addEventListener('keydown', clavier);
    majAccueil();
  }

  init();
})();
