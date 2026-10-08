import { Link } from "react-router-dom";

/**
 * Ruta no encontrada dentro de la app. Antes no existía catch-all y React Router
 * mostraba su pantalla de error de desarrollo ("Unexpected Application Error").
 */
export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <div className="sub">
        This address does not exist in votes-es. The link may be outdated.
      </div>
      <p>
        Go back to the <Link to="/">overview</Link>, browse{" "}
        <Link to="/issuers">issuers</Link> or <Link to="/reporters">reporters</Link>,
        or read the <Link to="/methodology">methodology</Link>.
      </p>
    </>
  );
}
