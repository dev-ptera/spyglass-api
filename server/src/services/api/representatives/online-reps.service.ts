import { NANO_CLIENT } from '@app/config';
import {LOG_INFO, writeRepStatistics} from '@app/services';

export const getOnlineRepsPromise = async (): Promise<string[]> => {
    const rpcData = await NANO_CLIENT.representatives_online(false);
    const response: string[] = [];
    for (const rep of rpcData.representatives as string[]) {
        response.push(rep);
        await writeRepStatistics(rep, true);
    }
    return response;
};

/** Returns a string array of online-reps.3 representative addresses. */
export const getOnlineReps = async (req, res): Promise<string[]> => {
    const start = LOG_INFO('Updating Online Reps');
    const response = await getOnlineRepsPromise();
    res.send(response);
    LOG_INFO('Online Reps Updated', start);
    return response;
};
