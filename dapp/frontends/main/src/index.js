import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/index';

import { Api, JsonRpc } from 'eosjs';
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs2';

ScatterJS.plugins(new ScatterEOS())



// -- detf contract --

// create(const name& issuer, 
// 	   std::vector<extended_asset> basket_units, 
// 	   const asset&  maximum_supply)

// {
//     name: "issuer",
//     basket_units: [{
//         contract: 'btc.token',
//         quantity: '0.0001 EBTC'
//     },
//     {
//         contract: 'eosio.token',
//         quantity: '0.0001 EOS'
//     },
//     {
//         contract: 'eosio.dapp',
//         quantity: '0.0001 DAPP'
//     }],
//     maximum_supply: '100000000.0000 ETF'
// }
	   
// issue(const name& account, 
//       const asset& quantity,
//  	  const string& memo )

// {
//     account: 'zach',
//     quantity: '0.1000 ETF',
//     memo: 'get etf tokens'
// }
	  
// redeem(const name& account, 
//        const asset& quantity, 
// 	   const string& memo )

// {
//     account: 'zach',
//     quantity: '0.1000 ETF',
//     memo: 'get etf tokens'
// }
	   
// transfer(const name& from,
//          const name& to, 
// 		 const asset& quantity, 
// 		 const string&  memo ) 

// -> deposits / trasfers of etfs
		 
// withdraw(name account, 
//          std::optional<extended_asset> amount)

//------------------------
// -- detfdex contract -- EXCHANGE
//------------------------

// create(const name& issuer, 
//        uint64_t market_id, 
// 	   string& name, 
// 	   extended_asset& initial_base, 
// 	   extended_asset& initial_quote)

// {
//     issuer: 'zach',
//     market_id: 123456,
//     name: "super ETF/USDT",
//     initial_base: {
//         contract: 'etf.token',
//         quantity: '0.0001 ETF'
//     },
//     initial_quote: {
//         contract: 'usdt.token',
//         quantity: '1.0000 USDT'
//     }
// }
	   
// convert(name account,
// 	    uint64_t market_id,
// 	    extended_asset& from,
// 	    bool transfer) - true, deposits to account / false, keeps as credit

// {
//     name: 'zach',
//     market_id: 123456,
//     initial_base: {
//         contract: 'usdt.token',
//         quantity: '1.0000 USDT'
//     }
// }
    
// - only for deposits..
// transfer( const name&    from,
// 		   const name&    to,
// 		   const asset&   quantity,
// 		   const string&  memo ) -> deposits

// withdraw from deposits.
// withdraw(name account, 
//          std::optional<extended_asset> amount)

// - liquidaccounts -

// regaccount(name vaccount, publio_key pubkey)
// const response = await service.push_liquid_account_transaction(
//         "vacctstst123",
//         "5JMUyaQ4qw6Zt816B1kWJjgRA5cdEE6PhCb2BW45rU8GBEDa1RC",
//         "regaccount",
//         {
//             vaccount: 'testing126' // increment to new account if fails
//         }
//     );

// retail customers (not market makers/etf issuers)
// vconvert(name vaccount
//          uint64_t market_id
//          extended_asset from)

// const response = await service.push_liquid_account_transaction(
//         "vacctstst123",
//         "5JMUyaQ4qw6Zt816B1kWJjgRA5cdEE6PhCb2BW45rU8GBEDa1RC",
//         "hello",
//         {
//             vaccount: 'testing124',
//             market_id: 1,
//             from: {
//                 contract: 'usdt.token',
//                 quantity: '1.0000 USDT'
//             }
//         }
//     );

// vwithdraw(name vaccount
//           name to
//           std::optional<extended_asset> amount)

// const response = await service.push_liquid_account_transaction(
//         "vacctstst123",
//         "5JMUyaQ4qw6Zt816B1kWJjgRA5cdEE6PhCb2BW45rU8GBEDa1RC",
//         "hello",
//         {
//             vaccount: 'testing124',
//             b: 1,
//             c: 2
//         }
//     );


// eosio endpoint
// var debug = false;
// var endpoint = "https://api.eosrio.io";
// if(debug)
//   endpoint = "http://54.186.222.85:8888";

// if(window.location.host ===  "heartbeat.liquideos.com"){
//   endpoint = "http://api.eosrio.io";
// }

// if(window.location.host === "jungle-heartbeat.liquideos.com"){
//   endpoint = "http://dev.cryptolions.io:38888";
// }

let network = {
  blockchain: 'eos',
  protocol: 'https',
  host: 'nodes.get-scatter.com',
  port: 443,
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};
var jungle = false;
var local = true;
if (jungle) {
  network.chainId = '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca';
  network.port = 443;
  network.host = 'jungle.eosio.cr';
  network.protocol = 'https';
}

if (local) {
  network.chainId = 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f';
  network.port = 8888;
  network.host = '54.186.222.85';
  network.protocol = 'http';
}

network = ScatterJS.Network.fromJson(network)

async function setupScatter() {
  const scatter = window.scatter;

  const requiredFields = { accounts: [network] };
  // Use `scatter` normally now.  

  await scatter.getIdentity(requiredFields);
  const account = scatter.identity.accounts.find(x => x.blockchain === 'eos');
  // You can pass in any additional options you want into the eosjs reference.
  const eosOptions = { expireInSeconds: 600 };
  window.accountName = account.name;
  // Get a proxy reference to eosjs which you can use to sign transactions with a user's Scatter.
  const rpc = new JsonRpc(network.fullhost())
  const eos = scatter.eos(network, Api, {
    rpc,
    beta3: true
  })
  window.eos = eos;
}

// var ScatterJS = window.ScatterJS;
async function init () {
  await setupScatter();
  const eos = window.eos;
  
  const result = await eos.transact({
    actions: [{
      account: 'eosio.token',
      name: 'transfer',
      authorization: [{
        actor: 'player1',
        permission: 'active',
      }],
      data: {
        from: 'useraaaaaaaa',
        to: 'useraaaaaaab',
        quantity: '0.0001 SYS',
        memo: '',
      },
    }]
  }, {
    blocksBehind: 3,
    expireSeconds: 30,
  });
}

ScatterJS.scatter.connect('liquidWings').then((connected) => {
  if (!connected) {
    return false;
  }
  window.scatter = ScatterJS.scatter;
  init();
})

ReactDOM.render(<Index />, document.getElementById('root'));
