"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BollywoodMovie } from "@/lib/tmdb";

// Static download counts for demo display
const DOWNLOAD_COUNTS: Record<number, string> = {
  14942:  "24.5K",
  375366: "31.2K",
  1598:   "18.7K",
  27723:  "22.3K",
  97010:  "19.8K",
  33235:  "15.9K",
  260310: "14.1K",
  13477:  "9.7K",
  290250: "28.4K",
  255777: "26.1K",
  602211: "21.3K",
  442752: "17.6K",
};

const CLASSIC_IDS = new Set([14942, 13477, 19798, 29583]);

interface TrendingSectionProps {
  movies: BollywoodMovie[];
}

export default function TrendingSection({ movies }: TrendingSectionProps) {
  const display = movies.slice(0, 6);

  return (
    <section className="py-24 lg:py-32 bg-surface border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              <span className="text-xs font-semibold tracking-wider uppercase text-secondary">
                Trending Now
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-text-primary">
              Most Downloaded{" "}
              <span className="text-gradient">Scripts</span>
            </h2>
          </div>
          <a
            href="/download-scripts"
            className="hidden sm:flex items-center gap-2 text-sm text-accent hover:text-accent-light transition-colors"
          >
            View all scripts
            <span>→</span>
          </a>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {display.map((movie, i) => {
            const downloads = DOWNLOAD_COUNTS[movie.id] ?? "10K+";
            const isClassic = CLASSIC_IDS.has(movie.id);

            return (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="group cursor-pointer"
                >
                  {/* Poster */}
                  <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-3 shadow-card">
                    <Image
                      src={movie.posterUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-1 bg-black/60 rounded-full px-2.5 py-1">
                        <Download className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">{downloads}</span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                      <span className="text-[10px] text-white font-bold">{movie.rating}</span>
                    </div>

                    {isClassic && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="warning" className="text-[9px] px-1.5 py-0.5">
                          Classic
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted">{movie.year}</span>
                      {downloads && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-text-muted" />
                          <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                            <Download className="w-2.5 h-2.5" />
                            {downloads}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
