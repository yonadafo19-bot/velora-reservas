import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAdminAction } from "@/app/admin/actions";
import { getAdminSession, sanitizeAdminNextPath } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (session) {
    redirect(`/admin?negocio=${encodeURIComponent(session.memberships[0].businessSlug)}`);
  }

  const next = sanitizeAdminNextPath(params.next);

  return <main className="admin-login-page">
    <section className="admin-login-card" aria-labelledby="admin-login-title">
      <Link className="admin-login-brand" href="/">
        <span>Velora</span>
        <small>RESERVAS</small>
      </Link>
      <div className="admin-login-copy">
        <span className="eyebrow">ACCESO ADMINISTRATIVO</span>
        <h1 id="admin-login-title">Bienvenido de vuelta</h1>
        <p>Ingresa con la cuenta autorizada de tu negocio.</p>
      </div>
      {params.error ? <div className="admin-login-error" role="alert">
        No pudimos iniciar sesión. Revisa tus datos o solicita acceso al administrador del negocio.
      </div> : null}
      <form action={loginAdminAction} className="admin-login-form">
        {next ? <input name="next" type="hidden" value={next}/> : null}
        <label>
          Correo electrónico
          <input autoComplete="email" inputMode="email" name="email" required type="email"/>
        </label>
        <label>
          Contraseña
          <input autoComplete="current-password" name="password" required type="password"/>
        </label>
        <button className="button" type="submit">Ingresar al panel</button>
      </form>
      <p className="admin-login-help">Acceso exclusivo para administradores autorizados.</p>
    </section>
  </main>;
}
