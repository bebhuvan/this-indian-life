// Accounting-identity guard (Layer 4 of docs/DATA_INTEGRITY_GUARDRAILS.md).
//
// Some national-accounts numbers relate by definitional identities (GDP = NDP + depreciation;
// GNI = GDP minus net income paid abroad). Each number can be sourced correctly and yet NOT
// tie, because they are different vintages (the real failure: GDP for FY26 minus a CFC still
// dated FY24 did not equal NDP). This checks the identities on the LATEST value of each series
// and returns human warnings plus same-vintage derived figures to use instead.
//
// Lifted verbatim from the academy generator so both it and the main article generator share
// one implementation. Both work with the same econ.nas.* indicator ids.

const LC = 1e12; // one lakh crore in rupees

// Pick the most-recent locked number per indicator (prefer a label that says "latest").
export function latestByIndicator(lockedNumbers) {
  const map = new Map();
  for (const n of lockedNumbers) {
    if (!n.indicatorId) continue;
    const cur = map.get(n.indicatorId);
    const nLatest = /latest/i.test(n.label || "");
    if (!cur) { map.set(n.indicatorId, n); continue; }
    const curLatest = /latest/i.test(cur.label || "");
    if (nLatest && !curLatest) { map.set(n.indicatorId, n); continue; }
    if (nLatest === curLatest && String(n.date || "") > String(cur.date || "")) map.set(n.indicatorId, n);
  }
  return map;
}

export function checkNasIdentities(lockedNumbers) {
  const m = latestByIndicator(lockedNumbers);
  const lc = (v) => `₹${(v / LC).toFixed(1)} lakh crore`;
  const warnings = [];
  const derived = [];

  const gdp = m.get("econ.nas.gdp_nominal");
  const ndp = m.get("econ.nas.ndp_nominal");
  const cfc = m.get("econ.nas.cfc_nominal");
  if (gdp && ndp && cfc) {
    const off = Math.abs(gdp.value - (ndp.value + cfc.value)) / gdp.value;
    if (off > 0.01) {
      warnings.push(`GDP (${gdp.displayValue}, ${gdp.date}) does not equal NDP (${ndp.displayValue}, ${ndp.date}) + CFC (${cfc.displayValue}, ${cfc.date}); off by ${(off * 100).toFixed(1)}%, a vintage mismatch (CFC dated ${cfc.date}). Do NOT present GDP minus that CFC as equal to NDP.`);
      const gap = gdp.value - ndp.value;
      derived.push({ label: "Depreciation, latest year (GDP minus NDP, same vintage)", value: gap, displayValue: lc(gap), date: gdp.date, unit: "rupees", sourceId: gdp.sourceId, indicatorId: "derived.cfc_consistent", note: "Definitional identity GDP = NDP + depreciation. Use this same-year figure, not the separately-dated CFC." });
    }
  }

  const gni = m.get("econ.nas.gni_nominal");
  const ipa = m.get("econ.nas.income_paid_abroad_nominal");
  if (gdp && gni && ipa) {
    const off = Math.abs((gdp.value - ipa.value) - gni.value) / gdp.value;
    if (off > 0.01) warnings.push(`GNI does not tie: GDP minus net income paid abroad does not equal GNI (off ${(off * 100).toFixed(1)}%).`);
  }

  return { warnings, derived };
}
