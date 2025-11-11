import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { Feed, User, feeds, users } from "../schema.js";

export async function createFeed(feed: Feed) {
  const [result] = await db
    .insert(feeds)
    .values(feed)
    .returning();
  return result;
}

export async function getFeeds() {
  const result = await db
    .select({
      id        : feeds.id,
      url       : feeds.url,
      name      : feeds.name,
    })
    .from(feeds);
  return result;
}

export async function getFeedsByLastFetch() {
  const result = await db
    .select({
      id        : feeds.id,
      url       : feeds.url,
      name      : feeds.name,
    })
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} asc nulls first`);
  return result;
}

export async function getFeedByUrl(url: string) {
  const [result] = await db
    .select({
      id        : feeds.id,
      url       : feeds.url,
      name      : feeds.name,
    })
    .from(feeds)
    .where(eq(feeds.url, url));
  return result;
}

export async function markFeedFetched(feedId: string) {
  const [result] = await db.update(feeds)
    .set({ lastFetchedAt: new Date() })
    .where(eq(feeds.id, feedId));
  return result;
} 
