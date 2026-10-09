/* Independent checks from the quantities displayed in every exercise template. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
let seed = 431;
const sandbox = vm.createContext({ console });
sandbox.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
vm.runInContext(
  `
  Math.random = random;
  const app = {exerciseDecks: {}};
  const familyNames = {ohm:"Loi d’Ohm",charge:"Charge électrique",power:"Puissance",pouillet:"Loi de Pouillet",section:"Section ronde",series:"Résistances en série",parallel:"Résistances en parallèle",mixed:"Circuits mixtes",voltageDrop:"Chute de tension"};
  const pick = a => a[Math.floor(Math.random()*a.length)];
  const shuffle = a => [...a];
  const fmt = n => Number(n.toFixed(4)).toLocaleString('fr-BE',{maximumFractionDigits:4});
`,
  sandbox,
);
for (const file of ["circuits.js", "school-exercises.js"])
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    sandbox,
  );
const variants = JSON.parse(
  vm.runInContext("JSON.stringify(schoolVariants)", sandbox),
);

function oracle(q, theme, variant) {
  const precision = q.precision,
    rounded = (n) => Number(n.toFixed(precision));
  const given = Object.fromEntries(q.given);
  const g = (label) => {
    assert.ok(Object.hasOwn(given, label), `Missing ${label}`);
    const match = given[label].match(/^[\d,.\s]+/);
    assert.ok(match, `Not numerical: ${label}`);
    return Number(match[0].replace(/\s/g, "").replace(",", "."));
  };
  const expected = [];
  const add = (value, unit) => {
    const n = rounded(value);
    expected.push([n, unit]);
    return n;
  };
  const par = (values) => 1 / values.reduce((sum, value) => sum + 1 / value, 0);
  const resistors = () =>
    q.given
      .filter(([label]) => /^R[₁₂₃₄₅₆₇]$/.test(label))
      .map(([label]) => g(label));
  if (theme === "ohm") {
    if (variant === "lamp") add(g("Tension U") / g("Résistance R"), "A");
    if (variant === "heater") add(g("Tension U") / g("Courant I"), "Ω");
    if (variant === "generator") add(g("Résistance R") * g("Courant I"), "V");
    if (variant === "milliamps") {
      const i = add(g("Courant") / 1000, "A");
      add(g("Tension U") / i, "Ω");
    }
    if (variant === "kilohms") {
      const r = add(g("Résistance") * 1000, "Ω");
      add(g("Tension U") / r, "A");
    }
    if (variant === "table") {
      add(g("A · U") / g("A · I"), "Ω");
      add(g("B · R") * g("B · I"), "V");
      add(g("C · U") / g("C · R"), "A");
    }
    if (variant === "charge-resistance") {
      const t = add(g("Durée") / 60, "h"),
        i = add(g("Charge Q") / t, "A");
      add(g("Tension U") / i, "Ω");
    }
    if (variant === "coil-diameter") {
      const r = add(g("Tension U") / g("Courant I"), "Ω"),
        s = add((g("Résistivité ρ") * g("Longueur du fil L")) / r, "mm²");
      add(Math.sqrt((4 * s) / Math.PI), "mm");
    }
  }
  if (theme === "charge") {
    if (variant === "coulombs-minutes") {
      const t = add(g("Durée") * 60, "s");
      add(g("Courant I") * t, "C");
    }
    if (variant === "current-coulombs") {
      const t = add(g("Durée") * 60, "s");
      add(g("Charge Q") / t, "A");
    }
    if (variant === "current-ah") add(g("Charge Q") / g("Durée T"), "A");
    if (variant === "duration-ah") add(g("Charge Q") / g("Courant I"), "h");
    if (variant === "daily-capacity") {
      const t = add(g("Nombre de jours") * g("Utilisation par jour"), "h");
      add(g("Courant I") * t, "Ah");
    }
    if (variant === "daily-autonomy") {
      const t = add(g("Capacité Q") / g("Courant I"), "h");
      add(t / g("Utilisation par jour"), "jours");
    }
  }
  if (theme === "power") {
    if (variant === "current") add(g("Puissance P") / g("Tension U"), "A");
    else if (variant === "voltage") add(g("Puissance P") / g("Courant I"), "V");
    else {
      const p = add(g("Tension U") * g("Courant I"), "W");
      if (variant === "resistive") add(g("Tension U") ** 2 / p, "Ω");
    }
  }
  if (theme === "section") {
    if (variant === "area") add(2 * Math.sqrt(g("Section S") / Math.PI), "mm");
    else if (variant === "radius") add(Math.PI * g("Rayon r") ** 2, "mm²");
    else {
      const d =
        variant === "gauge"
          ? add(g("Diamètre en dixièmes de mm") / 10, "mm")
          : g("Diamètre d");
      add((Math.PI * d ** 2) / 4, "mm²");
    }
  }
  if (theme === "pouillet") {
    if (variant === "section")
      add((g("Résistivité ρ") * g("Longueur L")) / g("Résistance R"), "mm²");
    if (variant === "resistivity")
      add((g("Résistance R") * g("Section S")) / g("Longueur L"), "Ω·mm²/m");
    if (variant === "bifilar") {
      const s = add((Math.PI * g("Diamètre d") ** 2) / 4, "mm²"),
        l = add(g("Distance") * 2000, "m");
      add((g("Résistivité ρ") * l) / s, "Ω");
    }
    if (variant === "coil-length") {
      const d = add(g("Diamètre") / 10, "mm"),
        s = add((Math.PI * d ** 2) / 4, "mm²");
      add((g("Résistance R") * s) / g("Résistivité ρ"), "m");
    }
    if (variant === "strip") {
      const s = add(g("Largeur") * g("Épaisseur"), "mm²"),
        l = add(g("Longueur") / 100, "m");
      add((g("Résistivité ρ") * l) / s, "Ω");
    }
    if (variant === "diameter") {
      const s = add(
        (g("Résistivité ρ") * g("Longueur L")) / g("Résistance R"),
        "mm²",
      );
      add(2 * Math.sqrt(s / Math.PI), "mm");
    }
    if (variant === "cut-wire") {
      const half = add(g("Résistance initiale R") / 2, "Ω");
      add(half / 2, "Ω");
    }
    if (variant === "replace-material") {
      const s = add((Math.PI * g("Diamètre cuivre d") ** 2) / 4, "mm²"),
        sa = add((s * g("ρ aluminium")) / g("ρ cuivre"), "mm²");
      add(2 * Math.sqrt(sa / Math.PI), "mm");
    }
  }
  if (theme === "series") {
    if (variant === "equivalent" || variant === "current-voltage") {
      const req = add(
        resistors().reduce((a, b) => a + b),
        "Ω",
      );
      if (variant === "current-voltage") {
        const i = add(g("Tension U") / req, "A");
        add(g("R₁") * i, "V");
      }
    }
    if (variant === "lamp-resistor") {
      const i = add(g("Tension lampe U₁") / g("Résistance lampe R₁"), "A"),
        u = add(g("Tension source U") - g("Tension lampe U₁"), "V");
      add(u / i, "Ω");
    }
    if (variant === "voltmeter") {
      const i = add(g("Courant pleine échelle") / 1000, "A"),
        u = add(g("Résistance interne R₁") * i, "V");
      add((g("Calibre U") - u) / i, "Ω");
    }
    if (variant === "lamps") {
      const u = add(g("Tension totale U") / g("Nombre de lampes"), "V"),
        r = add(u / g("Courant I"), "Ω");
      add(r * g("Nombre de lampes"), "Ω");
    }
    if (variant === "measured-voltage") {
      const i = add(g("Tension mesurée U₂") / g("R₂"), "A"),
        req = add(
          resistors().reduce((a, b) => a + b),
          "Ω",
        );
      add(req * i, "V");
    }
  }
  if (theme === "parallel") {
    if (["four", "currents", "known-current"].includes(variant)) {
      const rs = resistors(),
        u =
          variant === "known-current"
            ? add(g("R₁") * g("Courant I₁"), "V")
            : variant === "currents"
              ? g("Tension U")
              : 0;
      if (variant !== "four") {
        const currents = rs.map((r, i) =>
          variant === "known-current" && i === 0
            ? g("Courant I₁")
            : add(u / r, "A"),
        );
        add(
          currents.reduce((a, b) => a + b),
          "A",
        );
      }
      add(par(rs), "Ω");
    }
    if (variant === "identical")
      add(g("Résistance d’un élément") / g("Nombre d’éléments"), "Ω");
    if (variant === "added-branch") {
      const req = add(par(resistors()), "Ω"),
        u = add(req * g("Courant avant"), "V"),
        i = add(g("Courant après") - g("Courant avant"), "A");
      add(u / i, "Ω");
    }
    if (variant === "shunt") {
      const im = add(g("Pleine échelle") / 1000, "A"),
        u = add(g("Résistance appareil R₁") * im, "V"),
        ish = add(g("Calibre total I") - im, "A");
      add(u / ish, "Ω");
    }
    if (variant === "missing")
      add(1 / (1 / g("Req") - resistors().reduce((a, r) => a + 1 / r, 0)), "Ω");
  }
  if (theme === "mixed") {
    if (variant === "bridge") {
      const a = add(g("R₁") + g("R₂"), "Ω"),
        b = add(g("R₃") + g("R₄"), "Ω");
      add(par([a, b]), "Ω");
      const ia = add(g("Tension UAB") / a, "A"),
        ib = add(g("Tension UAB") / b, "A"),
        vc = add(ia * g("R₂"), "V"),
        vd = add(ib * g("R₄"), "V");
      add(vc - vd, "V");
    } else if (variant === "branch-measurements") {
      const third = add(g("Courant total I") - g("Courant I₂"), "A"),
        u = add(g("R₂") * g("Courant I₂"), "V"),
        r3 = add(u / third, "Ω"),
        group = add(par([g("R₂"), r3]), "Ω"),
        req = add(g("R₁") + group, "Ω");
      add(req * g("Courant total I"), "V");
    } else if (["six-resistors", "seven-resistors"].includes(variant)) {
      const missing = add(g("Tension U₁") / g("Courant I₁"), "Ω");
      function reduce(tree) {
        if (tree.kind === "resistor")
          return tree.id === "R₁" ? missing : g(tree.id);
        const children = tree.children.map(reduce);
        return add(
          tree.kind === "series"
            ? children.reduce((a, b) => a + b)
            : par(children),
          "Ω",
        );
      }
      const req = reduce(q.diagram),
        i = add(g("Tension totale U") / req, "A");
      const measuredI = g("Courant I₁");
      assert.ok(
        g("Tension U₁") < g("Tension totale U"),
        "A series resistor cannot receive more voltage than the source",
      );
      const measuredBranch = variant === "six-resistors" ? req : expected[2][0];
      assert.ok(
        Math.abs(g("Tension totale U") / measuredBranch - measuredI) < 1e-8,
        "Local and source measurements must describe the same circuit",
      );
      if (variant === "six-resistors") {
        const group = expected[1][0],
          u = add(i * group, "V");
        add(u / g("R₂"), "A");
      } else add(g("Tension totale U") / expected[2][0], "A");
    } else {
      const r1missing = given["Tension U₁"] !== undefined;
      const missing = add(
        r1missing
          ? g("Tension U₁") / g("Intensité I₁")
          : given["Puissance P₂"]
            ? g("Tension U₂") ** 2 / g("Puissance P₂")
            : g("Tension U₂") / g("Intensité I₂"),
        "Ω",
      );
      const r1 = r1missing ? missing : g("R₁"),
        r2 = r1missing ? g("R₂") : missing;
      if (variant.startsWith("parallel")) {
        const group = add(par([r1, r2]), "Ω"),
          sum = add(group + g("R₃"), "Ω");
        if (variant === "parallel-series-parallel")
          add(par([sum, g("R₄")]), "Ω");
      } else {
        const sum = add(r1 + r2, "Ω"),
          group = add(par([sum, g("R₃")]), "Ω");
        if (variant === "series-parallel-series") add(group + g("R₄"), "Ω");
      }
    }
  }
  if (theme === "voltageDrop") {
    if (variant === "line-resistance") {
      const rl = add(2 * g("Résistance d’un fil"), "Ω"),
        drop = add(rl * g("Courant I"), "V");
      add(g("Tension générateur Ug") - drop, "V");
      add((100 * drop) / g("Tension générateur Ug"), "%");
    } else if (variant === "size-section") {
      const drop = add(
        (g("Tension générateur Ug") * g("Chute admise")) / 100,
        "V",
      );
      add(g("Tension générateur Ug") - drop, "V");
      const s = add(
        (g("Résistivité ρ") * 2 * g("Distance") * g("Courant I")) / drop,
        "mm²",
      );
      add(2 * Math.sqrt(s / Math.PI), "mm");
    } else {
      const s = add((Math.PI * g("Diamètre d") ** 2) / 4, "mm²"),
        rl = add((g("Résistivité ρ") * 2 * g("Distance (un trajet)")) / s, "Ω");
      const i =
        variant === "load-charge"
          ? add(
              g("Tension générateur Ug") / (g("Résistance récepteur R") + rl),
              "A",
            )
          : g("Courant I");
      const drop = add(rl * i, "V");
      add(
        variant === "diameter-line"
          ? g("Tension souhaitée Ur") + drop
          : g("Tension générateur Ug") - drop,
        "V",
      );
      if (variant === "diameter-line") add(i / s, "A/mm²");
      if (variant === "load-charge") add((i * g("Durée")) / 60, "Ah");
    }
  }
  const actual = q.steps?.length ? q.steps : [q];
  assert.equal(
    expected.length,
    actual.length,
    `${theme}/${variant}: number of results`,
  );
  actual.forEach((step, i) => {
    assert.ok(
      Number.isFinite(step.answer),
      `${theme}/${variant} finite answer`,
    );
    assert.ok(
      Math.abs(rounded(step.answer) - expected[i][0]) <
        1e-9 * Math.max(1, Math.abs(expected[i][0])),
      `${theme}/${variant} ${step.target}: ${step.answer} vs ${expected[i][0]}`,
    );
    assert.equal(step.unit, expected[i][1], `${theme}/${variant}: unit`);
    step.dependsOn?.forEach((index) =>
      assert.ok(
        index >= 0 && index < i,
        "Dependencies must refer to a completed step",
      ),
    );
  });
}
let count = 0;
for (const [theme, list] of Object.entries(variants)) {
  for (const variant of list)
    for (let repeat = 0; repeat < 100; repeat++) {
      const q = JSON.parse(
        vm.runInContext(
          `JSON.stringify(schoolQuestion(${JSON.stringify(theme)},${JSON.stringify(variant)}))`,
          sandbox,
        ),
      );
      oracle(q, theme, variant);
      count++;
    }
  console.log(
    `PASS ${theme}: ${list.length} templates, 100 generated cases each`,
  );
}
console.log(`${count} exercises verified independently from displayed values.`);
