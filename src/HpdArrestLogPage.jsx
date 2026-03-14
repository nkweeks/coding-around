import { useEffect, useMemo, useState } from 'react'

const SNAPSHOT_URL = '/hpd-arrest-log/snapshot.json'
const DAY_OPTIONS = [7, 14, 30, 60, 90]
const ROW_OPTIONS = [100, 250, 500, 1000]

function normalizeTokens(value) {
  return (String(value || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(Boolean)
}

function matchesName(name, query) {
  const terms = normalizeTokens(query)
  if (terms.length === 0) {
    return true
  }

  const haystack = normalizeTokens(name).join(' ')
  return terms.every((term) => haystack.includes(term))
}

function formatDateTime(value) {
  if (!value) {
    return 'Unknown'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleString()
}

function formatShortDate(value) {
  if (!value) {
    return 'Unknown'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleDateString()
}

export default function HpdArrestLogPage() {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const [days, setDays] = useState(14)
  const [rows, setRows] = useState(250)

  useEffect(() => {
    document.title = 'HPD Arrest Log Viewer | Coding Around'

    let cancelled = false

    async function loadSnapshot() {
      try {
        setLoading(true)
        setError('')
        const response = await fetch(SNAPSHOT_URL, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Snapshot request failed with ${response.status}`)
        }
        const payload = await response.json()
        if (!cancelled) {
          setSnapshot(payload)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load snapshot')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSnapshot()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredData = useMemo(() => {
    if (!snapshot) {
      return {
        matchedCount: 0,
        sourceCount: 0,
        records: [],
      }
    }

    const latestAnchor = snapshot.latest_source_anchor_utc
      ? new Date(snapshot.latest_source_anchor_utc)
      : new Date(snapshot.generated_at_utc)
    const cutoff = new Date(latestAnchor)
    cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(0, days - 1))

    const filtered = snapshot.records.filter((record) => {
      const sourceAnchor = record.source_anchor_utc ? new Date(record.source_anchor_utc) : null
      if (sourceAnchor && sourceAnchor < cutoff) {
        return false
      }

      return matchesName(record.name, nameQuery)
    })

    filtered.sort((left, right) => {
      const leftDate = Date.parse(left.arrest_sort_utc || left.source_anchor_utc || '')
      const rightDate = Date.parse(right.arrest_sort_utc || right.source_anchor_utc || '')
      return rightDate - leftDate
    })

    return {
      matchedCount: filtered.length,
      sourceCount: new Set(filtered.map((record) => record.source_pdf)).size,
      records: filtered.slice(0, rows),
    }
  }, [days, nameQuery, rows, snapshot])

  return (
    <div className="hpd-page-shell">
      <header className="project-page-header">
        <a className="top-brand" href="/">
          <span className="brand-dot" />
          coding around
        </a>
        <nav>
          <a href="/">Portfolio</a>
          <a href={SNAPSHOT_URL}>Snapshot JSON</a>
        </nav>
      </header>

      <main className="project-page-main">
        <section className="hpd-hero">
          <div className="hpd-hero-copy">
            <p className="kicker">Operational Dashboard</p>
            <h1>HPD Arrest Log Viewer</h1>
            <p>
              A Python and Flask pipeline that pulls Honolulu PD arrest log PDFs, parses them into
              structured records, and exposes searchable review flows with watch alerts and ingest
              telemetry. The portfolio version is a static snapshot of the latest synced data.
            </p>
            <div className="hpd-hero-actions">
              <span className="hpd-status-pill">Snapshot live</span>
              <span className="hpd-source-pill">Source: hpd_arrest_log_viewer</span>
              <a className="hpd-back-link" href="/#projects">
                Back to portfolio
              </a>
            </div>
          </div>

          <div className="hpd-hero-panel">
            <div className="hpd-panel-header">
              <span className="hpd-panel-dot hpd-panel-dot-blue" />
              <span className="hpd-panel-dot hpd-panel-dot-orange" />
              <span className="hpd-panel-dot hpd-panel-dot-green" />
              <p>Snapshot metadata</p>
            </div>
            <div className="hpd-meta-grid">
              <article>
                <span>Generated</span>
                <strong>{snapshot ? formatDateTime(snapshot.generated_at_utc) : 'Loading...'}</strong>
              </article>
              <article>
                <span>Latest source</span>
                <strong>
                  {snapshot ? formatDateTime(snapshot.latest_source_anchor_utc) : 'Loading...'}
                </strong>
              </article>
              <article>
                <span>OCR</span>
                <strong>{snapshot ? (snapshot.ocr?.ok ? 'Ready' : 'Unavailable') : 'Loading...'}</strong>
              </article>
              <article>
                <span>Last parse</span>
                <strong>{snapshot?.last_run?.parse_method || 'Unknown'}</strong>
              </article>
            </div>
          </div>
        </section>

        {loading && (
          <section className="hpd-message-panel">
            <p>Loading snapshot...</p>
          </section>
        )}

        {error && (
          <section className="hpd-message-panel hpd-message-panel-error">
            <p>{error}</p>
          </section>
        )}

        {snapshot && !loading && !error && (
          <>
            <section className="hpd-controls">
              <div className="hpd-control-card">
                <label htmlFor="hpd-name-search">Search arrested name</label>
                <input
                  id="hpd-name-search"
                  type="text"
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                  placeholder="Partial search works"
                />
              </div>
              <div className="hpd-control-card">
                <label htmlFor="hpd-days-window">Days window</label>
                <select
                  id="hpd-days-window"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                >
                  {DAY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} days
                    </option>
                  ))}
                </select>
              </div>
              <div className="hpd-control-card">
                <label htmlFor="hpd-row-limit">Rows shown</label>
                <select
                  id="hpd-row-limit"
                  value={rows}
                  onChange={(event) => setRows(Number(event.target.value))}
                >
                  {ROW_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="hpd-stats-grid">
              <article>
                <span>Matched records</span>
                <strong>{filteredData.matchedCount}</strong>
              </article>
              <article>
                <span>Rows shown</span>
                <strong>{filteredData.records.length}</strong>
              </article>
              <article>
                <span>Source PDFs in view</span>
                <strong>{filteredData.sourceCount}</strong>
              </article>
              <article>
                <span>Total source PDFs</span>
                <strong>{snapshot.summary?.available_source_count || 0}</strong>
              </article>
            </section>

            <section className="hpd-content-grid">
              <aside className="hpd-sidebar">
                <div className="hpd-sidebar-card">
                  <h2>Run state</h2>
                  <p>
                    Latest sync: <strong>{formatDateTime(snapshot.last_run?.ran_at_utc)}</strong>
                  </p>
                  <p>
                    Last record count: <strong>{snapshot.last_run?.record_count || 0}</strong>
                  </p>
                  <p>
                    Parse method: <strong>{snapshot.last_run?.parse_method || 'Unknown'}</strong>
                  </p>
                  <p className="hpd-sidebar-note">
                    Portfolio mode is read-only. Manual pull, backfill, and watch updates remain in
                    the local Flask app.
                  </p>
                </div>

                <div className="hpd-sidebar-card">
                  <h2>Watchlist</h2>
                  {snapshot.watch_names?.length ? (
                    <div className="hpd-chip-list">
                      {snapshot.watch_names.map((watchName) => (
                        <span key={watchName}>{watchName}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="hpd-empty-copy">No watch names configured in the current snapshot.</p>
                  )}
                </div>

                <div className="hpd-sidebar-card">
                  <h2>Recent alerts</h2>
                  {snapshot.recent_alerts?.length ? (
                    <div className="hpd-alert-list">
                      {snapshot.recent_alerts.map((alert) => (
                        <article key={alert.event_key} className="hpd-alert-item">
                          <strong>{alert.watch_name} matched</strong>
                          <p>{alert.name}</p>
                          <span>{formatDateTime(alert.triggered_at_utc)}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="hpd-empty-copy">No recent alert events in this snapshot.</p>
                  )}
                </div>
              </aside>

              <section className="hpd-records-panel">
                <div className="hpd-records-head">
                  <div>
                    <p className="kicker">Searchable records</p>
                    <h2>Current synced snapshot</h2>
                  </div>
                  <span>{filteredData.records.length} rows visible</span>
                </div>

                <div className="hpd-records-table-wrap">
                  <table className="hpd-records-table">
                    <thead>
                      <tr>
                        <th>Arrested</th>
                        <th>Person</th>
                        <th>Charge</th>
                        <th>Location / Officer</th>
                        <th>Release</th>
                        <th>Source</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.records.map((record) => (
                        <tr
                          key={`${record.report_number}-${record.source_pdf}-${record.page_number}`}
                        >
                          <td>{record.arrest_datetime || 'Unknown'}</td>
                          <td>
                            <div className="hpd-name-main">{record.name || 'Unknown'}</div>
                            <div className="hpd-tag-row">
                              {record.age ? <span>Age {record.age}</span> : null}
                              {record.sex ? <span>{record.sex}</span> : null}
                              {record.race ? <span>{record.race}</span> : null}
                            </div>
                          </td>
                          <td>
                            <div>{record.offense || 'Unknown'}</div>
                            <div className="hpd-subline">{record.report_number || 'No report'}</div>
                          </td>
                          <td>
                            <div>{record.location || 'Unknown'}</div>
                            <div className="hpd-subline">{record.officer || 'No officer listed'}</div>
                          </td>
                          <td>
                            <div>{record.release_datetime || 'Not listed'}</div>
                            <div className="hpd-subline">
                              {record.how_released || record.release_code || 'Pending'}
                            </div>
                          </td>
                          <td>
                            <div>{record.source_pdf || 'Unknown source'}</div>
                            <div className="hpd-subline">
                              {formatShortDate(record.source_anchor_utc)}
                            </div>
                          </td>
                          <td>
                            <details className="hpd-details">
                              <summary>Open</summary>
                              <div className="hpd-details-grid">
                                <div>
                                  <span>Court</span>
                                  <p>{record.court_information || 'None'}</p>
                                </div>
                                <div>
                                  <span>Release code</span>
                                  <p>{record.release_code || 'None'}</p>
                                </div>
                                <div>
                                  <span>Raw OCR</span>
                                  <p>{record.raw_text || 'None'}</p>
                                </div>
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
