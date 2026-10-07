import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function ReporterDetail() {
  const { id } = useParams();
  const [r, setR] = useState<any>();
  useEffect(() => { api.reporter(id!).then(setR); }, [id]);
  if (!r) return <p className="meta">loading…</p>;
  return (
    <>
      <h1>{r.canonical_name}</h1>
      <div className="sub mono">
        {r.reporter_id} · {r.reporter_type} · {r.parent_group ?? "—"} ·
        LEI {r.lei ?? "—"}
      </div>

      <h2>Disclosure profile</h2>
      <table>
        <thead><tr><th>season</th><th>level</th><th>significance criteria</th>
          <th>documented</th></tr></thead>
        <tbody>{(r.disclosure_seasons ?? []).map((d: any) => (
          <tr key={d.season}>
            <td className="mono">{d.season}</td>
            <td><span className="chip">{d.disclosure_level}</span></td>
            <td style={{ maxWidth: 480, fontSize: 12.5 }}>
              {d.significance_criteria_text ?? "—"}</td>
            <td>{d.significance_criteria_documented ? "yes" : "no"}</td>
          </tr>))}
        </tbody>
      </table>

      <h2>Category breakdown (VOTES_ES taxonomy)</h2>
      <table>
        <thead><tr><th>category</th><th>votes</th><th>dissent</th></tr></thead>
        <tbody>{(r.category_breakdown ?? []).map((c: any) => (
          <tr key={c.category}>
            <td>{c.category}</td>
            <td className="num">{c.votes}</td>
            <td className="num">{c.dissent}</td>
          </tr>))}
        </tbody>
      </table>

      <h2>Reporting units ({(r.units ?? []).length})</h2>
      <table>
        <thead><tr><th>unit</th><th>type</th><th>source id</th></tr></thead>
        <tbody>{(r.units ?? []).map((u: any) => (
          <tr key={u.unit_id}>
            <td>{u.canonical_name}</td>
            <td><span className="chip dim">{u.unit_type}</span></td>
            <td className="mono">{u.source_identifier}</td>
          </tr>))}
        </tbody>
      </table>
    </>
  );
}
