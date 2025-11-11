import { eq, asc } from "drizzle-orm";
import { db } from "../index.js";
import { users } from "../schema.js";

export async function createUser(name: string) {
  const [result] = await db
    .insert(users)
    .values({ name: name })
    .returning();
  return result;
}

export async function getUser(name: string) {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.name, name)); 
  return result;
}

export async function getUsers() {
  const result = await db
    .select()
    .from(users)
    .orderBy(asc(users.name));
  return result;
}

