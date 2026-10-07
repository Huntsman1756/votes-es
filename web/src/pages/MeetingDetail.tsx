import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, PivotRow } from "../api";

function Chip({ d, raw }: { d: string; raw: string }) {
  const cls = d === "FOR" ? "for" : d === "AGAINST" ? "against"
    : d === "ABSTAIN" || d === "WITHHOLD" ? "abstain" : "dim";
  return <span className={`chip ${cls}`} title={raw}>{d}</span>;
}

export default function MeetingDetail() {
  const { id } = useParams();
  const [m, setM] = useState<any>();
  const [rows, setRows] = useState<PivotRow[]>([]);
  useEffect(() => {
    api.meeting(id!).then(setM);
    api.meetingPivot(id!).then(r => setRows(r.pivot));
  }, [id]);

  const { proposals, reporters } = useMemo(() => {
    const reps = [...new Set(rows.map(r => r.reporter))].sort();
    const props = new Map<string, { num: string | null; title: string;
      category: string | null; cells: Record<string, PivotRow> }>();
    for (const r of rows) {
      const p = props.get(r.proposal_id) ??
        { num: r.proposal_number, title: r.proposal_title_normalized,
          category: r.category, cells: {} };
      // same reporter × proposal can appear as multiple units; collapse to one cell
      if (!p.cells[r.reporter] || r.direction !== "FOR") p.cells[r.reporter] = r;
      props.set(r.proposal_id, p);
    }
    return {
      proposals: [...props.entries()].sort((a, b) =>
        (a[1].num ?? "999").localeCompare(b[1].num ?? "999",
          undefined, { numeric: true })),
      reporters: reps,
    };
  }, [rows]);

  if (!m) return <p className="meta">loading…</p>;
  return (
    <>
      <h1>{m.issuer}</h1>
      <div className="sub mono">
        {m.meeting_date} · {m.meeting_type} · {m.meeting_id} ·
        source ids: {m.source_meeting_ids}
      </div>
      <h2>Proposals × reporters</h2>
      <table className="matrix">
        <thead><tr><th style={{ width: 40 }}>#</th><th>proposal</th>
          <th>category</th>{reporters.map(r => <th key={r}>{r}</th>)}</tr></thead>
        <tbody>{proposals.map(([pid, p]) => (
          <tr key={pid}>
            <td className="mono">{p.num ?? ""}</td>
            <td>{p.title}</td>
            <td className="meta">{p.category ?? ""}</td>
            {reporters.map(rep => {
              const c = p.cells[rep];
              if (!c) return <td key={rep} className="dir dim">·</td>;
              return (
                <td key={rep}
                  className={`dir ${c.against_management ? "dissent-cell" : ""}`}
                  title={`mgmt: ${c.management_recommendation ?? "n/a"}`}>
                  <Chip d={c.direction} raw={c.vote_raw} />
                </td>);
            })}
          </tr>))}
        </tbody>
      </table>
      <div className="legend">
        “·” = not observed / not disclosed (never read as “did not vote”).
        Shaded cell = disclosed vote against the disclosed management
        recommendation. Multiple funds of one reporter collapse to the
        last non-FOR direction for legibility — unit-level detail via API.
      </div>
    </>
  );
}
