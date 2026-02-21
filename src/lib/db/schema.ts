import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const likes = pgTable(
  "likes",
  {
    userEmail: text("user_email").notNull(),
    fileId: text("file_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userEmail, t.fileId] })]
);

// Metadata cache — parsed once from FLAC, stored forever
export const trackMetadata = pgTable("track_metadata", {
  fileId: text("file_id").primaryKey(),
  title: text("title"),
  artist: text("artist"),
  album: text("album"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
