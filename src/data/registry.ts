export interface PublicAPI {
  API: string;
  Description: string;
  Auth: string;
  HTTPS: boolean;
  Cors: string;
  Link: string;
  Category: string;
  PythonExample?: string;
  JSExample?: string;
  Feature?: {
    name: string;
    description: string;
    type: 'filter' | 'action' | 'transform';
    params?: Record<string, any>;
  };
}

export interface APIRegistry {
  count: number;
  entries: PublicAPI[];
}

// A representative sample of APIs that meet Auth: No and HTTPS: Yes
export const initialRegistry: PublicAPI[] = [
  {
    API: "Cat Facts",
    Description: "Daily cat facts",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://catfact.ninja/fact",
    Category: "Animals",
    PythonExample: "import requests\n\nresponse = requests.get('https://catfact.ninja/fact')\nprint(response.json()['fact'])",
    JSExample: "fetch('https://catfact.ninja/fact')\n  .then(res => res.json())\n  .then(data => console.log(data.fact));",
    Feature: {
      name: "Random Refresher",
      description: "Instantly fetch a brand new cat fact from the database.",
      type: "action"
    }
  },
  {
    API: "Dog Facts",
    Description: "Random dog facts",
    Auth: "",
    HTTPS: true,
    Cors: "no", // Force proxying as it often has CORS issues
    Link: "https://dog-api.kinduff.com/api/facts",
    Category: "Animals",
    PythonExample: "import requests\n\nresponse = requests.get('https://dog-api.kinduff.com/api/facts')\nprint(response.json()['facts'][0])",
    JSExample: "fetch('https://dog-api.kinduff.com/api/facts')\n  .then(res => res.json())\n  .then(data => console.log(data.facts[0]));",
    Feature: {
      name: "Fact Generator",
      description: "Generate a fresh dog fact using the proxy handler.",
      type: "action"
    }
  },
  {
    API: "Dog Images",
    Description: "Random dog images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://dog.ceo/api/breeds/image/random",
    Category: "Animals",
    Feature: {
      name: "New Puppy",
      description: "Fetch a random high-resolution dog image.",
      type: "action"
    }
  },
  {
    API: "IPify",
    Description: "A simple IP Address API",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.ipify.org?format=json",
    Category: "Development",
    Feature: {
      name: "IP Refresh",
      description: "Re-detect your current public IP address.",
      type: "action"
    }
  },
  {
    API: "IPAPI",
    Description: "IP Geolocation API",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ipapi.co/json/",
    Category: "Development",
    Feature: {
      name: "Locate Me",
      description: "Get detailed geolocation data based on your IP.",
      type: "action"
    }
  },
  {
    API: "Jokes API",
    Description: "Programming and general jokes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://official-joke-api.appspot.com/random_joke",
    Category: "Entertainment",
    Feature: {
      name: "Laugh Out Loud",
      description: "Get a random setup and punchline joke.",
      type: "action"
    }
  },
  {
    API: "JokeAPI",
    Description: "Uniform API for jokes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://v2.jokeapi.dev/joke/Any?safe-mode",
    Category: "Entertainment",
    Feature: {
      name: "Safe Joke",
      description: "Fetch a safe-for-work joke from any category.",
      type: "action"
    }
  },
  {
    API: "Zippopotam",
    Description: "Get info about a zip code",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.zippopotam.us/us/33162",
    Category: "Geocoding",
    Feature: {
      name: "Miami Lookup",
      description: "Lookup details for the 33162 Miami zip code.",
      type: "action"
    }
  },
  {
    API: "Genderize.io",
    Description: "Predict the gender of a name",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.genderize.io/?name=peter",
    Category: "Data Validation",
    Feature: {
      name: "Predict 'Sarah'",
      description: "Predict the gender for the name 'Sarah'.",
      type: "filter",
      params: { name: "sarah" }
    }
  },
  {
    API: "Agify.io",
    Description: "Predict the age of a name",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.agify.io/?name=bella",
    Category: "Data Validation",
    Feature: {
      name: "Predict 'John'",
      description: "Predict the estimated age for the name 'John'.",
      type: "filter",
      params: { name: "john" }
    }
  },
  {
    API: "Nationalize.io",
    Description: "Predict the nationality of a name",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.nationalize.io/?name=nathaniel",
    Category: "Data Validation",
    Feature: {
      name: "Predict 'Nathaniel'",
      description: "Analyze the probable nationality for the name 'Nathaniel'.",
      type: "filter",
      params: { name: "nathaniel" }
    }
  },
  {
    API: "RandomUser",
    Description: "Generates random user data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://randomuser.me/api/",
    Category: "Development",
    Feature: {
      name: "Generate Identity",
      description: "Generate a completely new random user profile.",
      type: "action"
    }
  },
  {
    API: "JSONPlaceholder",
    Description: "Fake Online REST API",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/posts/1",
    Category: "Development",
    Feature: {
      name: "Fetch Post #2",
      description: "Retrieve a different sample post from the placeholder API.",
      type: "action"
    }
  },
  {
    API: "Rick and Morty",
    Description: "Characters and episodes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/character/1",
    Category: "Anime",
    Feature: {
      name: "Morty Smith",
      description: "Fetch details for Morty Smith (ID: 2).",
      type: "action"
    }
  },
  {
    API: "PokeAPI",
    Description: "Pokémon data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/pokemon/ditto",
    Category: "Anime",
    Feature: {
      name: "Pikachu Stats",
      description: "Fetch real-time stats for Pikachu.",
      type: "action"
    }
  },
  {
    API: "Open-Meteo",
    Description: "Weather forecast API",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true",
    Category: "Weather",
    Feature: {
      name: "Berlin Weather",
      description: "Get the current weather conditions in Berlin.",
      type: "action"
    }
  },
  {
    API: "NASA APOD",
    Description: "Astronomy Picture of the Day",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    Category: "Science",
    Feature: {
      name: "Cosmic View",
      description: "Fetch today's Astronomy Picture of the Day from NASA.",
      type: "action"
    }
  },
  {
    API: "Open Library",
    Description: "Books, authors and more",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/api/books?bibkeys=ISBN:0451526562&format=json",
    Category: "Books",
    Feature: {
      name: "Book Lookup",
      description: "Fetch metadata for a specific ISBN (0451526562).",
      type: "action"
    }
  },
  {
    API: "GitHub Users",
    Description: "Public user data from GitHub",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.github.com/users/octocat",
    Category: "Development",
    Feature: {
      name: "Octocat Profile",
      description: "Fetch the public profile of GitHub's mascot.",
      type: "action"
    }
  },
  {
    API: "Anime News",
    Description: "Latest anime news",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.jikan.moe/v4/seasons/now",
    Category: "Anime",
    Feature: {
      name: "Season Refresh",
      description: "Get the latest anime releases for the current season.",
      type: "action"
    }
  },
  {
    API: "Cat as a Service",
    Description: "Random cat images with text",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://cataas.com/cat?json=true",
    Category: "Animals",
    Feature: {
      name: "Meow Image",
      description: "Fetch a random cat image metadata.",
      type: "action"
    }
  },
  {
    API: "Advice Slip",
    Description: "Random advice for life",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.adviceslip.com/advice",
    Category: "Social",
    Feature: {
      name: "Wise Words",
      description: "Get a random piece of life advice.",
      type: "action"
    }
  },
  {
    API: "Evil Insult",
    Description: "Generate random insults",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://evilinsult.com/generate_insult.php?lang=en&type=json",
    Category: "Entertainment",
    Feature: {
      name: "Insult Me",
      description: "Generate a random (evil) insult via proxy.",
      type: "action"
    }
  },
  {
    API: "Ghibli API",
    Description: "Studio Ghibli films and characters",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/films",
    Category: "Anime",
    Feature: {
      name: "Filmography",
      description: "Retrieve a list of all Studio Ghibli films.",
      type: "action"
    }
  },
  {
    API: "Random Fact",
    Description: "Useless but true facts",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    Category: "Entertainment",
    Feature: {
      name: "Useless Fact",
      description: "Get a random fact that is completely useless.",
      type: "action"
    }
  },
  {
    API: "Blockchain Info",
    Description: "Bitcoin blockchain data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://blockchain.info/ticker",
    Category: "Blockchain"
  },
  {
    API: "Jikan Random Anime",
    Description: "Random anime data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.jikan.moe/v4/random/anime",
    Category: "Anime"
  },
  {
    API: "The Color API",
    Description: "Color information and conversion",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.thecolorapi.com/id?hex=0047AB",
    Category: "Art & Design",
    Feature: {
      name: "Color Info",
      description: "Get detailed information for the hex color #0047AB.",
      type: "action"
    }
  },
  {
    API: "Blockchain Stats",
    Description: "Bitcoin network statistics",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://api.blockchain.info/stats",
    Category: "Blockchain"
  },
  {
    API: "Clearbit Autocomplete",
    Description: "Company autocomplete and logo API",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://autocomplete.clearbit.com/v1/companies/suggest?query=segment",
    Category: "Business"
  },
  {
    API: "Nager.Date",
    Description: "Public holidays for a given year",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://date.nager.at/api/v3/PublicHolidays/2023/US",
    Category: "Calendar"
  },
  {
    API: "CoinLore",
    Description: "Cryptocurrency prices and market cap",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.coinlore.net/api/ticker/?id=90",
    Category: "Cryptocurrency"
  },
  {
    API: "Frankfurter",
    Description: "Current and historical foreign exchange rates",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.frankfurter.app/latest",
    Category: "Currency Exchange",
    Feature: {
      name: "Latest Rates",
      description: "Fetch the most recent foreign exchange rates.",
      type: "action"
    }
  },
  {
    API: "Postman Echo",
    Description: "Echo service for testing API calls",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://postman-echo.com/get?foo1=bar1&foo2=bar2",
    Category: "Data Validation"
  },
  {
    API: "Httpbin",
    Description: "A simple HTTP Request & Response Service",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://httpbin.org/get",
    Category: "Development"
  },
  {
    API: "Free Dictionary",
    Description: "English dictionary with definitions and audio",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.dictionaryapi.dev/api/v2/entries/en/hello",
    Category: "Dictionaries",
    Feature: {
      name: "Define 'Hello'",
      description: "Get the definition and phonetics for the word 'Hello'.",
      type: "action"
    }
  },
  {
    API: "Open Library Search",
    Description: "Search for books in the Open Library",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/search.json?q=the+lord+of+the+rings",
    Category: "Education"
  },
  {
    API: "Deck of Cards",
    Description: "Deck of cards as a service",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1",
    Category: "Entertainment"
  },
  {
    API: "WAQI",
    Description: "World Air Quality Index",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.waqi.info/feed/shanghai/?token=demo",
    Category: "Environment"
  },
  {
    API: "TheMealDB",
    Description: "Random meal recipes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.themealdb.com/api/json/v1/1/random.php",
    Category: "Food & Drink",
    Feature: {
      name: "Random Recipe",
      description: "Fetch a random meal recipe with instructions and ingredients.",
      type: "action"
    }
  },
  {
    API: "XKCD",
    Description: "Latest XKCD comic metadata",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://xkcd.com/info.0.json",
    Category: "Games & Comics",
    Feature: {
      name: "Latest Comic",
      description: "Get metadata for the most recent XKCD comic.",
      type: "action"
    }
  },
  {
    API: "Nominatim",
    Description: "OpenStreetMap reverse geocoding",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://nominatim.openstreetmap.org/reverse?format=json&lat=-34.44076&lon=-58.70521",
    Category: "Geocoding"
  },
  {
    API: "Open Brewery DB",
    Description: "Public breweries in the US",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.openbrewerydb.org/v1/breweries",
    Category: "Food & Drink",
    Feature: {
      name: "Brewery List",
      description: "Fetch a list of public breweries in the US.",
      type: "action"
    }
  },
  {
    API: "Jobicy",
    Description: "Remote jobs feed",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jobicy.com/api/v2/remote-jobs",
    Category: "Jobs"
  },
  {
    API: "iTunes Search",
    Description: "Search for content on the iTunes Store",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://itunes.apple.com/search?term=jack+johnson",
    Category: "Music"
  },
  {
    API: "ok.surf News",
    Description: "World news feed",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ok.surf/api/v1/cors/news-feed",
    Category: "News"
  },
  {
    API: "Lorem Picsum",
    Description: "Placeholder image list",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://picsum.photos/v2/list",
    Category: "Photography",
    Feature: {
      name: "Image Gallery",
      description: "Fetch a list of high-quality placeholder images.",
      type: "action"
    }
  },
  {
    API: "USGS Earthquakes",
    Description: "Real-time earthquake data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2014-01-01&endtime=2014-01-02",
    Category: "Science"
  },
  {
    API: "Mastodon Instance",
    Description: "Public Mastodon instance metadata",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://mastodon.social/api/v1/instance",
    Category: "Social"
  },
  {
    API: "TheSportsDB",
    Description: "Sports player search",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=Danny%20Welbeck",
    Category: "Sports & Fitness"
  },
  {
    API: "Faker API",
    Description: "Fake data for testing",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://fakerapi.it/api/v1/persons?_quantity=1&_gender=male&_birthday_start=2005-01-01",
    Category: "Test Data"
  },
  {
    API: "TVMaze Search",
    Description: "Search for TV shows",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.tvmaze.com/search/shows?q=girls",
    Category: "Video"
  },
  {
    API: "7Timer!",
    Description: "Weather forecast for any location",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.7timer.info/bin/astro.php?lon=113.2&lat=23.1&ac=0&unit=metric&output=json&tzshift=0",
    Category: "Weather"
  },
  {
    API: "Met Museum",
    Description: "Metropolitan Museum of Art Collection",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://collectionapi.metmuseum.org/public/collection/v1/objects/1",
    Category: "Art & Design"
  },
  {
    API: "Art Institute of Chicago",
    Description: "Art Institute of Chicago Collection",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.artic.edu/api/v1/artworks/129454",
    Category: "Art & Design"
  },
  {
    API: "CDNJS",
    Description: "Library information from cdnjs",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.cdnjs.com/libraries/jquery",
    Category: "Development"
  },
  {
    API: "The CocktailDB",
    Description: "Random cocktail recipes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.thecocktaildb.com/api/json/v1/1/random.php",
    Category: "Food & Drink"
  },
  {
    API: "CheapShark",
    Description: "PC game deals",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15",
    Category: "Games & Comics"
  },
  {
    API: "MusicBrainz",
    Description: "Music encyclopedia data",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://musicbrainz.org/ws/2/artist/5b11f4ce-a62d-471e-81fc-a69a8278c7da?fmt=json",
    Category: "Music"
  },
  {
    API: "NHTSA Vehicles",
    Description: "Vehicle makes and models",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json",
    Category: "Vehicle"
  },
  {
    API: "Rest Countries",
    Description: "Information about countries",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://restcountries.com/v3.1/name/peru",
    Category: "Geocoding"
  },
  {
    API: "Bacon Ipsum",
    Description: "Meat-themed placeholder text",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://baconipsum.com/api/?type=all-meat&sentences=1&format=json",
    Category: "Test Data"
  },
  {
    API: "Corporate BS",
    Description: "Corporate buzzword generator",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://corporatebs-generator.sameerkumar.website/",
    Category: "Entertainment"
  },
  {
    API: "Kanye Rest",
    Description: "Random Kanye West quotes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.kanye.rest/",
    Category: "Entertainment"
  },
  {
    API: "Free IP API",
    Description: "IP address and location info",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://freeipapi.com/api/json",
    Category: "Development"
  },
  {
    API: "Wiktionary",
    Description: "Dictionary data from Wiktionary",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://en.wiktionary.org/api/rest_v1/page/definition/hello",
    Category: "Dictionaries"
  },
  {
    API: "Open Library Subjects",
    Description: "Books by subject",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://openlibrary.org/subjects/love.json",
    Category: "Books"
  },
  {
    API: "Anime Quotes",
    Description: "Random anime quotes",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://animechan.xyz/api/random",
    Category: "Anime"
  },
  {
    API: "DummyJSON",
    Description: "Get dummy JSON data to use as placeholder in your frontend",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://dummyjson.com/products/1",
    Category: "Development"
  },
  {
    API: "Random Dog Image",
    Description: "Random dog images and videos",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://random.dog/woof.json",
    Category: "Animals"
  },
  {
    API: "The Cat API",
    Description: "Random cat images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.thecatapi.com/v1/images/search",
    Category: "Animals"
  },
  {
    API: "The Dog API",
    Description: "Random dog images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.thedogapi.com/v1/images/search",
    Category: "Animals"
  },
  {
    API: "MeowFacts",
    Description: "Get random cat facts",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://meowfacts.herokuapp.com/",
    Category: "Animals"
  },
  {
    API: "PlaceBear",
    Description: "Placeholder bear images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://placebear.com/200/300",
    Category: "Animals"
  },
  {
    API: "FishWatch",
    Description: "Information about edible fish species",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://www.fishwatch.gov/api/species",
    Category: "Animals"
  },
  {
    API: "Random Fox",
    Description: "Random fox images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://randomfox.ca/floof/",
    Category: "Animals"
  },
  {
    API: "Random Duck",
    Description: "Random duck images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://random-d.uk/api/v2/random",
    Category: "Animals"
  },
  {
    API: "Random Koala",
    Description: "Random koala images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://some-random-api.com/animal/koala",
    Category: "Animals"
  },
  {
    API: "Random Panda",
    Description: "Random panda images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://some-random-api.com/animal/panda",
    Category: "Animals"
  },
  {
    API: "Random Bird",
    Description: "Random bird images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://some-random-api.com/animal/bird",
    Category: "Animals"
  },
  {
    API: "Random Kangaroo",
    Description: "Random kangaroo images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://some-random-api.com/animal/kangaroo",
    Category: "Animals"
  },
  {
    API: "Random Whale",
    Description: "Random whale images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://some-random-api.com/animal/whale",
    Category: "Animals"
  },
  {
    API: "Nekos.best",
    Description: "Neko images and more",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://nekos.best/api/v2/neko",
    Category: "Anime"
  },
  {
    API: "Waifu.pics",
    Description: "Random anime images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.waifu.pics/sfw/waifu",
    Category: "Anime"
  },
  {
    API: "DiceBear",
    Description: "Avatar library for designers and developers",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.dicebear.com/7.x/pixel-art/svg",
    Category: "Art & Design"
  },
  {
    API: "Library of Congress",
    Description: "Digital collections from the Library of Congress",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.loc.gov/search/?q=baseball&fo=json",
    Category: "Books"
  },
  {
    API: "Hebcal",
    Description: "Jewish calendar and holiday dates",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=now&month=x&ss=on&mf=on&c=on&geo=zip&zip=90210&m=50&s=on",
    Category: "Calendar"
  },
  {
    API: "CoinGecko",
    Description: "Cryptocurrency data from CoinGecko",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.coingecko.com/api/v3/ping",
    Category: "Cryptocurrency"
  },
  {
    API: "Coinbase",
    Description: "Bitcoin price from Coinbase",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.coinbase.com/v2/prices/spot?currency=USD",
    Category: "Cryptocurrency"
  },
  {
    API: "Bitfinex",
    Description: "Cryptocurrency tickers from Bitfinex",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://api-pub.bitfinex.com/v2/tickers?symbols=tBTCUSD",
    Category: "Cryptocurrency"
  },
  {
    API: "Exchangerate.host",
    Description: "Free currency exchange rates",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.exchangerate.host/latest",
    Category: "Currency Exchange"
  },
  {
    API: "PurgoMalum",
    Description: "Profanity filter service",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://www.purgomalum.com/service/json?text=this%20is%20some%20test%20data",
    Category: "Data Validation"
  },
  {
    API: "UNPKG",
    Description: "The CDN for everything on npm",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://unpkg.com/react@18/package.json",
    Category: "Development"
  },
  {
    API: "Open Food Facts",
    Description: "Food products database",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://world.openfoodfacts.org/api/v0/product/737628064502.json",
    Category: "Food & Drink"
  },
  {
    API: "Digimon API",
    Description: "Digimon characters and data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://digimon-api.vercel.app/api/digimon",
    Category: "Games & Comics"
  },
  {
    API: "Disease.sh",
    Description: "Open disease data (COVID-19, etc.)",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://disease.sh/v3/covid-19/all",
    Category: "Health"
  },
  {
    API: "Newton",
    Description: "Advanced math solver",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://newton.now.sh/api/v2/simplify/2^2+2(2)",
    Category: "Science & Math"
  },
  {
    API: "Meteorologisk Institutt",
    Description: "Weather forecast from the Norwegian Meteorological Institute",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.5&lon=0",
    Category: "Weather"
  },
  {
    API: "PlaceGoat",
    Description: "Placeholder goat images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://placegoat.com/200/200",
    Category: "Animals"
  },
  {
    API: "Random Bunny",
    Description: "Random bunny images and gifs",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.bunnies.io/v2/loop/random/?media=gif",
    Category: "Animals"
  },
  {
    API: "Random Lizard",
    Description: "Random lizard images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://nekos.life/api/v2/img/lizard",
    Category: "Animals"
  },
  {
    API: "Random Goose",
    Description: "Random goose images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://nekos.life/api/v2/img/goose",
    Category: "Animals"
  },
  {
    API: "Kitsu",
    Description: "Anime and manga search",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://kitsu.io/api/edge/anime?filter[text]=cowboy%20bebop",
    Category: "Anime"
  },
  {
    API: "MyMemory Translation",
    Description: "Free translation memory and machine translation",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.mymemory.translated.net/get?q=Hello%20World!&langpair=en|it",
    Category: "Text Analysis"
  },
  {
    API: "MLB API",
    Description: "MLB teams and statistics",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://statsapi.mlb.com/api/v1/teams",
    Category: "Sports & Fitness"
  },
  {
    API: "Dailymotion API",
    Description: "Search for videos on Dailymotion",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.dailymotion.com/videos?fields=id,title,owner&limit=10",
    Category: "Video"
  },
  {
    API: "FDA API",
    Description: "Food and Drug Administration open data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.fda.gov/food/enforcement.json?limit=1",
    Category: "Health"
  },
  {
    API: "SpaceX API",
    Description: "SpaceX launches and rockets data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.spacexdata.com/v4/launches/latest",
    Category: "Science & Math"
  },
  {
    API: "Lemmy API",
    Description: "Data from the Lemmy federated social network",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://lemmy.ml/api/v3/site",
    Category: "Social"
  },
  {
    API: "Random Coffee",
    Description: "Random coffee images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://coffee.alexflipnote.dev/random.json",
    Category: "Food & Drink"
  },
  {
    API: "Harry Potter API",
    Description: "Characters and spells from Harry Potter",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hp-api.onrender.com/api/characters",
    Category: "Entertainment"
  },
  {
    API: "Magic: The Gathering API",
    Description: "Magic: The Gathering cards and sets",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.magicthegathering.io/v1/cards",
    Category: "Games & Comics"
  },
  {
    API: "Country Flags API",
    Description: "Get country flags by code",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://flagcdn.com/en/codes.json",
    Category: "Geocoding"
  },
  {
    API: "Open Library Covers",
    Description: "Book covers from Open Library",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://covers.openlibrary.org/b/isbn/0385472579-L.jpg",
    Category: "Books"
  },
  {
    API: "Wallhaven API",
    Description: "Wallpaper search API",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://wallhaven.cc/api/v1/search",
    Category: "Art & Design"
  },
  {
    API: "Lorem Picsum",
    Description: "Reliable placeholder images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://picsum.photos/320/240",
    Category: "Photography"
  },
  {
    API: "Dino Ipsum",
    Description: "Dinosaur-themed placeholder text",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://dinoipsum.com/api/?format=json&paragraphs=1&words=10",
    Category: "Test Data"
  },
  {
    API: "Sunrise-Sunset",
    Description: "Sunrise and sunset times for a given latitude and longitude",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400",
    Category: "Science & Math"
  },
  {
    API: "USGS Water Services",
    Description: "Water data for the Nation",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=01646500",
    Category: "Environment"
  },
  {
    API: "NBP Web API",
    Description: "Exchange rates from the National Bank of Poland",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.nbp.pl/api/exchangerates/tables/a/?format=json",
    Category: "Finance"
  },
  {
    API: "BitPay Rates",
    Description: "Current exchange rates from BitPay",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://bitpay.com/api/rates",
    Category: "Finance"
  },
  {
    API: "Blockchain.info Charts",
    Description: "Bitcoin market price chart data",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://api.blockchain.info/charts/market-price?format=json",
    Category: "Blockchain"
  },
  {
    API: "Cataas Tags",
    Description: "List of tags for Cat as a Service",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://cataas.com/api/tags",
    Category: "Animals"
  },
  {
    API: "Dog Breeds List",
    Description: "List of all dog breeds",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://dog.ceo/api/breeds/list/all",
    Category: "Animals"
  },
  {
    API: "Sub-breed List",
    Description: "List of sub-breeds for a dog breed",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://dog.ceo/api/breed/hound/list",
    Category: "Animals"
  },
  {
    API: "Random User (Multiple)",
    Description: "Generate multiple random users",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://randomuser.me/api/?results=5",
    Category: "Development"
  },
  {
    API: "Random User (Gender)",
    Description: "Generate random user by gender",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://randomuser.me/api/?gender=female",
    Category: "Development"
  },
  {
    API: "JSONPlaceholder Comments",
    Description: "Fake comments data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/comments",
    Category: "Development"
  },
  {
    API: "JSONPlaceholder Albums",
    Description: "Fake albums data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/albums",
    Category: "Development"
  },
  {
    API: "JSONPlaceholder Photos",
    Description: "Fake photos data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/photos",
    Category: "Development"
  },
  {
    API: "JSONPlaceholder Todos",
    Description: "Fake todos data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/todos",
    Category: "Development"
  },
  {
    API: "JSONPlaceholder Users",
    Description: "Fake users data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://jsonplaceholder.typicode.com/users",
    Category: "Development"
  },
  {
    API: "Httpbin IP",
    Description: "Returns Origin IP",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://httpbin.org/ip",
    Category: "Development"
  },
  {
    API: "Httpbin User-Agent",
    Description: "Returns User-Agent",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://httpbin.org/user-agent",
    Category: "Development"
  },
  {
    API: "Httpbin Headers",
    Description: "Returns Request Headers",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://httpbin.org/headers",
    Category: "Development"
  },
  {
    API: "PokeAPI Berries",
    Description: "Pokémon berry data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/berry/1",
    Category: "Anime"
  },
  {
    API: "PokeAPI Contests",
    Description: "Pokémon contest data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/contest-type/1",
    Category: "Anime"
  },
  {
    API: "PokeAPI Encounters",
    Description: "Pokémon encounter data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/encounter-method/1",
    Category: "Anime"
  },
  {
    API: "PokeAPI Evolution",
    Description: "Pokémon evolution data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/evolution-chain/1",
    Category: "Anime"
  },
  {
    API: "PokeAPI Generations",
    Description: "Pokémon generation data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/generation/1",
    Category: "Anime"
  },
  {
    API: "Rick and Morty Locations",
    Description: "Rick and Morty locations",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/location",
    Category: "Anime"
  },
  {
    API: "Rick and Morty Episodes",
    Description: "Rick and Morty episodes",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/episode",
    Category: "Anime"
  },
  {
    API: "Ghibli Locations",
    Description: "Studio Ghibli locations",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/locations",
    Category: "Anime"
  },
  {
    API: "Ghibli Species",
    Description: "Studio Ghibli species",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/species",
    Category: "Anime"
  },
  {
    API: "Ghibli Vehicles",
    Description: "Studio Ghibli vehicles",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/vehicles",
    Category: "Anime"
  },
  {
    API: "TVMaze Schedule",
    Description: "TV show schedule",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.tvmaze.com/schedule?country=US&date=2014-12-01",
    Category: "Video"
  },
  {
    API: "TVMaze Show Index",
    Description: "TV show index",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.tvmaze.com/shows",
    Category: "Video"
  },
  {
    API: "TVMaze People Search",
    Description: "Search for people in TVMaze",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.tvmaze.com/search/people?q=lauren",
    Category: "Video"
  },
  {
    API: "Robohash",
    Description: "Generate unique robot avatars from text",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://robohash.org/antigravity",
    Category: "Art & Design"
  },
  {
    API: "PlaceKeanu",
    Description: "Placeholder Keanu Reeves images",
    Auth: "",
    HTTPS: true,
    Cors: "no",
    Link: "https://placekeanu.com/200/300",
    Category: "Entertainment"
  },
  {
    API: "World Bank Indicators",
    Description: "World Bank development indicators",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Countries",
    Description: "List of countries from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/country?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Regions",
    Description: "List of regions from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/region?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Income Levels",
    Description: "List of income levels from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/incomeLevel?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Lending Types",
    Description: "List of lending types from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/lendingType?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Topics",
    Description: "List of topics from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/topic?format=json",
    Category: "Open Data"
  },
  {
    API: "World Bank Sources",
    Description: "List of sources from World Bank",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.worldbank.org/v2/source?format=json",
    Category: "Open Data"
  },
  {
    API: "Foodish API",
    Description: "Random food images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Burger",
    Description: "Random burger images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/burger",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Pizza",
    Description: "Random pizza images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/pizza",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Dessert",
    Description: "Random dessert images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/dessert",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Pasta",
    Description: "Random pasta images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/pasta",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Rice",
    Description: "Random rice images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/rice",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Samosa",
    Description: "Random samosa images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/samosa",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Biryani",
    Description: "Random biryani images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/biryani",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Dosa",
    Description: "Random dosa images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/dosa",
    Category: "Food & Drink"
  },
  {
    API: "Foodish Butter Chicken",
    Description: "Random butter chicken images",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://foodish-api.com/api/images/butter-chicken",
    Category: "Food & Drink"
  },
  {
    API: "Open Meteo Geocoding",
    Description: "Search for locations by name",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://geocoding-api.open-meteo.com/v1/search?name=Berlin&count=10&language=en&format=json",
    Category: "Geocoding"
  },
  {
    API: "Open Meteo Air Quality",
    Description: "Air quality forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.52&longitude=13.41&current=european_aqi,us_aqi",
    Category: "Environment"
  },
  {
    API: "Open Meteo Flood",
    Description: "Flood forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://flood-api.open-meteo.com/v1/flood?latitude=52.52&longitude=13.41&daily=river_discharge",
    Category: "Environment"
  },
  {
    API: "Open Meteo Marine",
    Description: "Marine forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://marine-api.open-meteo.com/v1/marine?latitude=52.52&longitude=13.41&current=wave_height",
    Category: "Environment"
  },
  {
    API: "Open Meteo Elevation",
    Description: "Get elevation for coordinates",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/elevation?latitude=52.52,48.85&longitude=13.41,2.35",
    Category: "Science & Math"
  },
  {
    API: "Open Meteo UV",
    Description: "UV index forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=uv_index",
    Category: "Weather"
  },
  {
    API: "Open Meteo Wind",
    Description: "Wind speed forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=windspeed_10m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Pressure",
    Description: "Surface pressure forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=surface_pressure",
    Category: "Weather"
  },
  {
    API: "Open Meteo Humidity",
    Description: "Relative humidity forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=relativehumidity_2m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Precipitation",
    Description: "Precipitation forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=precipitation",
    Category: "Weather"
  },
  {
    API: "Open Meteo Cloud Cover",
    Description: "Cloud cover forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=cloudcover",
    Category: "Weather"
  },
  {
    API: "Open Meteo Dew Point",
    Description: "Dew point forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=dewpoint_2m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Apparent Temp",
    Description: "Apparent temperature forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=apparent_temperature",
    Category: "Weather"
  },
  {
    API: "Open Meteo Snowfall",
    Description: "Snowfall forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=snowfall",
    Category: "Weather"
  },
  {
    API: "Open Meteo Wind Gusts",
    Description: "Wind gusts forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=windgusts_10m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Wind Direction",
    Description: "Wind direction forecast data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=winddirection_10m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Temperature 80m",
    Description: "Temperature at 80m altitude",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_80m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Windspeed 80m",
    Description: "Wind speed at 80m altitude",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=windspeed_80m",
    Category: "Weather"
  },
  {
    API: "Open Meteo Winddirection 80m",
    Description: "Wind direction at 80m altitude",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=winddirection_80m",
    Category: "Weather"
  },
  {
    API: "Open Library Books API",
    Description: "Get book data by ISBN or LCCN",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/api/books?bibkeys=ISBN:0451526562&format=json",
    Category: "Books"
  },
  {
    API: "Open Library Recent Changes",
    Description: "Recent changes to the Open Library database",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/recentchanges.json",
    Category: "Books"
  },
  {
    API: "Open Library Covers API",
    Description: "Get book covers by ID",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://covers.openlibrary.org/b/id/240726-S.jpg",
    Category: "Books"
  },
  {
    API: "Open Library Authors API",
    Description: "Get author data by ID",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/authors/OL23919A.json",
    Category: "Books"
  },
  {
    API: "Open Library Works API",
    Description: "Get work data by ID",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://openlibrary.org/works/OL45583W.json",
    Category: "Books"
  },
  {
    API: "Hacker News Top Stories",
    Description: "Top stories from Hacker News",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/topstories.json",
    Category: "News"
  },
  {
    API: "Hacker News New Stories",
    Description: "Newest stories from Hacker News",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/newstories.json",
    Category: "News"
  },
  {
    API: "Hacker News Best Stories",
    Description: "Best stories from Hacker News",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/beststories.json",
    Category: "News"
  },
  {
    API: "Hacker News Ask Stories",
    Description: "Ask HN stories",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/askstories.json",
    Category: "News"
  },
  {
    API: "Hacker News Show Stories",
    Description: "Show HN stories",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/showstories.json",
    Category: "News"
  },
  {
    API: "Hacker News Job Stories",
    Description: "Job stories from Hacker News",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/jobstories.json",
    Category: "News"
  },
  {
    API: "Hacker News Item Detail",
    Description: "Get details for a specific HN item",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/item/8863.json",
    Category: "News"
  },
  {
    API: "Hacker News User Detail",
    Description: "Get details for a specific HN user",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/user/jl.json",
    Category: "News"
  },
  {
    API: "Hacker News Max Item",
    Description: "Get the current largest item ID",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/maxitem.json",
    Category: "News"
  },
  {
    API: "Hacker News Updates",
    Description: "Get recent item and profile updates",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://hacker-news.firebaseio.com/v0/updates.json",
    Category: "News"
  },
  {
    API: "PokéAPI",
    Description: "Get Pokémon data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/pokemon/pikachu",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Ability",
    Description: "Get Pokémon abilities",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/ability/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Berry",
    Description: "Get Pokémon berries",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/berry/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Characteristic",
    Description: "Get Pokémon characteristics",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/characteristic/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Evolution Chain",
    Description: "Get Pokémon evolution chains",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/evolution-chain/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Generation",
    Description: "Get Pokémon generations",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/generation/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Item",
    Description: "Get Pokémon items",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/item/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Location",
    Description: "Get Pokémon locations",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/location/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Move",
    Description: "Get Pokémon moves",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/move/1",
    Category: "Games & Comics"
  },
  {
    API: "PokéAPI Nature",
    Description: "Get Pokémon natures",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://pokeapi.co/api/v2/nature/1",
    Category: "Games & Comics"
  },
  {
    API: "Rick and Morty Character",
    Description: "Rick and Morty character data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/character/1",
    Category: "Games & Comics"
  },
  {
    API: "Rick and Morty Location",
    Description: "Rick and Morty location data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/location/1",
    Category: "Games & Comics"
  },
  {
    API: "Rick and Morty Episode",
    Description: "Rick and Morty episode data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://rickandmortyapi.com/api/episode/1",
    Category: "Games & Comics"
  },
  {
    API: "Final Space Characters",
    Description: "Final Space character data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://finalspaceapi.com/api/v0/character/",
    Category: "Games & Comics"
  },
  {
    API: "Final Space Episodes",
    Description: "Final Space episode data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://finalspaceapi.com/api/v0/episode/",
    Category: "Games & Comics"
  },
  {
    API: "Final Space Locations",
    Description: "Final Space location data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://finalspaceapi.com/api/v0/location/",
    Category: "Games & Comics"
  },
  {
    API: "Studio Ghibli People",
    Description: "Studio Ghibli characters data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/people",
    Category: "Anime"
  },
  {
    API: "Studio Ghibli Locations",
    Description: "Studio Ghibli locations data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/locations",
    Category: "Anime"
  },
  {
    API: "Studio Ghibli Species",
    Description: "Studio Ghibli species data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/species",
    Category: "Anime"
  },
  {
    API: "Studio Ghibli Vehicles",
    Description: "Studio Ghibli vehicles data",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://ghibliapi.vercel.app/vehicles",
    Category: "Anime"
  },
  {
    API: "Open Brewery DB Search",
    Description: "Search for breweries by name",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.openbrewerydb.org/v1/breweries/search?query=dog",
    Category: "Food & Drink"
  },
  {
    API: "Open Brewery DB Autocomplete",
    Description: "Autocomplete brewery names",
    Auth: "",
    HTTPS: true,
    Cors: "yes",
    Link: "https://api.openbrewerydb.org/v1/breweries/autocomplete?query=dog",
    Category: "Food & Drink"
  }
];
