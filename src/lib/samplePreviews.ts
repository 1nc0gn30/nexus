import { PublicAPI } from '../data/registry';

/**
 * Curated offline sample payloads for popular endpoints and workflows so users
 * can inspect schemas, test the IDE, and run workflow chains even offline.
 */
const EXACT_SAMPLES: Array<{ match: RegExp; payload: unknown }> = [
  {
    match: /jsonplaceholder\.typicode\.com\/users\/\d+/i,
    payload: {
      id: 1,
      name: 'Leanne Graham',
      username: 'Bret',
      email: 'Sincere@april.biz',
      address: { city: 'Gwenborough', zipcode: '92998-3874' },
      company: { name: 'Romaguera-Crona' },
    },
  },
  {
    match: /jsonplaceholder\.typicode\.com\/posts(\?.*)?$/i,
    payload: [
      {
        userId: 1,
        id: 1,
        title: 'sunt aut facere repellat provident occaecati',
        body: 'quia et suscipit recusandae consequuntur expedita et cum',
      },
      {
        userId: 1,
        id: 2,
        title: 'qui est esse',
        body: 'est rerum tempore vitae sequi sint nihil reprehenderit',
      },
    ],
  },
  {
    match: /jsonplaceholder\.typicode\.com\/posts\/\d+/i,
    payload: {
      userId: 1,
      id: 1,
      title: 'sunt aut facere repellat provident occaecati',
      body: 'quia et suscipit recusandae consequuntur expedita et cum',
    },
  },
  {
    match: /jsonplaceholder\.typicode\.com\/todos\/\d+/i,
    payload: {
      userId: 1,
      id: 1,
      title: 'delectus aut autem',
      completed: false,
    },
  },
  {
    match: /jsonplaceholder\.typicode\.com\/comments/i,
    payload: [
      {
        postId: 1,
        id: 1,
        name: 'id labore ex et quam laborum',
        email: 'Eliseo@gardner.biz',
        body: 'laudantium enim quasi est quidem magnam voluptate ipsam eos',
      },
    ],
  },
  {
    match: /api\.github\.com\/users\/[^/]+\/repos/i,
    payload: [
      {
        id: 1296269,
        name: 'Hello-World',
        full_name: 'octocat/Hello-World',
        stargazers_count: 2540,
        language: 'TypeScript',
        html_url: 'https://github.com/octocat/Hello-World',
      },
    ],
  },
  {
    match: /api\.github\.com\/users\/([^/?]+)/i,
    payload: {
      login: 'octocat',
      id: 583231,
      type: 'User',
      name: 'The Octocat',
      company: '@github',
      location: 'San Francisco',
      public_repos: 8,
      followers: 15200,
    },
  },
  {
    match: /catfact\.ninja\/fact/i,
    payload: {
      fact: 'Cats have 32 muscles that control the outer ear compared to 6 in humans.',
      length: 70,
    },
  },
  {
    match: /dog\.ceo\/api\/breeds\/image\/random/i,
    payload: {
      message: 'https://images.dog.ceo/breeds/shiba/shiba-12.jpg',
      status: 'success',
    },
  },
  {
    match: /api\.ipify\.org/i,
    payload: { ip: '203.0.113.42' },
  },
  {
    match: /ipapi\.co\/json/i,
    payload: {
      ip: '203.0.113.42',
      city: 'Norfolk',
      region: 'Virginia',
      country_name: 'United States',
      timezone: 'America/New_York',
    },
  },
  {
    match: /official-joke-api\.appspot\.com/i,
    payload: {
      type: 'programming',
      setup: 'Why do programmers prefer dark mode?',
      punchline: 'Because light attracts bugs.',
      id: 24,
    },
  },
  {
    match: /api\.open-meteo\.com/i,
    payload: {
      latitude: 52.52,
      longitude: 13.41,
      timezone: 'GMT',
      current_weather: {
        temperature: 14.2,
        windspeed: 11.4,
        weathercode: 2,
        time: '2026-04-12T14:00',
      },
    },
  },
  {
    match: /randomuser\.me\/api/i,
    payload: {
      results: [
        {
          gender: 'female',
          name: { title: 'Ms', first: 'Elena', last: 'Vance' },
          location: { city: 'Austin', country: 'United States' },
          email: 'elena.vance@example.com',
        },
      ],
      info: { seed: 'nexus-offline', results: 1, page: 1 },
    },
  },
  {
    match: /api\.agify\.io/i,
    payload: { count: 48210, name: 'elena', age: 34 },
  },
  {
    match: /api\.genderize\.io/i,
    payload: { count: 91430, name: 'elena', gender: 'female', probability: 0.99 },
  },
  {
    match: /api\.nationalize\.io/i,
    payload: {
      count: 14200,
      name: 'nathaniel',
      country: [
        { country_id: 'US', probability: 0.42 },
        { country_id: 'GB', probability: 0.19 },
      ],
    },
  },
  {
    match: /pokeapi\.co\/api\/v2\/pokemon/i,
    payload: {
      id: 132,
      name: 'ditto',
      base_experience: 101,
      height: 3,
      weight: 40,
      abilities: [{ ability: { name: 'limber' } }],
    },
  },
  {
    match: /rickandmortyapi\.com\/api\/character/i,
    payload: {
      id: 1,
      name: 'Rick Sanchez',
      status: 'Alive',
      species: 'Human',
      origin: { name: 'Earth (C-137)' },
    },
  },
  {
    match: /api\.frankfurter\.app\/latest/i,
    payload: {
      amount: 1.0,
      base: 'EUR',
      date: '2026-04-10',
      rates: { USD: 1.09, GBP: 0.85, JPY: 164.2 },
    },
  },
  {
    match: /httpbin\.org\/get/i,
    payload: {
      args: {},
      headers: { Accept: 'application/json', Host: 'httpbin.org' },
      url: 'https://httpbin.org/get',
    },
  },
  {
    match: /api\.zippopotam\.us/i,
    payload: {
      'post code': '33162',
      country: 'United States',
      places: [{ 'place name': 'Miami', state: 'Florida', latitude: '25.9286', longitude: '-80.183' }],
    },
  },
  {
    match: /api\.dictionaryapi\.dev/i,
    payload: [
      {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        meanings: [{ partOfSpeech: 'exclamation', definitions: [{ definition: 'Used as a greeting.' }] }],
      },
    ],
  },
  {
    match: /restcountries\.com/i,
    payload: [
      {
        name: { common: 'Peru', official: 'Republic of Peru' },
        capital: ['Lima'],
        region: 'Americas',
        population: 32971846,
      },
    ],
  },
];

export function getOfflineMockPayload(url: string, api?: PublicAPI): unknown {
  for (const sample of EXACT_SAMPLES) {
    if (sample.match.test(url)) {
      return sample.payload;
    }
  }

  let host = 'api.example.com';
  let pathname = '/';
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    // ignore malformed URLs
  }

  return {
    preview: true,
    mode: 'offline-schema-preview',
    service: api?.API || host,
    category: api?.Category || 'Public API',
    endpoint: `${host}${pathname}`,
    auth: api?.Auth || 'None',
    cors: api?.Cors || 'unknown',
    https: api?.HTTPS ?? url.startsWith('https://'),
    sample: {
      id: 1,
      status: 'ok',
      description: api?.Description || 'Structured offline response preview',
    },
  };
}
