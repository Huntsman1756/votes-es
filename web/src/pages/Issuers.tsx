import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, IssuerRow } from "../api";

export default function Issuers() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<IssuerRow[]>([]);
  useEffect(() => {
    const t = setTimeout(() => api.issuers(q).then(r => setRows(r.issuers)), 200);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <>
      <h1>Issuers</h1>
      <div className="sub">Spanish-listed companies (XMAD/BME universe + seeds)</div>
      <input type="search" placeholder="search name, ISIN, ticker…"
        value={q} onChange={e => setQ(e.target.value)} />
      <p />
      <div className="table-scroll" tabIndex={0}><table>
        <thead><tr><th>issuer</th><th>isins</th><th>meetings</th>
          <th>reporters observed</th><th>votes</th><th>latest</th></tr></thead>
        <tbody>{rows.map(i => (
          <tr key={i.issuer_id}>
            <td><Link to={`/issuers/${i.issuer_id}`}>{i.canonical_name}</Link></td>
            <td className="mono">{i.isins}</td>
            <td className="num">{i.meetings ?? 0}</td>
            <td className="num">{i.reporters ?? 0}</td>
            <td className="num">{(i.observed_votes ?? 0).toLocaleString()}</td>
            <td className="mono">{i.latest_meeting ?? "—"}</td>
          </tr>))}
        </tbody>
      </table></div>
      <div className="legend">No rows for an issuer = no observed disclosures, not no meetings.</div>
    </>
  );
}
