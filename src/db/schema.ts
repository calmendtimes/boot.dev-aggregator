import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom().notNull(),
  name:      text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferInsert;


export const feeds = pgTable("feeds", {
  id:            uuid("id").primaryKey().defaultRandom().notNull(),
  name:          text("name").notNull(),
  url:           text("url").notNull().unique(),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  lastFetchedAt: timestamp("last_fetched_at"),
});

export type Feed = typeof feeds.$inferInsert;


export const feed_follows = pgTable("feed_follows", {
  id:        uuid("id").primaryKey().defaultRandom().notNull(),
  user_id:   uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feed_id:   uuid("feed_id").notNull().references(() => feeds.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
},
(table) => ({
  uniqueUserFeed: unique().on(table.user_id, table.feed_id),
}));

export type FeedFollows = typeof feed_follows.$inferInsert;