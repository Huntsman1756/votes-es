import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, MeetingRow } from "../api";

export default function IssuerDetail() {
  const { id } = useParams();
  const [issuer, setIssuer] = useState<any>();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  useEffect(() => {
    api.issuer(id!).then(setIssuer);
    api.issuerMeetings(id!).then(r => setMeetings(r.meetings));
  }, [id]);
  if (!issuer) return <p className="meta">loading…</p>;
  return (
    <>
      <h1>{issuer.canonical_name}</h1>
      <div className="sub mono">
        {issuer.issuer_id} · {issuer.country ?? "—"} ·
        LEI {issuer.lei ?? "—"} · universe: {issuer.universe_basis}
      </div>
      {issuer.instruments?.length > 0 && (
        <div className="meta" style={{ marginBottom: 12 }}>
          identifiers: {issuer.instruments.map((x: any) =>
            [x.isin, x.cusip, x.ticker].filter(Boolean).join(" / ")).join(" · ")}
        </div>)}
      <h2>Meetings</h2>
      <table>
        <thead><tr><th>date</th><th>type</th><th>proposals</th>
          <th>reporters</th><th>votes</th><th>dissent</th><th /></tr></thead>
        <tbody>{meetings.map(m => (
          <tr key={m.meeting_id}>
            <td className="mono">{m.meeting_date}</td>
            <td><span className="chip">{m.meeting_type}</span></td>
            <td className="num">{m.proposals}</td>
            <td className="num">{m.reporters}</td>
            <td className="num">{m.observed_votes}</td>
            <td className="num">{m.dissent_votes ?? 0}</td>
            <td><Link to={`/meetings/${m.meeting_id}`}>pivot</Link></td>
          </tr>))}
        </tbody>
      </table>
      {meetings.length === 0 &&
        <div className="note">No observed meetings — disclosures may simply not exist yet.</div>}
    </>
  );
}
