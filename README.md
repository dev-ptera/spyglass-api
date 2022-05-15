# spyglass-api

Spyglass API is a free-to-use REST-ful datasource which can be used to fuel apps in the banano or nano ecosystem.  
There's currently request throttling in place, but the default rates can be increased with the use of an authentication token (todo). 

https://spyglass-api.web.app

## API

#### `account/confirmed-transactions`

Returns a list of an account's confirmed blocks.  There are filters available to filter the results by block type and pagination support. 

#### `account/delegators`

Returns a list of delegators, the number of weighted/empty delegators and total weight.  Includes options for pagination.

#### `account/export`

Provides a CSV export for account transactions.

#### `account/insights`

Returns statistics around an account's history such as largest transactions, most common recipient, etc. 

#### `account/overview`

Returns a summary of a public address, including account balance, delegator count, weight, etc.

#### `account/representative`

Returns the account's representative. 

#### `account/receivable-transactions`

Returns a list of pending transactions.  Includes options for pagination.

#### `block`

Returns block information for a single block.

#### `blocks`

Returns block information for an array of blocks.

#### `distribution/burn`

Returns the list of designated burn accounts & their respective balances, including burn total.

#### `distribution/buckets`

Returns distribution statistics; how many accounts have 1-10 balance, 10-100 balance, etc.

#### `distribution/developer-funds`

Returns the list of designated developer/foundation owned accounts and their respective balances.

#### `distribution/rich-list`

Returns a list of accounts and their respective balances; sorted by balance descending.  Includes options for pagination.

#### `distribution/rich-list-snapshot`

Returns the entire list of accounts and their respective balances.

#### `distribution/supply`

Returns statistics around circulating/uncirculating supply, burned supply,

#### `known/accounts`

Returns the list of accounts, their aliases and metadata.


#### `known/vanities`

Returns a list of accounts that have a custom vanity avatar.

#### `network/nakamoto-coefficient`

Returns how many representatives it requires for the network to be compromised, and the largest representatives required to collude.

#### `network/ledger-size`

Returns how large the ledger is in MB. (only for a single node; ledger size between nodes may vary).

#### `network/nakamoto-coefficient`

Returns how many bad actors would be required to attack the network.

#### `network/peers`

Returns the number of peers, grouped by version.

#### `network/quorum`

Returns information about network weight; online, offline, no-rep weights.

#### `price`

Returns a snapshot of price data; updated every 15 minutes.

#### `representatives/aliases`

Returns the list of aliases for network representatives.  Populated via `known/accounts`.

#### `representatives/monitored`

Returns the list of monitored representatives. 

#### `representatives/online`

Returns online representatives. These are tracked via calling `representatives_online` rpc command every minute.  

#### `representatives/pr-weight`

Returns the weight required for a representative to be considered a principal representative.

#### `representatives`

Returns a list of representatives; includes extensive filtering options.

#### `representatives/scores`

Assigns a score [1-100] to each representative based on uptime, weight & other factors.

#### `representatives/uptime`

Returns uptime statistics for a given representative.
  
  
## Stack

The documentation site (`/client`) is written using Angular.

The server (`/server`) is written using ExpressJS and Typescript. 

## Representative Uptime Calculations

### Nano

For Nano, rep uptime is not being calculated since I'm not hosting this service.  The infrastructure is in place but someone else needs to host the service. 

### Banano

For Banano, representative uptime is analyzed & stored for each rep with a weight of >10,000 BAN and is calculated on a daily, weekly, monthly, semi-anually, and yearly basis.  Checks happen every minute & if a representative fails to pass an 'online' check 3 consecutive times, the representative is considered offline until it reappears as online. The results of each check are stored in JSON files (`database/banano/rep-uptime`) & are backed-up automatically each day via an automation script.

For Prinicipal Representatives, I use the Nano RPC `representatives_online` command and aggregate the results from several nodes (`/config/banano`).  For Non-Principal Representives, since these nodes do not rebroadcast votes, they do not appear within the RPC command used for PRs (this is specific to V22).  If a non-PR rep is running some form of node-monitor software & I am peered with them, they will appear as online.  Non-PRs that run node-monitor software can manually have their node added to a list of known representatives so that they appear regardless of peer status.

## Local Development

This API requires some environment setup before it can run.  

1.  Copy `server/.env.template` to a new file `server/.env`.
2.  Replace the placeholder fields.

> This API requires a Nano or Banano node accessible via RPC commands.


To run the server, run `cd server && yarn && yarn start`.

To run the client, run `cd client && yarn && yarn start`. 

## Contact

Suggestions or issues? Please feel free to post an issue directly on the github.
