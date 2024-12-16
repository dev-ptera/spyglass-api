import { Domain } from '@app/types';
import { LOG_ERR } from '@app/services';
import { BNS_RESOLVER } from '@app/config';

const getBNSDomainInfo = async (domain_name: string, tld: string): Promise<Domain | undefined> => {
    try {
        return await BNS_RESOLVER.resolve(domain_name, tld);
    } catch (err) {
        return Promise.reject(LOG_ERR('getBNSDomainInfo', err, { domain_name, tld }));
    }
};

export const getAccountBNS = async (req, res): Promise<void> => {
    const domain_name = req.body.domain_name;
    const tld = req.body.tld;
    if (!domain_name) {
        return res.status(400).send({ errorMsg: 'Domain Name is required', errorCode: 1 });
    }
    if (!tld) {
        return res.status(400).send({ errorMsg: 'TLD is required', errorCode: 2 });
    }
    try {
        const domain = await getBNSDomainInfo(domain_name, tld);
        //may be { domain: undefined } if no domain
        res.send({ domain });
    } catch (err) {
        res.status(500).send({ errorMsg: 'Internal Server Error', errorCode: 3 });
    }
};
