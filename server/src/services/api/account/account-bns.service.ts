import { RPC_URL, BNS_TLDS } from '@app/config';
import { Domain } from '@app/types';
import { LOG_ERR } from '@app/services';
import { banani, Resolver } from 'banani-bns';

//in the future, store results in db, and on request, check if it needs to be updated (see stored history and see if last history block is still the head hash for the latest owner), if so, crawl the new sections, store in db and return

const getBNSDomainInfo = async (domain_name: string, tld: string): Promise<Domain | undefined> => {
    const rpc = new banani.RPC(RPC_URL);
    const resolver = new Resolver(rpc, BNS_TLDS);
    try {
        return await resolver.resolve(domain_name, tld);
    } catch (err) {
        return Promise.reject(LOG_ERR('getBNSDomainInfo', err, { domain_name, tld }));
    }
};

export const getAccountBNS = async (req, res): Promise<void> => {
    console.log(req.body);
    const domain_name = req.body.domain_name;
    const tld = req.body.tld;

    try {
        const domain = await getBNSDomainInfo(domain_name, tld);
        //may be { domain: undefined } if no domain
        res.send({ domain });
    } catch (err) {
        res.status(500).send({ errorMsg: 'Internal Server Error', errorCode: 3 });
    }
};
