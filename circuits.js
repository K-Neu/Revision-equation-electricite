/* Circuit exercises and diagrams. All reductions use the displayed 4-decimal values. */
const circuitRound = (value) => Number(value.toFixed(4));
const parallelResistance = (...resistances) =>
  1 / resistances.reduce((sum, value) => sum + 1 / value, 0);
const resistor = (id, value) => ({ kind: "resistor", id, value });
const connection = (kind, ...children) => ({ kind, children });

function parallelQuestion(
  variant = pick(["two", "three", "missing-two", "missing-three"]),
) {
  const r1 = pick([10, 15, 20, 30, 40, 60, 100, 120]),
    r2 = pick([10, 20, 30, 40, 60, 80, 120]),
    r3 = pick([15, 30, 45, 60, 90, 150]);
  const meter = (name, value) => [name, `${fmt(value)} Ω`];
  let question, given, answer, formula, calc;
  if (variant === "two") {
    answer = parallelResistance(r1, r2);
    question =
      "R₁ et R₂ sont en parallèle. Quelle est leur résistance équivalente Req ?";
    given = [meter("R₁", r1), meter("R₂", r2)];
    formula = "Req = R₁ × R₂ ÷ (R₁ + R₂)";
    calc = `Req = ${fmt(r1)} × ${fmt(r2)} ÷ (${fmt(r1)} + ${fmt(r2)}) ≈ ${fmt(answer)} Ω`;
  } else if (variant === "three") {
    answer = parallelResistance(r1, r2, r3);
    question =
      "R₁, R₂ et R₃ sont en parallèle. Quelle est leur résistance équivalente Req ?";
    given = [meter("R₁", r1), meter("R₂", r2), meter("R₃", r3)];
    formula = "Req = 1 ÷ (1/R₁ + 1/R₂ + 1/R₃)";
    calc = `Req = 1 ÷ (1/${fmt(r1)} + 1/${fmt(r2)} + 1/${fmt(r3)}) ≈ ${fmt(answer)} Ω`;
  } else if (variant === "missing-two") {
    const req = circuitRound(parallelResistance(r1, r2));
    answer = 1 / (1 / req - 1 / r1);
    question =
      "R₁ et R₂ sont en parallèle. Retrouvez la résistance inconnue R₂ à partir de Req.";
    given = [meter("R₁", r1), meter("Req", req)];
    formula = "R₂ = 1 ÷ (1/Req − 1/R₁)";
    calc = `R₂ = 1 ÷ (1/${fmt(req)} − 1/${fmt(r1)}) ≈ ${fmt(answer)} Ω`;
  } else {
    const req = circuitRound(parallelResistance(r1, r2, r3));
    answer = 1 / (1 / req - 1 / r1 - 1 / r2);
    question =
      "R₁, R₂ et R₃ sont en parallèle. Retrouvez la résistance inconnue R₃ à partir de Req.";
    given = [meter("R₁", r1), meter("R₂", r2), meter("Req", req)];
    formula = "R₃ = 1 ÷ (1/Req − 1/R₁ − 1/R₂)";
    calc = `R₃ = 1 ÷ (1/${fmt(req)} − 1/${fmt(r1)} − 1/${fmt(r2)}) ≈ ${fmt(answer)} Ω`;
  }
  return {
    topic: "Résistances en parallèle",
    question,
    given,
    answer,
    formula,
    calc,
    unit: "Ω",
    variant,
  };
}

function mixedCircuitQuestion(
  variant = pick([
    "parallel-series",
    "series-parallel",
    "series-parallel-series",
    "parallel-series-parallel",
  ]),
) {
  const seed1 = pick([10, 20, 30, 40, 60, 80]),
    seed2 = pick([15, 20, 30, 40, 60, 90]),
    r3 = pick([10, 20, 30, 50, 75, 100]),
    r4 = pick([10, 20, 40, 60, 100]);
  const current = pick([0.1, 0.2, 0.5, 1, 2]);
  const powerVariant = variant === "series-parallel";
  const missing =
    variant === "parallel-series" || variant === "series-parallel-series"
      ? "R₁"
      : "R₂";
  const missingSeed = missing === "R₁" ? seed1 : seed2;
  const voltage = circuitRound(missingSeed * current),
    power = circuitRound(voltage * current);
  const recovered = circuitRound(
    powerVariant ? voltage ** 2 / power : voltage / current,
  );
  const r1 = missing === "R₁" ? recovered : seed1,
    r2 = missing === "R₂" ? recovered : seed2;
  const meter = (name, value, unit = "Ω") => [name, `${fmt(value)} ${unit}`];
  const sub = missing === "R₁" ? "₁" : "₂";
  const given = [
    ["Résistance " + missing, "à déterminer"],
    meter(missing === "R₁" ? "R₂" : "R₁", missing === "R₁" ? r2 : r1),
    meter("R₃", r3),
    meter("Tension U" + sub, voltage, "V"),
    meter(
      powerVariant ? "Puissance P₂" : "Intensité I" + sub,
      powerVariant ? power : current,
      powerVariant ? "W" : "A",
    ),
  ];
  const steps = [
    {
      target: missing,
      title: "Retrouver la résistance manquante",
      description: `La tension et ${powerVariant ? "la puissance" : "l’intensité"} sont mesurées sur ${missing}.`,
      dependsOn: [],
      answer: recovered,
      unit: "Ω",
      formula: powerVariant
        ? "R₂ = U₂² ÷ P₂"
        : `${missing} = U${sub} ÷ I${sub}`,
      calc: powerVariant
        ? `R₂ = ${fmt(voltage)}² ÷ ${fmt(power)} = ${fmt(recovered)} Ω`
        : `${missing} = ${fmt(voltage)} ÷ ${fmt(current)} = ${fmt(recovered)} Ω`,
    },
  ];
  const addStep = (
    target,
    title,
    description,
    dependsOn,
    answer,
    formula,
    calc,
  ) => {
    const rounded = circuitRound(answer);
    steps.push({
      target,
      title,
      description,
      dependsOn,
      answer: rounded,
      unit: "Ω",
      formula,
      calc: calc + ` ≈ ${fmt(rounded)} Ω`,
    });
    return rounded;
  };
  let statement, diagram;
  if (variant === "parallel-series" || variant === "parallel-series-parallel") {
    const r12 = addStep(
      "R₁₂",
      "Réduire l’association en parallèle",
      "R₁ et R₂ sont en parallèle.",
      [0],
      parallelResistance(r1, r2),
      "R₁₂ = R₁ × R₂ ÷ (R₁ + R₂)",
      `R₁₂ = ${fmt(r1)} × ${fmt(r2)} ÷ (${fmt(r1)} + ${fmt(r2)})`,
    );
    diagram = connection(
      "series",
      connection(
        "parallel",
        resistor("R₁", missing === "R₁" ? null : r1),
        resistor("R₂", missing === "R₂" ? null : r2),
      ),
      resistor("R₃", r3),
    );
    if (variant === "parallel-series") {
      addStep(
        "Req",
        "Calculer la résistance équivalente",
        "R₁₂ est en série avec R₃.",
        [1],
        r12 + r3,
        "Req = R₁₂ + R₃",
        `Req = ${fmt(r12)} + ${fmt(r3)}`,
      );
      statement =
        "Entre A et B, R₁ et R₂ sont en parallèle. Ce groupe est en série avec R₃. R₁ est inconnue ; retrouvez-la à partir de la tension U₁ et du courant I₁ mesurés sur R₁, puis réduisez le circuit.";
    } else {
      const r123 = addStep(
        "R₁₂₃",
        "Ajouter la résistance en série",
        "R₁₂ est en série avec R₃.",
        [1],
        r12 + r3,
        "R₁₂₃ = R₁₂ + R₃",
        `R₁₂₃ = ${fmt(r12)} + ${fmt(r3)}`,
      );
      addStep(
        "Req",
        "Réduire la dernière association",
        "R₁₂₃ est en parallèle avec R₄.",
        [2],
        parallelResistance(r123, r4),
        "Req = R₁₂₃ × R₄ ÷ (R₁₂₃ + R₄)",
        `Req = ${fmt(r123)} × ${fmt(r4)} ÷ (${fmt(r123)} + ${fmt(r4)})`,
      );
      diagram = connection("parallel", diagram, resistor("R₄", r4));
      given.push(meter("R₄", r4));
      statement =
        "Entre A et B, une branche contient R₁ et R₂ en parallèle, puis R₃ en série avec ce groupe. La seconde branche contient R₄. R₂ est inconnue ; utilisez U₂ et I₂, mesurés sur R₂, puis réduisez les associations successives.";
    }
  } else {
    const r12 = addStep(
      "R₁₂",
      "Réduire l’association en série",
      "R₁ et R₂ sont en série.",
      [0],
      r1 + r2,
      "R₁₂ = R₁ + R₂",
      `R₁₂ = ${fmt(r1)} + ${fmt(r2)}`,
    );
    diagram = connection(
      "parallel",
      connection(
        "series",
        resistor("R₁", missing === "R₁" ? null : r1),
        resistor("R₂", missing === "R₂" ? null : r2),
      ),
      resistor("R₃", r3),
    );
    if (variant === "series-parallel") {
      addStep(
        "Req",
        "Calculer la résistance équivalente",
        "R₁₂ est en parallèle avec R₃.",
        [1],
        parallelResistance(r12, r3),
        "Req = R₁₂ × R₃ ÷ (R₁₂ + R₃)",
        `Req = ${fmt(r12)} × ${fmt(r3)} ÷ (${fmt(r12)} + ${fmt(r3)})`,
      );
      statement =
        "Entre A et B, R₁ et R₂ sont en série dans une première branche. R₃ constitue la seconde branche, en parallèle avec la première. R₂ est inconnue ; retrouvez-la grâce à la tension U₂ et à la puissance P₂ mesurées sur R₂, puis réduisez le circuit.";
    } else {
      const r123 = addStep(
        "R₁₂₃",
        "Réduire les deux branches",
        "R₁₂ est en parallèle avec R₃.",
        [1],
        parallelResistance(r12, r3),
        "R₁₂₃ = R₁₂ × R₃ ÷ (R₁₂ + R₃)",
        `R₁₂₃ = ${fmt(r12)} × ${fmt(r3)} ÷ (${fmt(r12)} + ${fmt(r3)})`,
      );
      addStep(
        "Req",
        "Ajouter la dernière résistance",
        "R₁₂₃ est en série avec R₄.",
        [2],
        r123 + r4,
        "Req = R₁₂₃ + R₄",
        `Req = ${fmt(r123)} + ${fmt(r4)}`,
      );
      diagram = connection("series", diagram, resistor("R₄", r4));
      given.push(meter("R₄", r4));
      statement =
        "R₁ et R₂ sont en série ; ce groupe est en parallèle avec R₃. L’ensemble est en série avec R₄ entre A et B. R₁ est inconnue ; utilisez U₁ et I₁, mesurés sur R₁, puis réduisez les associations successives.";
    }
  }
  return {
    kind: "cascade",
    variant,
    topic: "Circuits de résistances mixtes",
    question: "Calculez la résistance équivalente Req entre A et B.",
    statement,
    diagram,
    given,
    steps,
    answer: steps.at(-1).answer,
    unit: "Ω",
    formula: steps[0].formula,
    calc: steps.map((step, index) => `${index + 1}. ${step.calc}`).join("\n"),
    unitContext:
      statement +
      " Les valeurs intermédiaires sont arrondies à 4 décimales et reprises à l’étape suivante.",
  };
}

function renderCircuitDiagram(tree) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const make = (name, attributes, text) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes))
      node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    svg.append(node);
    return node;
  };
  const measure = (node) => {
    if (node.kind === "resistor") return { width: 144, height: 76 };
    const sizes = node.children.map(measure);
    return node.kind === "series"
      ? {
          width:
            sizes.reduce((sum, size) => sum + size.width, 0) +
            36 * (sizes.length - 1),
          height: Math.max(...sizes.map((size) => size.height)),
        }
      : {
          width: Math.max(...sizes.map((size) => size.width)) + 68,
          height:
            sizes.reduce((sum, size) => sum + size.height, 0) +
            24 * (sizes.length - 1),
        };
  };
  const line = (x1, y1, x2, y2) =>
    make("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: "currentColor",
      "stroke-width": 1.8,
    });
  function draw(node, x, y) {
    const { width, height } = measure(node),
      middle = y + height / 2;
    if (node.kind === "resistor") {
      line(x, middle, x + 30, middle);
      line(x + 114, middle, x + width, middle);
      make("rect", {
        x: x + 30,
        y: middle - 8,
        width: 84,
        height: 16,
        fill: "var(--surface)",
        stroke: "currentColor",
        "stroke-width": 1.8,
      });
      make(
        "text",
        {
          x: x + 72,
          y: middle - 20,
          "text-anchor": "middle",
          class: "circuit-label",
        },
        node.id,
      );
      make(
        "text",
        {
          x: x + 72,
          y: middle + 30,
          "text-anchor": "middle",
          class: "circuit-value",
        },
        node.value === null ? "? Ω" : `${fmt(node.value)} Ω`,
      );
      return;
    }
    if (node.kind === "series") {
      let left = x;
      node.children.forEach((child, index) => {
        const size = measure(child);
        draw(child, left, middle - size.height / 2);
        left += size.width;
        if (index < node.children.length - 1) {
          line(left, middle, left + 36, middle);
          if (node.junctionLabels?.[index]) {
            make("circle", {
              cx: left + 18,
              cy: middle,
              r: 2.5,
              fill: "currentColor",
            });
            make(
              "text",
              {
                x: left + 18,
                y: middle - 12,
                "text-anchor": "middle",
                class: "circuit-label",
              },
              node.junctionLabels[index],
            );
          }
          left += 36;
        }
      });
    } else {
      let top = y;
      const centers = [];
      for (const child of node.children) {
        const size = measure(child),
          cy = top + size.height / 2;
        centers.push(cy);
        line(x + 18, cy, x + 34, cy);
        draw(child, x + 34, top);
        line(x + 34 + size.width, cy, x + width - 18, cy);
        top += size.height + 24;
      }
      line(x + 18, centers[0], x + 18, centers.at(-1));
      line(x + width - 18, centers[0], x + width - 18, centers.at(-1));
      line(x, middle, x + 18, middle);
      line(x + width - 18, middle, x + width, middle);
      for (const cy of centers) {
        make("circle", { cx: x + 18, cy, r: 2.5, fill: "currentColor" });
        make("circle", {
          cx: x + width - 18,
          cy,
          r: 2.5,
          fill: "currentColor",
        });
      }
    }
  }
  const size = measure(tree),
    middle = 24 + size.height / 2;
  svg.setAttribute("viewBox", `0 0 ${size.width + 88} ${size.height + 48}`);
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    "Circuit entre les bornes A et B. Les valeurs et les associations sont également décrites dans l’énoncé. Un point d’interrogation indique une résistance à déterminer.",
  );
  draw(tree, 44, 24);
  line(18, middle, 44, middle);
  line(44 + size.width, middle, 70 + size.width, middle);
  for (const [label, x] of [
    ["A", 18],
    ["B", 70 + size.width],
  ]) {
    make("circle", {
      cx: x,
      cy: middle,
      r: 3,
      fill: "var(--surface)",
      stroke: "currentColor",
      "stroke-width": 1.5,
    });
    make(
      "text",
      { x, y: middle - 12, "text-anchor": "middle", class: "circuit-label" },
      label,
    );
  }
  return svg;
}
