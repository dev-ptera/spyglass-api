# spyglass-api

Spyglass API is a free-to-use REST-ful datasource which can be used to fuel apps in the banano or nano ecosystem.  
There's currently request throttling in place but the default rates can be increased with the use of an authentication token (todo). 

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

#### `account/representative`

Returns the account's representative. 

#### `account/receivable-transactions`

Returns a list of pending transactions.  Includes options for paginations.

#### `block/block`

Returns block information.

#### `distribution/burn`

Returns the list of designated burn accounts & their respective balances, including burn total.

#### `distribution/buckets`

Returns accounts' distribution stastistics; how many accounts have 1-10 balance, 10-100 balance, etc.

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

#### `network/peers`

Returns the number of peers, grouped by version.

#### `network/quorum`

Returns information about network weight; online, offline, no-rep weights.

#### `representatives/aliases`

Returns the list of aliases for network representatives.  Populated via `known/accounts`.

#### `representatives/monitored`

Returns the list of monitored representatives. 

#### `representatives/online`

Returns online representatives. These are tracked via calling `representatives_online` rpc command every minute.  

#### `representatives/pr-weight`

Returns the weight required for a representative to be considered a principal representative.

#### `representatives/representatives`

Returns a list of representatives; includes extensive filtering options.

#### `representatives/uptime`

Returns uptime statistics for a given representative.
  
## Contact

Suggestions or issues? Please feel free to post an issue directly on the github.
