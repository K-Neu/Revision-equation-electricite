/* Original, variable exercises inspired by the kinds of problems taught in class.
   Each following calculation uses the rounded value explicitly given to the learner. */
const schoolVariants = {
  ohm: [
    "lamp",
    "heater",
    "generator",
    "milliamps",
    "kilohms",
    "table",
    "charge-resistance",
    "coil-diameter",
  ],
  charge: [
    "coulombs-minutes",
    "current-ah",
    "duration-ah",
    "daily-capacity",
    "daily-autonomy",
    "current-coulombs",
  ],
  power: ["appliance", "current", "voltage", "resistive"],
  pouillet: [
    "section",
    "resistivity",
    "bifilar",
    "coil-length",
    "strip",
    "diameter",
    "cut-wire",
    "replace-material",
  ],
  section: ["radius", "diameter", "area", "gauge"],
  series: [
    "equivalent",
    "current-voltage",
    "lamp-resistor",
    "voltmeter",
    "lamps",
    "measured-voltage",
  ],
  parallel: [
    "four",
    "identical",
    "currents",
    "known-current",
    "added-branch",
    "shunt",
    "missing",
  ],
  mixed: [
    "parallel-series",
    "series-parallel",
    "series-parallel-series",
    "parallel-series-parallel",
    "six-resistors",
    "seven-resistors",
    "branch-measurements",
    "bridge",
  ],
  voltageDrop: [
    "line-resistance",
    "receiver",
    "diameter-line",
    "size-section",
    "load-charge",
  ],
};
const schoolNumber = (value, precision = 4) => Number(value.toFixed(precision));
const schoolFormat = (value) =>
  value.toLocaleString("fr-BE", { maximumFractionDigits: 6 });
const datum = (name, value, unit) => [name, `${schoolFormat(value)} ${unit}`];
const subscript = (value) =>
  String(value).replace(/\d/g, (n) => "₀₁₂₃₄₅₆₇₈₉"[n]);

function schoolProblem(theme, variant, statement, given, precision = 4) {
  const steps = [];
  return {
    steps,
    add(
      target,
      title,
      formula,
      value,
      unit,
      dependsOn = [],
      calculation = formula,
    ) {
      const answer = schoolNumber(value, precision);
      steps.push({
        target,
        title,
        description: "",
        formula,
        answer,
        unit,
        precision,
        dependsOn,
        calc: `${calculation} ≈ ${schoolFormat(answer)} ${unit}`,
      });
      return answer;
    },
    finish(diagram) {
      const last = steps.at(-1);
      const instructions = steps
        .map((step) => `${step.target} (${step.unit})`)
        .join(", puis ");
      return {
        topic: familyNames[theme],
        variant,
        theme,
        precision,
        given,
        diagram,
        question: `${statement} Déterminez ${instructions}.`,
        kind: steps.length > 1 ? "cascade" : "numeric",
        steps,
        formula: steps[0].formula,
        answer: last.answer,
        unit: last.unit,
        calc: steps.map((step) => step.calc).join("\n"),
        unitContext:
          "Utilisez les unités demandées à chaque étape. Reprenez les valeurs corrigées et arrondies affichées pour la suite. π est la valeur de votre calculatrice.",
      };
    },
  };
}

function schoolQuestion(theme, forcedVariant) {
  if (!app.exerciseDecks[theme]?.length)
    app.exerciseDecks[theme] = shuffle(schoolVariants[theme]);
  const variant = forcedVariant || app.exerciseDecks[theme].pop();
  if (
    theme === "mixed" &&
    ![
      "six-resistors",
      "seven-resistors",
      "branch-measurements",
      "bridge",
    ].includes(variant)
  ) {
    return { ...mixedCircuitQuestion(variant), theme, precision: 4 };
  }
  return schoolGenerators[theme](variant);
}

function schoolOhm(variant) {
  const U = pick([12, 24, 110, 120, 220, 240]),
    R = pick([20, 40, 60, 120, 240, 600]);
  let p;
  if (variant === "charge-resistance") {
    const Q = pick([12, 24, 48, 72]),
      minutes = pick([30, 60, 80, 120]);
    p = schoolProblem(
      "ohm",
      variant,
      "Un récepteur est alimenté sous une tension constante. La quantité d’électricité transportée et la durée sont connues.",
      [
        datum("Tension U", U, "V"),
        datum("Charge Q", Q, "Ah"),
        datum("Durée", minutes, "min"),
      ],
    );
    const t = p.add(
      "T",
      "Convertir la durée en heures",
      "T = durée ÷ 60",
      minutes / 60,
      "h",
    );
    const i = p.add(
      "I",
      "Retrouver le courant",
      "I = Q ÷ T",
      Q / t,
      "A",
      [0],
      `I = ${Q} ÷ ${schoolFormat(t)}`,
    );
    p.add(
      "R",
      "Retrouver la résistance du récepteur",
      "R = U ÷ I",
      U / i,
      "Ω",
      [1],
      `R = ${U} ÷ ${schoolFormat(i)}`,
    );
  } else if (variant === "coil-diameter") {
    const I = pick([0.5, 1, 2, 4]),
      L = pick([80, 120, 160, 240]),
      rho = 0.0175;
    p = schoolProblem(
      "ohm",
      variant,
      "Une bobine en cuivre est parcourue par un courant constant. Retrouvez le diamètre de son fil à partir des mesures électriques.",
      [
        datum("Tension U", U, "V"),
        datum("Courant I", I, "A"),
        datum("Longueur du fil L", L, "m"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    const r = p.add(
      "R",
      "Calculer la résistance de la bobine",
      "R = U ÷ I",
      U / I,
      "Ω",
    );
    const s = p.add(
      "S",
      "Retrouver la section du fil",
      "S = ρ × L ÷ R",
      (rho * L) / r,
      "mm²",
      [0],
    );
    p.add(
      "d",
      "Déduire le diamètre",
      "d = √(4 × S ÷ π)",
      Math.sqrt((4 * s) / Math.PI),
      "mm",
      [1],
    );
  } else if (variant === "table") {
    p = schoolProblem(
      "ohm",
      variant,
      "Complétez successivement trois relevés indépendants d’un tableau de mesures : relevé A (U et I), relevé B (R et I), relevé C (U et R).",
      [
        datum("A · U", 24, "V"),
        datum("A · I", 3, "A"),
        datum("B · R", R, "Ω"),
        datum("B · I", 2, "A"),
        datum("C · U", U, "V"),
        datum("C · R", 1000, "Ω"),
      ],
    );
    p.add("R (A)", "Compléter le relevé A", "R = U ÷ I", 24 / 3, "Ω");
    p.add("U (B)", "Compléter le relevé B", "U = R × I", R * 2, "V");
    p.add("I (C)", "Compléter le relevé C", "I = U ÷ R", U / 1000, "A");
  } else if (variant === "milliamps") {
    const mA = pick([20, 50, 100, 250]);
    p = schoolProblem(
      "ohm",
      variant,
      "L’étiquette d’une petite lampe indique sa tension et son courant en milliampères. Retrouvez sa résistance en fonctionnement.",
      [datum("Tension U", U, "V"), datum("Courant", mA, "mA")],
    );
    const i = p.add(
      "I",
      "Convertir les milliampères",
      "I = courant en mA ÷ 1000",
      mA / 1000,
      "A",
    );
    p.add("R", "Calculer la résistance", "R = U ÷ I", U / i, "Ω", [0]);
  } else if (variant === "kilohms") {
    const k = pick([2, 5, 10, 25, 34]);
    p = schoolProblem(
      "ohm",
      variant,
      "Une résistance donnée en kilo-ohms est raccordée à une source continue.",
      [datum("Tension U", U, "V"), datum("Résistance", k, "kΩ")],
    );
    const r = p.add(
      "R",
      "Convertir les kilo-ohms",
      "R = résistance en kΩ × 1000",
      k * 1000,
      "Ω",
    );
    p.add("I", "Calculer le courant", "I = U ÷ R", U / r, "A", [0]);
  } else if (variant === "heater") {
    const I = pick([2, 4, 5, 8]);
    p = schoolProblem(
      "ohm",
      variant,
      "Un élément chauffant est traversé par le courant indiqué lorsqu’il est branché sous la tension donnée.",
      [datum("Tension U", U, "V"), datum("Courant I", I, "A")],
    );
    p.add("R", "Retrouver la résistance à chaud", "R = U ÷ I", U / I, "Ω");
  } else if (variant === "generator") {
    const I = pick([0.5, 1, 2, 3]);
    p = schoolProblem(
      "ohm",
      variant,
      "Un générateur doit faire circuler le courant indiqué dans un récepteur résistif.",
      [datum("Résistance R", R, "Ω"), datum("Courant I", I, "A")],
    );
    p.add("U", "Choisir la tension du générateur", "U = R × I", R * I, "V");
  } else {
    p = schoolProblem(
      "ohm",
      variant,
      "Une lampe à incandescence présente la résistance à chaud indiquée. Elle est alimentée par une source continue.",
      [datum("Tension U", U, "V"), datum("Résistance R", R, "Ω")],
    );
    p.add("I", "Calculer le courant dans la lampe", "I = U ÷ R", U / R, "A");
  }
  return p.finish();
}

function schoolCharge(variant) {
  const I = pick([0.2, 0.5, 0.8, 1.5, 2.4, 3]),
    Q = pick([24, 60, 90, 120]),
    hours = pick([2, 4, 6, 8]);
  let p;
  if (variant === "coulombs-minutes" || variant === "current-coulombs") {
    const minutes = pick([15, 30, 35, 75, 90]),
      c = pick([16800, 27000, 54000]);
    p = schoolProblem(
      "charge",
      variant,
      "Une installation transporte une quantité d’électricité pendant la durée indiquée. Travaillez en coulombs et en secondes.",
      [
        datum("Durée", minutes, "min"),
        variant === "coulombs-minutes"
          ? datum("Courant I", I, "A")
          : datum("Charge Q", c, "C"),
      ],
    );
    const t = p.add(
      "T",
      "Convertir les minutes en secondes",
      "T = durée × 60",
      minutes * 60,
      "s",
    );
    if (variant === "coulombs-minutes")
      p.add(
        "Q",
        "Calculer la quantité d’électricité",
        "Q = I × T",
        I * t,
        "C",
        [0],
      );
    else
      p.add(
        "I",
        "Calculer le courant nécessaire",
        "I = Q ÷ T",
        c / t,
        "A",
        [0],
      );
  } else if (variant === "daily-capacity") {
    const days = pick([3, 5, 7, 10]);
    p = schoolProblem(
      "charge",
      variant,
      "Une batterie alimente un appareil plusieurs heures par jour, sous un courant constant. Déterminez la charge fournie pendant toute la période.",
      [
        datum("Courant I", I, "A"),
        datum("Nombre de jours", days, "jours"),
        datum("Utilisation par jour", hours, "h/jour"),
      ],
    );
    const t = p.add(
      "T",
      "Calculer la durée cumulée",
      "T = jours × heures par jour",
      days * hours,
      "h",
    );
    p.add("Q", "Calculer la capacité utilisée", "Q = I × T", I * t, "Ah", [0]);
  } else if (variant === "daily-autonomy") {
    p = schoolProblem(
      "charge",
      variant,
      "Une batterie est supposée restituer sa capacité nominale à courant constant. Combien de jours dure-t-elle avec cette utilisation quotidienne ?",
      [
        datum("Capacité Q", Q, "Ah"),
        datum("Courant I", I, "A"),
        datum("Utilisation par jour", hours, "h/jour"),
      ],
    );
    const t = p.add(
      "T",
      "Calculer l’autonomie totale",
      "T = Q ÷ I",
      Q / I,
      "h",
    );
    p.add(
      "N",
      "Exprimer l’autonomie en jours d’utilisation",
      "N = T ÷ heures par jour",
      t / hours,
      "jours",
      [0],
    );
  } else if (variant === "current-ah") {
    p = schoolProblem(
      "charge",
      variant,
      "Un générateur doit fournir la quantité d’électricité indiquée à une installation pendant une durée donnée.",
      [datum("Charge Q", Q, "Ah"), datum("Durée T", hours, "h")],
    );
    p.add("I", "Calculer le courant constant", "I = Q ÷ T", Q / hours, "A");
  } else {
    p = schoolProblem(
      "charge",
      variant,
      "Une lampe reçoit un courant constant. Combien de temps faut-il pour consommer la charge indiquée ?",
      [datum("Charge Q", Q, "Ah"), datum("Courant I", I, "A")],
    );
    p.add("T", "Calculer le temps de fonctionnement", "T = Q ÷ I", Q / I, "h");
  }
  return p.finish();
}

function schoolPower(variant) {
  const U = pick([12, 24, 120, 230]),
    I = pick([0.5, 1, 2, 4]),
    P = U * I;
  const given =
    variant === "current"
      ? [datum("Puissance P", P, "W"), datum("Tension U", U, "V")]
      : variant === "voltage"
        ? [datum("Puissance P", P, "W"), datum("Courant I", I, "A")]
        : [datum("Tension U", U, "V"), datum("Courant I", I, "A")];
  const p = schoolProblem(
    "power",
    variant,
    "Un récepteur électrique fonctionne en courant continu avec les caractéristiques indiquées.",
    given,
  );
  if (variant === "current")
    p.add("I", "Retrouver le courant absorbé", "I = P ÷ U", P / U, "A");
  else if (variant === "voltage")
    p.add("U", "Retrouver la tension de service", "U = P ÷ I", P / I, "V");
  else {
    p.add("P", "Calculer la puissance absorbée", "P = U × I", P, "W");
    if (variant === "resistive")
      p.add(
        "R",
        "Retrouver la résistance du récepteur",
        "R = U² ÷ P",
        U ** 2 / P,
        "Ω",
        [0],
      );
  }
  return p.finish();
}

function schoolSection(variant) {
  const d = pick([0.8, 1.2, 1.5, 2, 3, 4]),
    r = d / 2;
  const p = schoolProblem(
    "section",
    variant,
    "Le conducteur est cylindrique et sa section est un disque. Utilisez π sur votre calculatrice.",
    variant === "radius"
      ? [datum("Rayon r", r, "mm")]
      : variant === "area"
        ? [datum("Section S", schoolNumber((Math.PI * d ** 2) / 4), "mm²")]
        : variant === "gauge"
          ? [datum("Diamètre en dixièmes de mm", d * 10, "/10 mm")]
          : [datum("Diamètre d", d, "mm")],
  );
  if (variant === "area")
    p.add(
      "d",
      "Retrouver le diamètre",
      "d = √(4 × S ÷ π)",
      Math.sqrt((4 * schoolNumber((Math.PI * d ** 2) / 4)) / Math.PI),
      "mm",
    );
  else {
    if (variant === "gauge")
      p.add(
        "d",
        "Convertir les dixièmes en millimètres",
        "d = diamètre en dixièmes ÷ 10",
        d,
        "mm",
      );
    p.add(
      "S",
      "Calculer la section ronde",
      variant === "radius" ? "S = π × r²" : "S = π × d² ÷ 4",
      (Math.PI * d ** 2) / 4,
      "mm²",
      variant === "gauge" ? [0] : [],
    );
  }
  return p.finish();
}

function schoolPouillet(variant) {
  const material = pick([
    ["cuivre", 0.0175],
    ["aluminium", 0.028],
    ["bronze", 0.067],
    ["nickel-chrome", 1.07],
  ]);
  const [name, rho] = material,
    L = pick([60, 100, 120, 240]),
    R = pick([0.8, 1.2, 5, 12]),
    d = pick([0.8, 1.2, 2, 3]);
  let p;
  if (variant === "bifilar") {
    const km = pick([0.5, 1, 2, 3]);
    p = schoolProblem(
      "pouillet",
      variant,
      `Une ligne bifilaire en ${name} relie deux points. La distance donnée est celle d’un seul trajet ; la résistance demandée comprend l’aller et le retour.`,
      [
        datum("Distance", km, "km"),
        datum("Diamètre d", d, "mm"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    const s = p.add(
      "S",
      "Calculer la section de chaque fil",
      "S = π × d² ÷ 4",
      (Math.PI * d ** 2) / 4,
      "mm²",
    );
    const length = p.add(
      "L",
      "Calculer la longueur totale aller et retour",
      "L = 2 × distance × 1000",
      2 * km * 1000,
      "m",
    );
    p.add(
      "R",
      "Calculer la résistance de la ligne complète",
      "R = ρ × L ÷ S",
      (rho * length) / s,
      "Ω",
      [0, 1],
    );
  } else if (variant === "coil-length") {
    p = schoolProblem(
      "pouillet",
      variant,
      `Une bobine en ${name} est enroulée avec un fil dont le diamètre est donné en dixièmes de millimètre. Retrouvez la longueur du fil.`,
      [
        datum("Diamètre", d * 10, "/10 mm"),
        datum("Résistance R", R, "Ω"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    const diameter = p.add(
      "d",
      "Convertir le diamètre en millimètres",
      "d = diamètre en dixièmes ÷ 10",
      d,
      "mm",
    );
    const s = p.add(
      "S",
      "Calculer la section",
      "S = π × d² ÷ 4",
      (Math.PI * diameter ** 2) / 4,
      "mm²",
      [0],
    );
    p.add(
      "L",
      "Retrouver la longueur de fil enroulé",
      "L = R × S ÷ ρ",
      (R * s) / rho,
      "m",
      [1],
    );
  } else if (variant === "strip") {
    const width = pick([2, 4, 5]),
      thickness = pick([0.1, 0.5, 1]),
      cm = pick([5, 10, 15]);
    p = schoolProblem(
      "pouillet",
      variant,
      "Un shunt en manganine est constitué d’une bande rectangulaire. Sa longueur est donnée en centimètres et ses dimensions de section en millimètres.",
      [
        datum("Longueur", cm, "cm"),
        datum("Largeur", width, "mm"),
        datum("Épaisseur", thickness, "mm"),
        datum("Résistivité ρ", 0.42, "Ω·mm²/m"),
      ],
      6,
    );
    const s = p.add(
      "S",
      "Calculer la section rectangulaire",
      "S = largeur × épaisseur",
      width * thickness,
      "mm²",
    );
    const length = p.add(
      "L",
      "Convertir la longueur en mètres",
      "L = longueur en cm ÷ 100",
      cm / 100,
      "m",
    );
    p.add(
      "R",
      "Calculer la résistance du shunt",
      "R = ρ × L ÷ S",
      (0.42 * length) / s,
      "Ω",
      [0, 1],
    );
  } else if (variant === "diameter") {
    p = schoolProblem(
      "pouillet",
      variant,
      `Retrouvez le diamètre d’un conducteur en ${name} à partir de sa longueur et de sa résistance.`,
      [
        datum("Longueur L", L, "m"),
        datum("Résistance R", R, "Ω"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    const s = p.add(
      "S",
      "Retrouver la section",
      "S = ρ × L ÷ R",
      (rho * L) / R,
      "mm²",
    );
    p.add(
      "d",
      "Déduire le diamètre du fil",
      "d = √(4 × S ÷ π)",
      Math.sqrt((4 * s) / Math.PI),
      "mm",
      [0],
    );
  } else if (variant === "cut-wire") {
    p = schoolProblem(
      "pouillet",
      variant,
      "Un fil homogène est coupé en deux longueurs égales. Les deux morceaux sont ensuite reliés en parallèle entre les mêmes bornes.",
      [datum("Résistance initiale R", R, "Ω")],
      6,
    );
    const half = p.add(
      "R₁",
      "Trouver la résistance d’un demi-fil",
      "R₁ = R ÷ 2",
      R / 2,
      "Ω",
    );
    p.add(
      "Req",
      "Associer les deux morceaux identiques en parallèle",
      "Req = R₁ ÷ 2",
      half / 2,
      "Ω",
      [0],
    );
  } else if (variant === "replace-material") {
    p = schoolProblem(
      "pouillet",
      variant,
      "On remplace un fil de cuivre par un fil d’aluminium de même longueur et de même résistance. Retrouvez le diamètre du nouveau fil.",
      [
        datum("Diamètre cuivre d", d, "mm"),
        datum("ρ cuivre", 0.0175, "Ω·mm²/m"),
        datum("ρ aluminium", 0.028, "Ω·mm²/m"),
      ],
      6,
    );
    const s = p.add(
      "S cuivre",
      "Calculer la section du fil initial",
      "S cuivre = π × d² ÷ 4",
      (Math.PI * d ** 2) / 4,
      "mm²",
    );
    const sa = p.add(
      "S aluminium",
      "Garder la même résistance et la même longueur",
      "S aluminium = S cuivre × ρ aluminium ÷ ρ cuivre",
      (s * 0.028) / 0.0175,
      "mm²",
      [0],
    );
    p.add(
      "d aluminium",
      "Déduire le diamètre du nouveau fil",
      "d aluminium = √(4 × S aluminium ÷ π)",
      Math.sqrt((4 * sa) / Math.PI),
      "mm",
      [1],
    );
  } else if (variant === "resistivity") {
    const S = pick([1.5, 2.5, 4]);
    p = schoolProblem(
      "pouillet",
      variant,
      "Un fil de matériau inconnu a été mesuré. Déterminez sa résistivité avec les unités indiquées.",
      [
        datum("Longueur L", L, "m"),
        datum("Section S", S, "mm²"),
        datum("Résistance R", R, "Ω"),
      ],
      6,
    );
    p.add(
      "ρ",
      "Retrouver la résistivité",
      "ρ = R × S ÷ L",
      (R * S) / L,
      "Ω·mm²/m",
    );
  } else {
    p = schoolProblem(
      "pouillet",
      variant,
      `Un fil en ${name} présente la longueur et la résistance indiquées.`,
      [
        datum("Longueur L", L, "m"),
        datum("Résistance R", R, "Ω"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    p.add(
      "S",
      "Calculer la section nécessaire",
      "S = ρ × L ÷ R",
      (rho * L) / R,
      "mm²",
    );
  }
  return p.finish();
}

function schoolSeries(variant) {
  const values = [
      pick([3, 6, 10]),
      pick([5, 12, 20]),
      pick([4, 8, 15]),
      pick([2, 6, 10]),
    ],
    U = pick([24, 60, 120, 220]);
  const tree = connection(
    "series",
    ...values.map((value, i) => resistor("R" + subscript(i + 1), value)),
  );
  let p, diagram;
  if (variant === "equivalent" || variant === "current-voltage") {
    p = schoolProblem(
      "series",
      variant,
      "Quatre résistances sont raccordées en série entre A et B.",
      [
        ...values.map((r, i) => datum("R" + subscript(i + 1), r, "Ω")),
        ...(variant === "current-voltage" ? [datum("Tension U", U, "V")] : []),
      ],
    );
    const req = p.add(
      "Req",
      "Additionner les résistances",
      "Req = R₁ + R₂ + R₃ + R₄",
      values.reduce((a, b) => a + b),
      "Ω",
    );
    if (variant === "current-voltage") {
      const i = p.add(
        "I",
        "Calculer le courant commun",
        "I = U ÷ Req",
        U / req,
        "A",
        [0],
      );
      p.add(
        "U₁",
        "Calculer la tension aux bornes de R₁",
        "U₁ = R₁ × I",
        values[0] * i,
        "V",
        [1],
      );
    }
    diagram = tree;
  } else if (variant === "lamp-resistor") {
    const ul = pick([12, 24, 110, 127]),
      us = ul + pick([24, 60, 93]),
      rl = pick([60, 120, 180]);
    p = schoolProblem(
      "series",
      variant,
      "Une lampe doit fonctionner à sa tension nominale sur une source de tension plus élevée. On ajoute une résistance en série pour conserver son courant nominal.",
      [
        datum("Tension source U", us, "V"),
        datum("Tension lampe U₁", ul, "V"),
        datum("Résistance lampe R₁", rl, "Ω"),
      ],
    );
    const i = p.add(
      "I",
      "Calculer le courant nominal de la lampe",
      "I = U₁ ÷ R₁",
      ul / rl,
      "A",
    );
    const ur = p.add(
      "U₂",
      "Calculer la tension à absorber",
      "U₂ = U − U₁",
      us - ul,
      "V",
    );
    p.add(
      "R₂",
      "Dimensionner la résistance additionnelle",
      "R₂ = U₂ ÷ I",
      ur / i,
      "Ω",
      [0, 1],
    );
    diagram = connection("series", resistor("R₁", rl), resistor("R₂", null));
  } else if (variant === "voltmeter") {
    const rm = pick([60, 100, 120]),
      ma = pick([1, 2, 2.5]),
      range = pick([15, 100, 120]);
    p = schoolProblem(
      "series",
      variant,
      "Un appareil de mesure est modélisé par sa résistance interne. Pour en faire un voltmètre de calibre plus élevé, on lui ajoute une résistance en série.",
      [
        datum("Résistance interne R₁", rm, "Ω"),
        datum("Courant pleine échelle", ma, "mA"),
        datum("Calibre U", range, "V"),
      ],
      6,
    );
    const i = p.add(
      "I",
      "Convertir le courant de pleine échelle",
      "I = courant en mA ÷ 1000",
      ma / 1000,
      "A",
    );
    const um = p.add(
      "U₁",
      "Calculer la tension propre de l’appareil",
      "U₁ = R₁ × I",
      rm * i,
      "V",
      [0],
    );
    p.add(
      "R₂",
      "Calculer la résistance à ajouter en série",
      "R₂ = (U − U₁) ÷ I",
      (range - um) / i,
      "Ω",
      [0, 1],
    );
    diagram = connection("series", resistor("R₁", rm), resistor("R₂", null));
  } else if (variant === "lamps") {
    const n = pick([6, 8, 9, 10]),
      i = pick([0.1, 0.2, 0.5]);
    p = schoolProblem(
      "series",
      variant,
      "Une guirlande est constituée de lampes identiques raccordées en série. Le courant est identique dans toutes les lampes.",
      [
        datum("Nombre de lampes", n, "lampes"),
        datum("Tension totale U", U, "V"),
        datum("Courant I", i, "A"),
      ],
    );
    const ul = p.add(
      "U₁",
      "Répartir la tension entre les lampes",
      "U₁ = U ÷ nombre de lampes",
      U / n,
      "V",
    );
    const rl = p.add(
      "R₁",
      "Calculer la résistance d’une lampe",
      "R₁ = U₁ ÷ I",
      ul / i,
      "Ω",
      [0],
    );
    p.add(
      "Req",
      "Calculer la résistance de la guirlande",
      "Req = nombre de lampes × R₁",
      n * rl,
      "Ω",
      [1],
    );
  } else {
    const measured = pick([6, 10, 12]);
    p = schoolProblem(
      "series",
      variant,
      "Trois résistances sont en série. Un voltmètre idéal mesure uniquement la tension aux bornes de R₂. Retrouvez la tension d’alimentation.",
      [
        ...values
          .slice(0, 3)
          .map((r, i) => datum("R" + subscript(i + 1), r, "Ω")),
        datum("Tension mesurée U₂", measured, "V"),
      ],
    );
    const i = p.add(
      "I",
      "Retrouver le courant commun grâce au voltmètre",
      "I = U₂ ÷ R₂",
      measured / values[1],
      "A",
    );
    const req = p.add(
      "Req",
      "Calculer la résistance totale",
      "Req = R₁ + R₂ + R₃",
      values.slice(0, 3).reduce((a, b) => a + b),
      "Ω",
    );
    p.add(
      "U",
      "Retrouver la tension du générateur",
      "U = Req × I",
      req * i,
      "V",
      [0, 1],
    );
    diagram = connection("series", ...tree.children.slice(0, 3));
  }
  return p.finish(diagram);
}

function schoolParallel(variant) {
  const values = [
      pick([4, 8, 12]),
      pick([6, 12, 24]),
      pick([8, 16, 32]),
      pick([12, 24, 48]),
    ],
    U = pick([12, 24, 60]);
  let p, diagram;
  if (
    variant === "four" ||
    variant === "currents" ||
    variant === "known-current"
  ) {
    const n = variant === "four" ? 4 : 3,
      rs = values.slice(0, n),
      i1 = pick([1, 2, 3]);
    p = schoolProblem(
      "parallel",
      variant,
      "Des résistances sont raccordées en dérivation entre A et B. La tension est commune à toutes les branches.",
      [
        ...rs.map((r, i) => datum("R" + subscript(i + 1), r, "Ω")),
        ...(variant === "currents"
          ? [datum("Tension U", U, "V")]
          : variant === "known-current"
            ? [datum("Courant I₁", i1, "A")]
            : []),
      ],
    );
    const voltage =
      variant === "known-current"
        ? p.add(
            "U",
            "Déduire la tension commune à partir de R₁",
            "U = R₁ × I₁",
            rs[0] * i1,
            "V",
          )
        : U;
    const currents = [];
    if (variant !== "four") {
      for (let k = 0; k < n; k++) {
        if (variant === "known-current" && k === 0) {
          currents.push(i1);
          continue;
        }
        currents.push(
          p.add(
            "I" + subscript(k + 1),
            "Calculer le courant de la branche " + (k + 1),
            `I${subscript(k + 1)} = U ÷ R${subscript(k + 1)}`,
            voltage / rs[k],
            "A",
            variant === "known-current" ? [0] : [],
          ),
        );
      }
      p.add(
        "I",
        "Additionner les courants de branche",
        "I = I₁ + I₂ + I₃",
        currents.reduce((a, b) => a + b),
        "A",
        variant === "known-current" ? [1, 2] : [0, 1, 2],
      );
    }
    p.add(
      "Req",
      "Réduire l’association en parallèle",
      `Req = 1 ÷ (${rs.map((_, i) => "1/R" + subscript(i + 1)).join(" + ")})`,
      parallelResistance(...rs),
      "Ω",
    );
    diagram = connection(
      "parallel",
      ...rs.map((r, i) => resistor("R" + subscript(i + 1), r)),
    );
  } else if (variant === "identical") {
    const n = pick([4, 6, 8, 10]),
      r = pick([0.24, 8, 12, 100, 450]);
    p = schoolProblem(
      "parallel",
      variant,
      "Des éléments identiques sont tous raccordés en parallèle.",
      [
        datum("Nombre d’éléments", n, "éléments"),
        datum("Résistance d’un élément", r, "Ω"),
      ],
    );
    p.add(
      "Req",
      "Réduire des résistances identiques",
      "Req = résistance d’un élément ÷ nombre d’éléments",
      r / n,
      "Ω",
    );
  } else if (variant === "added-branch") {
    const before = pick([2, 3, 4]),
      extra = pick([0.5, 1, 2]),
      r1 = 8,
      r2 = 12;
    p = schoolProblem(
      "parallel",
      variant,
      "Deux résistances en parallèle absorbent un courant connu. On ajoute une troisième branche sans modifier la tension de la source ; le courant total augmente.",
      [
        datum("R₁", r1, "Ω"),
        datum("R₂", r2, "Ω"),
        datum("Courant avant", before, "A"),
        datum("Courant après", before + extra, "A"),
      ],
    );
    const req = p.add(
      "R₁₂",
      "Réduire les deux branches initiales",
      "R₁₂ = R₁ × R₂ ÷ (R₁ + R₂)",
      parallelResistance(r1, r2),
      "Ω",
    );
    const u = p.add(
      "U",
      "Retrouver la tension inchangée",
      "U = R₁₂ × courant avant",
      req * before,
      "V",
      [0],
    );
    const i = p.add(
      "I₃",
      "Retrouver le courant de la branche ajoutée",
      "I₃ = courant après − courant avant",
      extra,
      "A",
    );
    p.add(
      "R₃",
      "Retrouver la résistance ajoutée",
      "R₃ = U ÷ I₃",
      u / i,
      "Ω",
      [1, 2],
    );
    diagram = connection(
      "parallel",
      resistor("R₁", r1),
      resistor("R₂", r2),
      resistor("R₃", null),
    );
  } else if (variant === "shunt") {
    const rm = pick([60, 100, 120]),
      ma = pick([1, 2, 2.5]),
      range = pick([5, 10, 20]);
    p = schoolProblem(
      "parallel",
      variant,
      "Pour transformer un appareil de mesure en ampèremètre de plus grand calibre, on place un shunt en parallèle. L’appareil garde son courant de pleine échelle ; le reste traverse le shunt.",
      [
        datum("Résistance appareil R₁", rm, "Ω"),
        datum("Pleine échelle", ma, "mA"),
        datum("Calibre total I", range, "A"),
      ],
      6,
    );
    const im = p.add(
      "I₁",
      "Convertir le courant de l’appareil",
      "I₁ = pleine échelle en mA ÷ 1000",
      ma / 1000,
      "A",
    );
    const u = p.add(
      "U",
      "Calculer la tension commune",
      "U = R₁ × I₁",
      rm * im,
      "V",
      [0],
    );
    const ish = p.add(
      "I₂",
      "Déterminer le courant dans le shunt",
      "I₂ = I − I₁",
      range - im,
      "A",
      [0],
    );
    p.add("R₂", "Dimensionner le shunt", "R₂ = U ÷ I₂", u / ish, "Ω", [1, 2]);
    diagram = connection("parallel", resistor("R₁", rm), resistor("R₂", null));
  } else {
    return {
      ...parallelQuestion(pick(["missing-two", "missing-three"])),
      theme: "parallel",
      precision: 4,
    };
  }
  return p.finish(diagram);
}

function schoolMixed(variant) {
  const rs = Array.from({ length: 7 }, () => pick([4, 6, 8, 10, 12, 20, 30]));
  const U = pick([24, 60, 90, 120]);
  const r = (i) => resistor("R" + subscript(i + 1), rs[i]);
  const P = (...children) => connection("parallel", ...children),
    S = (...children) => connection("series", ...children);
  if (variant === "branch-measurements") {
    const i2 = pick([0.5, 1, 2]),
      i3 = pick([1, 2, 3]),
      r1 = pick([2, 4, 6]),
      r2 = pick([4, 8, 12]);
    const p = schoolProblem(
      "mixed",
      variant,
      "Entre A et B, R₁ est en série avec (R₂ ∥ R₃). Le courant total I et le courant de R₂ sont mesurés. Retrouvez R₃, puis réduisez le circuit jusqu’à Req.",
      [
        datum("R₁", r1, "Ω"),
        datum("R₂", r2, "Ω"),
        ["R₃", "à déterminer"],
        datum("Courant total I", i2 + i3, "A"),
        datum("Courant I₂", i2, "A"),
      ],
    );
    const third = p.add(
      "I₃",
      "Utiliser la loi des nœuds",
      "I₃ = I − I₂",
      i3,
      "A",
    );
    const voltage = p.add(
      "U₂₃",
      "Retrouver la tension commune des branches",
      "U₂₃ = R₂ × I₂",
      r2 * i2,
      "V",
    );
    const missing = p.add(
      "R₃",
      "Retrouver la résistance inconnue",
      "R₃ = U₂₃ ÷ I₃",
      voltage / third,
      "Ω",
      [0, 1],
    );
    const group = p.add(
      "R₂₃",
      "Réduire les deux branches en parallèle",
      "R₂₃ = R₂ × R₃ ÷ (R₂ + R₃)",
      parallelResistance(r2, missing),
      "Ω",
      [2],
    );
    const req = p.add(
      "Req",
      "Ajouter R₁ en série",
      "Req = R₁ + R₂₃",
      r1 + group,
      "Ω",
      [3],
    );
    p.add(
      "U",
      "Retrouver la tension d’alimentation",
      "U = Req × I",
      req * (i2 + i3),
      "V",
      [4],
    );
    return p.finish(
      S(resistor("R₁", r1), P(resistor("R₂", r2), resistor("R₃", null))),
    );
  }
  if (variant === "bridge") {
    const p = schoolProblem(
      "mixed",
      variant,
      "Entre A et B, deux branches en parallèle contiennent chacune deux résistances en série : R₁ puis R₂ dans la branche supérieure, R₃ puis R₄ dans l’autre. C et D désignent leurs points milieux respectifs. Un voltmètre idéal mesure UCD = VC − VD sans prélever de courant.",
      [
        ...rs.slice(0, 4).map((v, i) => datum("R" + subscript(i + 1), v, "Ω")),
        datum("Tension UAB", U, "V"),
      ],
    );
    const a = p.add(
      "R₁₂",
      "Réduire la branche supérieure",
      "R₁₂ = R₁ + R₂",
      rs[0] + rs[1],
      "Ω",
    );
    const b = p.add(
      "R₃₄",
      "Réduire la branche inférieure",
      "R₃₄ = R₃ + R₄",
      rs[2] + rs[3],
      "Ω",
    );
    p.add(
      "Req",
      "Mettre les deux branches en parallèle",
      "Req = R₁₂ × R₃₄ ÷ (R₁₂ + R₃₄)",
      parallelResistance(a, b),
      "Ω",
      [0, 1],
    );
    const ia = p.add(
      "I₁₂",
      "Calculer le courant de la branche supérieure",
      "I₁₂ = UAB ÷ R₁₂",
      U / a,
      "A",
      [0],
    );
    const ib = p.add(
      "I₃₄",
      "Calculer le courant de la branche inférieure",
      "I₃₄ = UAB ÷ R₃₄",
      U / b,
      "A",
      [1],
    );
    const vc = p.add(
      "VC",
      "Potentiel de C par rapport à B",
      "VC = R₂ × I₁₂",
      rs[1] * ia,
      "V",
      [3],
    );
    const vd = p.add(
      "VD",
      "Potentiel de D par rapport à B",
      "VD = R₄ × I₃₄",
      rs[3] * ib,
      "V",
      [4],
    );
    p.add(
      "UCD",
      "Calculer la tension signée entre les points milieux",
      "UCD = VC − VD",
      vc - vd,
      "V",
      [5, 6],
    );
    const bridge = P(S(r(0), r(1)), S(r(2), r(3)));
    bridge.children[0].junctionLabels = ["C"];
    bridge.children[1].junctionLabels = ["D"];
    return p.finish(bridge);
  }
  // Ratios make each inner parallel group exact. Measurements on R1 and on
  // the source therefore describe the same physical circuit, before rounding.
  const scale = pick([1, 2, 3, 5]);
  if (variant === "six-resistors")
    rs.splice(1, 5, 3 * scale, 6 * scale, 2 * scale, 4 * scale, 4 * scale);
  else
    rs.splice(
      1,
      6,
      2 * scale,
      2 * scale,
      3 * scale,
      6 * scale,
      scale,
      2 * scale,
    );
  const tree =
    variant === "six-resistors"
      ? S(r(0), P(r(1), r(2), r(3)), P(r(4), r(5)))
      : P(S(r(0), P(r(1), r(2))), S(P(r(3), r(4)), r(5)), r(6));
  // The missing resistor is found first, then every group is reduced from inside out.
  const i1 = pick([0.2, 0.5, 1, 2]),
    u1 = rs[0] * i1;
  const totalVoltage =
    (rs[0] + (variant === "six-resistors" ? 3 * scale : scale)) * i1;
  const given = rs
    .slice(0, variant === "six-resistors" ? 6 : 7)
    .map((v, i) =>
      i === 0 ? ["R₁", "à déterminer"] : datum("R" + subscript(i + 1), v, "Ω"),
    );
  given.push(
    datum("Tension U₁", u1, "V"),
    datum("Courant I₁", i1, "A"),
    datum("Tension totale U", totalVoltage, "V"),
  );
  const p = schoolProblem(
    "mixed",
    variant,
    variant === "six-resistors"
      ? "Entre A et B, R₁ est en série avec deux groupes successifs : (R₂ ∥ R₃ ∥ R₄), puis (R₅ ∥ R₆). Retrouvez R₁, puis Req, le courant total et la tension du premier groupe parallèle."
      : "Entre A et B, trois branches sont en parallèle : [R₁ + (R₂ ∥ R₃)], [(R₄ ∥ R₅) + R₆] et R₇. Retrouvez R₁, réduisez chaque branche, puis déterminez Req et les courants.",
    given,
  );
  const recovered = p.add(
    "R₁",
    "Retrouver la résistance manquante",
    "R₁ = U₁ ÷ I₁",
    u1 / i1,
    "Ω",
  );
  let groupNumber = 0;
  function reduce(node, root = false) {
    if (node.kind === "resistor")
      return {
        value: node.id === "R₁" ? recovered : node.value,
        name: node.id,
        index: node.id === "R₁" ? 0 : null,
      };
    const children = node.children.map((child) => reduce(child));
    const name = root ? "Req" : "Rg" + ++groupNumber;
    const formula =
      name +
      " = " +
      (node.kind === "series"
        ? children.map((c) => c.name).join(" + ")
        : "1 ÷ (" + children.map((c) => "1/" + c.name).join(" + ") + ")");
    const value = p.add(
      name,
      (node.kind === "series"
        ? "Additionner en série : "
        : "Réduire en parallèle : ") + children.map((c) => c.name).join(", "),
      formula,
      node.kind === "series"
        ? children.reduce((sum, c) => sum + c.value, 0)
        : parallelResistance(...children.map((c) => c.value)),
      "Ω",
      children.filter((c) => c.index !== null).map((c) => c.index),
    );
    node.reduction = { value, name, index: p.steps.length - 1 };
    return node.reduction;
  }
  const total = reduce(tree, true);
  const totalI = p.add(
    "I",
    "Calculer le courant fourni par la source",
    "I = U ÷ Req",
    totalVoltage / total.value,
    "A",
    [total.index],
  );
  if (variant === "six-resistors") {
    const group = tree.children[1].reduction;
    const voltage = p.add(
      "U₂₃₄",
      "Calculer la tension du premier groupe parallèle",
      `U₂₃₄ = I × ${group.name}`,
      totalI * group.value,
      "V",
      [p.steps.length - 1, group.index],
    );
    p.add(
      "I₂",
      "Calculer le courant dans R₂",
      "I₂ = U₂₃₄ ÷ R₂",
      voltage / rs[1],
      "A",
      [p.steps.length - 1],
    );
  } else {
    const branch = tree.children[0].reduction;
    p.add(
      "I branche 1",
      "Calculer le courant de la branche supérieure",
      `I branche 1 = U ÷ ${branch.name}`,
      totalVoltage / branch.value,
      "A",
      [branch.index],
    );
  }
  // Keep R1 hidden in the displayed diagram; the calculation graph retains its value.
  function hide(node) {
    if (node.kind === "resistor" && node.id === "R₁") node.value = null;
    else node.children?.forEach(hide);
  }
  hide(tree);
  return p.finish(tree);
}

function schoolVoltageDrop(variant) {
  const U = pick([120, 220, 230]),
    I = pick([4, 8, 12, 16]),
    distance = pick([40, 80, 150, 250]),
    rho = pick([0.0175, 0.028]);
  let p;
  if (variant === "line-resistance") {
    const one = pick([0.05, 0.1, 0.25, 0.5]);
    p = schoolProblem(
      "voltageDrop",
      variant,
      "Une ligne bifilaire alimente un récepteur. La résistance fournie est celle d’un seul fil : il faut tenir compte de l’aller et du retour.",
      [
        datum("Résistance d’un fil", one, "Ω"),
        datum("Tension générateur Ug", U, "V"),
        datum("Courant I", I, "A"),
      ],
    );
    const rl = p.add(
      "Rligne",
      "Calculer la résistance aller et retour",
      "Rligne = 2 × résistance d’un fil",
      2 * one,
      "Ω",
    );
    const drop = p.add(
      "ΔU",
      "Calculer la chute de tension",
      "ΔU = Rligne × I",
      rl * I,
      "V",
      [0],
    );
    p.add(
      "Ur",
      "Calculer la tension du récepteur",
      "Ur = Ug − ΔU",
      U - drop,
      "V",
      [1],
    );
    p.add(
      "Chute relative",
      "Exprimer la chute en pourcentage de Ug",
      "Chute relative = 100 × ΔU ÷ Ug",
      (100 * drop) / U,
      "%",
      [1],
    );
  } else if (variant === "size-section") {
    const percent = pick([3, 5, 10]);
    p = schoolProblem(
      "voltageDrop",
      variant,
      "Une ligne bifilaire relie une source à un récepteur. La distance est celle d’un seul trajet. Dimensionnez chaque fil pour la chute admise ; on demande la section théorique, sans arrondi à une section commerciale.",
      [
        datum("Tension générateur Ug", U, "V"),
        datum("Distance", distance, "m"),
        datum("Courant I", I, "A"),
        datum("Chute admise", percent, "% de Ug"),
        datum("Résistivité ρ", rho, "Ω·mm²/m"),
      ],
      6,
    );
    const drop = p.add(
      "ΔU",
      "Calculer la chute de tension admise",
      "ΔU = Ug × pourcentage ÷ 100",
      (U * percent) / 100,
      "V",
    );
    p.add(
      "Ur",
      "Calculer la tension au récepteur",
      "Ur = Ug − ΔU",
      U - drop,
      "V",
      [0],
    );
    const s = p.add(
      "S",
      "Dimensionner la section de chaque conducteur",
      "S = ρ × 2 × distance × I ÷ ΔU",
      (rho * 2 * distance * I) / drop,
      "mm²",
      [0],
    );
    p.add(
      "d",
      "Retrouver le diamètre théorique",
      "d = √(4 × S ÷ π)",
      Math.sqrt((4 * s) / Math.PI),
      "mm",
      [2],
    );
  } else {
    const d = pick([2, 3, 4]),
      load = pick([10, 20, 30]);
    const given = [
      datum(
        variant === "diameter-line"
          ? "Tension souhaitée Ur"
          : "Tension générateur Ug",
        U,
        "V",
      ),
      datum("Distance (un trajet)", distance, "m"),
      datum("Diamètre d", d, "mm"),
      datum("Résistivité ρ", rho, "Ω·mm²/m"),
    ];
    given.push(
      variant === "load-charge"
        ? datum("Résistance récepteur R", load, "Ω")
        : datum("Courant I", I, "A"),
    );
    if (variant === "load-charge") given.push(datum("Durée", 75, "min"));
    p = schoolProblem(
      "voltageDrop",
      variant,
      variant === "diameter-line"
        ? "Un récepteur doit recevoir la tension indiquée malgré la résistance de la ligne bifilaire. Calculez la tension nécessaire au générateur et la densité de courant."
        : "Un récepteur est alimenté par une ligne bifilaire. Les deux fils ont le même diamètre. La longueur électrique totale vaut deux fois la distance donnée.",
      given,
      6,
    );
    const s = p.add(
      "S",
      "Calculer la section d’un fil",
      "S = π × d² ÷ 4",
      (Math.PI * d ** 2) / 4,
      "mm²",
    );
    const rl = p.add(
      "Rligne",
      "Calculer la résistance de l’aller et du retour",
      "Rligne = ρ × 2 × distance ÷ S",
      (rho * 2 * distance) / s,
      "Ω",
      [0],
    );
    const i =
      variant === "load-charge"
        ? p.add(
            "I",
            "Tenir compte du récepteur et de la ligne en série",
            "I = Ug ÷ (R + Rligne)",
            U / (load + rl),
            "A",
            [1],
          )
        : I;
    const drop = p.add(
      "ΔU",
      "Calculer la chute en ligne",
      "ΔU = Rligne × I",
      rl * i,
      "V",
      variant === "load-charge" ? [1, 2] : [1],
    );
    p.add(
      variant === "diameter-line" ? "Ug" : "Ur",
      "Calculer la tension à l’autre extrémité",
      variant === "diameter-line" ? "Ug = Ur + ΔU" : "Ur = Ug − ΔU",
      variant === "diameter-line" ? U + drop : U - drop,
      "V",
      [p.steps.length - 1],
    );
    if (variant === "diameter-line")
      p.add(
        "J",
        "Calculer la densité du courant",
        "J = I ÷ S",
        i / s,
        "A/mm²",
        [0],
      );
    if (variant === "load-charge")
      p.add(
        "Q",
        "Calculer la charge transportée en 75 minutes",
        "Q = I × (75 ÷ 60)",
        (i * 75) / 60,
        "Ah",
        [2],
      );
  }
  return p.finish();
}

const schoolGenerators = {
  ohm: schoolOhm,
  charge: schoolCharge,
  power: schoolPower,
  section: schoolSection,
  pouillet: schoolPouillet,
  series: schoolSeries,
  parallel: schoolParallel,
  mixed: schoolMixed,
  voltageDrop: schoolVoltageDrop,
};
