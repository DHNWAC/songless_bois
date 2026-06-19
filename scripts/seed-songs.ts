import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY not set in .env.local')

const ALL_GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic']

function getDailyGenres(date: string): string[] {
  const seed = date.replace(/-/g, '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 1)
  const genres = [...ALL_GENRES]
  let s = seed
  for (let i = genres.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[genres[i], genres[j]] = [genres[j], genres[i]]
  }
  return genres.slice(0, 3)
}

interface ItunesResult {
  trackId: number
  trackName: string
  artistName: string
  kind: string
}

interface YouTubeSearchResponse {
  items?: Array<{ id: { videoId: string } }>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function searchItunes(query: string, attempt = 0): Promise<ItunesResult | null> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`
  )
  const text = await res.text()
  if (!res.ok || !text.startsWith('{')) {
    if (attempt < 3) {
      const wait = 60000
      console.warn(`  iTunes rate limited, waiting 60s before retry ${attempt + 1}/3...`)
      await sleep(wait)
      return searchItunes(query, attempt + 1)
    }
    return null
  }
  const data = JSON.parse(text) as { results: ItunesResult[] }
  return data.results.find((t) => t.kind === 'song') ?? null
}

async function searchYouTube(query: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' official audio')}&type=video&videoCategoryId=10&maxResults=3&key=${YOUTUBE_API_KEY}`
  )
  const data = await res.json() as YouTubeSearchResponse
  return data.items?.[0]?.id?.videoId ?? null
}

const SONGS_BY_GENRE: Record<string, string[]> = {
  'Pop': [
    // Big hits
    'Shape of You Ed Sheeran', 'Blinding Lights The Weeknd', 'As It Was Harry Styles',
    'Bad Guy Billie Eilish', 'Levitating Dua Lipa', 'Watermelon Sugar Harry Styles',
    'Stay With Me Sam Smith', 'Thinking Out Loud Ed Sheeran', 'Someone Like You Adele',
    'Rolling in the Deep Adele', 'Hello Adele', 'Uptown Funk Mark Ronson Bruno Mars',
    'Happy Pharrell Williams', 'Call Me Maybe Carly Rae Jepsen', 'Shake It Off Taylor Swift',
    'Blank Space Taylor Swift', 'Anti-Hero Taylor Swift', 'Cruel Summer Taylor Swift',
    'Flowers Miley Cyrus', "Can't Stop the Feeling Justin Timberlake",
    'What Makes You Beautiful One Direction', 'Story of My Life One Direction',
    'Stitches Shawn Mendes', 'Senorita Shawn Mendes Camila Cabello', 'Havana Camila Cabello',
    'Roar Katy Perry', 'Dark Horse Katy Perry', 'Firework Katy Perry',
    'Wrecking Ball Miley Cyrus', 'Love Yourself Justin Bieber', 'Sorry Justin Bieber',
    '7 rings Ariana Grande', 'Thank U Next Ariana Grande', 'Problem Ariana Grande',
    'No Tears Left to Cry Ariana Grande', 'Perfect Ed Sheeran', 'Photograph Ed Sheeran',
    'Good 4 U Olivia Rodrigo', 'Brutal Olivia Rodrigo', 'Vampire Olivia Rodrigo',
    'Traitor Olivia Rodrigo', 'Deja Vu Olivia Rodrigo', 'Closer Chainsmokers Halsey',
    'New Rules Dua Lipa', 'Physical Dua Lipa', "Don't Start Now Dua Lipa",
    'Locked Out of Heaven Bruno Mars', 'Just the Way You Are Bruno Mars',
    "That's What I Like Bruno Mars", 'When I Was Your Man Bruno Mars',
    'Rehab Amy Winehouse', 'Back to Black Amy Winehouse', 'Valerie Amy Winehouse',
    'Set Fire to the Rain Adele', 'Skyfall Adele', 'Easy On Me Adele',
    'Sweetener Ariana Grande', 'God is a Woman Ariana Grande', 'Needy Ariana Grande',
    'Cardigan Taylor Swift', 'August Taylor Swift', 'Champagne Problems Taylor Swift',
    'Willow Taylor Swift', 'Style Taylor Swift', 'Wildest Dreams Taylor Swift',
    'All Too Well Taylor Swift', 'Getaway Car Taylor Swift', 'Gorgeous Taylor Swift',
    'Adore You Harry Styles', 'Golden Harry Styles', 'Late Night Talking Harry Styles',
    'Sign of the Times Harry Styles', 'Cherry Harry Styles',
    'Unholy Sam Smith Kim Petras', 'Lay All Your Love on Me ABBA',
    'Dancing Queen ABBA', 'Mamma Mia ABBA', 'Gimme Gimme Gimme ABBA',
    'Waterloo ABBA', 'The Winner Takes It All ABBA',
    'Somebody That I Used to Know Gotye Kimbra',
    'Counting Stars OneRepublic', 'Apologize Timbaland OneRepublic',
    'Titanium David Guetta Sia', 'Chandelier Sia', 'Cheap Thrills Sia',
    'Elastic Heart Sia', 'The Greatest Sia', 'Unstoppable Sia',
    'Dynamite BTS', 'Butter BTS', 'Boy With Luv BTS',
    'Fancy TWICE', 'How You Like That BLACKPINK', 'Kill This Love BLACKPINK',
    'Lovesick Girls BLACKPINK',
    'Heat Waves Glass Animals', 'Grapejuice Harry Styles',
    'Sweet Disposition Temper Trap', 'Dog Days Are Over Florence Machine',
    "You Need Me I Don't Need You Ed Sheeran", "Don't Olivia Rodrigo",
    'Jealous Nick Jonas', 'Cake By The Ocean DNCE',
    'Sugar Maroon 5', 'Moves Like Jagger Maroon 5', 'Girls Like You Maroon 5',
    'Animals Maroon 5', 'Maps Maroon 5',
  ],

  'Hip-Hop': [
    // Big hits
    'Gods Plan Drake', 'HUMBLE Kendrick Lamar', 'Sicko Mode Travis Scott',
    'Rockstar Post Malone', 'Sunflower Post Malone', 'Congratulations Post Malone',
    'White Iverson Post Malone', 'Better Now Post Malone', 'Circles Post Malone',
    'One Dance Drake', 'Hotline Bling Drake', 'Started From the Bottom Drake',
    "Hold On We're Going Home Drake", 'In My Feelings Drake', 'Passionfruit Drake',
    'Toosie Slide Drake', 'Laugh Now Cry Later Drake', 'Way 2 Sexy Drake',
    'Gummo 6ix9ine', 'POWER Kanye West', 'Gold Digger Kanye West',
    'Stronger Kanye West', 'Good Life Kanye West', 'Heartless Kanye West',
    'Runaway Kanye West', 'All of the Lights Kanye West', 'Ultralight Beam Kanye West',
    'DNA Kendrick Lamar', 'Alright Kendrick Lamar', 'Swimming Pools Kendrick Lamar',
    "Bitch Don't Kill My Vibe Kendrick Lamar", 'Money Trees Kendrick Lamar',
    'm.A.A.d city Kendrick Lamar', 'King Kunta Kendrick Lamar',
    'LOYALTY Kendrick Lamar', 'ELEMENT Kendrick Lamar', 'LOVE Kendrick Lamar',
    'XO Tour Llif3 Lil Uzi Vert', 'Lucid Dreams Juice WRLD',
    'All Girls Are the Same Juice WRLD', 'Robbery Juice WRLD',
    'Bad and Boujee Migos', 'Versace Migos', 'T-Shirt Migos', 'Walk It Talk It Migos',
    'Drip Too Hard Lil Baby Gunna', 'Woah Lil Baby', 'The Bigger Picture Lil Baby',
    'Antidote Travis Scott', 'goosebumps Travis Scott', 'butterfly effect Travis Scott',
    'Highest in the Room Travis Scott', 'Franchise Travis Scott',
    'Lose Yourself Eminem', 'Not Afraid Eminem', 'Without Me Eminem',
    'The Real Slim Shady Eminem', 'Rap God Eminem', 'Stan Eminem',
    'Love the Way You Lie Eminem Rihanna',
    'Ni**as in Paris Jay-Z Kanye West', 'Empire State of Mind Jay-Z Alicia Keys',
    'Hard Knock Life Jay-Z', '99 Problems Jay-Z', 'Tom Ford Jay-Z',
    'HUMBLE Kendrick Lamar', 'Backseat Freestyle Kendrick Lamar',
    'Bodak Yellow Cardi B', 'I Like It Cardi B', 'WAP Cardi B',
    'Clout Cardi B Offset', 'Money Cardi B', 'Up Cardi B',
    'Old Town Road Lil Nas X', 'Montero Lil Nas X', 'Industry Baby Lil Nas X',
    "That's What I Want Lil Nas X",
    'Mask Off Future', 'Low Life Future', 'Codeine Crazy Future',
    'Life is Good Future Drake',
    'No Role Modelz J Cole', 'MIDDLE CHILD J Cole', 'Power Trip J Cole',
    'Neighbors J Cole', "Kevin's Heart J Cole", 'ATM J Cole', 'KOD J Cole',
    'Blessings Big Sean Drake Kanye West',
    'Jumpman Drake Future', 'Gyalchester Drake',
    'Portland Drake Future Quavo',
    'Mob Ties Drake', 'Nonstop Drake',
    "Sandra's Rose Drake", 'Peak Drake Future',
    '0 to 100 Drake', 'Tuesday Drake', 'Know Yourself Drake',
    'Energy Drake',
    'Tunnel Vision Kodak Black',
    'ZEZE Kodak Black',
    'No Flockin Kodak Black',
    'Super Gremlin Kodak Black',
  ],

  'R&B': [
    // Big hits
    'Leave the Door Open Bruno Mars Anderson Paak', 'Best Part Daniel Caesar',
    'Die For You The Weeknd', 'Earned It The Weeknd', 'Often The Weeknd',
    'The Hills The Weeknd', "Can't Feel My Face The Weeknd",
    'Save Your Tears The Weeknd', 'After Hours The Weeknd',
    'Out of Time The Weeknd', 'Gasoline The Weeknd', 'Is There Someone Else The Weeknd',
    'Good Days SZA', 'Broken Clocks SZA', 'Love Galore SZA',
    'Garden SZA', 'Supermodel SZA', 'Drew Barrymore SZA',
    'The Weekend SZA', 'Normal Girl SZA', 'Snooze SZA',
    'Kill Bill SZA', 'Low SZA', 'Seek and Destroy SZA',
    'Needed Me Rihanna', 'Work Rihanna Drake', 'Love on the Brain Rihanna',
    'Consideration Rihanna', 'Kiss It Better Rihanna', 'Higher Rihanna',
    'Desperado Rihanna', 'Sex With Me Rihanna',
    'All of Me John Legend', 'Conversations in the Dark John Legend',
    'Bigger Love John Legend', 'Used to Love U John Legend',
    'Ordinary People John Legend', 'Save Room John Legend',
    'P.D.A. John Legend', 'Green Light John Legend',
    'No Role Modelz J Cole', 'Wet Dreamz J Cole',
    'Cranes in the Sky Solange', "Don't Touch My Hair Solange",
    'Mad Solange', 'Almeda Solange', 'Weary Solange',
    'Focus H.E.R.', 'Hard Place H.E.R.', 'I Used to Know Her H.E.R.',
    'Avenue H.E.R.', 'Damage H.E.R.',
    'Essence Wizkid', 'Come Closer Wizkid', 'Soco Wizkid',
    'Mood 24kGoldn Iann Dior',
    'Golden Hour JVKE',
    'Peaches Justin Bieber Daniel Caesar Giveon',
    'Overpass Graffiti Ed Sheeran', 'Shivers Ed Sheeran',
    'Hold On Chord Overstreet',
    'Lose You to Love Me Selena Gomez', 'Rare Selena Gomez',
    'Wolves Selena Gomez', 'Fetish Selena Gomez',
    'Love Someone Lukas Graham', '7 Years Lukas Graham',
    'Stay Rihanna Mikky Ekko',
    'Slow Motion Trey Songz', 'Na Na Trey Songz', "Can't Help but Wait Trey Songz",
    'Neighbors Chris Brown', 'No Guidance Chris Brown Drake',
    'Go Crazy Chris Brown Young Thug', 'With You Chris Brown',
    'Say Aah Trey Songz Fabolous',
    'Climax Usher', 'Scream Usher', 'There Goes My Baby Usher',
    'DJ Got Us Fallin in Love Usher', 'More Usher',
    'Making Love Out of Nothing At All Usher',
    'Numb Linkin Park Jay Z',
    'Sure Thing Miguel', 'Adorn Miguel', 'Do You Miguel',
    'How Many Drinks Miguel', 'Coffee Miguel',
    'Pillow Talk Zayn', 'LIKE I WOULD Zayn', 'Wrong Zayn Kehlani',
    'Dusk Till Dawn Zayn Sia', 'Let Me Zayn',
    'Location Khalid', 'Talk Khalid', 'Young Dumb Broke Khalid',
    'Better Khalid', 'OTW Khalid Ty Dolla Sign 6LACK',
    '6LACK East Atlanta Love Letter', 'Sorry Enough 6LACK',
    'Seasons 6LACK', 'Disconnect 6LACK',
    'Beautiful Bazzi', 'Mine Bazzi', 'Paradise Bazzi',
    'Tip Toe Jason Derulo', 'Want to Want Me Jason Derulo',
    'In My Head Jason Derulo', 'Take You Dancing Jason Derulo',
    'Lady Lady Masego', 'Tadow Masego FKJ',
  ],

  'Rock': [
    // Big hits
    'Somebody That I Used to Know Gotye', 'Mr Brightside The Killers',
    'Seven Nation Army White Stripes', 'Bohemian Rhapsody Queen',
    'Smells Like Teen Spirit Nirvana', 'Come As You Are Nirvana',
    'In Bloom Nirvana', 'Heart-Shaped Box Nirvana', 'Lithium Nirvana',
    'About a Girl Nirvana', 'The Man Who Sold the World Nirvana',
    'Creep Radiohead', 'Fake Plastic Trees Radiohead', 'High and Dry Radiohead',
    'Karma Police Radiohead', 'No Surprises Radiohead',
    'Yellow Coldplay', 'The Scientist Coldplay', 'Clocks Coldplay',
    'Fix You Coldplay', 'Speed of Sound Coldplay', 'Viva la Vida Coldplay',
    'In My Place Coldplay', 'The Hardest Part Coldplay',
    'Under the Bridge Red Hot Chili Peppers', 'Californication Red Hot Chili Peppers',
    'Scar Tissue Red Hot Chili Peppers', 'Soul to Squeeze Red Hot Chili Peppers',
    'Otherside Red Hot Chili Peppers', 'Dani California Red Hot Chili Peppers',
    'Snow Red Hot Chili Peppers', 'Dark Necessities Red Hot Chili Peppers',
    'Welcome to the Black Parade My Chemical Romance',
    'Helena My Chemical Romance', 'Famous Last Words My Chemical Romance',
    "I'm Not Okay My Chemical Romance", 'Cancer My Chemical Romance',
    'Boulevard of Broken Dreams Green Day', 'American Idiot Green Day',
    'Wake Me Up When September Ends Green Day', 'Good Riddance Green Day',
    'Holiday Green Day', 'Basket Case Green Day',
    'Stairway to Heaven Led Zeppelin', 'Whole Lotta Love Led Zeppelin',
    'Kashmir Led Zeppelin', 'Black Dog Led Zeppelin',
    'Hotel California Eagles', 'Take It Easy Eagles',
    'Lynyrd Skynyrd Sweet Home Alabama', 'Free Bird Lynyrd Skynyrd',
    'Black Sabbath Iron Man', 'War Pigs Black Sabbath', 'Paranoid Black Sabbath',
    'Enter Sandman Metallica', 'Nothing Else Matters Metallica',
    'One Metallica', 'Master of Puppets Metallica',
    'Sweet Child O Mine Guns N Roses', 'November Rain Guns N Roses',
    'Welcome to the Jungle Guns N Roses', 'Paradise City Guns N Roses',
    'Under Pressure Queen David Bowie', 'We Will Rock You Queen',
    'We Are the Champions Queen', "Don't Stop Me Now Queen", 'Somebody to Love Queen',
    'fat bottomed girls Queen', 'Radio Ga Ga Queen',
    'Roxanne The Police', 'Every Breath You Take The Police',
    'Everlong Foo Fighters', 'Best of You Foo Fighters',
    'Learn to Fly Foo Fighters', 'The Pretender Foo Fighters',
    'Times Like These Foo Fighters', 'All My Life Foo Fighters',
    'Where Is My Mind Pixies', 'Here Comes Your Man Pixies',
    'Debaser Pixies', 'Gigantic Pixies',
    'Do I Wanna Know Arctic Monkeys', 'R U Mine Arctic Monkeys',
    '505 Arctic Monkeys', "Why'd You Only Call Me When You're High Arctic Monkeys",
    'Fluorescent Adolescent Arctic Monkeys', 'I Wanna Be Yours Arctic Monkeys',
    'Snap Out of It Arctic Monkeys', 'Arabella Arctic Monkeys',
    'Reptilia The Strokes', 'Last Nite The Strokes',
    'Hard to Explain The Strokes', 'Someday The Strokes',
    'Pumped Up Kicks Foster the People',
    'Little Lion Man Mumford and Sons', 'The Cave Mumford and Sons',
    'I Will Wait Mumford and Sons',
    'Dog Days Are Over Florence and the Machine',
    'Shake It Out Florence and the Machine',
    "You've Got the Love Florence and the Machine",
  ],

  'Electronic': [
    // Big hits
    'One More Time Daft Punk', 'Levels Avicii', 'Animals Martin Garrix',
    'Titanium David Guetta', 'Lean On Major Lazer', 'Wake Me Up Avicii',
    'Without You Avicii', 'Hey Brother Avicii', 'Addicted to You Avicii',
    'The Nights Avicii', 'Waiting For Love Avicii', 'Broken Arrows Avicii',
    'Get Lucky Daft Punk', 'Around the World Daft Punk', 'Harder Better Faster Stronger Daft Punk',
    'Da Funk Daft Punk', 'Instant Crush Daft Punk', 'Digital Love Daft Punk',
    'Something About Us Daft Punk', 'Lose Yourself to Dance Daft Punk',
    'Around the World Daft Punk',
    'Clarity Zedd', 'Beautiful Now Zedd', 'Stay the Night Zedd',
    'The Middle Zedd Maren Morris', 'Spectrum Zedd',
    'Language Porter Robinson', 'Sad Machine Porter Robinson',
    'Flicker Porter Robinson', 'Sea of Voices Porter Robinson',
    'Shelter Porter Robinson Madeon',
    'Pop Culture Madeon', 'Finale Madeon', 'Pay No Mind Madeon',
    'Burn Ellie Goulding',
    'Promises Calvin Harris Sam Smith', 'One Kiss Calvin Harris Dua Lipa',
    'Summer Calvin Harris', 'Acceptable in the 80s Calvin Harris',
    'This Is What You Came For Calvin Harris Rihanna',
    'How Deep Is Your Love Calvin Harris Disciples',
    'Slide Calvin Harris', 'My Way Calvin Harris',
    'Outside Calvin Harris Ellie Goulding',
    'Move Like This Calvin Harris', 'Feel So Close Calvin Harris',
    'We Found Love Calvin Harris Rihanna', 'Sweet Nothing Calvin Harris Florence Welch',
    'Let Me Love You DJ Snake Justin Bieber',
    'Turn Down for What DJ Snake Lil Jon',
    'Middle DJ Snake Bipolar Sunshine',
    'Taki Taki DJ Snake',
    'Lean On Major Lazer MO DJ Snake',
    'Cold Water Major Lazer Justin Bieber',
    'Run the World Beyonce',
    'Scary Monsters and Nice Sprites Skrillex',
    'Bangarang Skrillex Sirah',
    'First of the Year Skrillex',
    'Promises Calvin Harris Sam Smith',
    'Sweet Sensation Flux Pavilion',
    'Bass Cannon Flux Pavilion',
    'Gold Kiiara', 'Feels Like We Only Go Backwards Tame Impala',
    'Let It Happen Tame Impala', 'The Less I Know the Better Tame Impala',
    'New Person Same Old Mistakes Tame Impala',
    'Eventually Tame Impala', 'Disciples Tame Impala',
    'Is It True Tame Impala', 'Borderline Tame Impala',
    'It Might Be Time Tame Impala', 'Patience Tame Impala',
    'Lost in Yesterday Tame Impala',
    'Sunflower Vol 6 Harry Hudson',
    'Midnight City M83', 'Outro M83', 'Wait M83',
    'Do It Try It M83', 'Go M83',
    'Ghosts n Stuff deadmau5', 'I Remember deadmau5', 'Raise Your Weapon deadmau5',
    'FML Deadmau5', 'Not Exactly deadmau5',
    'Stay deadmau5 Colleen DAgostino',
    'Saturn Stevie Wonder', 'Come Alive Hugh Jackman',
    'Silhouettes Avicii', 'Liar Avicii', 'Pure Grinding Avicii',
  ],
}

function getDailySongIndex(date: string, genre: string, total: number): number {
  const n = date.replace(/-/g, '').split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 1)
  const g = genre.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (n + g) % total
}

function dateOffsetDays(base: string, offset: number): string {
  const d = new Date(base + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function seedDate(date: string) {
  const dailyGenres = getDailyGenres(date)
  console.log(`\nSeeding ${date} — genres: ${dailyGenres.join(', ')}`)

  for (const genre of dailyGenres) {
    const allQueries = SONGS_BY_GENRE[genre] ?? []
    const startIndex = getDailySongIndex(date, genre, allQueries.length)
    const queries = [...allQueries.slice(startIndex), ...allQueries.slice(0, startIndex)]
    let seeded = false

    for (const query of queries) {
      await sleep(3500)
      const [itunesTrack, videoId] = await Promise.all([
        searchItunes(query),
        searchYouTube(query),
      ])

      if (!itunesTrack || !videoId) {
        console.warn(`  Skipping "${query}" — iTunes: ${!!itunesTrack}, YouTube: ${!!videoId}`)
        continue
      }

      const { error } = await supabase.from('daily_challenges').upsert({
        challenge_date: date,
        genre,
        spotify_track_id: String(itunesTrack.trackId),
        track_name: itunesTrack.trackName,
        artist_name: itunesTrack.artistName,
        preview_url: videoId,
      }, { onConflict: 'challenge_date,genre' })

      if (error) {
        console.error(`  DB error for ${itunesTrack.trackName}:`, error.message)
      } else {
        console.log(`  ✓ ${genre}: ${itunesTrack.trackName} — ${itunesTrack.artistName}`)
        seeded = true
        break
      }
    }

    if (!seeded) console.warn(`  ⚠ No song seeded for ${genre}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const daysArg = args.find((a) => a.startsWith('--days='))
  const startArg = args.find((a) => a.startsWith('--start='))

  const numDays = daysArg ? parseInt(daysArg.split('=')[1], 10) : 1
  const startDate = startArg ? startArg.split('=')[1] : new Date().toISOString().slice(0, 10)

  console.log(`Seeding ${numDays} day(s) starting from ${startDate}`)

  for (let i = 0; i < numDays; i++) {
    await seedDate(dateOffsetDays(startDate, i))
  }

  console.log('\nDone.')
}

main().catch(console.error)
