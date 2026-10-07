import { useEffect, useState } from "react";
import { api, Status, Season } from "../api";
import { Link } from "react-router-dom";

export default function Overview() {
  const [s, setS] = useState<Status>();
  const [seasons, setSeasons] = useState<Season[]>([]);
  useEffect(() => {
    api.status().then(setS);
    api.seasons().then(r => setSeasons(r.seasons));
  }, []);
  if (!s) return <p className="meta">loading…</p>;
  return (
    <>
      <h1>votes-es</h1>
      <div className="sub">{s.disclaimer}</div>
      <div className="stats">
        <div className="stat"><div className="v">{s.votes.toLocaleString()}</div><div className="k">observed votes</div></div>
        <div className="stat"><div className="v">{s.issuers}</div><div className="k">issuers</div></div>
        <div className="stat"><div className="v">{s.meetings}</div><div className="k">meetings</div></div>
        <div className="stat"><div className="v">{s.reporters}</div><div className="k">reporters</div></div>
        <div className="stat"><div className="v">{s.sources}</div><div className="k">sources</div></div>
      </div>
      <h2>Seasons (meeting year)</h2>
      <table>
        <thead><tr><th>season</th><th>meetings</th><th>observed votes</th><th>reporters</th></tr></thead>
        <tbody>{seasons.map(x => (
          <tr key={x.season}><td className="mono">{x.season}</td>
            <td className="num">{x.meetings}</td><td className="num">{x.votes.toLocaleString()}</td>
            <td className="num">{x.reporters}</td></tr>))}
        </tbody>
      </table>
      <div className="note">
        This is observed disclosure, not total voting behaviour. Managers that
        do not publish itemized records simply do not appear. See{" "}
        <Link to="/methodology">methodology</Link>.
      </div>
    </>
  );
}
