import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { Chip } from "../components/Chip";

/** Explain view for one canonical vote: raw row, provenance, identity,
    split components, manager attribution — the "explain" pattern. */
export default function VoteExplain() {
  const { id } = useParams();
  const [v, setV] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api.vote(id!).then(setV).catch((e) => setErr(String(e)));
  }, [id]);
  if (err) return <p className="dim">{err}</p>;
  if (!v) return <p className="dim">loading…</p>;
  const split = v.split_components ?? [];
  return (
    <div>
      <h2>Vote evidence</h2>
      <p>
        <b>{v.issuer}</b> · {v.meeting_date} · {v.proposal_title_normalized}
      </p>
      <p>
        <Chip d={v.direction} raw={v.vote_raw} />
        {v.is_split ? <span className="chip abstain" style={{ marginLeft: 8 }}>SPLIT</span> : null}
      </p>
      <div className="table-scroll" tabIndex={0}><table className="kv">
        <tbody>
          <tr><td>reporter</td><td>{v.reporter} <span className="dim">({v.reporter_type})</span></td></tr>
          <tr><td>reporting unit</td><td>{v.unit} <span className="dim">[{v.unit_type} {v.source_identifier}]</span></td></tr>
          <tr><td>direction</td><td>{v.direction} <span className="dim">(raw: “{v.vote_raw}”)</span></td></tr>
          {v.management_alignment ? <tr><td>relative to mgmt rec</td><td>{v.management_alignment}</td></tr> : null}
          {v.management_recommendation ? <tr><td>mgmt recommendation</td><td>{v.management_recommendation}
            <span className="dim"> (raw: “{v.management_recommendation_raw}”)</span></td></tr> : null}
          <tr><td>against management</td><td>{v.against_management === null ? "not defined" : String(v.against_management)}</td></tr>
          {v.shares_voted !== null ? <tr><td>shares voted</td><td>{Number(v.shares_voted).toLocaleString()}</td></tr> : null}
          {v.shares_on_loan !== null ? <tr><td>shares on loan</td><td>{Number(v.shares_on_loan).toLocaleString()}</td></tr> : null}
          {v.voting_managers ? <tr><td>joint-reporting managers</td><td>{v.voting_managers}</td></tr> : null}
          <tr><td>identity match</td><td>{v.match_method} · {v.review_status}
            {v.match_evidence ? <span className="dim"> — {v.match_evidence}</span> : null}</td></tr>
          <tr><td>source</td><td>{v.source_id} · {v.source_document}</td></tr>
          <tr><td>accession</td><td>{v.accession ?? "—"}</td></tr>
          <tr><td>source URL</td><td>{v.source_url ? <a href={v.source_url} target="_blank" rel="noreferrer">{v.source_url}</a> : "—"}</td></tr>
          <tr><td>retrieved</td><td>{v.retrieved_at}</td></tr>
          <tr><td>parser version</td><td>{v.parser_version}</td></tr>
          <tr><td>content hash</td><td className="dim" style={{ fontSize: 12 }}>{v.content_hash}</td></tr>
        </tbody>
      </table></div>
      {split.length ? (
        <>
          <h3>Split components</h3>
          <div className="table-scroll" tabIndex={0}><table>
            <thead><tr><th>direction</th><th>raw</th><th>shares</th><th>vote</th></tr></thead>
            <tbody>
              {split.map((s: any) => (
                <tr key={s.vote_id}>
                  <td><Chip d={s.direction} raw={s.vote_raw} /></td>
                  <td className="dim">{s.vote_raw}</td>
                  <td>{s.shares_voted !== null ? Number(s.shares_voted).toLocaleString() : "—"}</td>
                  <td><Link to={`/votes/${s.vote_id}`}>{s.vote_id.slice(0, 12)}…</Link></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      ) : null}
      <p className="dim">{v.semantics_note}</p>
    </div>
  );
}
