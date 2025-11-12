import * as Config from './config.js';
import * as Schema from './db/schema.js'

import * as Users from './db/queries/users.js';
import * as Reset from './db/queries/reset.js';
import * as Feed  from './db/queries/feed.js';
import * as FeedFollows from './db/queries/feed_follows.js';
import * as Posts from './db/queries/posts.js';


import { XMLParser } from 'fast-xml-parser';
import { config } from 'process';

export type CommandsRegistry = { [commandName: string] : CommandHandler }

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type UserCommandHandler = (cmdName: string, user: Schema.User, ...args: string[]) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;



export const registry: CommandsRegistry = { 
    help      : handleHelp,
    login     : handleLogin,
    register  : handleRegister,
    reset     : handleReset,
    users     : handleUsers,
    agg       : handleAgg,
    feeds     : handleFeeds,
    addfeed   : getLoggedInHandler(handleAddFeed),
    follow    : getLoggedInHandler(handleFollow),
    following : getLoggedInHandler(handleFollowing),
    unfollow  : getLoggedInHandler(handleUnfollow),
};

const description: any = { };

export function getLoggedInHandler(handler: UserCommandHandler): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {

    const cfg = Config.readConfig();
    const user = await Users.getUser(cfg.currentUserName);
    if (!user) throw new Error(`User ${cfg.currentUserName} not found`);
    return await handler(cmdName, user, ...args);
  };
}

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
    await registry[cmdName](cmdName, ...args);
} 


async function handleHelp(cmdName: string, ...args: string[]): Promise<void> {
  // No arguments needed
  console.log("Something, something, ..., Aggregator HELP.")
  for(const k in registry) {
    console.log(`  * ${k}  ${description[k] || ''}`)
  }
}

description['login'] = "<username>"; 
async function handleLogin(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0) throw Error('login expects a single argument: username.');
    const user = await Users.getUser(args[0]);
    if (undefined === user) throw Error(`User ${args[0]} Not Found.`)

    Config.setUser(args[0]);
    console.log('User has been set.')
    return Promise.resolve();
}

description['register'] = "<username>";
async function handleRegister(cmdName: string, ...args: string[]): Promise<void> {
    if (args.length === 0) throw Error('register expects a single argument: username.');
    await Users.createUser(args[0]);
    Config.setUser(args[0]);
    console.log('User has been set.')
    return Promise.resolve();    
}

async function handleReset(cmdName: string, ...args: string[]): Promise<void> {
  // No argument needed  
  await Reset.clearAllUsers();
  console.log('Users have been cleared.')
  return Promise.resolve();    
}

async function handleUsers(cmdName: string, ...args: string[]): Promise<void> {
    // No argument needed
    const result = await Users.getUsers();
    const cfg = Config.readConfig();
    result.map((u) => { 
        const current = u.name === cfg.currentUserName ? ' (current)' : '';
        console.log(u.name + current) 
    })
    return Promise.resolve();    
}

description['agg'] = "[time_between_reqests_ms]";
async function handleAgg(cmdName: string, ...args: string[]): Promise<void> {
    const timeBetweenRequests = Number(args[0]) || (300 * 1000);

    const run = async () => {
      const feeds = await Feed.getFeedsByLastFetch();
      for (const feed of feeds) {
        const fetchedFeed = await fetchFeed(feed.url);
        await Feed.markFeedFetched(feed.id);
       
        for (const p of fetchedFeed.items) {
          const post: Schema.Post = {   
              url:    p.link,         
              title:  p.title,      
              description: p.description, 
              publishedAt: new Date(p.pubDate),
              feedId: feed.id,
          };

          Posts.createFeed(post);
        }

        console.log(` * Feed: ${fetchedFeed.title}`)
        fetchedFeed.items.forEach((e:any) => { console.log(`   -  ${e.title}`) });

        //console.log(` * Feed`, fetchedFeed)
        //fetchedFeed.items.forEach((e:any) => { console.log(`   - `, e) });
      }
    };
    run();

    const interval = setInterval(run, timeBetweenRequests);
    await new Promise<void>((resolve) => {
      process.on("SIGINT", () => {
        console.log("Shutting down feed aggregator...");
        clearInterval(interval);
        resolve();
      });
    });

    return Promise.resolve();  
}

async function handleFeeds(cmdName: string, ...args: string[]): Promise<void> {
  // No argument needed
  const result = await Feed.getFeeds();
  result.forEach((e) => { console.log(`${e.url} - ${e.name}`); });
  return Promise.resolve();    
}

description['addfeed'] = "<feed_name> <url>";
async function handleAddFeed(cmdName: string, user: Schema.User, ...args: string[]): Promise<void> {
    if (args.length !== 2) throw Error('addfeed expects a two argument: name, url.');
    const feedName = args[0];
    const url = args[1];
    const feed: Schema.Feed = { name: feedName, url: url, lastFetchedAt: null }
    const resultFeed = await Feed.createFeed(feed);

    const feedFollows: Schema.FeedFollows = { userId: user.id!, feedId: resultFeed.id };
    const resultFeedFollow = await FeedFollows.createFeedFollow(feedFollows);

    return Promise.resolve();    
}

description['follow'] = "<url>";
async function handleFollow(cmdName: string, user: Schema.User, ...args: string[]): Promise<void> {
  if (args.length === 0) throw Error('follow expects a single argument: url.');
  const url = args[0];
  const feed = await Feed.getFeedByUrl(url);  
  
  const feedFollows: Schema.FeedFollows = { userId: user.id!, feedId: feed.id };
  const result = await FeedFollows.createFeedFollow(feedFollows);
  return Promise.resolve();    
}

async function handleFollowing(cmdName: string, user: Schema.User, ...args: string[]): Promise<void> {
  // No argument needed
  const result = await FeedFollows.getFeedFollowsForUser(user.id!);
  result.forEach( e => console.log(e.feedName) );
  return Promise.resolve();    
}

description['unfollow'] = "<url>";
async function handleUnfollow(cmdName: string, user: Schema.User, ...args: string[]): Promise<void> {
  if (args.length === 0) throw Error('unfollow expects a single argument: url.');
  const url = args[0];
  const result = await FeedFollows.deleteFeedFollowForUser(user.id!, url);
  return Promise.resolve();    
}




 
async function fetchFeed(feedURL: string) {
  try {
    const response = await fetch(feedURL, {
      method: "GET",
      headers: { "User-Agent": "gator/0.01", "Accept": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const responseText = await response.text();

    if (undefined !== responseText) {
      const xmlParser = new XMLParser();
      const parsedData = xmlParser.parse(responseText);
      const channel = parsedData.rss.channel;
      if (undefined === channel) throw Error("rss channel NOT FOUND in response.");
      const [title, field, description] = [channel.title, channel.field, channel.description]; 
      if (!Array.isArray(channel.item)) channel.item = [];
      
      const channelMetadata: any = { title, field, description };
      const channelItems: any[] = [];

      interface ChannelItem { title?: string; link?: string; description?: string; pubDate?: string; }
      channel.item.forEach((e: ChannelItem) => { 
        if (e.title && e.link && e.description && e.pubDate) {
          channelItems.push({
            title: e.title, 
            link: e.link, 
            description: e.description, 
            pubDate: e.pubDate
          });
        }
      });

      const result = channelMetadata;
      result.items = channelItems;
      //result.items.forEach((e: ChannelItem) => { console.log(e.title) })
      
      return result;
    }

  } catch (err) {
    console.error(err)
  }
}