export default function Methodology() {
  return (
    <>
      <h1>Methodology</h1>
      <div className="sub">What this dataset is — and what it is not.</div>

      <h2>Scope</h2>
      <p style={{ maxWidth: 680, lineHeight: 1.6 }}>
        Publicly disclosed institutional votes at shareholder meetings of
        Spanish-listed companies. Universe = equity instruments with a live
        XMAD/BME listing (per OpenInstrument) ∪ curated seeds — deliberately
        not <code>ISIN LIKE 'ES%'</code>: Ferrovial (NL) and ArcelorMittal (LU)
        are in the universe.
      </p>

      <h2>Absence semantics</h2>
      <p style={{ maxWidth: 680, lineHeight: 1.6 }}>
        <code>NOT_OBSERVED</code> ≠ "did not vote" ≠ "abstain". A fund that
        does not publish itemized votes produces no rows. An empty direction
        is only rendered <code>DO_NOT_VOTE</code> when the source explicitly
        states the fund did not vote (VDS <code>(Blanks)</code> row).
      </p>

      <h2>Disclosure levels</h2>
      <p style={{ maxWidth: 680, lineHeight: 1.6 }}>
        SRD II permits significance filtering. Each reporter×season carries a
        declared <code>disclosure_level</code>
        (ITEMIZED / SIGNIFICANT_ONLY / SUMMARY_ONLY / NONE_PUBLISHED) plus the
        documented criteria when the manager publishes them. Comparisons are
        computed on observed intersections only.
      </p>

      <h2>Provenance</h2>
      <p style={{ maxWidth: 680, lineHeight: 1.6 }}>
        Every vote carries an observation: source, document, URL, retrieval
        timestamp, parser version, content hash. Canonical IDs are deterministic
        content hashes; the dataset rebuilds reproducibly from raw artifacts.
      </p>

      <h2>Not ownership</h2>
      <p style={{ maxWidth: 680, lineHeight: 1.6 }}>
        Ownership/holdings ≠ shares entitled to vote ≠ shares voted. This
        product records voting behaviour only; share counts are displayed as
        reported and never compared across source types.
      </p>
    </>
  );
}
