import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const key = process.env.YOUTUBE_API_KEY
if (!key) throw new Error('YOUTUBE_API_KEY not set')

async function test(query: string) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=3&key=${key}`
  const res = await fetch(url)
  const data = await res.json() as {
    error?: { message: string; code: number }
    items?: Array<{ id: { videoId: string }; snippet: { title: string } }>
  }

  if (data.error) {
    console.error(`API error ${data.error.code}: ${data.error.message}`)
    return
  }

  console.log(`Results for "${query}":`)
  data.items?.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.snippet.title} — https://youtu.be/${item.id.videoId}`)
  })
}

test('PYT Michael Jackson official audio').catch(console.error)
