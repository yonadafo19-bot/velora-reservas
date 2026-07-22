export default function Loading() {
  return <div className="admin-content admin-calendar-loading" aria-busy="true" aria-label="Cargando agenda">
    <div className="admin-heading">
      <div className="admin-heading-skeleton">
        <span className="admin-skeleton admin-skeleton--eyebrow"/>
        <span className="admin-skeleton admin-skeleton--title"/>
        <span className="admin-skeleton admin-skeleton--line admin-skeleton--wide"/>
      </div>
      <span className="admin-skeleton admin-skeleton--button"/>
    </div>
    <div className="metric-grid admin-metric-skeleton-grid">
      {[0, 1, 2, 3].map((item) => <article key={item}>
        <span className="admin-skeleton admin-skeleton--icon"/>
        <span className="admin-skeleton admin-skeleton--line"/>
        <span className="admin-skeleton admin-skeleton--metric"/>
        <span className="admin-skeleton admin-skeleton--line admin-skeleton--wide"/>
      </article>)}
    </div>
    <section className="admin-panel admin-agenda-skeleton">
      <div className="panel-heading">
        <div>
          <span className="admin-skeleton admin-skeleton--subtitle"/>
          <span className="admin-skeleton admin-skeleton--line admin-skeleton--wide"/>
        </div>
        <span className="admin-skeleton admin-skeleton--pill"/>
      </div>
      <div className="admin-skeleton-table">
        {[0, 1, 2, 3].map((row) => <div key={row}>{[0, 1, 2, 3, 4].map((cell) => <span className="admin-skeleton admin-skeleton--line" key={cell}/>)}</div>)}
      </div>
    </section>
  </div>;
}
