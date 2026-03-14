import { useEffect, useMemo, useState } from 'react'

const SNAPSHOT_URL = '/hpd-arrest-log/snapshot.json'
const WATCHLIST_STORAGE_KEY = 'coding-around:hpd-watchlist'
const DAY_OPTIONS = [7, 14, 30, 60, 90]
const ROW_OPTIONS = [100, 250, 500, 1000, 2500]
const DEFAULT_DAYS = 14
const DEFAULT_ROWS = 250

function normalizeTokens(value) {
  return (String(value || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(Boolean)
}

function cleanLine(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function dedupeItems(values) {
  return Array.from(new Set(values.map(cleanLine).filter(Boolean)))
}

function readStoredWatchlist() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? dedupeItems(parsed) : []
  } catch {
    return []
  }
}

function persistWatchlist(values) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(dedupeItems(values)))
}

function readInitialFilters() {
  if (typeof window === 'undefined') {
    return {
      nameQuery: '',
      days: DEFAULT_DAYS,
      rows: DEFAULT_ROWS,
    }
  }

  const params = new URLSearchParams(window.location.search)
  const daysValue = Number(params.get('days'))
  const rowsValue = Number(params.get('rows'))

  return {
    nameQuery: cleanLine(params.get('name') || ''),
    days: DAY_OPTIONS.includes(daysValue) ? daysValue : DEFAULT_DAYS,
    rows: ROW_OPTIONS.includes(rowsValue) ? rowsValue : DEFAULT_ROWS,
  }
}

function matchesQuery(name, query) {
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

function formatCompactDateTime(value) {
  if (!value) {
    return 'Unknown'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRecordTimestamp(record) {
  return Date.parse(record.arrest_sort_utc || record.source_anchor_utc || '') || 0
}

export default function HpdArrestLogPage() {
  const initialFilters = readInitialFilters()
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [nameQuery, setNameQuery] = useState(initialFilters.nameQuery)
  const [days, setDays] = useState(initialFilters.days)
  const [rows, setRows] = useState(initialFilters.rows)
  const [watchInput, setWatchInput] = useState('')
  const [watchNames, setWatchNames] = useState(() => readStoredWatchlist())

  useEffect(() => {
    document.title = 'HPD Arrest Log Viewer | Coding Around'
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (nameQuery) {
      params.set('name', nameQuery)
    } else {
      params.delete('name')
    }
    params.set('days', String(days))
    params.set('rows', String(rows))

    const nextQuery = params.toString()
    const nextUrl = nextQuery
      ? `${window.location.pathname}?${nextQuery}`
      : window.location.pathname

    window.history.replaceState({}, '', nextUrl)
  }, [days, nameQuery, rows])

  useEffect(() => {
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
        if (cancelled) {
          return
        }

        setSnapshot(payload)

        const storedExists = typeof window !== 'undefined'
          ? window.localStorage.getItem(WATCHLIST_STORAGE_KEY) !== null
          : false

        if (!storedExists) {
          const seededWatchlist = dedupeItems(payload.watch_names || [])
          setWatchNames(seededWatchlist)
          persistWatchlist(seededWatchlist)
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
  }, [reloadToken])

  const syncedWatchNames = useMemo(() => dedupeItems(snapshot?.watch_names || []), [snapshot])
  const activeWatchNames = useMemo(() => dedupeItems(watchNames), [watchNames])

  const filteredData = useMemo(() => {
    if (!snapshot) {
      return {
        windowRecords: [],
        visibleRecords: [],
        sourceCount: 0,
      }
    }

    const latestAnchor = snapshot.latest_source_anchor_utc
      ? new Date(snapshot.latest_source_anchor_utc)
      : new Date(snapshot.generated_at_utc)
    const cutoff = new Date(latestAnchor)
    cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(0, days - 1))

    const windowRecords = snapshot.records.filter((record) => {
      const sourceAnchor = record.source_anchor_utc ? new Date(record.source_anchor_utc) : null
      return !sourceAnchor || sourceAnchor >= cutoff
    })

    windowRecords.sort((left, right) => getRecordTimestamp(right) - getRecordTimestamp(left))

    const visibleRecords = windowRecords.filter((record) => matchesQuery(record.name, nameQuery))

    return {
      windowRecords,
      visibleRecords: visibleRecords.slice(0, rows),
      sourceCount: new Set(visibleRecords.map((record) => record.source_pdf)).size,
    }
  }, [days, nameQuery, rows, snapshot])

  const watchHits = useMemo(() => {
    if (!snapshot || activeWatchNames.length === 0) {
      return []
    }

    const hits = []
    for (const record of filteredData.windowRecords) {
      for (const watchName of activeWatchNames) {
        if (!matchesQuery(record.name, watchName)) {
          continue
        }
        hits.push({
          key: `${watchName}:${record.report_number || record.source_pdf}:${record.page_number}`,
          watchName,
          record,
        })
      }
    }

    hits.sort((left, right) => getRecordTimestamp(right.record) - getRecordTimestamp(left.record))
    return hits.slice(0, 12)
  }, [activeWatchNames, filteredData.windowRecords, snapshot])

  function handleRefresh() {
    setReloadToken((value) => value + 1)
  }

  function handleAddWatch(event) {
    event.preventDefault()
    const nextWatch = cleanLine(watchInput)
    if (!nextWatch) {
      return
    }

    const updated = dedupeItems([...activeWatchNames, nextWatch])
    setWatchNames(updated)
    persistWatchlist(updated)
    setWatchInput('')
  }

  function handleRemoveWatch(watchName) {
    const updated = activeWatchNames.filter((item) => item !== watchName)
    setWatchNames(updated)
    persistWatchlist(updated)
  }

  function handleResetWatchlist() {
    setWatchNames(syncedWatchNames)
    persistWatchlist(syncedWatchNames)
  }

  function handleClearFilters() {
    setNameQuery('')
    setDays(DEFAULT_DAYS)
    setRows(DEFAULT_ROWS)
  }

  const runStateOk = snapshot?.last_run?.ok === true

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
              A public-facing port of the HPD arrest review tool. This route keeps the denser
              operational feel of the source app, while running on the latest synced dataset so it
              stays deployable on Amplify.
            </p>
            <div className="hpd-hero-actions">
              <span className="hpd-status-pill">Full public interface</span>
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
              <p>Sync status</p>
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
                <span>Public mode</span>
                <strong>Read/search/watch on synced data</strong>
              </article>
            </div>
          </div>
        </section>

        {loading && (
          <section className="hpd-message-panel">
            <p>Loading synced dataset...</p>
          </section>
        )}

        {error && (
          <section className="hpd-message-panel hpd-message-panel-error">
            <p>{error}</p>
          </section>
        )}

        {snapshot && !loading && !error && (
          <>
            <section className="hpd-utility-grid">
              <div className="hpd-sidebar-card hpd-actions-card">
                <h2>Actions</h2>
                <p className="hpd-helper-copy">
                  Hosted mode supports search, watchlist management, and deep record review against
                  the latest synced dataset.
                </p>
                <div className="hpd-action-row">
                  <button className="hpd-btn" type="button" onClick={handleRefresh}>
                    Refresh synced data
                  </button>
                  <a className="hpd-btn hpd-btn-secondary" href={SNAPSHOT_URL}>
                    Open JSON
                  </a>
                </div>
                <div className="hpd-action-row">
                  <button className="hpd-btn hpd-btn-secondary" type="button" onClick={handleClearFilters}>
                    Reset filters
                  </button>
                  <button className="hpd-btn hpd-btn-secondary" type="button" onClick={handleResetWatchlist}>
                    Reset watchlist
                  </button>
                </div>
                <p className="hpd-inline-note">
                  Pull, backfill, and source watchlist writes still run in the local Flask tool.
                </p>
              </div>

              <div className="hpd-sidebar-card hpd-run-card">
                <div className="hpd-run-head">
                  <h2>Run state</h2>
                  <span className={`hpd-health-pill ${runStateOk ? 'hpd-health-pill-ok' : 'hpd-health-pill-error'}`}>
                    {runStateOk ? 'Healthy' : 'Needs attention'}
                  </span>
                </div>
                <div className="hpd-run-grid">
                  <article>
                    <span>Latest sync</span>
                    <strong>{formatDateTime(snapshot.last_run?.ran_at_utc)}</strong>
                  </article>
                  <article>
                    <span>Parse method</span>
                    <strong>{snapshot.last_run?.parse_method || 'Unknown'}</strong>
                  </article>
                  <article>
                    <span>Last record count</span>
                    <strong>{snapshot.last_run?.record_count || 0}</strong>
                  </article>
                  <article>
                    <span>Recent source alerts</span>
                    <strong>{snapshot.recent_alerts?.length || 0}</strong>
                  </article>
                </div>
                {snapshot.last_run?.error ? (
                  <p className="hpd-inline-note hpd-inline-note-error">{snapshot.last_run.error}</p>
                ) : null}
              </div>
            </section>

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
                <span>Records in window</span>
                <strong>{filteredData.windowRecords.length}</strong>
              </article>
              <article>
                <span>Rows visible</span>
                <strong>{filteredData.visibleRecords.length}</strong>
              </article>
              <article>
                <span>Source PDFs in view</span>
                <strong>{filteredData.sourceCount}</strong>
              </article>
              <article>
                <span>Watch hits</span>
                <strong>{watchHits.length}</strong>
              </article>
            </section>

            <section className="hpd-content-grid">
              <aside className="hpd-sidebar">
                <div className="hpd-sidebar-card">
                  <h2>Watchlist</h2>
                  <p className="hpd-helper-copy">
                    Add names here to keep a working watchlist in this browser while reviewing the
                    hosted page.
                  </p>
                  <form className="hpd-watch-form" onSubmit={handleAddWatch}>
                    <input
                      type="text"
                      value={watchInput}
                      onChange={(event) => setWatchInput(event.target.value)}
                      placeholder="Add alert name fragment"
                    />
                    <button className="hpd-btn" type="submit">
                      Add watch
                    </button>
                  </form>
                  {activeWatchNames.length ? (
                    <div className="hpd-watch-list">
                      {activeWatchNames.map((watchName) => (
                        <div className="hpd-watch-item" key={watchName}>
                          <span>{watchName}</span>
                          <button
                            type="button"
                            className="hpd-watch-remove"
                            onClick={() => handleRemoveWatch(watchName)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="hpd-empty-copy">No public watch names configured yet.</p>
                  )}
                  <p className="hpd-inline-note">
                    Synced watchlist count: {syncedWatchNames.length}. Public edits here do not write
                    back to the source tool.
                  </p>
                </div>

                <div className="hpd-sidebar-card">
                  <h2>Watch hits</h2>
                  {watchHits.length ? (
                    <div className="hpd-watch-hit-list">
                      {watchHits.map((hit) => (
                        <article className="hpd-watch-hit" key={hit.key}>
                          <strong>{hit.watchName} matched</strong>
                          <p>{hit.record.name || 'Unknown'}</p>
                          <span>
                            {hit.record.offense || 'Unknown offense'} · {formatCompactDateTime(hit.record.arrest_sort_utc || hit.record.source_anchor_utc)}
                          </span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="hpd-empty-copy">No watch hits in the current time window.</p>
                  )}
                </div>

                <div className="hpd-sidebar-card">
                  <h2>Source alert history</h2>
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
                    <p className="hpd-empty-copy">No recent source alerts in this sync.</p>
                  )}
                </div>
              </aside>

              <section className="hpd-records-panel">
                <div className="hpd-records-head">
                  <div>
                    <p className="kicker">Searchable records</p>
                    <h2>Full public review interface</h2>
                  </div>
                  <span>{filteredData.visibleRecords.length} rows visible</span>
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
                      {filteredData.visibleRecords.map((record) => (
                        <tr key={`${record.report_number}-${record.source_pdf}-${record.page_number}`}>
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
                            <div className="hpd-subline">{formatShortDate(record.source_anchor_utc)}</div>
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
