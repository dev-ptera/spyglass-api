import {Client} from "redis-om";
import {LOG_INFO} from "@app/services";

export let REDIS_CLIENT: Client;

export const connectRedisDatabase = async (): Promise<void> => {
    REDIS_CLIENT = await new Client().open(process.env.REDIS_URL);
    await REDIS_CLIENT.execute(['PING'])
    LOG_INFO(`Connected to Redis instance, at ${process.env.REDIS_URL}`);
}
