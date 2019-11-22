import React from 'react';
import ReactDOM from 'react-dom';
import Index from './pages/index';

import { Api, JsonRpc } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs2';
import { createClient } from '@liquidapps/dapp-client';

import EosHelper from './eosHelper'
import DetfHelper from './detfHelper'
import DetfdexHelper from './detfdexHelper'

ScatterJS.plugins(new ScatterEOS())

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
  network.port = 443;
  network.host = '8888-de82ebec-941c-4022-9e70-3175509c7335.ws-eu01.gitpod.io';
  network.protocol = 'https';
}

const defaultPrivateKey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
const defaultPubKey = "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV";

network = ScatterJS.Network.fromJson(network)

async function setupDspClient() {
    window.dspClient = await createClient({ httpEndpoint: network.fullhost(), fetch: window.fetch.bind(window) });
}

async function setupScatter() {
  const scatter = window.scatter;

  const requiredFields = { accounts: [network] };
  // Use `scatter` normally now.  
  await scatter.forgetIdentity();

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
  window.scatterEos = eos;
}

function setupDefaultEos() {
    
    const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
    const rpc = new JsonRpc(network.fullhost())
    window.eos = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
}

async function init () {
  //await setupScatter();

  setupDefaultEos();  
  await setupDspClient();
  //const scatterEos = window.scatterEos;
  const eos = window.eos;
  const dspClient = window.dspClient;

  const eosHelper = new EosHelper(eos);
  const detfHelper = new DetfHelper(eos, dspClient);
  const detfdexHelper = new DetfdexHelper(eos, dspClient);

  await seedContractTokens(eosHelper);
  await seedAccounts(eosHelper);
}

async function seedAccounts(eosHelper) {
    const accounts = ['liquidmarios', 'liquidzachal', 'liquidpeters'];
    const tokens = ['SYS', 'EOS', 'DAPP', 'ETH', 'BTC', 'GOLD', 'USDT', 'EURT'];

    try { 
        for(let acc of accounts) {
            await eosHelper.createAccount(acc, defaultPubKey);
        }
    } catch(e){};

    for(let acc of accounts) {
        for(let token of tokens) {
            await eosHelper.issueToken('eosio', acc, `1000.0000 ${token}`, 'give funds');
        }
    }
}

async function seedContractTokens(eosHelper) {
    try {
        const tokens = ['EOS', 'DAPP', 'ETH', 'BTC', 'GOLD', 'USDT', 'EURT'];
        for(let token of tokens) {
            await eosHelper.createToken('eosio', `1000000000.0000 ${token}`);
        }
    } catch(e){};    
}

init();

// ScatterJS.scatter.connect('liquidWings').then((connected) => {
//   if (!connected) {
//     return false;
//   }
//   window.scatter = ScatterJS.scatter;
  
// })

ReactDOM.render(<Index />, document.getElementById('root'));
