// Fully client-side song data + iTunes lookups. No backend, no API keys.
// iTunes Search API is public, keyless, and CORS-enabled.

export const CLIP_DURATIONS = [0.1, 0.5, 2, 4, 8, 15] // seconds

export const ROUND_SIZE = 5 // songs per game

export const CATEGORIES = ['Pop', 'Hip-Hop', 'R&B', 'Indie/Alt', 'Electronic'] as const
export type Category = typeof CATEGORIES[number]

// Category revealed after 2 skips (clip index 2 = the 2s clip)
export const CATEGORY_REVEAL_CLIP = 2

export interface Song {
  id: number
  name: string
  artist: string
  previewUrl: string
  category: Category
}

interface PoolEntry {
  query: string
  category: Category
}

export const SONG_POOL: PoolEntry[] = [
  // --- Pop ---
  { query: 'Symphony Clean Bandit Zara Larsson', category: 'Pop' },
  { query: 'Rewrite The Stars James Arthur Anne-Marie', category: 'Pop' },
  { query: 'Roar Katy Perry', category: 'Pop' },
  { query: 'Work from Home Fifth Harmony', category: 'Pop' },
  { query: 'Love Yourself Justin Bieber', category: 'Pop' },
  { query: 'What Do You Mean Justin Bieber', category: 'Pop' },
  { query: 'Ghost Justin Bieber', category: 'Pop' },
  { query: 'California Gurls Katy Perry', category: 'Pop' },
  { query: 'Dark Horse Katy Perry', category: 'Pop' },
  { query: 'Hot N Cold Katy Perry', category: 'Pop' },
  { query: 'Roar Katy Perry', category: 'Pop' },
  { query: 'Diamonds Rihanna', category: 'Pop' },
  { query: 'Umbrella Rihanna', category: 'Pop' },
  { query: 'Disturbia Rihanna', category: 'Pop' },
  { query: 'Only Girl Rihanna', category: 'Pop' },
  { query: 'I Ain\'t Worried OneRepublic', category: 'Pop' },
  { query: 'Counting Stars OneRepublic', category: 'Pop' },
  { query: 'Everything Has Changed Taylor Swift Ed Sheeran', category: 'Pop' },
  { query: 'Shape of You Ed Sheeran', category: 'Pop' },
  { query: 'Perfect Ed Sheeran', category: 'Pop' },
  { query: 'Thinking Out Loud Ed Sheeran', category: 'Pop' },
  { query: 'Wildest Dreams Taylor Swift', category: 'Pop' },
  { query: 'Cruel Summer Taylor Swift', category: 'Pop' },
  { query: 'Love Story Taylor Swift', category: 'Pop' },
  { query: 'Shake It Off Taylor Swift', category: 'Pop' },
  { query: 'Blank Space Taylor Swift', category: 'Pop' },
  { query: 'Adore You Harry Styles', category: 'Pop' },
  { query: 'Sweet Creature Harry Styles', category: 'Pop' },
  { query: 'Watermelon Sugar Harry Styles', category: 'Pop' },
  { query: 'Stereo Hearts Gym Class Heroes', category: 'Pop' },
  { query: 'Mr Brightside The Killers', category: 'Pop' },
  { query: 'Still into You Paramore', category: 'Pop' },
  { query: 'I Love It Icona Pop', category: 'Pop' },
  { query: 'Just Dance Lady Gaga', category: 'Pop' },
  { query: 'Poker Face Lady Gaga', category: 'Pop' },
  { query: 'Bad Romance Lady Gaga', category: 'Pop' },
  { query: 'Lush Life Zara Larsson', category: 'Pop' },
  { query: 'Untouched The Veronicas', category: 'Pop' },
  { query: 'Love Me Like You Do Ellie Goulding', category: 'Pop' },
  { query: 'Heart Attack Demi Lovato', category: 'Pop' },
  { query: 'One Call Away Charlie Puth', category: 'Pop' },
  { query: 'Attention Charlie Puth', category: 'Pop' },
  { query: 'The Lazy Song Bruno Mars', category: 'Pop' },
  { query: 'Uptown Funk Bruno Mars Mark Ronson', category: 'Pop' },
  { query: 'Grenade Bruno Mars', category: 'Pop' },
  { query: 'Just The Way You Are Bruno Mars', category: 'Pop' },
  { query: 'Story of My Life One Direction', category: 'Pop' },
  { query: 'What Makes You Beautiful One Direction', category: 'Pop' },
  { query: 'See You Again Wiz Khalifa Charlie Puth', category: 'Pop' },
  { query: 'Girls Like You Maroon 5', category: 'Pop' },
  { query: 'Moves Like Jagger Maroon 5', category: 'Pop' },
  { query: 'Payphone Maroon 5', category: 'Pop' },
  { query: 'Something Just Like This Chainsmokers Coldplay', category: 'Pop' },
  { query: 'Set Fire to the Rain Adele', category: 'Pop' },
  { query: 'Rolling in the Deep Adele', category: 'Pop' },
  { query: 'Someone Like You Adele', category: 'Pop' },
  { query: 'Shower Becky G', category: 'Pop' },
  { query: 'Unwritten Natasha Bedingfield', category: 'Pop' },
  { query: 'Summertime Sadness Lana Del Rey', category: 'Pop' },
  { query: 'Young and Beautiful Lana Del Rey', category: 'Pop' },
  { query: 'Talking Body Tove Lo', category: 'Pop' },
  { query: 'BIRDS OF A FEATHER Billie Eilish', category: 'Pop' },
  { query: 'bad guy Billie Eilish', category: 'Pop' },
  { query: 'Happier Than Ever Billie Eilish', category: 'Pop' },
  { query: 'supernatural Ariana Grande', category: 'Pop' },
  { query: 'thank u next Ariana Grande', category: 'Pop' },
  { query: 'positions Ariana Grande', category: 'Pop' },
  { query: 'Problem Ariana Grande', category: 'Pop' },
  { query: 'Close To You Gracie Abrams', category: 'Pop' },
  { query: 'That\'s So True Gracie Abrams', category: 'Pop' },
  { query: 'Red Wine Supernova Chappell Roan', category: 'Pop' },
  { query: 'Good Luck Babe Chappell Roan', category: 'Pop' },
  { query: 'Stick Season Noah Kahan', category: 'Pop' },
  { query: 'Can I Call You Tonight Dayglow', category: 'Pop' },
  { query: 'Riptide Vance Joy', category: 'Pop' },
  { query: 'Let Her Go Passenger', category: 'Pop' },
  { query: 'Ho Hey The Lumineers', category: 'Pop' },
  { query: 'Ophelia The Lumineers', category: 'Pop' },
  { query: 'Papercuts Illy Vera Blue', category: 'Pop' },
  { query: 'My Happiness Powderfinger', category: 'Pop' },
  { query: 'Don\'t Look Back In Anger Oasis', category: 'Pop' },
  { query: 'Wonderwall Oasis', category: 'Pop' },
  { query: 'Written in the Stars Tinie Tempah', category: 'Pop' },
  { query: 'Do You Remember Jay Sean', category: 'Pop' },
  { query: 'Down Jay Sean Lil Wayne', category: 'Pop' },
  { query: 'Just A Dream Nelly', category: 'Pop' },
  { query: 'Only One Yellowcard', category: 'Pop' },
  { query: 'NIGHTS LIKE THIS The Kid LAROI', category: 'Pop' },
  { query: 'Stay The Kid LAROI Justin Bieber', category: 'Pop' },
  { query: 'Lost In Japan Shawn Mendes', category: 'Pop' },
  { query: 'Stitches Shawn Mendes', category: 'Pop' },
  { query: 'Treat You Better Shawn Mendes', category: 'Pop' },
  { query: 'Brazil Declan McKenna', category: 'Pop' },
  { query: 'Sweet Disposition The Temper Trap', category: 'Pop' },
  { query: 'Levitating Dua Lipa', category: 'Pop' },
  { query: 'Don\'t Start Now Dua Lipa', category: 'Pop' },
  { query: 'Physical Dua Lipa', category: 'Pop' },
  { query: 'New Rules Dua Lipa', category: 'Pop' },
  { query: 'As It Was Harry Styles', category: 'Pop' },
  { query: 'Señorita Shawn Mendes Camila Cabello', category: 'Pop' },
  { query: 'Havana Camila Cabello', category: 'Pop' },

  // --- Hip-Hop ---
  { query: 'Dior Pop Smoke', category: 'Hip-Hop' },
  { query: 'Sunflower Post Malone Swae Lee', category: 'Hip-Hop' },
  { query: 'Circles Post Malone', category: 'Hip-Hop' },
  { query: 'Rockstar Post Malone 21 Savage', category: 'Hip-Hop' },
  { query: 'Black Beatles Rae Sremmurd', category: 'Hip-Hop' },
  { query: 'Congratulations Post Malone', category: 'Hip-Hop' },
  { query: 'STAR WALKIN Lil Nas X', category: 'Hip-Hop' },
  { query: 'Old Town Road Lil Nas X', category: 'Hip-Hop' },
  { query: 'Industry Baby Lil Nas X Jack Harlow', category: 'Hip-Hop' },
  { query: 'Can\'t Hold Us Macklemore Ryan Lewis', category: 'Hip-Hop' },
  { query: 'Thrift Shop Macklemore Ryan Lewis', category: 'Hip-Hop' },
  { query: 'The Monster Eminem Rihanna', category: 'Hip-Hop' },
  { query: 'Lose Yourself Eminem', category: 'Hip-Hop' },
  { query: 'Not Afraid Eminem', category: 'Hip-Hop' },
  { query: 'I Gotta Feeling Black Eyed Peas', category: 'Hip-Hop' },
  { query: 'Like A G6 Far East Movement', category: 'Hip-Hop' },
  { query: 'Day n Nite Kid Cudi', category: 'Hip-Hop' },
  { query: 'Pursuit Of Happiness Kid Cudi', category: 'Hip-Hop' },
  { query: 'Right Round Flo Rida', category: 'Hip-Hop' },
  { query: 'Goosebumps Travis Scott', category: 'Hip-Hop' },
  { query: 'SICKO MODE Travis Scott', category: 'Hip-Hop' },
  { query: 'Antidote Travis Scott', category: 'Hip-Hop' },
  { query: 'HIGHEST IN THE ROOM Travis Scott', category: 'Hip-Hop' },
  { query: 'Drop The World Lil Wayne Eminem', category: 'Hip-Hop' },
  { query: '6 Foot 7 Foot Lil Wayne', category: 'Hip-Hop' },
  { query: 'Like That Future Metro Boomin Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'Father Stretch My Hands Kanye West', category: 'Hip-Hop' },
  { query: 'Runaway Kanye West', category: 'Hip-Hop' },
  { query: 'Stronger Kanye West', category: 'Hip-Hop' },
  { query: 'POWER Kanye West', category: 'Hip-Hop' },
  { query: 'Famous Kanye West', category: 'Hip-Hop' },
  { query: 'Real Friends Kanye West', category: 'Hip-Hop' },
  { query: 'No More Parties in LA Kanye West Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'family ties Baby Keem Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'luther Kendrick Lamar SZA', category: 'Hip-Hop' },
  { query: 'All The Stars Kendrick Lamar SZA', category: 'Hip-Hop' },
  { query: 'Not Like Us Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'HUMBLE Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'DNA Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'No Role Modelz J Cole', category: 'Hip-Hop' },
  { query: 'Love Yourz J Cole', category: 'Hip-Hop' },
  { query: 'Work Out J Cole', category: 'Hip-Hop' },
  // --- Drake ---
  { query: 'God\'s Plan Drake', category: 'Hip-Hop' },
  { query: 'Hotline Bling Drake', category: 'Hip-Hop' },
  { query: 'One Dance Drake', category: 'Hip-Hop' },
  { query: 'Nice For What Drake', category: 'Hip-Hop' },
  { query: 'Passionfruit Drake', category: 'Hip-Hop' },
  { query: 'Started From The Bottom Drake', category: 'Hip-Hop' },
  { query: 'Hold On We\'re Going Home Drake', category: 'Hip-Hop' },
  { query: 'Controlla Drake', category: 'Hip-Hop' },
  { query: 'Nonstop Drake', category: 'Hip-Hop' },
  { query: 'Jumpman Drake Future', category: 'Hip-Hop' },
  { query: 'Forever Drake Kanye West Lil Wayne Eminem', category: 'Hip-Hop' },
  { query: 'Portland Drake Travis Scott Quavo', category: 'Hip-Hop' },
  // ---
  { query: 'EARFQUAKE Tyler The Creator', category: 'Hip-Hop' },
  { query: 'See You Again Tyler The Creator Kali Uchis', category: 'Hip-Hop' },
  { query: 'NEW MAGIC WAND Tyler The Creator', category: 'Hip-Hop' },
  { query: 'Wusyaname Tyler The Creator', category: 'Hip-Hop' },
  { query: 'NOID Tyler The Creator', category: 'Hip-Hop' },
  { query: 'Sundress ASAP Rocky', category: 'Hip-Hop' },
  { query: 'Praise The Lord ASAP Rocky', category: 'Hip-Hop' },
  { query: 'Fashion Killa ASAP Rocky', category: 'Hip-Hop' },
  { query: 'redrum 21 Savage', category: 'Hip-Hop' },
  { query: 'a lot 21 Savage J Cole', category: 'Hip-Hop' },
  { query: 'Aura Don Toliver', category: 'Hip-Hop' },
  { query: 'No Idea Don Toliver', category: 'Hip-Hop' },
  { query: 'After Party Don Toliver', category: 'Hip-Hop' },
  { query: 'Lemonade Internet Money Gunna', category: 'Hip-Hop' },
  { query: 'Blueberry Faygo Lil Mosey', category: 'Hip-Hop' },
  { query: 'The Way Life Goes Lil Uzi Vert', category: 'Hip-Hop' },
  { query: 'XO TOUR Llif3 Lil Uzi Vert', category: 'Hip-Hop' },
  { query: 'Sing About Me Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'Poetic Justice Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'Swimming Pools Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'Money Trees Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'LOVE Kendrick Lamar', category: 'Hip-Hop' },
  { query: 'pushin P Gunna Future', category: 'Hip-Hop' },
  { query: 'Dreams and Nightmares Meek Mill', category: 'Hip-Hop' },
  { query: 'Superhero Metro Boomin Future Chris Brown', category: 'Hip-Hop' },
  { query: 'Mask Off Future', category: 'Hip-Hop' },
  { query: 'Young Dumb Broke Khalid', category: 'Hip-Hop' },
  { query: 'Location Khalid', category: 'Hip-Hop' },
  { query: 'YOU\'RE THE ONE KAYTRANADA Syd', category: 'Hip-Hop' },
  { query: '3005 Childish Gambino', category: 'Hip-Hop' },
  { query: 'Redbone Childish Gambino', category: 'Hip-Hop' },
  { query: 'This Is America Childish Gambino', category: 'Hip-Hop' },
  { query: 'Essence Wizkid Tems', category: 'Hip-Hop' },
  { query: 'Come Closer Wizkid Drake', category: 'Hip-Hop' },

  // --- R&B ---
  { query: 'Gimme Love Joji', category: 'R&B' },
  { query: 'Glimpse of Us Joji', category: 'R&B' },
  { query: 'Saturn SZA', category: 'R&B' },
  { query: 'Kill Bill SZA', category: 'R&B' },
  { query: 'Good Days SZA', category: 'R&B' },
  { query: 'Seek and Destroy SZA', category: 'R&B' },
  { query: 'the perfect pair beabadoobee', category: 'R&B' },
  { query: 'Sailor Song Gigi Perez', category: 'R&B' },
  { query: 'MUTT Leon Thomas', category: 'R&B' },
  { query: 'YES IT IS Leon Thomas', category: 'R&B' },
  { query: 'wrong faces Brent Faiyaz', category: 'R&B' },
  { query: 'other side Brent Faiyaz', category: 'R&B' },
  { query: 'four seasons Brent Faiyaz', category: 'R&B' },
  { query: 'Wasting Time Brent Faiyaz Drake', category: 'R&B' },
  { query: 'Still Your Best GIVEON', category: 'R&B' },
  { query: 'Heartbreak Anniversary GIVEON', category: 'R&B' },
  { query: 'Needed Me Rihanna', category: 'R&B' },
  { query: 'Lost Frank Ocean', category: 'R&B' },
  { query: 'Super Rich Kids Frank Ocean', category: 'R&B' },
  { query: 'Nights Frank Ocean', category: 'R&B' },
  { query: 'Pink + White Frank Ocean', category: 'R&B' },
  { query: 'Thinking Bout You Frank Ocean', category: 'R&B' },
  { query: 'Slide On Me Snoh Aalegra', category: 'R&B' },
  { query: 'I Want You Around Snoh Aalegra', category: 'R&B' },
  { query: 'Best Part Daniel Caesar', category: 'R&B' },
  { query: 'Get You Daniel Caesar Kali Uchis', category: 'R&B' },
  { query: 'Japanese Denim Daniel Caesar', category: 'R&B' },
  { query: 'Comethru Jeremy Zucker', category: 'R&B' },
  { query: 'you were good to me Jeremy Zucker Chelsea Cutler', category: 'R&B' },
  { query: 'Falling Trevor Daniel', category: 'R&B' },
  { query: 'Die For You The Weeknd', category: 'R&B' },
  { query: 'Often The Weeknd', category: 'R&B' },
  { query: 'Acquainted The Weeknd', category: 'R&B' },
  { query: 'Reminder The Weeknd', category: 'R&B' },
  { query: 'Blinding Lights The Weeknd', category: 'R&B' },
  { query: 'Starboy The Weeknd Daft Punk', category: 'R&B' },
  { query: 'Can\'t Feel My Face The Weeknd', category: 'R&B' },
  { query: 'Save Your Tears The Weeknd', category: 'R&B' },
  { query: 'Call Out My Name The Weeknd', category: 'R&B' },
  { query: 'Heartless The Weeknd', category: 'R&B' },
  { query: 'Overdue Metro Boomin Travis Scott', category: 'R&B' },
  { query: 'favorite crime Olivia Rodrigo', category: 'R&B' },
  { query: 'drivers license Olivia Rodrigo', category: 'R&B' },
  { query: 'good 4 u Olivia Rodrigo', category: 'R&B' },
  { query: 'Love Lost Mac Miller The Temper Trap', category: 'R&B' },
  { query: 'Self Care Mac Miller', category: 'R&B' },
  { query: 'Small Worlds Mac Miller', category: 'R&B' },
  { query: 'After The Storm Kali Uchis Tyler The Creator', category: 'R&B' },
  { query: 'Telepatia Kali Uchis', category: 'R&B' },
  { query: 'Spite Omar Apollo', category: 'R&B' },
  { query: 'Evergreen Omar Apollo', category: 'R&B' },
  { query: 'Chicken Tenders Dominic Fike', category: 'R&B' },
  { query: 'Come As You Are Usher', category: 'R&B' },
  { query: 'Yeah Usher', category: 'R&B' },
  { query: 'Confessions Part II Usher', category: 'R&B' },
  { query: 'Beautiful Snoh Aalegra', category: 'R&B' },
  { query: 'Before I Let Go Beyonce', category: 'R&B' },
  { query: 'Crazy In Love Beyonce', category: 'R&B' },
  { query: 'Drunk in Love Beyonce', category: 'R&B' },

  // --- Indie/Alt ---
  { query: 'Heat Waves Glass Animals', category: 'Indie/Alt' },
  { query: 'A Tear in Space Glass Animals', category: 'Indie/Alt' },
  { query: 'The Other Side Of Paradise Glass Animals', category: 'Indie/Alt' },
  { query: 'Gooey Glass Animals', category: 'Indie/Alt' },
  { query: 'Confidence Ocean Alley', category: 'Indie/Alt' },
  { query: 'Knees Ocean Alley', category: 'Indie/Alt' },
  { query: 'Touch and Go Ocean Alley', category: 'Indie/Alt' },
  { query: 'Baby Come Back Ocean Alley', category: 'Indie/Alt' },
  { query: 'Linger Royel Otis', category: 'Indie/Alt' },
  { query: 'Sofa King Royel Otis', category: 'Indie/Alt' },
  { query: 'Pratts and Pain Royel Otis', category: 'Indie/Alt' },
  { query: 'What a Shame Royel Otis', category: 'Indie/Alt' },
  { query: 'Movement Hozier', category: 'Indie/Alt' },
  { query: 'From Eden Hozier', category: 'Indie/Alt' },
  { query: 'Someone New Hozier', category: 'Indie/Alt' },
  { query: 'Shrike Hozier', category: 'Indie/Alt' },
  { query: 'Take Me To Church Hozier', category: 'Indie/Alt' },
  { query: 'Somebody Else The 1975', category: 'Indie/Alt' },
  { query: 'Robbers The 1975', category: 'Indie/Alt' },
  { query: 'Chocolate The 1975', category: 'Indie/Alt' },
  { query: 'The Sound The 1975', category: 'Indie/Alt' },
  { query: 'If You\'re Too Shy The 1975', category: 'Indie/Alt' },
  { query: 'Do I Wanna Know Arctic Monkeys', category: 'Indie/Alt' },
  { query: '505 Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'R U Mine Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'Fluorescent Adolescent Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'Arabella Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'Why Do You Only Call Me When You re High Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'I Wanna Be Yours Arctic Monkeys', category: 'Indie/Alt' },
  { query: 'Reptilia The Strokes', category: 'Indie/Alt' },
  { query: 'Last Nite The Strokes', category: 'Indie/Alt' },
  { query: 'Someday The Strokes', category: 'Indie/Alt' },
  { query: 'Where Is My Mind Pixies', category: 'Indie/Alt' },
  { query: 'Pumped Up Kicks Foster The People', category: 'Indie/Alt' },
  { query: 'Little Dark Age MGMT', category: 'Indie/Alt' },
  { query: 'Kids MGMT', category: 'Indie/Alt' },
  { query: 'Electric Feel MGMT', category: 'Indie/Alt' },
  { query: 'Skinny Love Bon Iver', category: 'Indie/Alt' },
  { query: 'Holocene Bon Iver', category: 'Indie/Alt' },
  { query: 'Motion Sickness Phoebe Bridgers', category: 'Indie/Alt' },
  { query: 'Savior Complex Phoebe Bridgers', category: 'Indie/Alt' },
  { query: 'Kyoto Phoebe Bridgers', category: 'Indie/Alt' },
  { query: 'Moon Song Phoebe Bridgers', category: 'Indie/Alt' },
  { query: 'Scott Street Phoebe Bridgers', category: 'Indie/Alt' },
  { query: 'Dreams The Cranberries', category: 'Indie/Alt' },
  { query: 'Young Folks Peter Bjorn and John', category: 'Indie/Alt' },
  { query: 'What You Know Two Door Cinema Club', category: 'Indie/Alt' },
  { query: 'Ribs Lorde', category: 'Indie/Alt' },
  { query: 'Green Light Lorde', category: 'Indie/Alt' },
  { query: 'Tennis Court Lorde', category: 'Indie/Alt' },
  { query: 'Royals Lorde', category: 'Indie/Alt' },
  { query: 'One Step Closer Linkin Park', category: 'Indie/Alt' },
  { query: 'Numb Linkin Park', category: 'Indie/Alt' },
  { query: 'In The End Linkin Park', category: 'Indie/Alt' },
  { query: 'Heavy Is the Crown Linkin Park', category: 'Indie/Alt' },
  { query: 'The Emptiness Machine Linkin Park', category: 'Indie/Alt' },
  { query: 'Animal I Have Become Three Days Grace', category: 'Indie/Alt' },
  { query: 'The Less I Know The Better Tame Impala', category: 'Indie/Alt' },
  { query: 'Let It Happen Tame Impala', category: 'Indie/Alt' },
  { query: 'Feels Like We Only Go Backwards Tame Impala', category: 'Indie/Alt' },
  { query: 'Eventually Tame Impala', category: 'Indie/Alt' },
  { query: 'New Person Same Old Mistakes Tame Impala', category: 'Indie/Alt' },
  { query: 'Borderline Tame Impala', category: 'Indie/Alt' },
  { query: 'Elephant Tame Impala', category: 'Indie/Alt' },
  { query: 'Venice Bitch Lana Del Rey', category: 'Indie/Alt' },
  { query: 'Cinnamon Girl Lana Del Rey', category: 'Indie/Alt' },
  { query: 'Yellow Coldplay', category: 'Indie/Alt' },
  { query: 'The Scientist Coldplay', category: 'Indie/Alt' },
  { query: 'Fix You Coldplay', category: 'Indie/Alt' },
  { query: 'Clocks Coldplay', category: 'Indie/Alt' },
  { query: 'Everlong Foo Fighters', category: 'Indie/Alt' },
  { query: 'Best of You Foo Fighters', category: 'Indie/Alt' },
  { query: 'Under The Bridge Red Hot Chili Peppers', category: 'Indie/Alt' },
  { query: 'Californication Red Hot Chili Peppers', category: 'Indie/Alt' },
  { query: 'Scar Tissue Red Hot Chili Peppers', category: 'Indie/Alt' },
  { query: 'Smells Like Teen Spirit Nirvana', category: 'Indie/Alt' },
  { query: 'Come As You Are Nirvana', category: 'Indie/Alt' },
  { query: 'My Hero Foo Fighters', category: 'Indie/Alt' },
  { query: 'Oblivion Grimes', category: 'Indie/Alt' },
  { query: 'Midnight City M83', category: 'Indie/Alt' },
  { query: 'Dead Hearts Stars', category: 'Indie/Alt' },

  // --- Electronic ---
  { query: 'Stay Zedd Alessia Cara', category: 'Electronic' },
  { query: 'Clarity Zedd', category: 'Electronic' },
  { query: 'The Middle Zedd Maren Morris', category: 'Electronic' },
  { query: 'Waiting For Love Avicii', category: 'Electronic' },
  { query: 'Wake Me Up Avicii', category: 'Electronic' },
  { query: 'The Nights Avicii', category: 'Electronic' },
  { query: 'We Found Love Rihanna Calvin Harris', category: 'Electronic' },
  { query: 'This Is What You Came For Calvin Harris Rihanna', category: 'Electronic' },
  { query: 'Summer Calvin Harris', category: 'Electronic' },
  { query: 'Without You David Guetta Usher', category: 'Electronic' },
  { query: 'Titanium David Guetta Sia', category: 'Electronic' },
  { query: 'Let Me Love You DJ Snake Justin Bieber', category: 'Electronic' },
  { query: 'Taki Taki DJ Snake', category: 'Electronic' },
  { query: 'Rather Be Clean Bandit Jess Glynne', category: 'Electronic' },
  { query: 'Saving Up Dom Dolla', category: 'Electronic' },
  { query: 'Cola Camelphat Elderbrook', category: 'Electronic' },
  { query: 'Hypercolour Bicep', category: 'Electronic' },
  { query: 'Glue Bicep', category: 'Electronic' },
  { query: 'Orca Bicep', category: 'Electronic' },
  { query: 'Keep Moving Jungle', category: 'Electronic' },
  { query: 'Busy Earnin Jungle', category: 'Electronic' },
  { query: 'Good Times Jungle', category: 'Electronic' },
  { query: 'Talk About It Flume', category: 'Electronic' },
  { query: 'Never Be Like You Flume', category: 'Electronic' },
  { query: 'Say It Flume', category: 'Electronic' },
  { query: 'Some Minds Flume', category: 'Electronic' },
  { query: 'Insane Flume', category: 'Electronic' },
  { query: 'Space Cadet Rezz', category: 'Electronic' },
  { query: 'Never Catch Me Flying Lotus', category: 'Electronic' },
  { query: 'Danza Kuduro Don Omar Lucenzo', category: 'Electronic' },
  { query: 'Get Lucky Daft Punk Pharrell', category: 'Electronic' },
  { query: 'One More Time Daft Punk', category: 'Electronic' },
  { query: 'Instant Crush Daft Punk Julian Casablancas', category: 'Electronic' },
  { query: 'Shelter Porter Robinson Madeon', category: 'Electronic' },
  { query: 'Language Porter Robinson', category: 'Electronic' },
  { query: 'Mirror Porter Robinson', category: 'Electronic' },
  { query: 'Sad Machine Porter Robinson', category: 'Electronic' },
  { query: 'Divinity Porter Robinson', category: 'Electronic' },
  { query: 'Paper Skin Madeon', category: 'Electronic' },
  { query: 'Pay No Mind Madeon Passion Pit', category: 'Electronic' },
  { query: 'All My Friends Madeon', category: 'Electronic' },
  { query: 'Pop Culture Madeon', category: 'Electronic' },
  { query: 'The Chain Fleetwood Mac', category: 'Electronic' },
  { query: 'Hideaway Kiesza', category: 'Electronic' },
  { query: 'Lean On Major Lazer DJ Snake', category: 'Electronic' },
  { query: 'Cold Water Major Lazer Justin Bieber', category: 'Electronic' },
  { query: 'Powerful Major Lazer Ellie Goulding', category: 'Electronic' },
]

export interface SearchResult {
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

async function itunesSearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`
  )
  if (!res.ok) throw new Error('iTunes search failed')
  const data = (await res.json()) as { results: ItunesResult[] }
  return data.results
    .filter((t) => t.kind === 'song' && t.previewUrl)
    .map((t) => ({
      id: t.trackId,
      name: t.trackName,
      artist: t.artistName,
      previewUrl: t.previewUrl!,
    }))
}

export async function searchTracks(query: string): Promise<SearchResult[]> {
  const tracks = await itunesSearch(query, 10)
  return tracks.slice(0, 8)
}

async function resolveSong(entry: PoolEntry): Promise<Song | null> {
  try {
    const tracks = await itunesSearch(entry.query, 5)
    const t = tracks[0]
    return t ? { id: t.id, name: t.name, artist: t.artist, previewUrl: t.previewUrl, category: entry.category } : null
  } catch {
    return null
  }
}

// Fixed master seed — one shuffle of the entire pool, shared by all players forever.
// Day N gets songs at indices [(N-1)*3, (N-1)*3+1, (N-1)*3+2] — no repeats across days.
const MASTER_SEED = 42

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Master pool order — computed once, reused for all day lookups
function getMasterPool(): PoolEntry[] {
  return shuffle(SONG_POOL, seededRandom(MASTER_SEED))
}

export function getDayPoolEntries(dayNumber: number, size = 3): string[] {
  const pool = getMasterPool()
  const start = (dayNumber - 1) * size
  return pool.slice(start, start + size).map((e) => e.query)
}

export async function buildRound(size = ROUND_SIZE, dayNumber?: number): Promise<Song[]> {
  let entries: PoolEntry[]
  if (dayNumber !== undefined) {
    const pool = getMasterPool()
    const start = (dayNumber - 1) * size
    entries = pool.slice(start, start + size * 4) // grab extra in case some fail to resolve
  } else {
    entries = shuffle(SONG_POOL, seededRandom(Date.now()))
  }
  const songs: Song[] = []
  const seen = new Set<number>()
  let i = 0
  while (songs.length < size && i < entries.length) {
    const batch = entries.slice(i, i + size)
    i += size
    const resolved = await Promise.all(batch.map(resolveSong))
    for (const s of resolved) {
      if (s && !seen.has(s.id)) {
        seen.add(s.id)
        songs.push(s)
        if (songs.length >= size) break
      }
    }
  }
  return songs
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\bfeat\b.*/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function isCorrectGuess(guess: SearchResult, answer: Song): boolean {
  if (guess.id === answer.id) return true
  return normalize(guess.name) === normalize(answer.name)
}
