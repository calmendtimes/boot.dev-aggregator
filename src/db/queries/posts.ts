import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import * as Schema from "../schema.js";

export async function createFeed(post: Schema.Post) {
  const [result] = await db
    .insert(Schema.posts)
    .values(post)
    .returning();
  return result;
}

export async function getPosts(userId: string) {
  const result = await db
    .select({ post: Schema.posts })
    .from(Schema.posts)
    .innerJoin(Schema.feed_follows, eq(Schema.feed_follows.feedId, Schema.posts.feedId))
    .where(eq(Schema.feed_follows.userId, userId))
    .orderBy(sql`posts.published_at DESC`);

  return result;
}   