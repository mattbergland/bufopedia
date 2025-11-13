import { useEffect, useMemo, useState } from 'react'
import bufosRaw from './data/bufos.json'
import './App.css'

const TYPE_FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'static', label: 'Static (PNG / JPG)' },
  { id: 'animated', label: 'Animated (GIF)' },
]

const SORT_OPTIONS = [
  { id: 'alpha', label: 'Name · A → Z' },
  { id: 'reverse', label: 'Name · Z → A' },
  { id: 'filename', label: 'Filename' },
  { id: 'shortest', label: 'Shortest name' },
]

const bufos = bufosRaw.map((bufo, index) => {
  const extension = bufo.fileName.split('.').pop()?.toLowerCase() ?? ''
  const type = extension === 'gif' ? 'animated' : 'static'
  const baseName = bufo.fileName.replace(/\.[^.]+$/, '')
  const slackName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || baseName.toLowerCase()
  const slackCommand = `:${slackName}:`
  return {
    ...bufo,
    extension,
    type,
    order: index,
    slackName,
    slackCommand,
    searchable: `${bufo.displayName} ${bufo.fileName}`.toLowerCase(),
  }
})

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('alpha')
  const [copyState, setCopyState] = useState({ id: null, message: '', action: null })
  const [copying, setCopying] = useState({ id: null, action: null })

  const queryWords = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  )

  const filteredBufos = useMemo(() => {
    return bufos
      .filter((bufo) => (typeFilter === 'all' ? true : bufo.type === typeFilter))
      .filter((bufo) => queryWords.every((word) => bufo.searchable.includes(word)))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'reverse':
            return b.displayName.localeCompare(a.displayName)
          case 'filename':
            return a.fileName.localeCompare(b.fileName)
          case 'shortest':
            return (
              a.displayName.length - b.displayName.length ||
              a.displayName.localeCompare(b.displayName)
            )
          case 'alpha':
          default:
            return a.displayName.localeCompare(b.displayName)
        }
      })
  }, [queryWords, sortOrder, typeFilter])

  useEffect(() => {
    if (!copyState.id) return
    const timeout = setTimeout(() => setCopyState({ id: null, message: '', action: null }), 1800)
    return () => clearTimeout(timeout)
  }, [copyState])

  const setCopyingState = (payload) => setCopying(payload)

  const handleCopySlack = async (bufo) => {
    if (!navigator.clipboard?.writeText) {
      setCopyState({ id: bufo.id, action: 'slack', message: 'Clipboard unavailable' })
      return
    }
    setCopyingState({ id: bufo.id, action: 'slack' })
    try {
      await navigator.clipboard.writeText(bufo.slackCommand)
      setCopyState({ id: bufo.id, action: 'slack', message: 'Command copied!' })
    } catch (error) {
      console.error('Unable to copy Slack command', error)
      setCopyState({ id: bufo.id, action: 'slack', message: 'Copy failed' })
    } finally {
      setCopyingState({ id: null, action: null })
    }
  }

  const handleCopyImage = async (bufo) => {
    setCopyingState({ id: bufo.id, action: 'image' })
    try {
      const response = await fetch(bufo.imageUrl)
      const blob = await response.blob()
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const clipboardItem = new ClipboardItem({ [blob.type]: blob })
        await navigator.clipboard.write([clipboardItem])
        setCopyState({ id: bufo.id, action: 'image', message: 'Image copied!' })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bufo.imageUrl)
        setCopyState({ id: bufo.id, action: 'image', message: 'Link copied!' })
      } else {
        throw new Error('Clipboard API not supported')
      }
    } catch (error) {
      console.error('Unable to copy bufo image', error)
      setCopyState({ id: bufo.id, action: 'image', message: 'Copy failed' })
    } finally {
      setCopyingState({ id: null, action: null })
    }
  }

  const handleDownload = async (bufo) => {
    try {
      const response = await fetch(bufo.imageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = bufo.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Unable to download bufo', error)
    }
  }

  const getCopyLabel = (bufoId, action, fallback) => {
    if (copying.id === bufoId && copying.action === action) {
      return 'Copying…'
    }
    if (copyState.id === bufoId && copyState.action === action && copyState.message) {
      return copyState.message
    }
    return fallback
  }

  const totalCount = bufos.length
  const visibleCount = filteredBufos.length
  const extensionCount = useMemo(() => {
    return bufos.reduce(
      (acc, item) => {
        if (item.type === 'animated') acc.animated += 1
        else acc.static += 1
        return acc
      },
      { static: 0, animated: 0 },
    )
  }, [])

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Bufopedia · the unofficial bufo emojipedia</p>
        <h1>Every bufo, ready to paste</h1>
        <p className="tagline">
          Browse {totalCount.toLocaleString()}+ iconic bufos sourced from the community collection.
          Search, filter, copy to your clipboard, or download for anywhere that needs a little extra
          froge energy.
        </p>
        <a
          className="source-link"
          href="https://github.com/knobiknows/all-the-bufo"
          target="_blank"
          rel="noreferrer"
        >
          View source repository ↗
        </a>
        <p className="credit">
          by{' '}
          <a href="https://twitter.com/mattbergland" target="_blank" rel="noreferrer">
            @mattbergland
          </a>
        </p>
      </header>

      <section className="controls">
        <label className="search-bar" aria-label="Search bufos">
          <span role="img" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name, vibe, or filename..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button className="clear" type="button" onClick={() => setQuery('')}>
              Clear
            </button>
          )}
        </label>

        <div className="filter-row">
          <div className="type-filters" role="group" aria-label="Filter by media type">
            {TYPE_FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={typeFilter === option.id ? 'chip active' : 'chip'}
                onClick={() => setTypeFilter(option.id)}
              >
                {option.label}
                {option.id !== 'all' && (
                  <span className="count-pill">{extensionCount[option.id] ?? bufos.length}</span>
                )}
              </button>
            ))}
          </div>

          <label className="sort-select">
            <span>Sort</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="results-meta">
          Showing <strong>{visibleCount.toLocaleString()}</strong> bufos
          {query || typeFilter !== 'all' ? (
            <>
              {' '}
              ·{' '}
              <button
                onClick={() => {
                  setQuery('')
                  setTypeFilter('all')
                }}
              >
                Reset filters
              </button>
            </>
          ) : null}
        </div>
      </section>

      {visibleCount === 0 ? (
        <div className="empty-state">
          <p>No bufos found for "{query}".</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setTypeFilter('all')
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <section className="bufo-grid" aria-live="polite">
          {filteredBufos.map((bufo) => (
            <article key={bufo.id} className="bufo-card">
              <div className="bufo-image">
                <img loading="lazy" src={bufo.imageUrl} alt={bufo.displayName} />
              </div>
              <div className="bufo-info">
                <p className="name">{bufo.displayName}</p>
                <p className="filename">{bufo.fileName}</p>
                <p className="slack-code" aria-label="Slack emoji shortcode">
                  {bufo.slackCommand}
                </p>
              </div>
              <div className="chip-row">
                <span className="chip subtle">.{bufo.extension}</span>
                <span className="chip subtle">{bufo.type === 'animated' ? 'Animated' : 'Static'}</span>
              </div>
              <div className="actions">
                <button type="button" className="primary" onClick={() => handleCopySlack(bufo)}>
                  {getCopyLabel(bufo.id, 'slack', 'Copy Slack command')}
                </button>
                <button type="button" onClick={() => handleCopyImage(bufo)}>
                  {getCopyLabel(bufo.id, 'image', 'Copy image')}
                </button>
                <button type="button" onClick={() => handleDownload(bufo)}>
                  Download
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default App
