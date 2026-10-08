"use strict";
const $ = (selector) => document.querySelector(selector);
const storage = {
  get(key, fallback = null) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Practice also works without storage. */
    }
  },
};
const app = {
  screen: "home",
  mode: "mix",
  equationTheme: "mix",
  index: 0,
  score: 0,
  answered: false,
  total: 10,
  current: null,
  showHelp: storage.get("electricite-help", "false") === "true",
  helpUsed: false,
  completed: false,
  formulaCorrect: 0,
  unitCorrect: 0,
  numericCorrect: 0,
  result: null,
  history: [],
  equationDeck: [],
  numericDeck: [],
};
const pick = (values) => values[Math.floor(Math.random() * values.length)];
const shuffle = (values) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const fmt = (value) =>
  Number(value.toFixed(4)).toLocaleString("fr-BE", {
    maximumFractionDigits: 4,
  });
const fmtPrecise = (value) =>
  Number(value.toFixed(6)).toLocaleString("fr-BE", {
    maximumFractionDigits: 6,
  });
const modeNames = {
  ohm: "Loi d’Ohm",
  charge: "Charge électrique",
  power: "Puissance",
  pouillet: "Loi de Pouillet",
  section: "Section ronde",
  series: "Résistances en série",
  mix: "Tous les thèmes",
  formulas: "Équations & unités",
};
const familyNames = {
  ohm: "Loi d’Ohm",
  charge: "Charge électrique",
  power: "Puissance",
  pouillet: "Loi de Pouillet",
  section: "Section ronde",
  series: "Résistances en série",
};
const screenHashes = {
  home: "#accueil",
  setup: "#questionnaires",
  quiz: "#serie",
  summary: "#bilan",
};
const typeLabel = () =>
  app.mode === "formulas" ? "Équations & unités" : "Calculs appliqués";
const themeLabel = () =>
  modeNames[app.mode === "formulas" ? app.equationTheme : app.mode];
function finalPoints() {
  return app.score / (app.helpUsed ? 2 : 1);
}
function updateScore() {
  $("#score").textContent = `${fmt(finalPoints())} / ${app.total}`;
  const rule =
    app.mode === "formulas"
      ? "Équation : 0,5 pt. Unité : 0,5 pt."
      : "Bonne réponse : 1 point.";
  $("#scoringNote").textContent =
    rule +
    " " +
    (app.helpUsed
      ? "Aides utilisées : score final divisé par 2."
      : "Avec les aides, le score de la série est divisé par 2.");
  $("#scoringNote").dataset.assisted = String(app.helpUsed);
}
function showScreen(screen, focus = true) {
  app.screen = screen;
  for (const name of Object.keys(screenHashes))
    $("#" + name + "Screen").hidden = name !== screen;
  for (const [id, name] of [
    ["homeNav", "home"],
    ["setupNav", "setup"],
  ]) {
    if (
      name === screen ||
      (name === "setup" && (screen === "quiz" || screen === "summary"))
    )
      $("#" + id).setAttribute("aria-current", "page");
    else $("#" + id).removeAttribute("aria-current");
  }
  history.replaceState(null, "", screenHashes[screen]);
  const titles = {
    home: "Réviser et comprendre",
    setup: "Choisir un questionnaire",
    quiz: themeLabel(),
    summary: "Bilan de la série",
  };
  document.title = `Atelier Électricité — ${titles[screen]}`;
  if (focus) {
    $("#" + screen + "Title").focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}
let pendingScreen = null;
function navigate(screen) {
  if (app.screen === "quiz" && !app.completed && screen !== "quiz") {
    pendingScreen = screen;
    history.replaceState(null, "", screenHashes.quiz);
    if (!$("#leaveDialog").open) $("#leaveDialog").showModal();
    return;
  }
  showScreen(screen);
}
$("#leaveDialog").addEventListener("close", () => {
  if ($("#leaveDialog").returnValue === "leave" && pendingScreen) {
    app.current = null;
    app.history = [];
    app.answered = false;
    showScreen(pendingScreen);
  }
  pendingScreen = null;
});
document
  .querySelectorAll('a[href="#accueil"],a[href="#questionnaires"]')
  .forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.hash === "#accueil" ? "home" : "setup");
    }),
  );
window.addEventListener("hashchange", () => {
  const screen = Object.keys(screenHashes).find(
    (key) => screenHashes[key] === location.hash,
  );
  navigate(
    screen === "summary" && app.completed
      ? "summary"
      : screen === "quiz" && app.current
        ? "quiz"
        : screen === "home"
          ? "home"
          : "setup",
  );
});
function updateSetup() {
  const type = $('input[name="quizType"]:checked').value;
  $("#selectedType").textContent =
    type === "equation" ? "Équations & unités" : "Calculs appliqués";
  $("#selectedTheme").textContent =
    modeNames[$('input[name="quizTheme"]:checked').value];
}
document
  .querySelectorAll('input[name="quizType"],input[name="quizTheme"]')
  .forEach((input) => input.addEventListener("change", updateSetup));
function setHelp(enabled) {
  app.showHelp = enabled;
  if (enabled && app.screen === "quiz" && app.current && !app.completed)
    app.helpUsed = true;
  $("#helpToggle").checked = enabled;
  $("#setupHelpToggle").checked = enabled;
  $("#formulaHelp").hidden = !enabled;
  storage.set("electricite-help", enabled);
  updateScore();
}
$("#helpToggle").addEventListener("change", (event) =>
  setHelp(event.target.checked),
);
$("#setupHelpToggle").addEventListener("change", (event) =>
  setHelp(event.target.checked),
);

const variables = [
  "U",
  "I",
  "R",
  "P",
  "Q",
  "T",
  "ρ",
  "L",
  "S",
  "r",
  "d",
  "Rₜ",
  "R₁",
  "R₂",
  "R₃",
];
// Both keyboard notation and the course's mathematical symbols are accepted.
function tokenizeExpression(value, target) {
  let source = value
    .trim()
    .normalize("NFC")
    .replace(/sqrt/gi, "√")
    .replace(/rho/gi, "ρ")
    .replace(/pi/gi, "π")
    .replace(/R_?t\b/gi, "Rₜ")
    .replace(/R_?([123])\b/gi, (_, n) => "R" + { 1: "₁", 2: "₂", 3: "₃" }[n])
    .replace(/\*\*/g, "^")
    .replace(/\^\s*2/g, "²")
    .replace(/[*,]/g, (char) => (char === "*" ? "×" : "."))
    .replace(/\//g, "÷")
    .replace(/[-–]/g, "−");
  if (source.includes("=")) {
    const sides = source.split("=");
    if (sides.length !== 2 || sides[0].trim() !== target)
      throw Error(`Écrivez la relation pour ${target}.`);
    source = sides[1];
  }
  const tokens = [];
  while (source.trim()) {
    source = source.trimStart();
    const match =
      /^(R[ₜ₁₂₃]|[UIRPQTρLSrdπ√²()+−×÷]|(?:\d+(?:\.\d*)?|\.\d+))/.exec(source);
    if (!match)
      throw Error(
        "Utilisez les variables du cours et les opérations indiquées.",
      );
    tokens.push(match[0]);
    source = source.slice(match[0].length);
    if (tokens.length > 100) throw Error("L’équation est trop longue.");
  }
  if (!tokens.length) throw Error("Saisissez votre équation.");
  return tokens;
}
// A small arithmetic parser avoids executing user-supplied JavaScript.
function parseExpression(tokens) {
  let pos = 0;
  function atom() {
    const token = tokens[pos++];
    if (token === "(") {
      const value = sum();
      if (tokens[pos++] !== ")") throw Error("Fermez la parenthèse.");
      return value;
    }
    if (token === "π") return () => Math.PI;
    if (typeof token === "string" && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token))
      return () => Number(token);
    if (!variables.includes(token))
      throw Error(
        "L’équation est incomplète : une variable ou une valeur est attendue.",
      );
    return (values) => values[token];
  }
  function power() {
    let value = atom();
    while (tokens[pos] === "²") {
      pos++;
      const previous = value;
      value = (values) => previous(values) ** 2;
    }
    return value;
  }
  function product() {
    let value = unary();
    while (tokens[pos] === "×" || tokens[pos] === "÷") {
      const op = tokens[pos++],
        left = value,
        right = unary();
      value = (values) =>
        op === "×"
          ? left(values) * right(values)
          : left(values) / right(values);
    }
    return value;
  }
  function unary() {
    const token = tokens[pos];
    if (token === "−" || token === "+" || token === "√") {
      pos++;
      const value = unary();
      return (values) =>
        token === "√"
          ? Math.sqrt(value(values))
          : token === "−"
            ? -value(values)
            : value(values);
    }
    return power();
  }
  function sum() {
    let value = product();
    while (tokens[pos] === "+" || tokens[pos] === "−") {
      const op = tokens[pos++],
        left = value,
        right = product();
      value = (values) =>
        op === "+"
          ? left(values) + right(values)
          : left(values) - right(values);
    }
    return value;
  }
  const result = sum();
  if (pos !== tokens.length)
    throw Error("Vérifiez les opérations et les parenthèses.");
  return result;
}
function equivalent(tokens, expected) {
  const actual = parseExpression(tokens),
    reference = parseExpression(tokenizeExpression(expected));
  for (let trial = 1; trial <= 24; trial++) {
    const values = Object.fromEntries(
      variables.map((variable, index) => [
        variable,
        0.3 + Math.abs(Math.sin(trial * 12.9898 + (index + 1) * 78.233)) * 97,
      ]),
    );
    const a = actual(values),
      b = reference(values);
    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(b))
    )
      return false;
  }
  return true;
}
function normalizeUnit(value) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/ohms?|ω/g, "Ω")
    .replace(/\s+/g, "")
    .replace(/\^2/g, "2")
    .replace(/[.*×⋅]/g, "·");
}
function parseNumericAnswer(value, unit) {
  let text = value
    .trim()
    .replace(/[\s\u00a0\u202f]/g, "")
    .replace(/−/g, "-");
  const match = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?/i.exec(text);
  if (!match)
    throw Error(
      "Saisissez un nombre, avec une virgule ou un point pour les décimales.",
    );
  const suffix = text.slice(match[0].length);
  if (suffix && normalizeUnit(suffix) !== normalizeUnit(unit))
    throw Error(
      `Exprimez votre résultat en ${unit}, l’unité indiquée à droite du champ.`,
    );
  text = match[0].replace(",", ".");
  const number = Number(text);
  if (!Number.isFinite(number)) throw Error("Saisissez un nombre fini.");
  return number;
}
function isNumericCorrect(value, question) {
  const precision = question.precision ?? 4;
  return (
    Math.abs(value - question.answer) <=
    0.5 * 10 ** -precision + 1e-9 * Math.max(1, Math.abs(question.answer))
  );
}

const equationBank = [
  {
    question: "Quelle équation calcule l’intensité I à partir de U et R ?",
    answer: "I = U ÷ R",
    family: "Loi d’Ohm",
  },
  {
    question: "Quelle équation calcule la tension U à partir de R et I ?",
    answer: "U = R × I",
    family: "Loi d’Ohm",
  },
  {
    question: "Quelle équation calcule la résistance R à partir de U et I ?",
    answer: "R = U ÷ I",
    family: "Loi d’Ohm",
  },
  {
    question: "Quelle équation calcule la puissance P à partir de U et I ?",
    answer: "P = U × I",
    family: "Puissance",
  },
  {
    question: "Quelle équation calcule l’intensité I à partir de P et U ?",
    answer: "I = P ÷ U",
    family: "Puissance",
  },
  {
    question: "Quelle équation calcule la tension U à partir de P et I ?",
    answer: "U = P ÷ I",
    family: "Puissance",
  },
  {
    question: "Quelle équation calcule la charge Q à partir de I et T ?",
    answer: "Q = I × T",
    family: "Charge électrique",
  },
  {
    question: "Quelle équation calcule l’intensité I à partir de Q et T ?",
    answer: "I = Q ÷ T",
    family: "Charge électrique",
  },
  {
    question: "Quelle équation calcule la durée T à partir de Q et I ?",
    answer: "T = Q ÷ I",
    family: "Charge électrique",
  },
  {
    question: "Quelle équation calcule la résistance R à partir de ρ, L et S ?",
    answer: "R = ρ × L ÷ S",
    family: "Loi de Pouillet",
  },
  {
    question:
      "Quelle équation calcule la résistivité ρ à partir de R, L et S ?",
    answer: "ρ = R × S ÷ L",
    family: "Loi de Pouillet",
  },
  {
    question: "Quelle équation calcule la longueur L à partir de R, ρ et S ?",
    answer: "L = R × S ÷ ρ",
    family: "Loi de Pouillet",
  },
  {
    question: "Quelle équation calcule la section S à partir de ρ, L et R ?",
    answer: "S = ρ × L ÷ R",
    family: "Loi de Pouillet",
  },
];
equationBank.push(
  {
    question:
      "Quelle équation calcule la section S d’un conducteur rond à partir du rayon r ?",
    answer: "S = π × r ²",
    family: "Section ronde",
  },
  {
    question:
      "Quelle équation calcule la section S d’un conducteur rond à partir du diamètre d ?",
    answer: "S = π × d ² ÷ 4",
    family: "Section ronde",
  },
  {
    question: "Quelle équation calcule le rayon r à partir de la section S ?",
    answer: "r = √ ( S ÷ π )",
    family: "Section ronde",
  },
  {
    question:
      "Quelle équation calcule le diamètre d à partir de la section S ?",
    answer: "d = 2 × √ ( S ÷ π )",
    family: "Section ronde",
  },
  {
    question: "Quelle équation calcule le diamètre d à partir du rayon r ?",
    answer: "d = 2 × r",
    family: "Section ronde",
  },
  {
    question: "Quelle équation calcule le rayon r à partir du diamètre d ?",
    answer: "r = d ÷ 2",
    family: "Section ronde",
  },
  {
    question: "En série, quelle équation calcule Rₜ à partir de R₁ et R₂ ?",
    answer: "Rₜ = R₁ + R₂",
    family: "Résistances en série",
  },
  {
    question: "En série, quelle équation calcule Rₜ à partir de R₁, R₂ et R₃ ?",
    answer: "Rₜ = R₁ + R₂ + R₃",
    family: "Résistances en série",
  },
  {
    question:
      "Quelle résistance R₂ ajouter en série à R₁ pour atteindre le total Rₜ ?",
    answer: "R₂ = Rₜ − R₁",
    family: "Résistances en série",
  },
  {
    question:
      "Quelle résistance R₃ ajouter en série à R₁ et R₂ pour atteindre Rₜ ?",
    answer: "R₃ = Rₜ − R₁ − R₂",
    family: "Résistances en série",
  },
  {
    question:
      "En série, quelle équation retrouve R₁ à partir du total Rₜ et de R₂ ?",
    answer: "R₁ = Rₜ − R₂",
    family: "Résistances en série",
  },
);

function ohmQuestion() {
  const type = pick(["u", "i", "r"]);
  const r = pick([2, 5, 10, 12, 20, 25, 40, 50, 100, 200, 500, 1000]);
  const i = pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 3, 5, 10]);
  const u = Number((r * i).toFixed(4));
  if (type === "u")
    return {
      topic: "Loi d’Ohm",
      formula: "U = R × I",
      question: "Quelle est la tension U ?",
      given: [
        ["Résistance R", `${fmt(r)} Ω`],
        ["Intensité I", `${fmt(i)} A`],
      ],
      answer: u,
      unit: "V",
      calc: `U = ${fmt(r)} × ${fmt(i)} = ${fmt(u)} V`,
    };
  if (type === "i")
    return {
      topic: "Loi d’Ohm",
      formula: "I = U ÷ R",
      question: "Quelle est l’intensité I ?",
      given: [
        ["Tension U", `${fmt(u)} V`],
        ["Résistance R", `${fmt(r)} Ω`],
      ],
      answer: i,
      unit: "A",
      calc: `I = ${fmt(u)} ÷ ${fmt(r)} = ${fmt(i)} A`,
    };
  return {
    topic: "Loi d’Ohm",
    formula: "R = U ÷ I",
    question: "Quelle est la résistance R ?",
    given: [
      ["Tension U", `${fmt(u)} V`],
      ["Intensité I", `${fmt(i)} A`],
    ],
    answer: r,
    unit: "Ω",
    calc: `R = ${fmt(u)} ÷ ${fmt(i)} = ${fmt(r)} Ω`,
  };
}

function chargeQuestion() {
  const type = pick(["qah", "i", "t", "coulomb"]);
  const i = pick([0.02, 0.05, 0.1, 0.5, 1, 2, 2.5, 5, 10, 15, 30]);
  const t = pick([0.2, 0.5, 1, 2, 4, 5, 6, 8, 10, 12, 24]);
  const q = Number((i * t).toFixed(4));
  if (type === "qah")
    return {
      topic: "Charge électrique",
      formula: "Q = I × T",
      question: "Quelle charge Q est fournie ?",
      given: [
        ["Intensité I", `${fmt(i)} A`],
        ["Durée T", `${fmt(t)} h`],
      ],
      answer: q,
      unit: "Ah",
      calc: `Q = ${fmt(i)} × ${fmt(t)} = ${fmt(q)} Ah`,
    };
  if (type === "i")
    return {
      topic: "Charge électrique",
      formula: "I = Q ÷ T",
      question: "Quelle est l’intensité I ?",
      given: [
        ["Charge Q", `${fmt(q)} Ah`],
        ["Durée T", `${fmt(t)} h`],
      ],
      answer: i,
      unit: "A",
      calc: `I = ${fmt(q)} ÷ ${fmt(t)} = ${fmt(i)} A`,
    };
  if (type === "t")
    return {
      topic: "Charge électrique",
      formula: "T = Q ÷ I",
      question: "Combien de temps dure le passage du courant ?",
      given: [
        ["Charge Q", `${fmt(q)} Ah`],
        ["Intensité I", `${fmt(i)} A`],
      ],
      answer: t,
      unit: "h",
      calc: `T = ${fmt(q)} ÷ ${fmt(i)} = ${fmt(t)} h`,
    };
  const seconds = pick([30, 60, 120, 300, 600, 1800, 3600]);
  const amps = pick([0.02, 0.1, 0.5, 1, 2, 5, 10, 30]);
  const coulombs = Number((amps * seconds).toFixed(4));
  return {
    topic: "Charge électrique",
    formula: "Q = I × T",
    question: "Quelle charge Q est transférée ?",
    given: [
      ["Intensité I", `${fmt(amps)} A`],
      ["Durée T", `${fmt(seconds)} s`],
    ],
    answer: coulombs,
    unit: "C",
    calc: `Q = ${fmt(amps)} × ${fmt(seconds)} = ${fmt(coulombs)} C`,
  };
}

function powerQuestion() {
  const type = pick(["p", "u", "i"]);
  const u = pick([6, 9, 12, 24, 48, 120, 230, 400]);
  const i = pick([0.02, 0.05, 0.1, 0.5, 1, 2, 3, 5, 10, 16, 20, 32]);
  const p = Number((u * i).toFixed(4));
  if (type === "p")
    return {
      topic: "Puissance électrique",
      formula: "P = U × I",
      question: "Quelle est la puissance P ?",
      given: [
        ["Tension U", `${fmt(u)} V`],
        ["Intensité I", `${fmt(i)} A`],
      ],
      answer: p,
      unit: "W",
      calc: `P = ${fmt(u)} × ${fmt(i)} = ${fmt(p)} W`,
    };
  if (type === "u")
    return {
      topic: "Puissance électrique",
      formula: "U = P ÷ I",
      question: "Quelle est la tension U ?",
      given: [
        ["Puissance P", `${fmt(p)} W`],
        ["Intensité I", `${fmt(i)} A`],
      ],
      answer: u,
      unit: "V",
      calc: `U = ${fmt(p)} ÷ ${fmt(i)} = ${fmt(u)} V`,
    };
  return {
    topic: "Puissance électrique",
    formula: "I = P ÷ U",
    question: "Quelle est l’intensité I ?",
    given: [
      ["Puissance P", `${fmt(p)} W`],
      ["Tension U", `${fmt(u)} V`],
    ],
    answer: i,
    unit: "A",
    calc: `I = ${fmt(p)} ÷ ${fmt(u)} = ${fmt(i)} A`,
  };
}

function pouilletQuestion() {
  const type = pick(["r", "rho", "l", "s"]);
  const material = pick([
    { name: "Cuivre", rho: 0.0175 },
    { name: "Aluminium", rho: 0.0282 },
  ]);
  const l = pick([10, 20, 25, 40, 50, 80, 100]);
  const s = pick([1.5, 2.5, 4, 6, 10, 16]);
  const r = Number(((material.rho * l) / s).toFixed(6));
  if (type === "r")
    return {
      topic: "Loi de Pouillet · " + material.name,
      formula: "R = ρ × L ÷ S",
      question: "Quelle est la résistance R du conducteur ?",
      given: [
        ["Résistivité ρ", `${fmtPrecise(material.rho)} Ω·mm²/m`],
        ["Longueur L", `${fmt(l)} m`],
        ["Section S", `${fmt(s)} mm²`],
      ],
      answer: r,
      unit: "Ω",
      calc: `R = ${fmtPrecise(material.rho)} × ${fmt(l)} ÷ ${fmt(s)} = ${fmtPrecise(r)} Ω`,
    };
  if (type === "rho")
    return {
      topic: "Loi de Pouillet · " + material.name,
      formula: "ρ = R × S ÷ L",
      question: "Quelle est la résistivité ρ du conducteur ?",
      given: [
        ["Résistance R", `${fmtPrecise(r)} Ω`],
        ["Longueur L", `${fmt(l)} m`],
        ["Section S", `${fmt(s)} mm²`],
      ],
      answer: (r * s) / l,
      unit: "Ω·mm²/m",
      calc: `ρ = ${fmtPrecise(r)} × ${fmt(s)} ÷ ${fmt(l)} = ${fmtPrecise((r * s) / l)} Ω·mm²/m`,
    };
  if (type === "l")
    return {
      topic: "Loi de Pouillet · " + material.name,
      formula: "L = R × S ÷ ρ",
      question: "Quelle est la longueur L du conducteur ?",
      given: [
        ["Résistance R", `${fmtPrecise(r)} Ω`],
        ["Résistivité ρ", `${fmtPrecise(material.rho)} Ω·mm²/m`],
        ["Section S", `${fmt(s)} mm²`],
      ],
      answer: (r * s) / material.rho,
      unit: "m",
      calc: `L = ${fmtPrecise(r)} × ${fmt(s)} ÷ ${fmtPrecise(material.rho)} = ${fmtPrecise((r * s) / material.rho)} m`,
    };
  return {
    topic: "Loi de Pouillet · " + material.name,
    formula: "S = ρ × L ÷ R",
    question: "Quelle est la section S du conducteur ?",
    given: [
      ["Résistivité ρ", `${fmtPrecise(material.rho)} Ω·mm²/m`],
      ["Longueur L", `${fmt(l)} m`],
      ["Résistance R", `${fmtPrecise(r)} Ω`],
    ],
    answer: (material.rho * l) / r,
    unit: "mm²",
    calc: `S = ${fmtPrecise(material.rho)} × ${fmt(l)} ÷ ${fmtPrecise(r)} = ${fmtPrecise((material.rho * l) / r)} mm²`,
  };
}

function sectionQuestion() {
  const type = pick(["sr", "sd", "rs", "ds", "dr", "rd"]);
  const r = pick([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4]);
  const d = 2 * r;
  const s = pick([0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25]);
  const cases = {
    sr: {
      question: "Quelle est la surface de section S du conducteur rond ?",
      given: [["Rayon r", `${fmt(r)} mm`]],
      answer: Math.PI * r * r,
      unit: "mm²",
      formula: "S = π × r²",
      calc: `S = π × ${fmt(r)}²`,
    },
    sd: {
      question: "Quelle est la surface de section S du conducteur rond ?",
      given: [["Diamètre d", `${fmt(d)} mm`]],
      answer: (Math.PI * d * d) / 4,
      unit: "mm²",
      formula: "S = π × d² ÷ 4",
      calc: `S = π × ${fmt(d)}² ÷ 4`,
    },
    rs: {
      question: "Quel est le rayon r du conducteur rond ?",
      given: [["Section S", `${fmt(s)} mm²`]],
      answer: Math.sqrt(s / Math.PI),
      unit: "mm",
      formula: "r = √(S ÷ π)",
      calc: `r = √(${fmt(s)} ÷ π)`,
    },
    ds: {
      question: "Quel est le diamètre d du conducteur rond ?",
      given: [["Section S", `${fmt(s)} mm²`]],
      answer: 2 * Math.sqrt(s / Math.PI),
      unit: "mm",
      formula: "d = 2 × √(S ÷ π)",
      calc: `d = 2 × √(${fmt(s)} ÷ π)`,
    },
    dr: {
      question: "Quel est le diamètre d du conducteur rond ?",
      given: [["Rayon r", `${fmt(r)} mm`]],
      answer: d,
      unit: "mm",
      formula: "d = 2 × r",
      calc: `d = 2 × ${fmt(r)}`,
    },
    rd: {
      question: "Quel est le rayon r du conducteur rond ?",
      given: [["Diamètre d", `${fmt(d)} mm`]],
      answer: r,
      unit: "mm",
      formula: "r = d ÷ 2",
      calc: `r = ${fmt(d)} ÷ 2`,
    },
  };
  const q = cases[type];
  q.answer = Number(q.answer.toFixed(4));
  return {
    ...q,
    topic: "Section ronde",
    question: q.question,
    calc: q.calc + ` ≈ ${fmt(q.answer)} ${q.unit}`,
  };
}
function seriesQuestion() {
  const values = [5, 10, 15, 22, 33, 47, 68, 100, 150, 220, 330, 470];
  const r1 = pick(values),
    r2 = pick(values),
    r3 = pick(values),
    total = r1 + r2 + r3;
  const meter = (label, n) => [label, `${fmt(n)} Ω`];
  const cases = [
    {
      question: "R₁ et R₂ sont en série. Quelle est la résistance totale Rₜ ?",
      given: [meter("R₁", r1), meter("R₂", r2)],
      answer: r1 + r2,
      formula: "Rₜ = R₁ + R₂",
      calc: `Rₜ = ${r1} + ${r2}`,
    },
    {
      question:
        "R₁, R₂ et R₃ sont en série. Quelle est la résistance totale Rₜ ?",
      given: [meter("R₁", r1), meter("R₂", r2), meter("R₃", r3)],
      answer: total,
      formula: "Rₜ = R₁ + R₂ + R₃",
      calc: `Rₜ = ${r1} + ${r2} + ${r3}`,
    },
    {
      question:
        "Quelle résistance R₂ ajouter en série à R₁ pour atteindre le total souhaité Rₜ ?",
      given: [meter("R₁ existante", r1), meter("Total souhaité Rₜ", r1 + r2)],
      answer: r2,
      formula: "R₂ = Rₜ − R₁",
      calc: `R₂ = ${r1 + r2} − ${r1}`,
    },
    {
      question:
        "Quelle résistance R₃ ajouter en série à R₁ et R₂ pour atteindre Rₜ ?",
      given: [
        meter("R₁", r1),
        meter("R₂", r2),
        meter("Total souhaité Rₜ", total),
      ],
      answer: r3,
      formula: "R₃ = Rₜ − R₁ − R₂",
      calc: `R₃ = ${total} − ${r1} − ${r2}`,
    },
    {
      question:
        "Deux résistances sont en série. Quelle est la résistance inconnue R₁ ?",
      given: [meter("Total Rₜ", r1 + r2), meter("R₂ connue", r2)],
      answer: r1,
      formula: "R₁ = Rₜ − R₂",
      calc: `R₁ = ${r1 + r2} − ${r2}`,
    },
  ];
  const q = pick(cases);
  return {
    ...q,
    topic: "Résistances en série",
    unit: "Ω",
    calc: q.calc + ` = ${q.answer} Ω`,
  };
}

function equationQuestion() {
  if (!app.equationDeck.length) {
    const bank =
      app.equationTheme === "mix"
        ? equationBank
        : equationBank.filter(
            (item) => item.family === familyNames[app.equationTheme],
          );
    app.equationDeck = shuffle(bank);
  }
  const item = app.equationDeck.pop(),
    target = item.answer.split(" = ")[0];
  const units = {
    I: "A",
    U: "V",
    R: "Ω",
    P: "W",
    Q: "C",
    T: "s",
    ρ: "Ω·mm²/m",
    L: "m",
    S: "mm²",
    r: "mm",
    d: "mm",
    Rₜ: "Ω",
    "R₁": "Ω",
    "R₂": "Ω",
    "R₃": "Ω",
  };
  if (item.family === "Charge électrique" && Math.random() < 0.5) {
    units.Q = "Ah";
    units.T = "h";
  }
  const givenUnits = [
    ...new Set(
      tokenizeExpression(item.answer.split(" = ")[1]).filter(
        (token) => units[token],
      ),
    ),
  ].map((token) => `${token} en ${units[token]}`);
  return {
    kind: "equation",
    target,
    topic: item.family,
    formula: item.answer,
    question: item.question,
    given: [],
    answer: item.answer,
    unit: units[target],
    unitContext: "Données exprimées avec " + givenUnits.join(", ") + ".",
    calc: `${item.answer} ; unité : ${units[target]}`,
  };
}
function insertSymbol(symbol) {
  const input = $("#equationInput");
  input.setRangeText(symbol, input.selectionStart, input.selectionEnd, "end");
  input.focus();
  clearError();
}
for (const symbol of ["×", "÷", "²", "√", "π", "ρ", "Rₜ", "R₁", "R₂", "R₃"]) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = symbol;
  button.setAttribute("aria-label", "Insérer " + symbol);
  button.addEventListener("click", () => insertSymbol(symbol));
  $("#symbolKeys").append(button);
}
function clearError() {
  $("#answerError").textContent = "";
  for (const id of ["numericInput", "equationInput", "unitInput"])
    $("#" + id).removeAttribute("aria-invalid");
}
for (const id of ["numericInput", "equationInput", "unitInput"])
  $("#" + id).addEventListener("input", clearError);
function newQuestion(focus = true) {
  app.answered = false;
  if (app.showHelp) app.helpUsed = true;
  updateScore();
  let mode = app.mode;
  if (mode === "mix") {
    if (!app.numericDeck.length)
      app.numericDeck = shuffle(Object.keys(familyNames));
    mode = app.numericDeck.pop();
  }
  const generators = {
    ohm: ohmQuestion,
    charge: chargeQuestion,
    power: powerQuestion,
    pouillet: pouilletQuestion,
    section: sectionQuestion,
    series: seriesQuestion,
    formulas: equationQuestion,
  };
  const question = generators[mode]();
  question.precision = mode === "pouillet" ? 6 : 4;
  app.current = question;
  const equation = question.kind === "equation";
  $("#numericAnswer").hidden = equation;
  $("#equationAnswer").hidden = !equation;
  $("#unitContext").hidden = !equation;
  $("#unitContext").textContent = question.unitContext || "";
  $("#topic").textContent = question.topic;
  $("#formula").textContent = question.formula;
  $("#questionText").textContent = question.question;
  $("#given").replaceChildren(
    ...question.given.map(([label, value]) => {
      const meter = document.createElement("div");
      meter.className = "meter";
      const name = document.createElement("span");
      name.textContent = label;
      const number = document.createElement("strong");
      number.textContent = value;
      meter.append(name, number);
      return meter;
    }),
  );
  $("#numericUnit").textContent = question.unit;
  $("#numericHint").textContent =
    `Virgule ou point accepté. Arrondissez à ${question.precision} décimales si nécessaire.`;
  $("#equationTarget").textContent = question.target || "";
  $("#answerForm").reset();
  $("#answerForm")
    .querySelectorAll("input,button")
    .forEach((control) => (control.disabled = false));
  clearError();
  $("#validateBtn").hidden = false;
  $("#nextBtn").hidden = true;
  $("#feedback").hidden = true;
  $("#feedback").replaceChildren();
  $("#counter").textContent = `Question ${app.index + 1} / ${app.total}`;
  $("#questionNumber").textContent =
    `${String(app.index + 1).padStart(2, "0")} / ${app.total}`;
  $("#progressFill").style.width = `${(app.index / app.total) * 100}%`;
  $(".progress").setAttribute("aria-valuenow", app.index);
  if (focus)
    (equation ? $("#equationInput") : $("#numericInput")).focus({
      preventScroll: true,
    });
}
function recordResponse(response, earned, evaluation) {
  const question = app.current;
  app.history.push({
    question: question.question,
    given: question.given.map((pair) => [...pair]),
    context: question.unitContext || "",
    response,
    correction: question.calc,
    earned,
    evaluation,
  });
}
function submitAnswer() {
  if (app.screen !== "quiz" || !app.current || app.answered) return;
  clearError();
  const question = app.current,
    equation = question.kind === "equation";
  let earned = 0,
    evaluation = "",
    response = "",
    correct = false;
  try {
    if (equation) {
      let formulaCorrect;
      try {
        formulaCorrect = equivalent(
          tokenizeExpression($("#equationInput").value, question.target),
          question.answer.split(" = ")[1],
        );
      } catch (error) {
        $("#equationInput").setAttribute("aria-invalid", "true");
        $("#equationInput").focus();
        throw error;
      }
      const unit = $("#unitInput").value.trim();
      if (!unit) {
        $("#unitInput").setAttribute("aria-invalid", "true");
        $("#unitInput").focus();
        throw Error("Indiquez l’unité du résultat avant de valider.");
      }
      const unitCorrect = normalizeUnit(unit) === normalizeUnit(question.unit);
      correct = formulaCorrect && unitCorrect;
      earned = (formulaCorrect ? 0.5 : 0) + (unitCorrect ? 0.5 : 0);
      app.formulaCorrect += Number(formulaCorrect);
      app.unitCorrect += Number(unitCorrect);
      response = `${question.target} = ${$("#equationInput").value.trim()} ; unité : ${unit}`;
      evaluation = `Équation ${formulaCorrect ? "correcte" : "incorrecte"} (${formulaCorrect ? "0,5" : "0"} pt) ; unité ${unitCorrect ? "correcte" : "incorrecte"} (${unitCorrect ? "0,5" : "0"} pt).`;
    } else {
      let value;
      try {
        value = parseNumericAnswer($("#numericInput").value, question.unit);
      } catch (error) {
        $("#numericInput").setAttribute("aria-invalid", "true");
        $("#numericInput").focus();
        throw error;
      }
      correct = isNumericCorrect(value, question);
      earned = correct ? 1 : 0;
      app.numericCorrect += Number(correct);
      response = `${$("#numericInput").value.trim()}${/[a-zΩ²]/i.test($("#numericInput").value.replace(/e[+-]?\d+/gi, "")) ? "" : " " + question.unit}`;
      evaluation = correct ? "Réponse correcte." : "Réponse incorrecte.";
    }
  } catch (error) {
    $("#answerError").textContent = error.message;
    return;
  }
  app.answered = true;
  app.score += earned;
  recordResponse(response, earned, evaluation);
  updateScore();
  $("#answerForm")
    .querySelectorAll("input,button")
    .forEach((control) => (control.disabled = true));
  $("#validateBtn").hidden = true;
  const feedback = $("#feedback");
  feedback.className = `feedback ${correct ? "ok" : "no"}`;
  feedback.hidden = false;
  const title = document.createElement("strong");
  title.textContent = `${correct ? "Bonne réponse." : earned ? "Une partie de la réponse est correcte." : "À reprendre."} +${fmt(earned)} ${earned > 1 ? "points" : "point"}${app.helpUsed ? " avant réduction" : ""}`;
  feedback.append(title);
  if (equation) {
    const detail = document.createElement("div");
    detail.textContent = evaluation;
    feedback.append(detail);
  }
  const calculation = document.createElement("span");
  calculation.className = "calculation";
  calculation.textContent = question.calc;
  feedback.append(calculation);
  $("#nextBtn").textContent =
    app.index === app.total - 1 ? "Voir mon bilan →" : "Question suivante →";
  $("#nextBtn").hidden = false;
  $("#nextBtn").focus({ preventScroll: true });
  $("#progressFill").style.width = `${((app.index + 1) / app.total) * 100}%`;
  $(".progress").setAttribute("aria-valuenow", app.index + 1);
}
$("#answerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitAnswer();
});
function refreshLastResult() {
  try {
    const last = JSON.parse(storage.get("electricite-last-result-v1", "null"));
    if (last && typeof last.mode === "string" && Number.isFinite(last.points)) {
      $("#lastResultText").textContent =
        `${last.mode} · ${fmt(last.points)} / 10`;
      $("#lastResult").hidden = false;
    }
  } catch {
    /* A malformed saved result must not prevent a new session. */
  }
}
function finish() {
  if (app.completed) return;
  app.completed = true;
  const points = finalPoints();
  $("#finalScore").textContent = `${fmt(points)} / ${app.total}`;
  $("#gauge").style.setProperty(
    "--score-angle",
    `${(points / app.total) * 360}deg`,
  );
  $("#summaryMode").textContent = `${typeLabel()} · ${themeLabel()}`;
  $("#summaryTitle").textContent =
    app.score === app.total ? "Les bases sont solides." : "Un pas de plus.";
  $("#summaryText").textContent =
    app.score === app.total
      ? "Toutes les réponses sont correctes. Continuez avec un autre thème pour consolider vos acquis."
      : app.score >= 7
        ? "Vous avez de bons réflexes. Une nouvelle série vous aidera à préciser les derniers points."
        : app.score >= 5
          ? "Les bases se construisent. Reprenez les corrections, puis testez à nouveau votre raisonnement."
          : "Chaque correction vous aide à progresser. Reprenez un thème à la fois, à votre rythme.";
  const detail =
    app.mode === "formulas"
      ? `Équations correctes : ${app.formulaCorrect}/${app.total} → ${fmt(app.formulaCorrect * 0.5)} pts\nUnités correctes : ${app.unitCorrect}/${app.total} → ${fmt(app.unitCorrect * 0.5)} pts`
      : `Bonnes réponses : ${app.numericCorrect}/${app.total}`;
  const breakdown = `${detail}\nTotal brut : ${fmt(app.score)} / ${app.total}\n${app.helpUsed ? "Aides utilisées : total ÷ 2" : "Sans aide : aucune réduction"}\nScore final : ${fmt(points)} / ${app.total}`;
  $("#scoreBreakdown").textContent = breakdown;
  const completedAt = new Date();
  const report = {
    date: completedAt.toLocaleString("fr-BE"),
    mode: `${typeLabel()} · ${themeLabel()}`,
    breakdown,
    rule:
      app.mode === "formulas"
        ? "0,5 point par équation correcte et 0,5 point par unité correcte."
        : "1 point par bonne réponse.",
    answers: app.history.map((answer) => ({ ...answer })),
  };
  const filename = `resultat-electricite-${completedAt.toISOString().replace(/[:.]/g, "-")}.pdf`;
  const blob = new Blob([createQuizPdf(report)], { type: "application/pdf" });
  const file =
    typeof File === "function"
      ? new File([blob], filename, { type: "application/pdf" })
      : null;
  app.result = Object.freeze({ report, filename, blob, file, points });
  $("#shareStatus").textContent =
    "Choisissez WhatsApp dans le menu de partage du téléphone.";
  storage.set(
    "electricite-best-v2",
    Math.max(points, Number(storage.get("electricite-best-v2", "0")) || 0),
  );
  storage.set(
    "electricite-last-result-v1",
    JSON.stringify({ mode: report.mode, points }),
  );
  refreshLastResult();
  showScreen("summary");
}
function restart() {
  Object.assign(app, {
    index: 0,
    score: 0,
    helpUsed: false,
    completed: false,
    formulaCorrect: 0,
    unitCorrect: 0,
    numericCorrect: 0,
    result: null,
    history: [],
    equationDeck: [],
    numericDeck: [],
    current: null,
  });
  $("#quizTitle").textContent = themeLabel();
  $("#quizTypeLabel").textContent = typeLabel().toUpperCase();
  showScreen("quiz", false);
  newQuestion(false);
  $("#quizTitle").focus();
  window.scrollTo({ top: 0, behavior: "instant" });
}
$("#startBtn").addEventListener("click", () => {
  const type = $('input[name="quizType"]:checked').value,
    theme = $('input[name="quizTheme"]:checked').value;
  app.mode = type === "equation" ? "formulas" : theme;
  app.equationTheme = theme;
  restart();
});
$("#changeQuizBtn").addEventListener("click", () => navigate("setup"));
$("#nextBtn").addEventListener("click", () => {
  if (!app.answered || app.completed) return;
  app.index++;
  if (app.index >= app.total) finish();
  else {
    newQuestion();
    $("#quizCard").scrollIntoView({ block: "start", behavior: "instant" });
  }
});
$("#restartBtn").addEventListener("click", restart);
function downloadResult() {
  if (!app.result) return;
  const url = URL.createObjectURL(app.result.blob),
    link = document.createElement("a");
  link.href = url;
  link.download = app.result.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#exportBtn").addEventListener("click", downloadResult);
$("#sharePdfBtn").addEventListener("click", async () => {
  if (!app.result) return;
  const file = app.result.file;
  try {
    if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "Résultat — Atelier Électricité",
      });
      $("#shareStatus").textContent =
        "Le PDF a été transmis au menu de partage.";
    } else {
      downloadResult();
      $("#shareStatus").textContent =
        "Le PDF est téléchargé. Joignez-le comme document dans WhatsApp.";
    }
  } catch (error) {
    $("#shareStatus").textContent =
      error.name === "AbortError"
        ? "Partage annulé. Le PDF reste disponible."
        : "Le partage n’a pas abouti. Téléchargez le PDF puis joignez-le comme document dans WhatsApp.";
  }
});
let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#installBtn").hidden = false;
});
$("#installBtn").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#installBtn").hidden = true;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  $("#installBtn").hidden = true;
});
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  );
setHelp(app.showHelp);
updateSetup();
refreshLastResult();
showScreen(location.hash === "#questionnaires" ? "setup" : "home", false);

if (document.modelContext?.registerTool) {
  const toolLife = new AbortController();
  const register = (tool) =>
    Promise.resolve(
      document.modelContext.registerTool(tool, { signal: toolLife.signal }),
    ).catch(() => {});
  register({
    name: "read_current_question",
    title: "Lire la question",
    description:
      "Retourne la question en cours et les champs de réponse libre.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () =>
      app.screen === "quiz" && app.current
        ? {
            question: app.current.question,
            given: app.current.given,
            kind: app.current.kind || "numeric",
            target: app.current.target || null,
            unit: app.current.kind === "equation" ? null : app.current.unit,
            context: app.current.unitContext || null,
            answered: app.answered,
            questionNumber: app.index + 1,
            total: app.total,
          }
        : { screen: app.screen, question: null },
  });
  register({
    name: "start_quiz_series",
    title: "Démarrer une série",
    description: "Démarre dix calculs ou équations dans le thème choisi.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: Object.keys(modeNames) },
        theme: { type: "string", enum: ["mix", ...Object.keys(familyNames)] },
      },
      required: ["mode"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (
        !Object.hasOwn(modeNames, input?.mode) ||
        (input.theme &&
          !["mix", ...Object.keys(familyNames)].includes(input.theme))
      )
        throw Error("Mode ou thème invalide.");
      if (app.screen === "quiz" && !app.completed)
        throw Error("Quittez la série en cours avant d’en démarrer une autre.");
      app.mode = input.mode;
      app.equationTheme = input.theme || "mix";
      restart();
      return { status: "started", mode: input.mode, total: app.total };
    },
  });
  register({
    name: "answer_current_question",
    title: "Saisir un résultat",
    description: "Valide une réponse numérique saisie librement.",
    inputSchema: {
      type: "object",
      properties: { response: { type: "string" } },
      required: ["response"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (
        app.screen !== "quiz" ||
        !app.current ||
        app.current.kind === "equation" ||
        app.answered
      )
        throw Error("Aucun calcul à compléter.");
      if (typeof input?.response !== "string" || input.response.length > 100)
        throw Error("Réponse invalide.");
      $("#numericInput").value = input.response;
      submitAnswer();
      return {
        answered: app.answered,
        score: finalPoints(),
        error: $("#answerError").textContent,
      };
    },
  });
  register({
    name: "submit_equation",
    title: "Saisir une équation",
    description: "Valide une équation écrite librement et son unité.",
    inputSchema: {
      type: "object",
      properties: { expression: { type: "string" }, unit: { type: "string" } },
      required: ["expression", "unit"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => {
      if (
        app.screen !== "quiz" ||
        app.current?.kind !== "equation" ||
        app.answered
      )
        throw Error("Aucune équation à compléter.");
      if (
        typeof input?.expression !== "string" ||
        typeof input.unit !== "string" ||
        input.expression.length > 300 ||
        input.unit.length > 100
      )
        throw Error("Équation ou unité invalide.");
      $("#equationInput").value = input.expression;
      $("#unitInput").value = input.unit;
      submitAnswer();
      return {
        answered: app.answered,
        score: finalPoints(),
        error: $("#answerError").textContent,
      };
    },
  });
}
