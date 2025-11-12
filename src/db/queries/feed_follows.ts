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
      userId   : feed_follows.userId,
      feedId   : feed_follows.feedId,
      userName : users.name,
      feedName : feeds.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
    .innerJoin(users, eq(feed_follows.userId, users.id));
  return result;
}

export async function getFeedFollowsForUser(userId: string) {
  const result = await db
    .select({
      userId   : feed_follows.userId,
      feedId   : feed_follows.feedId,
      userName : users.name,
      feedName : feeds.name,
    })
    .from(feed_follows)
    .innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
    .innerJoin(users, eq(feed_follows.userId, users.id))
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
      eq(feed_follows.userId, userId),
      eq(feed_follows.feedId, feed[0].id)
    ));
}