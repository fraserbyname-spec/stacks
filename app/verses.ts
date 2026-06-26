export type Tier = 'EASY' | 'LESS_EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export type Verse = {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  tier: Tier
  searchTerms: string[] // what the player might type to find this book
}

export const VERSES: Verse[] = [
  // EASY
  {
    id: 'john-3-16',
    book: 'John', chapter: 3, verse: 16, tier: 'EASY',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    searchTerms: ['joh', 'john']
  },
  {
    id: 'psalm-23-1',
    book: 'Psalm', chapter: 23, verse: 1, tier: 'EASY',
    text: 'The Lord is my shepherd, I lack nothing.',
    searchTerms: ['psa', 'psalm', 'psal']
  },
  {
    id: 'genesis-1-1',
    book: 'Genesis', chapter: 1, verse: 1, tier: 'EASY',
    text: 'In the beginning God created the heavens and the earth.',
    searchTerms: ['gen', 'gene', 'genes', 'genes', 'genesi', 'genesis']
  },
  {
    id: 'philippians-4-13',
    book: 'Philippians', chapter: 4, verse: 13, tier: 'EASY',
    text: 'I can do all this through him who gives me strength.',
    searchTerms: ['phi', 'phil', 'phili', 'philip', 'philipp', 'philippians']
  },
  {
    id: 'romans-8-28',
    book: 'Romans', chapter: 8, verse: 28, tier: 'EASY',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    searchTerms: ['rom', 'roma', 'roman', 'romans']
  },
  {
    id: 'proverbs-3-5',
    book: 'Proverbs', chapter: 3, verse: 5, tier: 'EASY',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding.',
    searchTerms: ['pro', 'prov', 'prover', 'proverb', 'proverbs']
  },
  {
    id: 'matthew-6-9',
    book: 'Matthew', chapter: 6, verse: 9, tier: 'EASY',
    text: 'Our Father in heaven, hallowed be your name.',
    searchTerms: ['mat', 'matt', 'matth', 'matthew']
  },
  {
    id: 'matthew-5-14',
    book: 'Matthew', chapter: 5, verse: 14, tier: 'EASY',
    text: 'You are the light of the world. A town built on a hill cannot be hidden.',
    searchTerms: ['mat', 'matt', 'matth', 'matthew']
  },
  {
    id: 'jeremiah-29-11',
    book: 'Jeremiah', chapter: 29, verse: 11, tier: 'EASY',
    text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    searchTerms: ['jer', 'jere', 'jerem', 'jeremi', 'jeremiah']
  },
  {
    id: 'psalm-119-105',
    book: 'Psalm', chapter: 119, verse: 105, tier: 'EASY',
    text: 'Your word is a lamp for my feet, a light on my path.',
    searchTerms: ['psa', 'psalm', 'psal']
  },

  // LESS EASY
  {
    id: 'ephesians-2-8',
    book: 'Ephesians', chapter: 2, verse: 8, tier: 'LESS_EASY',
    text: 'For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God.',
    searchTerms: ['eph', 'ephe', 'ephes', 'ephesian', 'ephesians']
  },
  {
    id: 'romans-12-2',
    book: 'Romans', chapter: 12, verse: 2, tier: 'LESS_EASY',
    text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.',
    searchTerms: ['rom', 'roma', 'roman', 'romans']
  },
  {
    id: '1corinthians-13-4',
    book: '1 Corinthians', chapter: 13, verse: 4, tier: 'LESS_EASY',
    text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud.',
    searchTerms: ['1co', '1cor', '1cori', '1 cor', '1 cori', '1 corinthians', 'cor', 'cori']
  },
  {
    id: 'joshua-1-9',
    book: 'Joshua', chapter: 1, verse: 9, tier: 'LESS_EASY',
    text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
    searchTerms: ['jos', 'josh', 'joshu', 'joshua']
  },
  {
    id: 'isaiah-40-31',
    book: 'Isaiah', chapter: 40, verse: 31, tier: 'LESS_EASY',
    text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
    searchTerms: ['isa', 'isai', 'isaia', 'isaiah']
  },
  {
    id: 'hebrews-11-1',
    book: 'Hebrews', chapter: 11, verse: 1, tier: 'LESS_EASY',
    text: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
    searchTerms: ['heb', 'hebr', 'hebre', 'hebrew', 'hebrews']
  },
  {
    id: 'psalm-46-10',
    book: 'Psalm', chapter: 46, verse: 10, tier: 'LESS_EASY',
    text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
    searchTerms: ['psa', 'psalm', 'psal']
  },
  {
    id: 'matthew-28-19',
    book: 'Matthew', chapter: 28, verse: 19, tier: 'LESS_EASY',
    text: 'Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.',
    searchTerms: ['mat', 'matt', 'matth', 'matthew']
  },
  {
    id: 'john-14-6',
    book: 'John', chapter: 14, verse: 6, tier: 'LESS_EASY',
    text: 'I am the way and the truth and the life. No one comes to the Father except through me.',
    searchTerms: ['joh', 'john']
  },
  {
    id: 'luke-6-31',
    book: 'Luke', chapter: 6, verse: 31, tier: 'LESS_EASY',
    text: 'Do to others as you would have them do to you.',
    searchTerms: ['luk', 'luke']
  },

  // MEDIUM
  {
    id: 'james-1-2',
    book: 'James', chapter: 1, verse: 2, tier: 'MEDIUM',
    text: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds.',
    searchTerms: ['jam', 'jame', 'james']
  },
  {
    id: '1peter-5-7',
    book: '1 Peter', chapter: 5, verse: 7, tier: 'MEDIUM',
    text: 'Cast all your anxiety on him because he cares for you.',
    searchTerms: ['1pe', '1pet', '1pete', '1peter', '1 pe', '1 pet', '1 peter', 'pet', 'pete']
  },
  {
    id: 'romans-10-9',
    book: 'Romans', chapter: 10, verse: 9, tier: 'MEDIUM',
    text: 'If you declare with your mouth, "Jesus is Lord," and believe in your heart that God raised him from the dead, you will be saved.',
    searchTerms: ['rom', 'roma', 'roman', 'romans']
  },
  {
    id: 'galatians-5-22',
    book: 'Galatians', chapter: 5, verse: 22, tier: 'MEDIUM',
    text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness.',
    searchTerms: ['gal', 'gala', 'galat', 'galati', 'galatia', 'galatians']
  },
  {
    id: 'matthew-11-28',
    book: 'Matthew', chapter: 11, verse: 28, tier: 'MEDIUM',
    text: 'Come to me, all you who are weary and burdened, and I will give you rest.',
    searchTerms: ['mat', 'matt', 'matth', 'matthew']
  },
  {
    id: 'john-1-1',
    book: 'John', chapter: 1, verse: 1, tier: 'MEDIUM',
    text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    searchTerms: ['joh', 'john']
  },
  {
    id: 'acts-2-38',
    book: 'Acts', chapter: 2, verse: 38, tier: 'MEDIUM',
    text: 'Repent and be baptized, every one of you, in the name of Jesus Christ for the forgiveness of your sins.',
    searchTerms: ['act', 'acts']
  },
  {
    id: 'colossians-3-23',
    book: 'Colossians', chapter: 3, verse: 23, tier: 'MEDIUM',
    text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
    searchTerms: ['col', 'colo', 'colos', 'coloss', 'colossi', 'colossian', 'colossians']
  },
  {
    id: 'psalm-37-4',
    book: 'Psalm', chapter: 37, verse: 4, tier: 'MEDIUM',
    text: 'Take delight in the Lord, and he will give you the desires of your heart.',
    searchTerms: ['psa', 'psalm', 'psal']
  },
  {
    id: 'isaiah-9-6',
    book: 'Isaiah', chapter: 9, verse: 6, tier: 'MEDIUM',
    text: 'For to us a child is born, to us a son is given, and the government will be on his shoulders.',
    searchTerms: ['isa', 'isai', 'isaia', 'isaiah']
  },

  // HARD
  {
    id: 'micah-6-8',
    book: 'Micah', chapter: 6, verse: 8, tier: 'HARD',
    text: 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.',
    searchTerms: ['mic', 'mica', 'micah']
  },
  {
    id: 'habakkuk-2-2',
    book: 'Habakkuk', chapter: 2, verse: 2, tier: 'HARD',
    text: 'Write down the revelation and make it plain on tablets so that a herald may run with it.',
    searchTerms: ['hab', 'haba', 'habak', 'habakk', 'habakkuk']
  },
  {
    id: 'zephaniah-3-17',
    book: 'Zephaniah', chapter: 3, verse: 17, tier: 'HARD',
    text: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.',
    searchTerms: ['zep', 'zeph', 'zephan', 'zephani', 'zephaniah']
  },
  {
    id: 'romans-5-8',
    book: 'Romans', chapter: 5, verse: 8, tier: 'HARD',
    text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
    searchTerms: ['rom', 'roma', 'roman', 'romans']
  },
  {
    id: '2timothy-1-7',
    book: '2 Timothy', chapter: 1, verse: 7, tier: 'HARD',
    text: 'For God has not given us a spirit of fear, but of power, of love and of self-discipline.',
    searchTerms: ['2ti', '2tim', '2timo', '2timothy', '2 ti', '2 tim', '2 timothy', 'tim', 'timo']
  },
  {
    id: '1john-4-18',
    book: '1 John', chapter: 4, verse: 18, tier: 'HARD',
    text: 'There is no fear in love. But perfect love drives out fear.',
    searchTerms: ['1jo', '1joh', '1john', '1 jo', '1 joh', '1 john']
  },
  {
    id: 'revelation-21-4',
    book: 'Revelation', chapter: 21, verse: 4, tier: 'HARD',
    text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.',
    searchTerms: ['rev', 'reve', 'revel', 'revelat', 'revelation']
  },
  {
    id: 'matthew-7-7',
    book: 'Matthew', chapter: 7, verse: 7, tier: 'HARD',
    text: 'Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.',
    searchTerms: ['mat', 'matt', 'matth', 'matthew']
  },
  {
    id: 'psalm-1-1',
    book: 'Psalm', chapter: 1, verse: 1, tier: 'HARD',
    text: 'Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take.',
    searchTerms: ['psa', 'psalm', 'psal']
  },
  {
    id: 'proverbs-16-3',
    book: 'Proverbs', chapter: 16, verse: 3, tier: 'HARD',
    text: 'Commit to the Lord whatever you do, and he will establish your plans.',
    searchTerms: ['pro', 'prov', 'prover', 'proverb', 'proverbs']
  },

  // EXPERT
  {
    id: 'ecclesiastes-3-1',
    book: 'Ecclesiastes', chapter: 3, verse: 1, tier: 'EXPERT',
    text: 'There is a time for everything, and a season for every activity under the heavens.',
    searchTerms: ['ecc', 'eccl', 'eccle', 'ecclesi', 'ecclesiastes']
  },
  {
    id: 'job-1-21',
    book: 'Job', chapter: 1, verse: 21, tier: 'EXPERT',
    text: 'The Lord gave and the Lord has taken away; may the name of the Lord be praised.',
    searchTerms: ['job']
  },
  {
    id: 'lamentations-3-22',
    book: 'Lamentations', chapter: 3, verse: 22, tier: 'EXPERT',
    text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail.',
    searchTerms: ['lam', 'lame', 'lament', 'lamentati', 'lamentations']
  },
  {
    id: 'nahum-1-7',
    book: 'Nahum', chapter: 1, verse: 7, tier: 'EXPERT',
    text: 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.',
    searchTerms: ['nah', 'nahu', 'nahum']
  },
  {
    id: 'hosea-6-6',
    book: 'Hosea', chapter: 6, verse: 6, tier: 'EXPERT',
    text: 'For I desire mercy, not sacrifice, and acknowledgment of God rather than burnt offerings.',
    searchTerms: ['hos', 'hose', 'hosea']
  },
  {
    id: 'malachi-3-10',
    book: 'Malachi', chapter: 3, verse: 10, tier: 'EXPERT',
    text: 'Bring the whole tithe into the storehouse, that there may be food in my house.',
    searchTerms: ['mal', 'mala', 'malac', 'malachi']
  },
  {
    id: 'daniel-3-17',
    book: 'Daniel', chapter: 3, verse: 17, tier: 'EXPERT',
    text: 'If we are thrown into the blazing furnace, the God we serve is able to deliver us from it.',
    searchTerms: ['dan', 'dani', 'danie', 'daniel']
  },
  {
    id: 'ezekiel-36-26',
    book: 'Ezekiel', chapter: 36, verse: 26, tier: 'EXPERT',
    text: 'I will give you a new heart and put a new spirit in you.',
    searchTerms: ['eze', 'ezek', 'ezeki', 'ezekiel']
  },
  {
    id: 'zechariah-4-6',
    book: 'Zechariah', chapter: 4, verse: 6, tier: 'EXPERT',
    text: 'Not by might nor by power, but by my Spirit, says the Lord Almighty.',
    searchTerms: ['zec', 'zech', 'zechar', 'zechariah']
  },
  {
    id: 'deuteronomy-6-5',
    book: 'Deuteronomy', chapter: 6, verse: 5, tier: 'EXPERT',
    text: 'Love the Lord your God with all your heart and with all your soul and with all your strength.',
    searchTerms: ['deu', 'deut', 'deute', 'deuteron', 'deuteronomy']
  },
]

export const TIER_ORDER: Tier[] = ['EASY', 'LESS_EASY', 'MEDIUM', 'HARD', 'EXPERT']

export const shuffleWithinTiers = (): Verse[] => {
  const result: Verse[] = []
  for (const tier of TIER_ORDER) {
    const tierVerses = VERSES.filter(v => v.tier === tier)
    // Fisher-Yates shuffle
    for (let i = tierVerses.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tierVerses[i], tierVerses[j]] = [tierVerses[j], tierVerses[i]]
    }
    result.push(...tierVerses)
  }
  return result
}

// Get all unique books in the verse pool
export const VERSE_BOOKS = [...new Set(VERSES.map(v => v.book))]