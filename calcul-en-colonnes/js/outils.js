// ─────────────────────────────────────────────
//  Sauvegarde, sons et voix
// ─────────────────────────────────────────────
const Stockage = (() => {
  const CLE = 'amelia-calcul-v1';

  function defaut() {
    const stats = {};
    for (let i = 1; i <= 6; i++) stats[i] = { sessions: 0, exercices: 0, erreurs: 0 };
    return {
      niveau: 1, auto: true, nbEx: 8, voix: false, son: true,
      etoiles: 0, bonnesSuite: 0, stats, historique: [],
    };
  }

  function charger() {
    const d = defaut();
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) {
        const o = JSON.parse(texte);
        return Object.assign(d, o, { stats: Object.assign(d.stats, o.stats || {}) });
      }
    } catch (e) { /* stockage indisponible : on garde les valeurs par défaut */ }
    return d;
  }

  function sauver(d) {
    try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) { /* ignoré */ }
  }

  return { charger, sauver, defaut };
})();

const Son = (() => {
  let ctx = null;
  let actif = true;

  function note(freq, duree, decalage = 0, type = 'sine', volume = 0.15) {
    if (!actif) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime + decalage;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duree);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duree + 0.05);
    } catch (e) { /* pas de son, tant pis */ }
  }

  return {
    activer(v) { actif = v; },
    bon() { note(880, 0.12); note(1320, 0.18, 0.09); },
    faux() { note(240, 0.22, 0, 'triangle', 0.12); },
    bravo() { [523, 659, 784, 1047].forEach((f, i) => note(f, 0.22, i * 0.11)); },
    fanfare() { [523, 659, 784, 659, 784, 1047].forEach((f, i) => note(f, 0.25, i * 0.14, 'triangle', 0.13)); },
  };
})();

const Voix = (() => {
  const dispo = 'speechSynthesis' in window;
  let voix = null;

  function choisir() {
    const toutes = speechSynthesis.getVoices();
    voix = toutes.find(v => /^fr[-_](FR|CH)/i.test(v.lang))
        || toutes.find(v => v.lang.toLowerCase().startsWith('fr'))
        || null;
  }
  if (dispo) { choisir(); speechSynthesis.onvoiceschanged = choisir; }

  function nettoyer(t) {
    return t.replace(/−/g, ' moins ')
            .replace(/\+/g, ' plus ')
            .replace(/=/g, ' égale ')
            .replace(/[^\p{L}\p{N}\s,.!?'’:]/gu, ' ');
  }

  function dire(texte) {
    if (!dispo) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(nettoyer(texte));
    u.lang = 'fr-FR';
    if (voix) u.voice = voix;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  return { dire, dispo, taire() { if (dispo) speechSynthesis.cancel(); } };
})();
