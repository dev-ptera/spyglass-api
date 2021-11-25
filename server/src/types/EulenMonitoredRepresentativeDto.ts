export type EulenMonitoredRepresentativeDto = {
    "node_account": string;
    "version": string;
    "store_version": number;
    "protocol_version": number;
    "store_vendor": string;
    "current_block": number
    "unchecked_blocks": number;
    "cemented_blocks": number;
    "num_peers": number;
    "confirmation_info": {
        "count": number;
        "time_span": number;
        "average": number;
        "percentile50": number;
        "percentile75": number;
        "percentile90": number;
        "percentile95": number;
        "percentile99": number;
    },
    "acc_balance_raw": string;
    "acc_balance": number;
    "acc_pending_raw": string;
    "acc_pending": number;
    "rep_account": string;
    "voting_weight_raw": string;
    "voting_weight": number;
    "system_load": number;
    "used_mem": number;
    "total_mem": number;
    "node_name": string;
    "node_uptime": number;
    "node_location": string;
    "block_sync": number;
}
