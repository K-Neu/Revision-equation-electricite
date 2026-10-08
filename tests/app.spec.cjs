/* Run with node tests/app.spec.cjs; requires Playwright and Chromium. */
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!file.startsWith(root + path.sep)) throw Error("Invalid path");
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    response.end(await fs.readFile(file));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
const testResults = [];
let runNumber = 0;
const freshUrl = (hash = "") => base + `/?check=${++runNumber}` + hash;
function pass(name) {
  testResults.push(name);
  console.log("PASS " + name);
}
async function start(page, type = "numeric", theme = "mix", help = false) {
  await page.goto(freshUrl("#questionnaires"));
  await page.locator(`input[name="quizType"][value="${type}"]`).check();
  await page.locator(`input[name="quizTheme"][value="${theme}"]`).check();
  await page.locator("#setupHelpToggle").setChecked(help);
  await page.locator("#startBtn").click();
  await page.waitForFunction(() => app.screen === "quiz");
}
// Independently calculate from the values actually shown to the student.
async function calculateDisplayedQuestion(page, theme) {
  const data = await page.evaluate(() => ({
    given: app.current.given,
    target: app.current.formula.split(" = ")[0],
  }));
  const given = Object.fromEntries(
    data.given.map(([label, value]) => [
      label,
      Number(
        value
          .match(/^[\d,.\s]+/)[0]
          .replace(/\s/g, "")
          .replace(",", "."),
      ),
    ]),
  );
  const find = (term) => {
    const entry = Object.entries(given).find(([key]) =>
      key.split(" ").includes(term),
    );
    assert.ok(entry, "Missing quantity " + term);
    return entry[1];
  };
  const target = data.target;
  if (theme === "ohm")
    return target === "U"
      ? find("R") * find("I")
      : target === "I"
        ? find("U") / find("R")
        : find("U") / find("I");
  if (theme === "charge")
    return target === "Q"
      ? find("I") * find("T")
      : target === "I"
        ? find("Q") / find("T")
        : find("Q") / find("I");
  if (theme === "power")
    return target === "P"
      ? find("U") * find("I")
      : target === "U"
        ? find("P") / find("I")
        : find("P") / find("U");
  if (theme === "pouillet")
    return target === "R"
      ? (find("ρ") * find("L")) / find("S")
      : target === "ρ"
        ? (find("R") * find("S")) / find("L")
        : target === "L"
          ? (find("R") * find("S")) / find("ρ")
          : (find("ρ") * find("L")) / find("R");
  if (theme === "section") {
    if (target === "S")
      return Object.keys(given)[0].includes("Rayon")
        ? Math.PI * find("r") ** 2
        : (Math.PI * find("d") ** 2) / 4;
    if (target === "r")
      return Object.keys(given)[0].includes("Section")
        ? Math.sqrt(find("S") / Math.PI)
        : find("d") / 2;
    return Object.keys(given)[0].includes("Section")
      ? 2 * Math.sqrt(find("S") / Math.PI)
      : 2 * find("r");
  }
  if (theme === "parallel") {
    const reciprocalSum = Object.entries(given)
      .filter(([label]) => label !== "Req")
      .reduce((sum, [, value]) => sum + 1 / value, 0);
    return Object.hasOwn(given, "Req")
      ? 1 / (1 / given.Req - reciprocalSum)
      : 1 / reciprocalSum;
  }
  if (target === "Rₜ")
    return Object.values(given).reduce((sum, value) => sum + value, 0);
  return (
    find("Rₜ") -
    Object.entries(given)
      .filter(([key]) => !key.includes("Rₜ"))
      .reduce((sum, [, value]) => sum + value, 0)
  );
}
async function submitNumeric(page, value) {
  await page.locator("#numericInput").fill(value);
  await page.locator("#numericInput").press("Enter");
}
async function calculateMixedSteps(page) {
  const data = await page.evaluate(() => ({
    variant: app.current.variant,
    given: app.current.given,
  }));
  const values = Object.fromEntries(
    data.given
      .filter(([, value]) => value !== "à déterminer")
      .map(([label, value]) => [
        label,
        Number(
          value
            .match(/^[\d,.\s]+/)[0]
            .replace(/\s/g, "")
            .replace(",", "."),
        ),
      ]),
  );
  const round = (value) => Number(value.toFixed(4));
  const parallel = (a, b) => (a * b) / (a + b);
  const missing = values["Tension U₁"] !== undefined ? "R₁" : "R₂";
  const recovered = round(
    missing === "R₁"
      ? values["Tension U₁"] / values["Intensité I₁"]
      : values["Puissance P₂"] !== undefined
        ? values["Tension U₂"] ** 2 / values["Puissance P₂"]
        : values["Tension U₂"] / values["Intensité I₂"],
  );
  values[missing] = recovered;
  const { "R₁": r1, "R₂": r2, "R₃": r3, "R₄": r4 } = values;
  const results = [recovered];
  if (
    data.variant === "parallel-series" ||
    data.variant === "parallel-series-parallel"
  ) {
    results.push(round(parallel(r1, r2)));
    results.push(round(results[1] + r3));
    if (data.variant === "parallel-series-parallel")
      results.push(round(parallel(results[2], r4)));
  } else {
    results.push(round(r1 + r2));
    results.push(round(parallel(results[1], r3)));
    if (data.variant === "series-parallel-series")
      results.push(round(results[2] + r4));
  }
  return results;
}
let base, browser;
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  assert.equal(await page.locator("#homeScreen").isVisible(), true);
  assert.equal(await page.locator("#quizScreen").isVisible(), false);
  await page.locator(".hero-cta").click();
  assert.equal(await page.locator("#setupScreen").isVisible(), true);
  assert.equal(await page.locator("#setupHelpToggle").isChecked(), false);
  assert.equal(await page.locator('input[name="quizTheme"]').count(), 9);
  pass("Home, questionnaire menu and aids disabled by default");

  for (const theme of [
    "ohm",
    "charge",
    "power",
    "pouillet",
    "section",
    "series",
    "parallel",
  ]) {
    await start(page, "numeric", theme);
    for (let index = 0; index < 10; index++) {
      const answer = await calculateDisplayedQuestion(page, theme),
        precision = theme === "pouillet" ? 6 : 4;
      await submitNumeric(page, answer.toFixed(precision).replace(".", ","));
      assert.equal(
        await page.evaluate(() => app.answered),
        true,
        `${theme}: ${answer} — ${await page.locator("#answerError").textContent()}`,
      );
      assert.equal(
        await page.evaluate(() => app.score),
        index + 1,
        `${theme} question ${index + 1}: ${answer} ${JSON.stringify(await page.evaluate(() => app.current))}`,
      );
      await page.locator("#nextBtn").click();
    }
    assert.equal(await page.locator("#summaryScreen").isVisible(), true);
    assert.equal(await page.locator("#finalScore").textContent(), "10 / 10");
  }
  pass(
    "All seven single-result calculation themes: displayed values, rounding, Enter and 10/10 scores",
  );

  await start(page, "numeric", "ohm");
  for (const invalid of [
    "",
    "abc",
    "1,2,3",
    "Infinity",
    "NaN",
    "<script>",
    "1e999",
  ]) {
    await submitNumeric(page, invalid);
    assert.equal(await page.evaluate(() => app.answered), false);
    assert.notEqual(await page.locator("#answerError").textContent(), "");
  }
  await submitNumeric(page, "0");
  assert.equal(await page.evaluate(() => app.score), 0);
  assert.equal(await page.locator(".calculation").isVisible(), true);
  assert.equal(await page.locator("#numericInput").isDisabled(), true);
  await page.evaluate(() => submitAnswer());
  assert.equal(await page.evaluate(() => app.history.length), 1);
  await page.locator("#nextBtn").click();
  const value = await calculateDisplayedQuestion(page, "ohm"),
    unit = await page.locator("#numericUnit").textContent();
  await submitNumeric(page, value + " wrong-unit");
  assert.equal(await page.evaluate(() => app.answered), false);
  await submitNumeric(page, value.toExponential(9) + " " + unit);
  assert.equal(await page.evaluate(() => app.score), 1);
  pass(
    "Invalid and wrong answers, correction without aids, scientific notation, unit suffix and duplicate submission",
  );

  await start(page, "numeric", "mix");
  await page.locator("#changeQuizBtn").click();
  assert.equal(await page.locator("#leaveDialog").isVisible(), true);
  await page.locator('button[value="stay"]').click();
  assert.equal(await page.evaluate(() => app.screen), "quiz");
  await page.locator("#homeNav").click();
  await page.locator('button[value="leave"]').click();
  await page.waitForFunction(() => app.screen === "home");
  assert.equal(await page.evaluate(() => app.screen), "home");
  assert.equal(await page.evaluate(() => app.current), null);
  pass("Leaving a series: cancel keeps responses, confirm returns home");

  await start(page, "numeric", "series", true);
  await page.locator("#helpToggle").uncheck();
  for (let index = 0; index < 10; index++) {
    await submitNumeric(
      page,
      String(await calculateDisplayedQuestion(page, "series")),
    );
    await page.locator("#nextBtn").click();
  }
  assert.equal(await page.locator("#finalScore").textContent(), "5 / 10");
  assert.match(
    await page.locator("#scoreBreakdown").textContent(),
    /Aides utilisées/,
  );
  pass("Aids halve the entire score even after hiding them");

  await start(page, "equation", "ohm");
  await page.locator("#equationInput").fill("U / (R");
  await page.locator("#unitInput").fill("A");
  await page.locator("#validateBtn").click();
  assert.equal(await page.evaluate(() => app.answered), false);
  await page
    .locator("#equationInput")
    .fill(await page.evaluate(() => app.current.answer));
  await page.locator("#unitInput").fill("");
  await page.locator("#validateBtn").click();
  assert.equal(await page.evaluate(() => app.answered), false);
  await page.locator("#unitInput").fill("wrong");
  await page.locator("#validateBtn").click();
  assert.equal(await page.evaluate(() => app.score), 0.5);
  await page.locator("#nextBtn").click();
  await page.locator("#equationInput").fill("0");
  await page
    .locator("#unitInput")
    .fill(await page.evaluate(() => app.current.unit));
  await page.locator("#validateBtn").click();
  assert.equal(await page.evaluate(() => app.score), 1);
  pass(
    "Equation syntax errors and missing units allow correction; formula and unit each earn half a point",
  );

  const parserChecks = await page.evaluate(() => {
    const equivalentPairs = [
      ["I*R", "R × I"],
      ["U / R", "U ÷ R"],
      ["rho * L / S", "ρ × L ÷ S"],
      ["pi*r^2", "π × r ²"],
      ["pi*r**2", "π × r ²"],
      ["(-r)^2*pi", "π × r ²"],
      ["sqrt(S/pi)", "√ ( S ÷ π )"],
      ["sqrt(4*S/pi)", "2 × √ ( S ÷ π )"],
      ["Rt-R1-R2", "Rₜ − R₁ − R₂"],
      ["R2+R1", "R₁ + R₂"],
      ["(R*I)", "R × I"],
    ];
    return {
      matches: equivalentPairs.map(([actual, expected]) =>
        equivalent(tokenizeExpression(actual), expected),
      ),
      wrong: equivalent(tokenizeExpression("U*R"), "U ÷ R"),
      negativeSquare: equivalent(tokenizeExpression("-r^2*pi"), "π × r ²"),
      unsafe: (() => {
        try {
          tokenizeExpression("alert(1)");
          return false;
        } catch {
          return true;
        }
      })(),
      units: [
        ["ohm", "Ω"],
        ["mm^2", "mm²"],
        ["ohm.mm2/m", "Ω·mm²/m"],
      ].map(([a, b]) => normalizeUnit(a) === normalizeUnit(b)),
    };
  });
  assert.ok(parserChecks.matches.every(Boolean));
  assert.equal(parserChecks.wrong, false);
  assert.equal(parserChecks.negativeSquare, false);
  assert.equal(parserChecks.unsafe, true);
  assert.ok(parserChecks.units.every(Boolean));
  pass(
    "Equivalent formulas, ASCII notation, square roots, series subscripts, unit aliases and rejected code",
  );

  const ascii = (expression) =>
    expression
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/²/g, "^2")
      .replace(/√/g, "sqrt")
      .replace(/π/g, "pi")
      .replace(/ρ/g, "rho")
      .replace(/Rₜ/g, "Rt")
      .replace(/R₁/g, "R1")
      .replace(/R₂/g, "R2")
      .replace(/R₃/g, "R3")
      .replace(/R₄/g, "R4")
      .replace(/−/g, "-");
  for (const theme of [
    "ohm",
    "charge",
    "power",
    "pouillet",
    "section",
    "series",
    "parallel",
    "mixed",
  ]) {
    await start(page, "equation", theme);
    for (let index = 0; index < 10; index++) {
      const question = await page.evaluate(() => ({
        answer: app.current.answer,
        unit: app.current.unit,
        topic: app.current.topic,
      }));
      assert.equal(
        question.topic,
        {
          ohm: "Loi d’Ohm",
          charge: "Charge électrique",
          power: "Puissance",
          pouillet: "Loi de Pouillet",
          section: "Section ronde",
          series: "Résistances en série",
          parallel: "Résistances en parallèle",
          mixed: "Circuits mixtes",
        }[theme],
      );
      await page.locator("#equationInput").fill(ascii(question.answer));
      await page
        .locator("#unitInput")
        .fill(question.unit.replace("Ω", "ohm").replace("²", "2"));
      await page.locator("#unitInput").press("Enter");
      assert.equal(await page.evaluate(() => app.score), index + 1);
      await page.locator("#nextBtn").click();
    }
    assert.equal(await page.locator("#finalScore").textContent(), "10 / 10");
  }
  pass(
    "All eight equation themes, full equations, manual units and 10/10 scores",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^resultat-electricite-.*\.pdf$/);
  const pdf = await fs.readFile(await download.path());
  assert.equal(pdf.subarray(0, 8).toString(), "%PDF-1.4");
  assert.ok(pdf.length > 100000);
  const report = await page.evaluate(() => app.result.report);
  assert.equal(report.answers.length, 10);
  assert.ok(
    report.answers.every((answer) => answer.response && answer.correction),
  );
  await page.locator(".summary-home").click();
  assert.equal(await page.locator("#lastResult").isVisible(), true);
  await page.reload();
  assert.equal(await page.locator("#lastResult").isVisible(), true);
  pass("Detailed downloadable PDF and saved last result");

  for (const variant of [
    "parallel-series",
    "series-parallel",
    "series-parallel-series",
    "parallel-series-parallel",
  ]) {
    await start(page, "numeric", "mixed");
    await page.evaluate((variant) => {
      const original = Math.random;
      Math.random = () =>
        [
          "parallel-series",
          "series-parallel",
          "series-parallel-series",
          "parallel-series-parallel",
        ].indexOf(variant) /
          4 +
        0.01;
      try {
        newQuestion();
      } finally {
        Math.random = original;
      }
    }, variant);
    assert.equal(await page.evaluate(() => app.current.variant), variant);
    assert.equal(await page.locator("#circuitDiagram svg").count(), 1);
    assert.equal(
      await page
        .locator("#given")
        .textContent()
        .then((text) => text.includes("à déterminer")),
      true,
    );
    const results = await calculateMixedSteps(page);
    assert.equal(
      await page.locator("#cascadeSteps li").count(),
      results.length,
    );
    await submitNumeric(page, "");
    assert.equal(await page.evaluate(() => app.stepIndex), 0);
    // A wrong first step is corrected and its canonical value feeds every later step.
    for (let index = 0; index < results.length; index++) {
      await submitNumeric(page, index === 0 ? "0" : String(results[index]));
      assert.equal(
        await page.evaluate(() => app.index),
        0,
        "Cascade must stay in one question",
      );
      assert.equal(await page.evaluate(() => app.stepIndex), index + 1);
      if (index < results.length - 1) {
        assert.equal(await page.evaluate(() => app.answered), false);
        assert.equal(await page.locator("#nextBtn").isVisible(), false);
        assert.equal(await page.evaluate(() => app.history.length), 0);
        assert.equal(
          await page
            .locator("#stepContext")
            .textContent()
            .then((text) =>
              text.includes(
                results[index].toLocaleString("fr-BE", {
                  maximumFractionDigits: 4,
                }),
              ),
            ),
          true,
        );
      }
    }
    assert.equal(await page.evaluate(() => app.answered), true);
    assert.ok(
      Math.abs(
        (await page.evaluate(() => app.score)) -
          (results.length - 1) / results.length,
      ) < 1e-9,
    );
    assert.equal(await page.evaluate(() => app.history.length), 1);
    assert.equal(
      await page.evaluate(() => app.history[0].steps[0].correct),
      false,
    );
    assert.equal(
      await page.evaluate(() =>
        app.history[0].steps.slice(1).every((step) => step.correct),
      ),
      true,
    );
    await page.evaluate(() => submitAnswer());
    assert.equal(await page.evaluate(() => app.history.length), 1);
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${variant} overflow at ${width}`,
      );
    }
  }
  pass(
    "All four circuit topologies: missing values, one statement, sequential steps, corrected reuse, partial credit and responsive diagrams",
  );

  await start(page, "numeric", "mixed");
  let expectedSteps = 0;
  for (let index = 0; index < 10; index++) {
    const values = await calculateMixedSteps(page);
    expectedSteps += values.length;
    for (const value of values) await submitNumeric(page, String(value));
    assert.equal(await page.evaluate(() => app.score), index + 1);
    await page.locator("#nextBtn").click();
  }
  assert.equal(await page.locator("#finalScore").textContent(), "10 / 10");
  const circuitReport = await page.evaluate(() => app.result.report);
  assert.equal(circuitReport.answers.length, 10);
  assert.equal(
    circuitReport.answers.reduce((sum, answer) => sum + answer.steps.length, 0),
    expectedSteps,
  );
  assert.ok(
    circuitReport.answers.every(
      (answer) =>
        answer.context.includes("Entre A") ||
        answer.context.includes("entre A"),
    ),
  );
  assert.ok(
    circuitReport.answers.every(
      (answer) =>
        answer.response.includes("Req") && answer.correction.includes("Req"),
    ),
  );
  const circuitDownloadPromise = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const circuitDownload = await circuitDownloadPromise;
  assert.equal(
    (await fs.readFile(await circuitDownload.path())).subarray(0, 8).toString(),
    "%PDF-1.4",
  );
  pass(
    "Complete ten-circuit series, all cascading responses/corrections in report and downloadable PDF",
  );

  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(freshUrl());
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Home overflow at ${width}`,
    );
    await page.locator(".hero-cta").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Menu overflow at ${width}`,
    );
    await page.locator('input[name="quizType"][value="equation"]').check();
    await page.locator("#startBtn").click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Quiz overflow at ${width}`,
    );
    await page.locator("#equationInput").fill("");
    await page.locator("#symbolKeys button").filter({ hasText: "ρ" }).click();
    assert.equal(await page.locator("#equationInput").inputValue(), "ρ");
  }
  pass(
    "Mobile, tablet and desktop layouts without horizontal overflow; symbol insertion",
  );

  await page.goto(freshUrl());
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open("atelier-electricite-v11");
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  for (const asset of [
    "app.js",
    "circuits.js",
    "styles.css",
    "pdf-fonts.js",
    "pdf-report.js",
  ])
    assert.ok(
      cached.some((url) => url.endsWith(asset)),
      asset + " not cached",
    );
  await context.setOffline(true);
  await page.reload();
  await page.locator(".hero-cta").click();
  await page.locator('input[name="quizTheme"][value="mixed"]').check();
  await page.locator("#startBtn").click();
  if (await page.locator("#equationAnswer").isVisible()) {
    const q = await page.evaluate(() => app.current);
    await page.locator("#equationInput").fill(q.answer);
    await page.locator("#unitInput").fill(q.unit);
    await page.locator("#validateBtn").click();
  } else if (await page.evaluate(() => app.current.kind === "cascade")) {
    for (const value of await calculateMixedSteps(page))
      await submitNumeric(page, String(value));
  } else
    await submitNumeric(
      page,
      String(await page.evaluate(() => app.current.answer)),
    );
  assert.equal(await page.evaluate(() => app.answered), true);
  await context.setOffline(false);
  pass(
    "Offline reload, cached app/PDF assets and functional answer validation",
  );
  assert.deepEqual(errors, []);
  pass("No browser JavaScript errors");
  console.log(`\n${testResults.length} checks passed.`);
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.close();
  });
