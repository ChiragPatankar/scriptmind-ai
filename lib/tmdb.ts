/**
 * Movie poster data source — Wikipedia Commons (no API key required)
 * Optional live data: OMDB API (https://www.omdbapi.com — free, 1000 req/day)
 *
 * All poster images are served from upload.wikimedia.org — permanent,
 * publicly accessible, no auth required.
 */

// ─── Shared types (kept identical so no other file needs changes) ─────────────

export type TMDBMovie = {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;   // kept for compat; we store full URLs here
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  original_language: string;
};

export type TMDBMovieDetail = TMDBMovie & {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
};

export type BollywoodMovie = {
  id: number;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  year: string;
  rating: string;
  overview: string;
};

// ─── Wikipedia Commons poster URLs ────────────────────────────────────────────
// Source: https://en.wikipedia.org/wiki/<Film_name>  → "Infobox film" poster
// These URLs are permanent and don't require any authentication.

export const STATIC_BOLLYWOOD_MOVIES: TMDBMovie[] = [
  {
    id: 1,
    title: "Sholay",
    original_title: "Sholay",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/2/2b/Sholay_poster.jpg",
    backdrop_path: null,
    release_date: "1975-08-15",
    vote_average: 8.4,
    vote_count: 1200,
    overview: "Two criminals are hired to capture a ruthless dacoit.",
    genre_ids: [28, 18],
    original_language: "hi",
  },
  {
    id: 2,
    title: "3 Idiots",
    original_title: "3 Idiots",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg",
    backdrop_path: null,
    release_date: "2009-12-25",
    vote_average: 8.4,
    vote_count: 4200,
    overview: "Three friends navigate the pressures of an Indian engineering college.",
    genre_ids: [35, 18],
    original_language: "hi",
  },
  {
    id: 3,
    title: "Lagaan",
    original_title: "Lagaan",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/8/8f/Lagaan_Movie_Poster.jpg",
    backdrop_path: null,
    release_date: "2001-06-15",
    vote_average: 8.1,
    vote_count: 1100,
    overview: "Villagers in colonial India challenge British officers to a cricket match.",
    genre_ids: [18, 36],
    original_language: "hi",
  },
  {
    id: 4,
    title: "Dil Chahta Hai",
    original_title: "Dil Chahta Hai",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/8/83/Dil_Chahta_Hai_poster.jpg",
    backdrop_path: null,
    release_date: "2001-08-10",
    vote_average: 8.1,
    vote_count: 890,
    overview: "Three inseparable best friends navigate love and life after college.",
    genre_ids: [35, 10749],
    original_language: "hi",
  },
  {
    id: 5,
    title: "Dangal",
    original_title: "Dangal",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/a/ac/Dangal_Poster.jpg",
    backdrop_path: null,
    release_date: "2016-12-23",
    vote_average: 8.4,
    vote_count: 4800,
    overview: "A former wrestler trains his daughters to become world-class wrestlers.",
    genre_ids: [18, 36],
    original_language: "hi",
  },
  {
    id: 6,
    title: "PK",
    original_title: "PK",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/b/b5/PK_film_poster.jpg",
    backdrop_path: null,
    release_date: "2014-12-19",
    vote_average: 8.2,
    vote_count: 3800,
    overview: "An alien on Earth questions the logic behind religion and godmen.",
    genre_ids: [35, 18],
    original_language: "hi",
  },
  {
    id: 7,
    title: "Taare Zameen Par",
    original_title: "Taare Zameen Par",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/4/4e/Taare_Zameen_Par.jpg",
    backdrop_path: null,
    release_date: "2007-12-21",
    vote_average: 8.4,
    vote_count: 3100,
    overview: "A dyslexic child discovers his potential with an understanding art teacher.",
    genre_ids: [18],
    original_language: "hi",
  },
  {
    id: 8,
    title: "Kabhi Khushi Kabhie Gham",
    original_title: "Kabhi Khushi Kabhie Gham",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/4/48/K3G_Movie_Poster.jpg",
    backdrop_path: null,
    release_date: "2001-12-14",
    vote_average: 7.6,
    vote_count: 1500,
    overview: "A family drama about class, love, and belonging across generations.",
    genre_ids: [18, 10751],
    original_language: "hi",
  },
  {
    id: 9,
    title: "Bajrangi Bhaijaan",
    original_title: "Bajrangi Bhaijaan",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/8/8b/Bajrangi_Bhaijaan_poster.jpg",
    backdrop_path: null,
    release_date: "2015-07-17",
    vote_average: 8.0,
    vote_count: 2400,
    overview: "A man goes to great lengths to reunite a Pakistani girl with her family.",
    genre_ids: [18, 12],
    original_language: "hi",
  },
  {
    id: 10,
    title: "Gangs of Wasseypur",
    original_title: "Gangs of Wasseypur",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/6/6d/Gangs_of_Wasseypur.jpg",
    backdrop_path: null,
    release_date: "2012-05-22",
    vote_average: 8.2,
    vote_count: 2100,
    overview: "A multigenerational saga of coal-mafia crime families in Jharkhand.",
    genre_ids: [80, 18],
    original_language: "hi",
  },
  {
    id: 11,
    title: "Queen",
    original_title: "Queen",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/1/16/Queen_2014_film_poster.jpg",
    backdrop_path: null,
    release_date: "2014-03-07",
    vote_average: 8.2,
    vote_count: 1200,
    overview: "A Delhi girl embarks on her honeymoon alone after being left at the altar.",
    genre_ids: [18, 35],
    original_language: "hi",
  },
  {
    id: 12,
    title: "Barfi!",
    original_title: "Barfi!",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/4/4b/Barfi_film_poster.jpg",
    backdrop_path: null,
    release_date: "2012-09-14",
    vote_average: 8.0,
    vote_count: 1600,
    overview: "A deaf-mute man charms two women in 1970s Darjeeling.",
    genre_ids: [35, 18, 10749],
    original_language: "hi",
  },
  {
    id: 13,
    title: "Rang De Basanti",
    original_title: "Rang De Basanti",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/5/5a/Rang_De_Basanti.jpg",
    backdrop_path: null,
    release_date: "2006-01-27",
    vote_average: 8.2,
    vote_count: 1700,
    overview: "Students reenacting India's freedom struggle find themselves repeating history.",
    genre_ids: [18, 36],
    original_language: "hi",
  },
  {
    id: 14,
    title: "Swades",
    original_title: "Swades",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/c/cd/Swades_film.jpg",
    backdrop_path: null,
    release_date: "2004-12-17",
    vote_average: 8.2,
    vote_count: 900,
    overview: "An NRI scientist returns to India and reconnects with his roots.",
    genre_ids: [18],
    original_language: "hi",
  },
  {
    id: 15,
    title: "Mughal-E-Azam",
    original_title: "Mughal-E-Azam",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/d/de/Mughal-e-Azam.jpg",
    backdrop_path: null,
    release_date: "1960-08-05",
    vote_average: 8.1,
    vote_count: 600,
    overview: "A Mughal prince's forbidden love for a court dancer defies his emperor father.",
    genre_ids: [18, 36, 10749],
    original_language: "hi",
  },
  {
    id: 16,
    title: "Shershaah",
    original_title: "Shershaah",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/a/a6/Shershaah_film_poster.jpg",
    backdrop_path: null,
    release_date: "2021-08-12",
    vote_average: 8.4,
    vote_count: 3500,
    overview: "The story of war hero Captain Vikram Batra during the Kargil War.",
    genre_ids: [36, 28, 18],
    original_language: "hi",
  },
  {
    id: 17,
    title: "Uri: The Surgical Strike",
    original_title: "Uri: The Surgical Strike",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/1/1b/Uri_The_Surgical_Strike_poster.jpg",
    backdrop_path: null,
    release_date: "2019-01-11",
    vote_average: 8.3,
    vote_count: 2800,
    overview: "India's armed forces conduct a covert operation after the Uri attacks.",
    genre_ids: [28, 36, 18],
    original_language: "hi",
  },
  {
    id: 18,
    title: "Sultan",
    original_title: "Sultan",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/f/f5/Sultan_film_poster.jpg",
    backdrop_path: null,
    release_date: "2016-07-06",
    vote_average: 7.1,
    vote_count: 1300,
    overview: "An aging wrestler makes a comeback to win back his estranged wife.",
    genre_ids: [18, 28],
    original_language: "hi",
  },
  {
    id: 19,
    title: "Black",
    original_title: "Black",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/5/51/Black_2005_poster.jpg",
    backdrop_path: null,
    release_date: "2005-02-04",
    vote_average: 8.1,
    vote_count: 1000,
    overview: "A deaf-blind girl and her tenacious teacher change each other's lives.",
    genre_ids: [18],
    original_language: "hi",
  },
  {
    id: 20,
    title: "Devdas",
    original_title: "Devdas",
    poster_path: "https://upload.wikimedia.org/wikipedia/en/d/d4/Devdas_film_poster.jpg",
    backdrop_path: null,
    release_date: "2002-07-12",
    vote_average: 7.5,
    vote_count: 800,
    overview: "A self-destructive aristocrat is torn between his childhood love and a courtesan.",
    genre_ids: [18, 10749],
    original_language: "hi",
  },
];

// ─── Helper: resolve a poster URL ────────────────────────────────────────────
// poster_path now holds full URLs, not TMDB paths.
export type PosterSize = "w185" | "w342" | "w500" | "w780" | "original";

export function getPosterUrl(
  posterPath: string | null,
  _size: PosterSize = "w500"
): string {
  if (!posterPath) return "https://picsum.photos/seed/bollywood/300/450";
  // If it's already a full URL (Wikipedia / OMDB), return as-is
  if (posterPath.startsWith("http")) return posterPath;
  // Legacy TMDB path — construct URL
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

export function getBackdropUrl(
  backdropPath: string | null,
  _size?: string
): string {
  if (!backdropPath) return "";
  if (backdropPath.startsWith("http")) return backdropPath;
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

// ─── OMDB API (optional live source) ─────────────────────────────────────────
// Free key: https://www.omdbapi.com/apikey.aspx  (1,000 req/day)
// Posters come from Amazon's IMDb CDN — high quality, reliable.

const OMDB_BASE = "https://www.omdbapi.com";
const getOmdbKey = () => process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY;

type OmdbSearchResult = {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
  Type: string;
};

type OmdbMovieDetail = OmdbSearchResult & {
  imdbRating: string;
  Plot: string;
  Genre: string;
};

async function fetchOmdbBollywoodMovies(count: number): Promise<TMDBMovie[]> {
  const apiKey = getOmdbKey();
  if (!apiKey) return [];

  const titles = [
    "Sholay", "3 Idiots", "Lagaan", "Dil Chahta Hai", "Dangal",
    "PK", "Taare Zameen Par", "Bajrangi Bhaijaan", "Gangs of Wasseypur",
    "Queen", "Barfi", "Rang De Basanti", "Swades", "Shershaah",
    "Uri The Surgical Strike", "Sultan", "Black", "Devdas",
    "Kabhi Khushi Kabhie Gham", "Mughal-E-Azam",
  ].slice(0, count);

  const results = await Promise.allSettled(
    titles.map(async (title, i) => {
      const url = `${OMDB_BASE}/?t=${encodeURIComponent(title)}&type=movie&apikey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (!res.ok) throw new Error(`OMDB ${res.status}`);
      const d: OmdbMovieDetail = await res.json();
      if (d.Poster === "N/A" || !d.Poster) throw new Error("No poster");
      return {
        id: i + 1,
        title: d.Title,
        original_title: d.Title,
        poster_path: d.Poster,        // full Amazon CDN URL
        backdrop_path: null,
        release_date: `${d.Year}-01-01`,
        vote_average: parseFloat(d.imdbRating) || 0,
        vote_count: 0,
        overview: d.Plot,
        genre_ids: [],
        original_language: "hi",
      } satisfies TMDBMovie;
    })
  );

  const fulfilled: TMDBMovie[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") fulfilled.push(r.value);
  }
  return fulfilled;
}

// ─── Main export: getTopBollywoodMovies ───────────────────────────────────────

export async function getTopBollywoodMovies(count = 20): Promise<TMDBMovie[]> {
  // Try OMDB if a key is set
  if (getOmdbKey()) {
    try {
      const movies = await fetchOmdbBollywoodMovies(count);
      if (movies.length >= 10) {
        console.info(`[OMDB] Fetched ${movies.length} Bollywood movies.`);
        return movies;
      }
    } catch (err) {
      console.warn("[OMDB] Fetch failed, using static list:", err);
    }
  } else {
    console.info("[Movies] No API key — using Wikipedia poster list.");
  }

  return STATIC_BOLLYWOOD_MOVIES.slice(0, count);
}

export async function getMovieDetail(_id: number): Promise<TMDBMovieDetail | null> {
  return null;
}

/** Convert TMDBMovie → BollywoodMovie used by UI components */
export function normaliseTMDBMovie(m: TMDBMovie): BollywoodMovie {
  return {
    id:          m.id,
    title:       m.title,
    posterUrl:   getPosterUrl(m.poster_path),
    backdropUrl: getBackdropUrl(m.backdrop_path),
    year:        m.release_date?.slice(0, 4) ?? "",
    rating:      m.vote_average?.toFixed(1) ?? "—",
    overview:    m.overview,
  };
}
