"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, Download, Star, Filter, SlidersHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const scripts = [
  { id: "1", title: "Sholay", director: "Ramesh Sippy", year: 1975, genre: "Action/Drama", rating: 9.2, pages: 187, language: "Hindi", seed: "sholay1975", downloads: "24.5K", isClassic: true },
  { id: "2", title: "3 Idiots", director: "Rajkumar Hirani", year: 2009, genre: "Comedy/Drama", rating: 9.0, pages: 158, language: "Hindi", seed: "3idiots2009", downloads: "31.2K", isClassic: false },
  { id: "3", title: "Lagaan", director: "Ashutosh Gowariker", year: 2001, genre: "Period/Drama", rating: 8.9, pages: 201, language: "Hindi", seed: "lagaan2001", downloads: "18.7K", isClassic: false },
  { id: "4", title: "Dil Chahta Hai", director: "Farhan Akhtar", year: 2001, genre: "Comedy/Romance", rating: 8.7, pages: 142, language: "Hindi", seed: "dilchahtahai", downloads: "22.3K", isClassic: false },
  { id: "5", title: "Gangs of Wasseypur", director: "Anurag Kashyap", year: 2012, genre: "Crime/Drama", rating: 8.8, pages: 234, language: "Hindi", seed: "gow2012", downloads: "19.8K", isClassic: false },
  { id: "6", title: "Taare Zameen Par", director: "Aamir Khan", year: 2007, genre: "Drama", rating: 8.4, pages: 128, language: "Hindi", seed: "tzp2007", downloads: "15.9K", isClassic: false },
  { id: "7", title: "Queen", director: "Vikas Bahl", year: 2014, genre: "Drama", rating: 8.2, pages: 118, language: "Hindi", seed: "queen2014", downloads: "14.1K", isClassic: false },
  { id: "8", title: "Mughal-E-Azam", director: "K. Asif", year: 1960, genre: "Period/Romance", rating: 8.5, pages: 178, language: "Urdu/Hindi", seed: "mughal1960", downloads: "9.7K", isClassic: true },
];

const genres = ["All", "Action/Drama", "Comedy/Drama", "Period/Drama", "Crime", "Romance"];

export default function DownloadScriptsPage() {
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = scripts.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.director.toLowerCase().includes(search.toLowerCase());
    const matchGenre = activeGenre === "All" || s.genre.includes(activeGenre);
    return matchSearch && matchGenre;
  });

  const handleDownload = (id: string) => {
    setDownloading(id);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-black text-text-primary mb-1">Download Scripts</h1>
        <p className="text-text-muted">10,000+ Bollywood scripts ready to download.</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            variant="glass"
            placeholder="Search by title or director..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="sm:max-w-sm"
          />
          <Button variant="secondary" leftIcon={<SlidersHorizontal className="w-4 h-4" />} size="sm">
            More Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-xs text-text-muted mr-1">
            <Filter className="w-3.5 h-3.5" />
            Genre:
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeGenre === g
                  ? "bg-accent text-white"
                  : "bg-surface-2 border border-border text-text-muted hover:border-accent/30"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((script, i) => (
          <motion.div
            key={script.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.15, duration: 0.5 }}
          >
            <div className="group cursor-pointer">
              {/* Poster */}
              <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-3 shadow-card">
                <Image
                  src={`https://picsum.photos/seed/${script.seed}/300/450`}
                  alt={script.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Download Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(script.id)}
                    loading={downloading === script.id}
                    className="shadow-glow scale-90 group-hover:scale-100 transition-transform"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download
                  </Button>
                </div>

                {/* Badges */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                  <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                  <span className="text-[10px] text-white font-bold">{script.rating}</span>
                </div>
                {script.isClassic && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gold/80 text-black">
                      Classic
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                  {script.title}
                </h3>
                <p className="text-xs text-text-muted mt-0.5 truncate">{script.director}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-text-muted">{script.year} · {script.pages}p</span>
                  <span className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Download className="w-2.5 h-2.5" />
                    {script.downloads}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-secondary font-medium">No scripts found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
