import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ReporterRow } from "../api";

export default function Reporters() {
  const [rows, setRows] = useState<ReporterRow[]>([]);
  useEffect(() => { api.reporters().then(r => setRows(r.reporters)); }, []);
  return (
    <>
      <h1>Reporters</h1>
      <div className="sub">Institutional disclosers — not a ranking.
        Different disclosure levels make raw counts incomparable.</div>
      <table>
        <thead><tr><th>reporter</th><th>type</th><th>group</th>
          <th>disclosure</th><th>units</th><th>meetings</th><th>votes</th>
          <th>dissent</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.reporter_id}>
            <td><Link to={`/reporters/${r.reporter_id}`}>{r.canonical_name}</Link></td>
            <td><span className="chip dim">{r.reporter_type}</span></td>
            <td>{r.parent_group ?? "—"}</td>
            <td className="mono" style={{ fontSize: 11 }}>
              {r.disclosure_seasons?.[0]
                ? `${r.disclosure_seasons[0].disclosure_level}${r.disclosure_seasons[0].significance_criteria_documented ? "*" : ""}`
                : "—"}</td>
            <td className="num">{r.units ?? 0}</td>
            <td className="num">{r.meetings ?? 0}</td>
            <td className="num">{(r.observed_votes ?? 0).toLocaleString()}</td>
            <td className="num">{r.dissent_votes ?? 0}</td>
          </tr>))}
        </tbody>
      </table>
      <div className="legend">
        * significance policy documented in source memo — the reporter only
        publishes votes meeting stated thresholds (SRD II).
      </div>
    </>
  );
}
