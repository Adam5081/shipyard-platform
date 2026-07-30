/* Каталог программы — серверная копия для валидации и начисления очков.
   Должен совпадать с PHASES/SECURITY/LEGAL в assets/app.js. */

const PHASE_TASKS = [
  { week: 0, tasks: { w0_idea: 30, w0_ip: 20, w0_docs: 20, w0_cc: 30, w0_vibe: 20, w0_tg: 10 } },
  { week: 1, gate: "G1", tasks: { w1_i1: 30, w1_i2: 30, w1_i3: 30, w1_i4: 30, w1_i5: 30, w1_seg: 40, w1_vp: 40 } },
  { week: 2, gate: "G2", tasks: { w2_scope: 50, w2_arch: 40, w2_mock: 30, w2_md: 50, w2_plan: 30 } },
  { week: 3, tasks: { w3_s1: 50, w3_s2: 60, w3_rev: 30 } },
  { week: 4, gate: "G3", tasks: { w4_auth: 40, w4_db: 40, w4_int: 40, w4_mid: 40 } },
  { week: 5, tasks: { w5_test: 40, w5_rev: 40, w5_scan: 40, w5_owasp: 60 } },
  { week: 6, gate: "G4", tasks: { w6_host: 40, w6_cicd: 40, w6_mon: 30, w6_legal: 50, w6_live: 60 } },
  { week: 7, gate: "G5", tasks: { w7_land: 40, w7_chan: 40, w7_loi: 200, w7_pay: 200 } },
  { week: 8, tasks: { w8_deck: 60, w8_dry: 40, w8_pitch: 100, w8_track: 30 } },
];

const TASKS = Object.assign({}, ...PHASE_TASKS.map(p => p.tasks));

const SEC_IDS = [
  "s_inj", "s_auth", "s_acc", "s_secr", "s_data", "s_valid", "s_err", "s_https",
  "s_deps", "s_conf", "s_rep",
  "s_man1", "s_man2", "s_man3",
];

const LEGAL_IDS = ["l0a", "l0b", "l1", "l2", "l3", "l5", "l6", "l7"];

// Уровни верфи: индекс фазы из PHASE_TASKS, полная фаза => уровень достигнут
const LEVEL_PHASES = [0, 1, 2, 4, 5, 6, 7, 8];

function phaseDone(phase, doneSet) {
  return Object.keys(phase.tasks).every(id => doneSet.has(id));
}

function computePoints({ doneSet, secSet, legalSet, demoCount }) {
  let pts = 0;
  for (const id of doneSet) if (TASKS[id]) pts += TASKS[id];
  for (const p of PHASE_TASKS) if (p.gate && phaseDone(p, doneSet)) pts += 100;
  pts += secSet.size * 10;
  pts += legalSet.size * 15;
  pts += demoCount * 50;
  if (demoCount >= 3) pts = Math.round(pts * 1.1);
  return pts;
}

function computeLevel(doneSet) {
  let lvl = 1;
  for (let i = 0; i < LEVEL_PHASES.length; i++) {
    if (phaseDone(PHASE_TASKS[LEVEL_PHASES[i]], doneSet)) lvl = i + 1;
    else break;
  }
  return lvl;
}

module.exports = { PHASE_TASKS, TASKS, SEC_IDS, LEGAL_IDS, computePoints, computeLevel };
