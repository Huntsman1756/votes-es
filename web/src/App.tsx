import { NavLink, Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="shell">
      <nav>
        <div className="brand">
          votes-es
          <small>institutional voting at Spanish listed companies</small>
        </div>
        <div style={{ marginTop: 18 }}>
          <NavLink to="/" end>Overview</NavLink>
          <NavLink to="/issuers">Issuers</NavLink>
          <NavLink to="/reporters">Reporters</NavLink>
          <NavLink to="/compare">Compare</NavLink>
          <NavLink to="/sources">Sources</NavLink>
          <NavLink to="/methodology">Methodology</NavLink>
        </div>
        <div className="foot">
          Observed public disclosures only. Absence of a record ≠ no vote.
          <br />Code MIT · data per DATA-NOTICE
        </div>
      </nav>
      <main><Outlet /></main>
    </div>
  );
}
