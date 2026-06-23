export default function Loading() {
  return <div className="admin-shell theme-barberia">
    <main className="admin-main">
      <div className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">VELORA RESERVAS</span>
            <h1>Citas</h1>
            <p>Cargando agenda real desde el API de Velora.</p>
          </div>
        </div>
        <section className="admin-panel">
          <div className="demo-notice">
            <span>
              <strong>Cargando agenda</strong>
              Estamos preparando las citas del rango seleccionado.
            </span>
          </div>
        </section>
      </div>
    </main>
  </div>;
}
