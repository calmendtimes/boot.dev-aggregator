import fs from "fs";
import os from "os";
import path from "path";

const configFileName = os.homedir() + "/.gatorconfig.json"

export type Config = {
    dbUrl: string,
    currentUserName: string,
}

export function setUser(user: string) {
    const config = readConfig();
    config.currentUserName = user;
    writeConfig(config);
}

export function readConfig(): Config {
    const configFile = fs.readFileSync(configFileName, 'utf-8');
    const configJson = JSON.parse(configFile);
    const config: Config = { dbUrl: configJson.db_url, currentUserName: configJson.current_user_name };
    return config;
}

function writeConfig(config: Config) {
    const configJson = { db_url: config.dbUrl, current_user_name: config.currentUserName };
    fs.writeFileSync(configFileName, JSON.stringify(configJson));
}