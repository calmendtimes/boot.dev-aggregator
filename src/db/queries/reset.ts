import { db } from "../index.js";
import * as Schema from "../schema.js";

export async function clearAllUsers() {
  await db.delete(Schema.users);
  await db.delete(Schema.feeds);
  await db.delete(Schema.feed_follows);
}