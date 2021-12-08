import { ConfirmedTransactionDto } from '@app/types';
import { convertToConfirmedTransactionDto, isValidAddress, LOG_ERR } from '@app/services';
import { accountHistoryRpc } from '@app/rpc';

const convertToCSV = (dtos: ConfirmedTransactionDto[]): string => {
    const json = dtos;
    const fields = Object.keys(json[0]);
    const replacer = function (key, value) {
        return value === null ? '' : value;
    };
    const csv = json.map(function (row) {
        return fields
            .map(function (fieldName) {
                return JSON.stringify(row[fieldName], replacer);
            })
            .join(',');
    });
    csv.unshift(fields.join(',')); // add header column
    return csv.join('\r\n');
};

const getAccountExportPromise = async (body: { address: string }): Promise<string> => {
    const address = body.address;

    if (!isValidAddress(address)) {
        return Promise.reject({ error: 'Address is required' });
    }

    const accountTx = await accountHistoryRpc(address, 0, -1).catch((err) => {
        return Promise.reject(LOG_ERR('getAccountExportPromise.accountHistoryRpc', err, { body }));
    });

    const dtos = [];
    accountTx.history.map((tx) => dtos.push(convertToConfirmedTransactionDto(tx)));

    try {
        const csv = convertToCSV(dtos);
        return csv;
    } catch (err) {
        LOG_ERR('convertToCsv', err);
        return '';
    }
};

/** For a given address, returns transactions in a csv format . */
export const getAccountExport = (req, res): void => {
    getAccountExportPromise(req.body)
        .then((csv: string) => {
            res.send(csv);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};
