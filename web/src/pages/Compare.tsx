import { useEffect, useState } from "react";
import { api, CompareResult, ReporterRow } from "../api";

export default function Compare() {
  const [reps, setReps] = useState<ReporterRow[]>([]);
  const [a, setA] = useState("CaixaBank");
  const [b, setB] = useState("BBVA");
  const [res, setRes] = useState<CompareResult>();
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.reporters().then(r => setReps(r.reporters)); }, []);

  function run() {
    setLoading(true);
    api.compare(a, b).then(r => { setRes(r); setLoading(false); });
  }

  return (
    <>
      <h1>Compare reporters</h1>
      <div className="sub">
        Observed intersection only: same meeting + proposal where both
        disclosed. Disclosure levels differ — this is not a ranking.
      </div>
      <div className="compare-pickers">
        <select value={a} onChange={e => setA(e.target.value)}>
          {reps.map(r => <option key={r.reporter_id}
            value={r.canonical_name}>{r.canonical_name}</option>)}
          <option value="CaixaBank">CaixaBank</option>
          <option value="BBVA">BBVA</option>
          <option value="BlackRock">BlackRock</option>
          <option value="Vanguard">Vanguard</option>
        </select>
        <span className="meta">vs</span>
        <select value={b} onChange={e => setB(e.target.value)}>
          {reps.map(r => <option key={r.reporter_id}
            value={r.canonical_name}>{r.canonical_name}</option>)}
          <option value="BBVA">BBVA</option>
          <option value="CaixaBank">CaixaBank</option>
          <option value="BlackRock">BlackRock</option>
          <option value="Vanguard">Vanguard</option>
        </select>
        <button onClick={run} disabled={loading}>
          {loading ? "…" : "compare"}
        </button>
      </div>

      {res && (
        <>
          <div className="stats" style={{ marginTop: 20 }}>
            <div className="stat"><div className="v">
              {res.common_disclosed_proposals}</div>
              <div className="k">common proposals</div></div>
            <div className="stat"><div className="v">
              {res.observed_agreement != null
                ? (res.observed_agreement * 100).toFixed(1) + "%" : "—"}</div>
              <div className="k">observed agreement</div></div>
            <div className="stat"><div className="v">
              {res.different_direction}</div><div className="k">divergent</div></div>
            <div className="stat"><div className="v">
              {res.issuers_compared}</div><div className="k">issuers</div></div>
          </div>
          <div className="note">{res.caveat}</div>
          <h2>Divergences</h2>
          <div className="table-scroll" tabIndex={0}><table>
            <thead><tr><th>issuer</th><th>date</th><th>proposal</th>
              <th>{a}</th><th>{b}</th></tr></thead>
            <tbody>
              {res.proposals.filter(p => p.vote_a !== p.vote_b).map(p => (
                <tr key={p.proposal_id + p.issuer}>
                  <td>{p.issuer}</td>
                  <td className="mono">{p.meeting_date}</td>
                  <td style={{ maxWidth: 380 }}>{p.proposal_title_normalized}</td>
                  <td><span className="chip">{p.vote_a}</span></td>
                  <td><span className="chip dissent">{p.vote_b}</span></td>
                </tr>))}
            </tbody>
          </table></div>
        </>
      )}
    </>
  );
}
