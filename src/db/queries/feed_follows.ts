import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { FeedFollows, feed_follows, users, feeds } from "../schema.js";

export async function createFeedFollow(feedFollow: FeedFollows) {
  const [result] = await db
    .insert(feed_follows)
    .values(feedFollow)
    .returning();
  return result;
}

export async function getFeedFollows() {
  const result = await db
    .select({
      user_id   : feed_follows.user_id,
      feed_id   : feed_follows.feed_id,
      user_name : users.name,
      feed_name : feeds.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id));
  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await db
    .select({
      user_id   : feed_follows.user_id,
      feed_id   : feed_follows.feed_id,
      user_name : users.name,
      feed_name : feeds.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feed_id, feeds.id))
    .innerJoin(users, eq(feed_follows.user_id, users.id))
    .where(eq(users.id, userId));
  return result;
}

export async function deleteFeedFollowForUser(userId: string, url: string) {
  const feed = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url))
    .limit(1);

  if (!feed[0]) return null;

  const result = await db
    .delete(feed_follows)
    .where(and(
      eq(feed_follows.user_id, userId),
      eq(feed_follows.feed_id, feed[0].id)
    ));
}