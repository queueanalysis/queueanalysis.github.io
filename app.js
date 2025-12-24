const models = [
  {
    id: "mm1_inf",
    label: "M/M/1:GD/∞/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("mu", "Service rate μ", { positive: true })
    ],
    compute: computeMm1Infinite
  },
  {
    id: "mm1_n",
    label: "M/M/1:GD/N/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("mu", "Service rate μ", { positive: true }),
      param("N", "System capacity N", { integer: true, min: 1 })
    ],
    compute: computeMm1Finite
  },
  {
    id: "mmc_inf",
    label: "M/M/c:GD/∞/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("mu", "Service rate μ", { positive: true }),
      param("c", "Servers c", { integer: true, min: 1 })
    ],
    compute: computeMmcInfinite
  },
  {
    id: "mmc_n",
    label: "M/M/c:GD/N/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("mu", "Service rate μ", { positive: true }),
      param("c", "Servers c", { integer: true, min: 1 }),
      param("N", "System capacity N (≥ c)", { integer: true, min: 1 })
    ],
    compute: computeMmcFinite
  },
  {
    id: "mminf",
    label: "M/M/∞:GD/∞/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("mu", "Service rate μ", { positive: true })
    ],
    compute: computeMminf
  },
  {
    id: "mmr_repair",
    label: "M/M/R:GD/K/K",
    params: [
      param("lambda", "Failure/arrival rate λ", { positive: true }),
      param("mu", "Repair rate μ", { positive: true }),
      param("R", "Servers R (repairers)", { integer: true, min: 1 }),
      param("K", "Population size K (units)", { integer: true, min: 1 })
    ],
    compute: computeMmrRepair
  },
  {
    id: "mg1_pk",
    label: "M/G/1:GD/∞/∞",
    params: [
      param("lambda", "Arrival rate λ", { positive: true }),
      param("meanService", "E{t} (service mean)", { positive: true }),
      param("varService", "Var{t} (service variance)", { min: 0 })
    ],
    compute: computeMg1Pk
  }
];

const modelSelect = document.getElementById("modelSelect");
const paramsContainer = document.getElementById("paramsContainer");
const validationSummary = document.getElementById("validationSummary");
const resultsSummary = document.getElementById("resultsSummary");
const pnList = document.getElementById("pnList");
const statusBadge = document.getElementById("statusBadge");
const copyResultsBtn = document.getElementById("copyResultsBtn");
const pdfResultsBtn = document.getElementById("pdfResultsBtn");
const formulaModal = document.getElementById("formulaModal");
const formulaBody = document.getElementById("formulaBody");
const formulaTitle = document.getElementById("formulaTitle");
const closeFormula = document.getElementById("closeFormula");
const compareStatus = document.getElementById("compareStatus");
const saveSlotA = document.getElementById("saveSlotA");
const saveSlotB = document.getElementById("saveSlotB");
const compareCanvas = document.getElementById("compareChart");
const copyCompareBtn = document.getElementById("copyCompareBtn");
const pdfCompareBtn = document.getElementById("pdfCompareBtn");
const downloadGraphBtn = document.getElementById("downloadGraphBtn");

const computeButtons = [document.getElementById("computeBtn")];
const resetButtons = [document.getElementById("resetBtn")];

let lastResult = null;
const compareSlots = { A: null, B: null };
let compareChart = null;

/**
 * Creates a parameter definition object for queueing model inputs.
 * @param {string} id - Unique identifier for the parameter
 * @param {string} label - Display label for the parameter
 * @param {Object} rules - Validation rules (positive, integer, min, etc.)
 * @returns {Object} Parameter definition object
 */
function param(id, label, rules = {}) {
  return { id, label, rules };
}

/**
 * Populates the model selection dropdown with available queueing models.
 */
function renderModelOptions() {
  models.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    modelSelect.appendChild(opt);
  });
}

/**
 * Renders input fields for the selected model's parameters.
 * @param {string} modelId - ID of the selected model
 */
function renderParams(modelId) {
  paramsContainer.innerHTML = "";
  if (!modelId) return;
  const model = models.find((m) => m.id === modelId);
  model.params.forEach((p) => {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `
      <label for="${p.id}">${p.label}</label>
      <input data-param="${p.id}" id="${p.id}" inputmode="decimal" placeholder="Enter ${p.label}">
      <div class="hint">${hintForRule(p.rules)}</div>
    `;
    paramsContainer.appendChild(field);
  });
}

/**
 * Generates a hint message based on validation rules.
 * @param {Object} rules - Validation rules object
 * @returns {string} Hint message for the input field
 */
function hintForRule(rules) {
  if (rules.integer) return "Required. Integer.";
  if (rules.positive) return "Required. > 0.";
  if (rules.min !== undefined) return `Required. ≥ ${rules.min}.`;
  return "Required.";
}

/**
 * Reads and validates input values from the parameter fields.
 * @param {Object} model - Model object containing parameter definitions
 * @returns {Object} Object containing validated values and error messages
 */
function readInputs(model) {
  const values = {};
  const errors = [];
  model.params.forEach((p) => {
    const input = paramsContainer.querySelector(`[data-param="${p.id}"]`);
    if (!input) return;
    input.classList.remove("error");
    const raw = input.value.trim();
    if (!raw) {
      errors.push(`${p.label} is required.`);
      input.classList.add("error");
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      errors.push(`${p.label} must be numeric.`);
      input.classList.add("error");
      return;
    }
    if (p.rules.positive && num <= 0) {
      errors.push(`${p.label} must be > 0.`);
      input.classList.add("error");
    }
    if (p.rules.min !== undefined && num < p.rules.min) {
      errors.push(`${p.label} must be ≥ ${p.rules.min}.`);
      input.classList.add("error");
    }
    if (p.rules.integer && !Number.isInteger(num)) {
      errors.push(`${p.label} must be an integer.`);
      input.classList.add("error");
    }
    values[p.id] = num;
  });
  return { values, errors };
}

/**
 * Displays validation messages to the user.
 * @param {string|Array<string>} messages - Validation message(s) to display
 * @param {string} type - Message type: "warn" or "error"
 */
function showValidation(messages, type = "warn") {
  if (!messages || messages.length === 0) {
    validationSummary.classList.add("hidden");
    return;
  }
  validationSummary.className = `note ${type === "error" ? "error" : ""}`;
  validationSummary.innerHTML = Array.isArray(messages) ? messages.join("<br>") : messages;
}

/**
 * Updates the status badge with text and styling level.
 * @param {string} text - Status text to display
 * @param {string} level - Badge level: "neutral", "good", "warn", or "error"
 */
function setStatusBadge(text, level = "neutral") {
  statusBadge.textContent = text;
  statusBadge.className = `badge ${level}`;
}

/**
 * Renders computation results including metrics and probability distributions.
 * @param {Object} result - Computation result object with metrics and pn array
 */
function renderResults(result) {
  resultsSummary.classList.remove("empty");
  const metrics = [
    ["p0", result.p0],
    ["pN", result.pN],
    ["λeff", result.lambdaEff],
    ["λlost", result.lambdaLost],
    ["Ls", result.Ls],
    ["Lq", result.Lq],
    ["Ws", result.Ws],
    ["Wq", result.Wq],
    ["c̄", result.cBar]
  ];

  resultsSummary.innerHTML = metrics
    .map(
      ([label, value]) => `
      <div class="metric">
        <div class="metric-label">
          <div class="label">${label}</div>
          <button class="info-btn" data-metric="${label}" title="Show formula">i</button>
        </div>
        <div class="value">${formatNumber(value)}</div>
      </div>
    `
    )
    .join("");

  if (result.pn && result.pn.length) {
    pnList.classList.remove("hidden");
    const items = result.pn
      .slice(0, 21)
      .map(
        ({ n, value }) => `
        <div class="pn-item">
          <div class="label latex-label">p<sub>${n}</sub></div>
          <div class="value">${formatProbability(value)}</div>
        </div>
      `
      )
      .join("");
    pnList.innerHTML = `<h3>\\(p_n\\) (\\(n \\leq 20\\))</h3><div class="pn-grid">${items}</div>`;
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([pnList]).catch(() => {});
    }
  } else {
    pnList.classList.add("hidden");
    pnList.innerHTML = "";
  }

  if (result.warnings && result.warnings.length) {
    showValidation(result.warnings, "warn");
  } else {
    showValidation([]);
  }
}

/**
 * Resets all inputs, outputs, and comparison data to initial state.
 */
function resetAll() {
  modelSelect.value = "";
  paramsContainer.innerHTML = "";
  resultsSummary.classList.add("empty");
  resultsSummary.innerHTML = `<p class="muted">Select a model, enter parameters, then click Compute.</p>`;
  pnList.classList.add("hidden");
  pnList.innerHTML = "";
  showValidation([]);
  setStatusBadge("Waiting for inputs", "neutral");
  lastResult = null;
  compareSlots.A = null;
  compareSlots.B = null;
  updateCompareStatus();
  clearCompareChart();
  toggleCompareActions();
}

/**
 * Handles the compute button click: validates inputs and computes queueing metrics.
 */
function handleCompute() {
  const modelId = modelSelect.value;
  if (!modelId) {
    showValidation(["Select a queuing model first."], "warn");
    setStatusBadge("Model not selected", "warn");
    return;
  }
  const model = models.find((m) => m.id === modelId);
  const { values, errors } = readInputs(model);
  if (errors.length) {
    showValidation(errors, "error");
    setStatusBadge("Fix validation errors", "error");
    return;
  }

  const result = model.compute(values);
  lastResult = { modelId, modelLabel: model.label, params: values, result };
  renderResults(result);
  const hasCritical = result.errors && result.errors.length;
  if (hasCritical) {
    setStatusBadge("Unstable / invalid", "error");
    showValidation(result.errors, "error");
  } else if (result.warnings && result.warnings.length) {
    setStatusBadge("Computed with warnings", "warn");
  } else {
    setStatusBadge("Computed", "good");
  }
}

computeButtons.forEach((btn) => btn.addEventListener("click", handleCompute));
resetButtons.forEach((btn) => btn.addEventListener("click", resetAll));
modelSelect.addEventListener("change", (e) => {
  renderParams(e.target.value);
  showValidation([]);
  setStatusBadge("Ready", "neutral");
});

resultsSummary.addEventListener("click", (e) => {
  const btn = e.target.closest(".info-btn");
  if (!btn || !lastResult) return;
  const metric = btn.getAttribute("data-metric");
  const formula = getFormula(metric, lastResult.modelId);
  const metricLatex = metric === "lambdaEff" ? "\\lambda_{eff}" : 
                       metric === "lambdaLost" ? "\\lambda_{lost}" : 
                       metric === "cBar" ? "\\bar{c}" : metric;
  formulaTitle.innerHTML = `\\(${metricLatex}\\) formula`;
  formulaBody.innerHTML = formula;
  formulaModal.classList.remove("hidden");
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([formulaTitle, formulaBody]).catch(() => {});
  }
});

closeFormula.addEventListener("click", () => {
  formulaModal.classList.add("hidden");
});
formulaModal.addEventListener("click", (e) => {
  if (e.target === formulaModal) formulaModal.classList.add("hidden");
});

if (copyResultsBtn) {
  copyResultsBtn.addEventListener("click", () => {
    const active = getActiveResult();
    if (!active) return showValidation(["Compute first, then copy."], "warn");
    const { result, modelLabel } = active;
    const lines = [
      `Model: ${modelLabel}`,
      `p0: ${formatNumber(result.p0)}`,
      `pN: ${formatNumber(result.pN)}`,
      `λeff: ${formatNumber(result.lambdaEff)}`,
      `λlost: ${formatNumber(result.lambdaLost)}`,
      `Ls: ${formatNumber(result.Ls)}`,
      `Lq: ${formatNumber(result.Lq)}`,
      `Ws: ${formatNumber(result.Ws)}`,
      `Wq: ${formatNumber(result.Wq)}`,
      `c̄: ${formatNumber(result.cBar)}`,
      "pn (n≤20):",
      ...(result.pn || []).slice(0, 21).map((x) => `p${x.n}: ${formatProbability(x.value)}`)
    ];
    const text = lines.join("\n");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => showValidation(["Results copied to clipboard."], "success"),
        () => {
          fallbackCopy(text);
        }
      );
    } else {
      fallbackCopy(text);
    }
  });
}

if (pdfResultsBtn) {
  pdfResultsBtn.addEventListener("click", () => {
    const active = getActiveResult();
    if (!active) return showValidation(["Compute first, then export."], "warn");
    const w = window.open("", "_blank");
    if (!w) return showValidation(["Popup blocked. Allow popups to export."], "warn");
    const { result, modelLabel } = active;
    const rows = [
      ["p₀", formatNumber(result.p0)],
      ["pN", formatNumber(result.pN)],
      ["λₑff", formatNumber(result.lambdaEff)],
      ["λₗost", formatNumber(result.lambdaLost)],
      ["Lₛ", formatNumber(result.Ls)],
      ["L_q", formatNumber(result.Lq)],
      ["Wₛ", formatNumber(result.Ws)],
      ["W_q", formatNumber(result.Wq)],
      ["c̄", formatNumber(result.cBar)]
    ]
      .map(([k, v]) => `<tr><td style="font-family:'Cambria Math','Times New Roman',serif;font-style:italic;">${k}</td><td>${v}</td></tr>`)
      .join("");
    const pnRows = chunkArray((result.pn || []).slice(0, 21), 7)
      .map(
        (chunk) =>
          `<tr>${chunk
            .map((x) => `<td style="font-family:'Cambria Math','Times New Roman',serif;font-style:italic;"><strong>p${x.n}</strong><br>${formatProbability(x.value)}</td>`)
            .join("")}</tr>`
      )
      .join("");
    w.document.write(`
      <html><head><title>${modelLabel} Results</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        td, th { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
        h1 { margin: 0 0 8px; }
        .pn-table { width: 100%; }
        .pn-table td { width: ${Math.floor(100 / 7)}%; }
      </style>
      </head><body>
      <h1>${modelLabel} Results</h1>
      <table><tbody>${rows}</tbody></table>
      <h3>pn (n ≤ 20)</h3>
      <table class="pn-table"><tbody>${pnRows}</tbody></table>
      </body></html>
    `);
    w.document.close();
    try {
      w.print();
    } catch (err) {
      showValidation(["Unable to open print dialog. Use browser print (Ctrl+P)."], "warn");
    }
  });
}

saveSlotA?.addEventListener("click", () => saveCompareSlot("A"));
saveSlotB?.addEventListener("click", () => saveCompareSlot("B"));
copyCompareBtn?.addEventListener("click", copyCompareResults);
pdfCompareBtn?.addEventListener("click", exportComparePdf);
downloadGraphBtn?.addEventListener("click", downloadCompareGraph);

renderModelOptions();
updateCompareStatus();

/**
 * Formats a number for display, handling special cases like null, infinity, and scientific notation.
 * @param {number|null|undefined} val - Value to format
 * @returns {string} Formatted number string
 */
function formatNumber(val) {
  if (val === null || val === undefined) return "—";
  if (!Number.isFinite(val)) return "∞";
  const abs = Math.abs(val);
  if ((abs !== 0 && abs < 1e-4) || abs >= 1e5) return val.toExponential(4);
  return val.toFixed(4);
}

/**
 * Formats a probability value with 6 decimal places.
 * @param {number|null|undefined} val - Probability value to format
 * @returns {string} Formatted probability string
 */
function formatProbability(val) {
  if (val === null || val === undefined) return "—";
  if (!Number.isFinite(val)) return "∞";
  return val.toFixed(6);
}

/**
 * Computes the factorial of a non-negative integer.
 * @param {number} n - Non-negative integer
 * @returns {number} Factorial of n, or NaN if n < 0
 */
function factorial(n) {
  if (n < 0) return NaN;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Computes the sum of a geometric series: 1 + r + r² + ... + r^(terms-1).
 * @param {number} r - Common ratio
 * @param {number} terms - Number of terms
 * @returns {number} Sum of the geometric series
 */
function geometricSum(r, terms) {
  if (terms <= 0) return 0;
  if (Math.abs(r - 1) < 1e-9) return terms;
  return (1 - r ** terms) / (1 - r);
}

/**
 * Computes the binomial coefficient C(n, k) = n! / (k! * (n-k)!).
 * @param {number} n - Total number of items
 * @param {number} k - Number of items to choose
 * @returns {number} Binomial coefficient
 */
function combination(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= n - (k - i);
    den *= i;
  }
  return num / den;
}

/**
 * Computes geometric probability distribution p_n = p0 * ρ^n for n = 0 to maxN.
 * @param {number} p0 - Probability of zero customers in system
 * @param {number} rho - Traffic intensity (utilization)
 * @param {number} maxN - Maximum n value to compute (default: 20)
 * @returns {Array<Object>} Array of {n, value} objects
 */
function computePnGeometric(p0, rho, maxN = 20) {
  const pn = [];
  for (let n = 0; n <= maxN; n++) {
    pn.push({ n, value: p0 * rho ** n });
  }
  return pn;
}

/**
 * Computes steady-state metrics for M/M/1:GD/∞/∞ queueing model.
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.mu - Service rate
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMm1Infinite({ lambda, mu }) {
  const rho = lambda / mu;
  const errors = [];
  const warnings = [];
  if (rho >= 1) {
    errors.push("System unstable (ρ ≥ 1). Metrics diverge.");
  }
  const p0 = 1 - rho;
  const pn = computePnGeometric(Math.max(p0, 0), rho);
  const stable = rho < 1;
  const Lq = stable ? (rho ** 2) / (1 - rho) : Infinity;
  const Ls = stable ? rho / (1 - rho) : Infinity;
  const lambdaEff = lambda;
  const Ws = stable ? 1 / (mu - lambda) : Infinity;
  const Wq = stable ? lambda / (mu * (mu - lambda)) : Infinity;
  const cBar = rho;
  return {
    p0,
    pn,
    pN: null,
    lambdaEff,
    lambdaLost: 0,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar,
    warnings,
    errors
  };
}

/**
 * Computes steady-state metrics for M/M/1:GD/N/∞ queueing model (finite capacity).
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.mu - Service rate
 * @param {number} params.N - System capacity
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMm1Finite({ lambda, mu, N }) {
  const rho = lambda / mu;
  const eps = 1e-9;
  const warnings = [];
  const errors = [];
  let p0;
  if (Math.abs(1 - rho) < eps) {
    p0 = 1 / (N + 1);
  } else {
    p0 = (1 - rho) / (1 - rho ** (N + 1));
  }
  const pn = [];
  for (let n = 0; n <= Math.min(20, N); n++) {
    pn.push({ n, value: p0 * rho ** n });
  }
  const pN = p0 * rho ** N;
  const lambdaEff = lambda * (1 - pN);
  const lambdaLost = lambda * pN;

  let Ls;
  if (Math.abs(1 - rho) < eps) {
    Ls = N / 2;
  } else {
    Ls = (rho * (1 - (N + 1) * rho ** N + N * rho ** (N + 1))) / ((1 - rho) * (1 - rho ** (N + 1)));
  }
  const busyProb = 1 - p0;
  const Lq = Ls - busyProb;
  const Ws = lambdaEff > 0 ? Ls / lambdaEff : Infinity;
  const Wq = lambdaEff > 0 ? Lq / lambdaEff : Infinity;
  const cBar = busyProb;
  if (lambdaEff < 1e-6) warnings.push("λeff is near zero; results may be numerically unstable.");
  return {
    p0,
    pn,
    pN,
    lambdaEff,
    lambdaLost,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar,
    warnings,
    errors
  };
}

/**
 * Computes steady-state metrics for M/M/c:GD/∞/∞ queueing model (multiple servers, infinite capacity).
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.mu - Service rate per server
 * @param {number} params.c - Number of parallel servers
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMmcInfinite({ lambda, mu, c }) {
  const a = lambda / mu;
  const rho = lambda / (c * mu);
  const errors = [];
  const warnings = [];
  if (rho >= 1) {
    errors.push("System unstable (ρ ≥ 1). Metrics diverge.");
  }
  let sum = 0;
  for (let n = 0; n < c; n++) sum += a ** n / factorial(n);
  const tail = (a ** c / factorial(c)) * (1 / (1 - rho));
  const p0 = 1 / (sum + tail);

  const pn = [];
  for (let n = 0; n <= 20; n++) {
    let prob;
    if (n <= c) {
      prob = p0 * (a ** n) / factorial(n);
    } else {
      prob = p0 * (a ** c / factorial(c)) * rho ** (n - c);
    }
    pn.push({ n, value: prob });
  }

  const Lq = rho >= 1 ? Infinity : ((a ** c) * rho * p0) / (factorial(c) * (1 - rho) ** 2);
  const Ls = Lq + a;
  const Wq = lambda > 0 ? Lq / lambda : Infinity;
  const Ws = Wq + 1 / mu;
  const cBar = a;
  return {
    p0,
    pn,
    pN: null,
    lambdaEff: lambda,
    lambdaLost: 0,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar,
    warnings,
    errors
  };
}

/**
 * Computes steady-state metrics for M/M/c:GD/N/∞ queueing model (multiple servers, finite capacity).
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.mu - Service rate per server
 * @param {number} params.c - Number of parallel servers
 * @param {number} params.N - System capacity (must be ≥ c)
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMmcFinite({ lambda, mu, c, N }) {
  const errors = [];
  const warnings = [];
  if (N < c) {
    errors.push("Capacity N must be ≥ c.");
  }
  const a = lambda / mu;
  const rho = a / c;

  let sum = 0;
  for (let n = 0; n < c; n++) sum += a ** n / factorial(n);
  for (let n = c; n <= N; n++) sum += a ** n / (factorial(c) * c ** (n - c));
  const p0 = 1 / sum;

  const pn = [];
  for (let n = 0; n <= Math.min(20, N); n++) {
    let prob;
    if (n <= c) {
      prob = p0 * (a ** n) / factorial(n);
    } else {
      prob = p0 * (a ** c / factorial(c)) * rho ** (n - c);
    }
    pn.push({ n, value: prob });
  }
  const pN = pn.find((x) => x.n === N)?.value ?? 0;
  const lambdaEff = lambda * (1 - pN);
  const lambdaLost = lambda * pN;

  let Ls = 0;
  for (let n = 0; n <= N; n++) {
    const prob = n <= 20 ? pn.find((x) => x.n === n)?.value ?? calcPn(n) : calcPn(n);
    Ls += n * prob;
  }

  let Lq = 0;
  for (let n = c + 1; n <= N; n++) {
    const prob = n <= 20 ? pn.find((x) => x.n === n)?.value ?? calcPn(n) : calcPn(n);
    Lq += (n - c) * prob;
  }

  const cBar = Ls - Lq;
  const Ws = lambdaEff > 0 ? Ls / lambdaEff : Infinity;
  const Wq = lambdaEff > 0 ? Lq / lambdaEff : Infinity;

  if (lambdaEff < 1e-6) warnings.push("λeff is near zero; results may be numerically unstable.");

  function calcPn(n) {
    if (n <= c) return p0 * (a ** n) / factorial(n);
    return p0 * (a ** c / factorial(c)) * rho ** (n - c);
  }

  return {
    p0,
    pn,
    pN,
    lambdaEff,
    lambdaLost,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar,
    warnings,
    errors
  };
}

/**
 * Computes steady-state metrics for M/M/∞:GD/∞/∞ queueing model (infinite servers, self-service).
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.mu - Service rate
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMminf({ lambda, mu }) {
  const a = lambda / mu;
  const p0 = Math.exp(-a);
  const pn = [];
  for (let n = 0; n <= 20; n++) {
    pn.push({ n, value: p0 * (a ** n) / factorial(n) });
  }
  const Ls = a;
  const Ws = 1 / mu;
  return {
    p0,
    pn,
    pN: null,
    lambdaEff: lambda,
    lambdaLost: 0,
    Ls,
    Lq: 0,
    Ws,
    Wq: 0,
    cBar: a,
    warnings: [],
    errors: []
  };
}

/**
 * Computes steady-state metrics for M/M/R:GD/K/K queueing model (finite-source repair shop).
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Failure/arrival rate
 * @param {number} params.mu - Repair rate per server
 * @param {number} params.R - Number of repair servers
 * @param {number} params.K - Population size (total units)
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMmrRepair({ lambda, mu, R, K }) {
  const warnings = [];
  const errors = [];
  if (R > K) {
    errors.push("Servers R must be ≤ population size K.");
  }
  const rho = lambda / mu;
  const pnRaw = [];
  for (let n = 0; n <= K; n++) {
    if (n <= R) {
      pnRaw[n] = combination(K, n) * rho ** n;
    } else {
      pnRaw[n] = combination(K, n) * (factorial(n) / (factorial(R) * R ** (n - R))) * rho ** n;
    }
  }
  const norm = pnRaw.reduce((s, v) => s + v, 0);
  const p0 = 1 / norm;
  const pn = [];
  for (let n = 0; n <= Math.min(20, K); n++) {
    pn.push({ n, value: p0 * pnRaw[n] });
  }

  let Ls = 0;
  let busy = 0;
  let Lq = 0;
  for (let n = 0; n <= K; n++) {
    const prob = p0 * pnRaw[n];
    Ls += n * prob;
    busy += Math.min(n, R) * prob;
    if (n > R) Lq += (n - R) * prob;
  }
  const lambdaEff = lambda * (K - Ls);
  const Ws = lambdaEff > 0 ? Ls / lambdaEff : Infinity;
  const Wq = lambdaEff > 0 ? Lq / lambdaEff : Infinity;
  const pN = pn.find((x) => x.n === K)?.value ?? 0;

  return {
    p0,
    pn,
    pN,
    lambdaEff,
    lambdaLost: 0,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar: busy,
    warnings,
    errors
  };
}

/**
 * Computes steady-state metrics for M/G/1:GD/∞/∞ queueing model using Pollaczek-Khinchine formula.
 * @param {Object} params - Model parameters
 * @param {number} params.lambda - Arrival rate
 * @param {number} params.meanService - Expected service time E{t}
 * @param {number} params.varService - Variance of service time Var{t}
 * @returns {Object} Computation results with metrics, warnings, and errors
 */
function computeMg1Pk({ lambda, meanService, varService }) {
  const errors = [];
  const rho = lambda * meanService;
  if (rho >= 1) errors.push("System unstable (ρ ≥ 1).");
  const p0 = Math.max(0, 1 - rho);
  const pn = computePnGeometric(p0, rho);
  const Lq = errors.length
    ? Infinity
    : (lambda ** 2 * varService + rho ** 2) / (2 * (1 - rho));
  const Wq = errors.length ? Infinity : Lq / lambda;
  const Ws = errors.length ? Infinity : Wq + meanService;
  // Pollaczek-Khintchine formula for L_s
  const Ls = errors.length 
    ? Infinity 
    : rho + (lambda ** 2 * (meanService ** 2 + varService)) / (2 * (1 - rho));
  return {
    p0,
    pn,
    pN: null,
    lambdaEff: lambda,
    lambdaLost: 0,
    Ls,
    Lq,
    Ws,
    Wq,
    cBar: rho,
    warnings,
    errors
  };
}

/**
 * Retrieves the LaTeX formula for a given metric and model.
 * @param {string} metric - Metric identifier (p0, pN, Ls, Lq, Ws, Wq, cBar, lambdaEff, lambdaLost)
 * @param {string} modelId - Model identifier
 * @returns {string} LaTeX formula wrapped in MathJax delimiters
 */
function getFormula(metric, modelId) {
  const m = modelId;
  const mml = (s) => `$$${s}$$`;
  if (metric === "λeff" || metric === "lambdaEff") metric = "lambdaEff";
  if (metric === "λlost" || metric === "lambdaLost") metric = "lambdaLost";
  switch (metric) {
    case "p0":
      if (m === "mm1_inf") return mml("p_0 = 1 - \\rho,\\; \\rho = \\lambda/\\mu < 1");
      if (m === "mm1_n") return mml("p_0 = \\frac{1-\\rho}{1-\\rho^{N+1}},\\; \\rho=\\lambda/\\mu");
      if (m === "mmc_inf") return mml("p_0 = \\left[\\sum_{n=0}^{c-1} \\frac{(\\lambda/\\mu)^n}{n!} + \\frac{(\\lambda/\\mu)^c}{c!(1-\\rho)}\\right]^{-1},\\; \\rho=\\lambda/(c\\mu)");
      if (m === "mmc_n")
        return mml(
          "p_0 = \\left[\\sum_{n=0}^{c-1} \\frac{(\\lambda/\\mu)^n}{n!} + \\frac{(\\lambda/\\mu)^c (1-(\\frac{\\lambda}{c\\mu})^{N-c+1})}{c!(1-\\frac{\\lambda}{c\\mu})}\\right]^{-1}"
        );
      if (m === "mminf") return mml("p_0 = e^{-\\lambda/\\mu}");
      if (m === "mmr_repair") return mml("p_0 = \\left[ \\sum_{n=0}^{R} \\binom{K}{n}\\rho^n + \\sum_{n=R+1}^{K} \\binom{K}{n} \\frac{n!}{R!R^{n-R}} \\rho^n \\right]^{-1},\\; \\rho=\\lambda/\\mu");
      if (m === "mg1_pk") return mml("p_0 = 1-\\rho,\\; \\rho = \\lambda E\\{t\\}");
      break;
    case "pN":
      if (m === "mm1_inf") return mml("p_n = p_0 \\rho^n,\\; \\rho = \\lambda/\\mu");
      if (m === "mmc_inf")
        return mml(
          "p_n = \\begin{cases} \\frac{(\\lambda/\\mu)^n}{n!} p_0, & n \\le c \\\\ \\frac{(\\lambda/\\mu)^n}{c! c^{n-c}} p_0, & n > c \\end{cases}"
        );
      if (m === "mminf") return mml("p_n = \\frac{(\\lambda/\\mu)^n}{n!} e^{-\\lambda/\\mu}");
      if (m === "mm1_n") return mml("p_N = p_0 \\rho^N");
      if (m === "mmc_n")
        return mml(
          "p_n = \\begin{cases} \\frac{(\\lambda/\\mu)^n}{n!} p_0, & n \\le c \\\\ \\frac{(\\lambda/\\mu)^n}{c! c^{n-c}} p_0, & N \\ge n > c \\end{cases}"
        );
      if (m === "mmr_repair")
        return mml(
          "p_n = \\begin{cases} \\binom{K}{n} \\rho^n p_0, & 0 \\le n \\le R \\\\ \\binom{K}{n} \\frac{n!}{R! R^{n-R}} \\rho^n p_0, & R < n \\le K \\end{cases},\\; \\rho = \\lambda/\\mu"
        );
      if (m === "mg1_pk") return mml("p_n = (\\lambda E\\{t\\})^n (1 - \\lambda E\\{t\\}),\\; n = 0,1,2,\\ldots");
      return mml("Not applicable (∞ capacity).");
    case "lambdaEff":
      if (m === "mm1_n" || m === "mmc_n") return mml("\\lambda_{eff} = \\lambda (1 - p_N)");
      if (m === "mmr_repair") return mml("\\lambda_{eff} = \\lambda (K - L_s)");
      return mml("\\lambda_{eff} = \\lambda");
    case "lambdaLost":
      if (m === "mm1_n" || m === "mmc_n") return mml("\\lambda_{lost} = \\lambda p_N");
      return mml("\\lambda_{lost} = 0");
    case "Ls":
      if (m === "mm1_inf") return mml("L_s = \\frac{\\rho}{1-\\rho}");
      if (m === "mm1_n") return mml("L_s = \\frac{\\rho (1 - (N+1)\\rho^N + N \\rho^{N+1})}{(1-\\rho)(1-\\rho^{N+1})}");
      if (m === "mmc_inf") return mml("L_s = L_q + \\frac{\\lambda}{\\mu}");
      if (m === "mmc_n") return mml("L_s = \\sum_{n=0}^{N} n p_n");
      if (m === "mminf") return mml("L_s = \\lambda/\\mu");
      if (m === "mmr_repair") return mml("L_s = \\sum_{n=0}^{K} n p_n");
      if (m === "mg1_pk") return mml("L_s = \\lambda E\\{t\\} + \\frac{\\lambda^2(E\\{t\\}^2 + Var\\{t\\})}{2(1-\\lambda E\\{t\\})}");
      break;
    case "Lq":
      if (m === "mm1_inf") return mml("L_q = \\frac{\\rho^2}{1-\\rho}");
      if (m === "mm1_n") return mml("L_q = L_s - (1 - p_0)");
      if (m === "mmc_inf")
        return mml(
          "L_q = \\frac{\\lambda^{c+1}}{(c - \\lambda/\\mu)^2 (c-1)! \\mu^{c+1}} p_0"
        );
      if (m === "mmc_n") return mml("L_q = L_s - \\sum_{n=0}^{c} n p_n - \\sum_{n=c+1}^{N} c p_n + c p_c");
      if (m === "mminf") return mml("L_q = 0");
      if (m === "mmr_repair") return mml("L_q = \\sum_{n=R+1}^{K} (n-R) p_n");
      if (m === "mg1_pk") return mml("L_q = \\frac{\\lambda^2 Var\\{t\\} + \\rho^2}{2(1-\\rho)}");
      break;
    case "Ws":
      if (m === "mm1_inf") return mml("W_s = \\frac{1}{\\mu - \\lambda}");
      if (m === "mm1_n") return mml("W_s = \\frac{L_s}{\\lambda(1-p_N)}");
      if (m === "mmc_inf") return mml("W_s = W_q + \\frac{1}{\\mu}");
      if (m === "mmc_n") return mml("W_s = \\frac{L_s}{\\lambda(1-p_N)}");
      if (m === "mminf") return mml("W_s = 1/\\mu");
      if (m === "mmr_repair") return mml("W_s = \\frac{L_s}{\\lambda(K-L_s)}");
      if (m === "mg1_pk") return mml("W_s = W_q + E\\{t\\}");
      break;
    case "Wq":
      if (m === "mm1_inf") return mml("W_q = \\frac{\\lambda}{\\mu(\\mu-\\lambda)}");
      if (m === "mm1_n") return mml("W_q = \\frac{L_q}{\\lambda(1-p_N)}");
      if (m === "mmc_inf") return mml("W_q = L_q / \\lambda");
      if (m === "mmc_n") return mml("W_q = \\frac{L_q}{\\lambda(1-p_N)}");
      if (m === "mminf") return mml("W_q = 0");
      if (m === "mmr_repair") return mml("W_q = \\frac{L_q}{\\lambda(K-L_s)}");
      if (m === "mg1_pk") return mml("W_q = L_q / \\lambda");
      break;
    case "c̄":
      if (m === "mm1_inf") return mml("\\bar{c} = \\rho");
      if (m === "mm1_n") return mml("\\bar{c} = 1 - p_0");
      if (m === "mmc_inf") return mml("\\bar{c} = \\lambda/\\mu");
      if (m === "mmc_n") return mml("\\bar{c} = L_s - L_q");
      if (m === "mminf") return mml("\\bar{c} = \\lambda/\\mu");
      if (m === "mmr_repair") return mml("\\bar{c} = \\sum_{n=0}^{K} \\min(n,R) p_n");
      if (m === "mg1_pk") return mml("\\bar{c} = \\rho");
      break;
    default:
      return mml("Formula not available.");
  }
  return mml("Formula not available.");
}

/**
 * Fallback method to copy text to clipboard when Clipboard API is unavailable.
 * @param {string} text - Text to copy
 */
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-1000px";
  document.body.appendChild(ta);
  ta.select();
  try {
    const ok = document.execCommand("copy");
    showValidation([ok ? "Results copied to clipboard." : "Clipboard unavailable."], ok ? "success" : "warn");
  } catch {
    showValidation(["Clipboard unavailable."], "warn");
  }
  document.body.removeChild(ta);
}

/**
 * Gets the currently active result (last computed or from comparison slots).
 * @returns {Object|null} Active result object or null
 */
function getActiveResult() {
  return lastResult || compareSlots.B || compareSlots.A;
}

/**
 * Splits an array into chunks of specified size.
 * @param {Array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Array of chunks
 */
function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

/**
 * Ensures both Model A and Model B are set for comparison.
 * @returns {Object|null} Object with models a and b, or null if not both set
 */
function ensureBothModels() {
  const a = compareSlots.A;
  const b = compareSlots.B;
  if (!a || !b) {
    showValidation(["Set both Model A and Model B first."], "warn");
    return null;
  }
  return { a, b };
}

/**
 * Copies comparison results (Model A vs Model B) to clipboard.
 */
function copyCompareResults() {
  const models = ensureBothModels();
  if (!models) return;
  const { a, b } = models;
  const metrics = ["p0","pN","lambdaEff","lambdaLost","Ls","Lq","Ws","Wq","cBar"];
  const label = (key) => (key === "lambdaEff" ? "λeff" : key === "lambdaLost" ? "λlost" : key === "cBar" ? "c̄" : key);
  const lines = [`Model A: ${a.modelLabel}`, ...metrics.map(k => `${label(k)}: ${formatNumber(a.result[k])}`), "", `Model B: ${b.modelLabel}`, ...metrics.map(k => `${label(k)}: ${formatNumber(b.result[k])}`)];
  const text = lines.join("\n");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(
      () => showValidation(["Comparison copied to clipboard."], "success"),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

/**
 * Exports comparison results as PDF by opening print dialog.
 */
function exportComparePdf() {
  const models = ensureBothModels();
  if (!models) return;
  const { a, b } = models;
  const w = window.open("", "_blank");
  if (!w) return showValidation(["Popup blocked. Allow popups to export."], "warn");
  const metrics = [
    ["p0","p0"],["pN","pN"],["lambdaEff","λeff"],["lambdaLost","λlost"],["Ls","Ls"],["Lq","Lq"],["Ws","Ws"],["Wq","Wq"],["cBar","c̄"]
  ];
  const rows = metrics.map(([k, label]) => `<tr><td>${label}</td><td>${formatNumber(a.result[k])}</td><td>${formatNumber(b.result[k])}</td></tr>`).join("");
  w.document.write(`
    <html><head><title>Queuing Model Comparison</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      td, th { border: 1px solid #ccc; padding: 6px 8px; }
      h1, h2 { margin: 0 0 8px; }
    </style>
    </head><body>
    <h1>Queuing Model Comparison</h1>
    <table><thead><tr><th>Metric</th><th>${a.modelLabel}</th><th>${b.modelLabel}</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>
  `);
  w.document.close();
  try {
    w.print();
  } catch (err) {
    showValidation(["Unable to open print dialog. Use browser print (Ctrl+P)."], "warn");
  }
}

/**
 * Downloads the comparison chart as a PNG image.
 */
function downloadCompareGraph() {
  const models = ensureBothModels();
  if (!models) return;
  if (!compareChart || !compareCanvas) return showValidation(["Chart not ready. Set both models first."], "warn");
  const link = document.createElement("a");
  link.href = compareCanvas.toDataURL("image/png");
  link.download = "comparison.png";
  link.click();
}

/**
 * Saves the last computed result to a comparison slot (A or B).
 * @param {string} slot - Slot identifier: "A" or "B"
 */
function saveCompareSlot(slot) {
  if (!lastResult) return showValidation([`Compute first, then set ${slot}.`], "warn");
  compareSlots[slot] = lastResult;
  updateCompareStatus();
  renderCompareChart();
  toggleCompareActions();
}

/**
 * Updates the comparison status display with current Model A and B labels.
 */
function updateCompareStatus() {
  const a = compareSlots.A ? compareSlots.A.modelLabel : "—";
  const b = compareSlots.B ? compareSlots.B.modelLabel : "—";
  if (compareStatus) {
    const aLatex = a === "—" ? "—" : `\\(${a}\\)`;
    const bLatex = b === "—" ? "—" : `\\(${b}\\)`;
    compareStatus.innerHTML = `Model A: ${aLatex} | Model B: ${bLatex}`;
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([compareStatus]).catch(() => {});
    }
  }
}

/**
 * Renders a bar chart comparing metrics between Model A and Model B.
 */
function renderCompareChart() {
  if (!compareCanvas) return;
  const a = compareSlots.A;
  const b = compareSlots.B;
  if (!a || !b) {
    if (compareChart) {
      compareChart.destroy();
      compareChart = null;
    }
    toggleCompareActions();
    return;
  }
  if (!window.Chart) {
    showValidation(["Chart.js not available; comparison chart cannot render."], "warn");
    return;
  }
  const primary = getCssVar("--accent") || "rgba(43,76,126,0.8)";
  const secondary = getCssVar("--accent-alt") || "rgba(229,233,242,0.85)";
  const gridColor = "rgba(229,233,242,0.25)";
  const textColor = "#e5e9f2";
  const metrics = ["Ls", "Lq", "Ws", "Wq", "cBar"];
  const labels = ["Ls", "Lq", "Ws", "Wq", "c̄"];
  const dataA = metrics.map((m) => a.result[m]);
  const dataB = metrics.map((m) => b.result[m]);
  if (compareChart) compareChart.destroy();
  compareChart = new Chart(compareCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: a.modelLabel, data: dataA, backgroundColor: primary },
        { label: b.modelLabel, data: dataB, backgroundColor: secondary }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
        x: { grid: { display: false }, ticks: { color: textColor } }
      }
    }
  });
  toggleCompareActions();
}

/**
 * Destroys and clears the comparison chart.
 */
function clearCompareChart() {
  if (compareChart) {
    compareChart.destroy();
    compareChart = null;
  }
}

/**
 * Shows or hides comparison action buttons based on whether both models are set.
 */
function toggleCompareActions() {
  const hasBoth = !!(compareSlots.A && compareSlots.B);
  [copyCompareBtn, pdfCompareBtn, downloadGraphBtn].forEach((btn) => {
    if (!btn) return;
    if (hasBoth) btn.classList.remove("hidden");
    else btn.classList.add("hidden");
  });
}

/**
 * Gets a CSS custom property value from the document root.
 * @param {string} name - CSS variable name (e.g., "--accent")
 * @returns {string} CSS variable value or empty string
 */
function getCssVar(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v ? v.trim() : "";
}
