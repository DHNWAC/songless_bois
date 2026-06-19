export const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic'] as const
export type Genre = typeof GENRES[number]

export const CLIP_DURATIONS = [0.1, 0.5, 1, 2, 5, 10] // seconds

export const EPOCH_DATE = '2026-06-20'

export function getDayNumber(date: string): number {
  const epoch = new Date(EPOCH_DATE + 'T00:00:00Z')
  const target = new Date(date + 'T00:00:00Z')
  return Math.floor((target.getTime() - epoch.getTime()) / 86400000) + 1
}

export function getDailyGenres(date: string): Genre[] {
  const seed = date.replace(/-/g, '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 1)
  const genres = [...GENRES] as string[]
  let s = seed
  for (let i = genres.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[genres[i], genres[j]] = [genres[j], genres[i]]
  }
  return genres.slice(0, 3) as Genre[]
}

export interface Track {
  id: number
  name: string
  artist: string
  previewUrl: string
}

interface ItunesResult {
  trackId: number
  trackName: string
  artistName: string
  previewUrl?: string
  kind: string
}

interface ItunesResponse {
  results: ItunesResult[]
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`,
    { next: { revalidate: 60 } }
  )

  if (!res.ok) throw new Error('iTunes search failed')

  const data = await res.json() as ItunesResponse

  return data.results
    .filter((t) => t.kind === 'song' && t.previewUrl)
    .slice(0, 8)
    .map((t) => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      previewUrl: t.previewUrl!,
    }))
}
