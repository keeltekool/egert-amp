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
