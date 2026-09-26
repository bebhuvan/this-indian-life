// Cross-field number-consistency guard (new — no academy equivalent).
//
// Catches a document that states two materially different magnitudes for what is almost
// certainly the SAME quantity: "$2 trillion" in one chart and "$2.5 trillion" in the next,
// or "30,000 tonnes" vs "31,000 tonnes" in one file. A human editor would pin one figure.
//
// Warn-only and deliberately HIGH-PRECISION, because a naive unit-only heuristic drowns in
// false positives (an energy article mentions dozens of different GW/TWh values; a trade
// article dozens of different $ values). Three guards keep it precise:
//   1. Only high-signal, low-frequency units: money (USD trillion/billion, INR lakh
//      crore/crore) and large tonnages. No %, no GW/MW/TWh/km/kg (they recur constantly).
//   2. Only NEAR-MISS pairs: a relative gap bigger than rounding but small enough to look
//      like drift of one quantity, not two different quantities ("$2T vs $2.5T" = 25%,
//      flagged; "$2T vs $5T" = 150%, not).
//   3. The two figures must share a CONTEXT WORD (a content word in the ~30 chars before
//      each), so "$2 trillion private gold" and "$2.5 trillion gold hoard" pair up, but
//      "$2 billion exports" and "$2.3 billion imports" do not.

const STOPWORDS = new Set(["about","around","roughly","nearly","over","under","some","only","just","more","than","less","worth","value","valued","total","almost","up","to","the","a","an","of","in","and","or","is","are","was","were","at","on","for","with","that","this","its","it","by","from","some","estimated","approximately","close","near"]);

// Each matcher captures (contextBefore, number, scaleWord, contextAfter). Context is taken
// on BOTH sides because the referent noun can lead ("private gold worth $2 trillion") or
// trail ("30,000 tonnes of gold") the figure.
const MATCHERS = [
  { re: /([\p{L}\s,'"()-]{0,30})\$\s?(\d+(?:\.\d+)?)\s*(trillion|billion)\b([\p{L}\s,'"()-]{0,30})/giu, bucket: (m) => `usd-${m[3].toLowerCase()}` },
  { re: /([\p{L}\s,'"()-]{0,30})₹\s?(\d+(?:\.\d+)?)\s*(lakh crore|crore)\b([\p{L}\s,'"()-]{0,30})/giu, bucket: (m) => `inr-${m[3].toLowerCase().replace(/\s+/g, "-")}` },
  { re: /([\p{L}\s,'"()-]{0,30})(\d[\d,]*(?:\.\d+)?)\s*(tonnes?)\b([\p{L}\s,'"()-]{0,30})/giu, bucket: () => "tonnes" },
];

const NEAR_MISS_MIN = 0.02; // below this = same number (rounding), not a contradiction
const NEAR_MISS_MAX = 0.5;  // above this = probably two different quantities, don't flag
const TONNES_MIN = 100;     // only headline-scale tonnages (the gold case was ~30,000t)

function contextWords(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^\p{L}]+/u)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function shareWord(a, b) {
  for (const w of a) if (b.has(w)) return true;
  return false;
}

export function checkNumberConsistency(texts, { nearMissMin = NEAR_MISS_MIN, nearMissMax = NEAR_MISS_MAX } = {}) {
  const buckets = new Map(); // bucketKey -> [{ value, raw, ctx }]
  for (const t of texts) {
    const s = String(t || "");
    for (const { re, bucket } of MATCHERS) {
      re.lastIndex = 0;
      for (const m of s.matchAll(re)) {
        const value = Number(String(m[2]).replace(/,/g, ""));
        if (!Number.isFinite(value) || value === 0) continue;
        const key = bucket(m);
        if (key === "tonnes" && value < TONNES_MIN) continue;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push({ value, raw: `${m[2].trim()} ${m[3]}`.trim(), ctx: contextWords(`${m[1]} ${m[4]}`) });
      }
    }
  }

  const findings = [];
  const seenPairs = new Set();
  for (const [key, entries] of buckets) {
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i];
        const b = entries[j];
        const hi = Math.max(a.value, b.value);
        const lo = Math.min(a.value, b.value);
        const rel = (hi - lo) / hi;
        if (rel <= nearMissMin || rel >= nearMissMax) continue; // equal, or too far apart
        if (!shareWord(a.ctx, b.ctx)) continue;                 // different referents
        const pairKey = `${key}:${[a.raw, b.raw].sort().join("|")}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);
        findings.push({
          rule: "number-inconsistency",
          severity: "warn",
          match: `${a.raw} vs ${b.raw}`,
          hint: `The document states "${a.raw}" and "${b.raw}" for what looks like the same quantity (${Math.round(rel * 100)}% apart). Pin one figure, or make clear they are different quantities.`,
        });
      }
    }
  }
  return findings;
}
