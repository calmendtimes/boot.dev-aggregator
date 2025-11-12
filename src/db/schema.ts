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
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  feedId:    uuid("feed_id").notNull().references(() => feeds.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
},
(table) => ({
  uniqueUserFeed: unique().on(table.userId, table.feedId),
}));

export type FeedFollows = typeof feed_follows.$inferInsert;


export const posts = pgTable("posts", {
  id:           uuid("id").primaryKey().defaultRandom().notNull(),
  url:          text("url").notNull().unique(),
  title:        text("title").notNull(),
  description:  text("description").notNull(),
  publishedAt:  timestamp("published_at"),
  feedId:       uuid("feed_id").notNull().references(() => feeds.id, { onDelete: "cascade" }), 
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Post = typeof posts.$inferInsert;

