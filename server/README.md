# Yellow Spyglass Server

https://www.yellowspyglass.com

Yellow Spyglass is a [BANANO](https://www.banano.cc) explorer and can be viewed [here](https://www.yellowspyglass.com). 

This explorer was written & maintained by [dev-ptera](https://github.com/dev-ptera), the [batman representative](http://108.39.249.5/).

## Stack

This API was written with Express & Typescript.

#### RPC Calls 
The NPM package [`@dev-ptera/nano-node-rpc`](https://www.npmjs.com/package/@dev-ptera/nano-node-rpc) is used to communicate with a local BANANO node via RPC commands. 


#### Client
The client was written in a different repo and can be found [here](https://github.com/dev-ptera/yellow-spyglass-client). 

## Running Locally

### Copy the ENV variables


```typescript
/* Can be 'production' or 'development' */
NODE_ENV=development
/* Port that listens for incoming requests. */
PORT=3000
/* URL used to send RPC commands. */
RPC_URL=[RPC_URL]
/* Used to fetch coinmarketcap price data. */
CMC_API_KEY=[key] 
/* Used to interact with the nano RPC node. */
RPC_AUTH=[key]
```
You will need a local `.env` file to run this project.  It helps to have direct access to a BANANO RPC node so that the configuration can go as smooth as possible.

Copy the `.env.template` file, rename it to `.env` & provide the required fields.

### Install Dependencies

Run `yarn` or `npm install` to install the dependencies.

### Setup Data Sources

#### Price Service
In order for the `price.service` to work correctly, you will need a CoinMarketCap API key.  
If you do not provide your own key, this service will fail to fetch the latest price information.  


#### Known Accounts
The only other service that relys on an outside API is the `known-accounts.service`. 
It uses [Kirby's](https://github.com/Kirby1997) public accounts API found [here](https://kirby.eu.pythonanywhere.com/api/v1/resources/addresses/all).  Thanks, Kirby.


#### All Other Services
All other services rely on a local BANANO node to fetch data.


### Start

`yarn start` will run the server locally.

#### Running this API & a BANANO Node on two separate machines?

Consider using [`@dev-ptera/nano-rpc-proxy`](https://www.npmjs.com/package/@dev-ptera/nano-rpc-proxy), 
which can be configured to filter out any non-authenticated request and will refuse to run any disabled rpc-actions.


## Contributing

Contributors are welcome! There's a contributing file for more info on how to help.  I don't have a CONTRIBUTORS file on every repo, but all of my repos are open to contributors.  

## Issues?

Please either contact me via dev.ptera@gmail.com or put a bug on the issues tab.  