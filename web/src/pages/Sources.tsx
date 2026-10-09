import { useEffect, useState } from "react";
import { api, SourceRow } from "../api";

export default function Sources() {
  const [rows, setRows] = useState<SourceRow[]>([]);
  useEffect(() => { api.sources().then(r => setRows(r.sources)); }, []);
  return (
    <>
      <h1>Sources</h1>
      <div className="sub">Every fact links back to its source record.
        Reuse status is enforced on export.</div>
      <div className="table-scroll" tabIndex={0}><table>
        <thead><tr><th>source</th><th>type</th><th>votes</th>
          <th>observations</th><th>last retrieved</th><th>reuse</th><th>published</th><th /></tr></thead>
        <tbody>{rows.map(s => (
          <tr key={s.source_id}>
            <td>{s.name}</td>
            <td className="mono" style={{ fontSize: 11 }}>{s.source_type}</td>
            <td className="num">{s.votes_ingested.toLocaleString()}</td>
            <td className="num">{s.observations}</td>
            <td className="mono">{(s.last_retrieved ?? "—").slice(0, 10)}</td>
            <td><span className={`chip ${s.reuse_status.startsWith("OPEN") ? "for" : "abstain"}`}>
              {s.reuse_status}</span></td>
            <td className="mono">{s.vote_rows_published ? "rows" : "metadata only"}</td>
            <td><a href={s.base_url} target="_blank" rel="noreferrer">source</a></td>
          </tr>))}
        </tbody>
      </table></div>
    </>
  );
}
