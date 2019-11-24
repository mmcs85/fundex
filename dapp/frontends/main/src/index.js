import { PrivateKey } from 'eosjs-ecc'
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

let network = {
  blockchain: 'eos',
  protocol: 'https',
  host: 'nodes.get-scatter.com',
  port: 443,
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
};
// var jungle = false;
// var local = true;
// if (jungle) {
//   network.chainId = '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca';
//   network.port = 443;
//   network.host = 'jungle.eosio.cr';
//   network.protocol = 'https';
// }

// if (local) {
//   network.chainId = 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f';
//   network.port = 443;
//   network.host = '13015-c2906f2a-6ebe-4018-a20b-790d7313b95b.ws-eu01.gitpod.io';
//   network.protocol = 'https';
// }

// kylin
network.chainId = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191';
network.port = 443;
network.host = 'kylin-dsp-1.liquidapps.io';
network.protocol = 'https';

const defaultPrivateKey = "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3";
const defaultPubKey = "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV";

network = ScatterJS.Network.fromJson(network)

window.cfg = {
    network,
    loggedInAccount: 'liquidmarios',
    tokensContract: 'xdummytokenx',
    detfContract: 'xxfundexxetf',
    detfDexContract: 'xxfundexxdex',
    accounts: ['liquidmarios', 'liquidzachal', 'liquidpeters', 'liquidlouren'],
    tokens: ['EOS', 'DAPP', 'ETH', 'BTC', 'GOLD', 'USDT', 'USDC'],
    etfs: ['RETF', 'SVETF', 'SCETF'],

    privateKeys: [ '5J96juvRwfwFuM87kTTMyLojVPsvBWwPE5rfrPE8UnnfB3vtS9T', 
                   '5JpuDKQKRSUCV9oTuMr6zSWGvgZRMgMTQ33CBkpEhRsYTAATDDk',
                   '5JTB8muAHW9cN5bg3N9NvbyVpFj7gmjTyt6TopjyZmRwxr2p7an',
                   '5J1qDwWMPQwwex74Ab3QGZu81cziJy5JZ7AmPXMt4Vz6ngmbPP2' ]
}

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
    const signatureProvider = new JsSignatureProvider(window.cfg.privateKeys);
    const rpc = new JsonRpc(network.fullhost())
    window.eos = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
}

async function init (callback) {
  //await setupScatter();

  setupDefaultEos();  
  await setupDspClient();
  //const scatterEos = window.scatterEos;
  const eos = window.eos;
  const dspClient = window.dspClient;

  const eosHelper = new EosHelper(eos);
  const detfHelper = new DetfHelper(eos, dspClient);
  const detfdexHelper = new DetfdexHelper(eos, dspClient);

//  await seedContractTokens(eosHelper);
//   await seedAccounts(eosHelper);
// await seedDetfs(eosHelper, detfHelper);
//  await seedMarkets(eosHelper, detfHelper, detfdexHelper);
//   await checkStates(eosHelper, detfHelper, detfdexHelper);

    callback();
}

async function seedContractTokens(eosHelper) {
    for(let token of window.cfg.tokens) {
        try {
            await eosHelper.createToken(window.cfg.tokensContract, window.cfg.tokensContract, `1000000000.0000 ${token}`);
        } catch(e){};
    }  
}

async function seedAccounts(eosHelper) {
    // for(let acc of window.cfg.accounts) {
    //     try { 
    //         await eosHelper.createAccount(acc, defaultPubKey);
    //     } catch(e){};
    // }

    for(let acc of window.cfg.accounts) {
        for(let token of window.cfg.tokens) {
            await eosHelper.issueToken(window.cfg.tokensContract, window.cfg.tokensContract, acc, `100000.0000 ${token}`, 'give funds');
        }
    }
}

async function seedDetfs(eosHelper, detfHelper) {
    // try {
    //     await detfHelper.createDetf(window.cfg.detfContract, 'liquidmarios', [{
    //         contract: window.cfg.tokensContract,
    //         quantity: '20.0000 EOS'
    //     }, {
    //         contract: window.cfg.tokensContract,
    //         quantity: '10.0000 DAPP'
    //     }, {
    //         contract: window.cfg.tokensContract,
    //         quantity: '1.0000 ETH'
    //     }], '1000000000.0000 RETF');
    // } catch(e){};

    // try {
    //     await detfHelper.createDetf(window.cfg.detfContract, 'liquidzachal', [{
    //         contract: window.cfg.tokensContract,
    //         quantity: '1.0000 BTC'
    //     }, {
    //         contract: window.cfg.tokensContract,
    //         quantity: '1.0000 GOLD'
    //     }], '1000000000.0000 SVETF');
    // } catch(e){};

    // try {
    //     await detfHelper.createDetf(window.cfg.detfContract, 'liquidpeters', [{
    //         contract: window.cfg.tokensContract,
    //         quantity: '0.5000 USDT'
    //     }, {
    //         contract: window.cfg.tokensContract,
    //         quantity: '0.5000 USDC'
    //     }], '1000000000.0000 SCETF');
    // } catch(e){};

    for(let i = 0; i<3; i++) {
        await detfHelper.issueDetfBulk(window.cfg.detfContract, 'liquidmarios', '0.0001 RETF', 'RETF', 'get some shares');
        await detfHelper.issueDetfBulk(window.cfg.detfContract, 'liquidzachal', '0.0001 SVETF', 'SVETF', 'get some shares');
        await detfHelper.issueDetfBulk(window.cfg.detfContract, 'liquidpeters', '0.0001 SCETF', 'SCETF', 'get some shares');
    }
}

async function seedMarkets(eosHelper, detfHelper, detfdexHelper) {
    try {
        await eosHelper.transfer(window.cfg.detfContract, 'liquidmarios', window.cfg.detfDexContract, '0.0003 RETF', '', {
            actor: 'liquidmarios',
            permission: 'active',
        });
        await eosHelper.transfer(window.cfg.tokensContract, 'liquidmarios', window.cfg.detfDexContract, '1000.0000 USDT', '', {
            actor: 'liquidmarios',
            permission: 'active',
        });
        await detfdexHelper.createMarket(window.cfg.detfDexContract, 'liquidmarios', 1, 5, 'Resources ETF/USDT', {
            contract: window.cfg.detfContract,
            quantity: '0.0003 RETF'
        }, {
            contract: window.cfg.tokensContract,
            quantity: '1000.0000 USDT'
        })
    } catch(e){};

    try {
        await eosHelper.transfer(window.cfg.detfContract, 'liquidzachal', window.cfg.detfDexContract, '0.0003 SVETF', '', {
            actor: 'liquidzachal',
            permission: 'active',
        });
        await eosHelper.transfer(window.cfg.tokensContract, 'liquidzachal', window.cfg.detfDexContract, '1000.0000 USDT', '', {
            actor: 'liquidzachal',
            permission: 'active',
        });
        await detfdexHelper.createMarket(window.cfg.detfDexContract, 'liquidzachal', 2, 5, 'Store of Value SVETF/USDT', {
            contract: window.cfg.detfContract,
            quantity: '0.0003 SVETF'
        }, {
            contract: window.cfg.tokensContract,
            quantity: '1000.0000 USDT'
        })
    } catch(e){};

    try {
        await eosHelper.transfer(window.cfg.detfContract, 'liquidpeters', window.cfg.detfDexContract, '0.0003 SCETF', '', {
            actor: 'liquidpeters',
            permission: 'active',
        });
        await eosHelper.transfer(window.cfg.tokensContract, 'liquidpeters', window.cfg.detfDexContract, '1000.0000 EOS', '', {
            actor: 'liquidpeters',
            permission: 'active',
        });
        await detfdexHelper.createMarket(window.cfg.detfDexContract, 'liquidpeters', 3, 5, 'Stablecoins SCETF/EOS', {
            contract: window.cfg.detfContract,
            quantity: '0.0003 SCETF'
        }, {
            contract: window.cfg.tokensContract,
            quantity: '1000.0000 EOS'
        })
    } catch(e){};

    // await eosHelper.transfer(window.cfg.detfContract, 'liquidmarios', window.cfg.detfDexContract, '0.0001 RETF', '', {
    //     actor: 'liquidmarios',
    //     permission: 'active',
    // });
    // await detfdexHelper.convert(window.cfg.detfDexContract, 'liquidmarios', 1, {
    //     contract: window.cfg.detfContract,
    //     quantity: '0.0001 RETF'
    // }, true);

    // await detfdexHelper.withdraw(window.cfg.detfDexContract, 'liquidmarios', {
    //     contract: window.cfg.tokensContract,
    //     quantity: '0.0001 RETF'
    // })

    // const privKey = PrivateKey.fromSeed('12345').toString()
    // detfdexHelper.regaccount(window.cfg.detfDexContract, privKey, 'testing111');

    // await eosHelper.transfer(window.cfg.detfContract, 'liquidmarios', window.cfg.detfDexContract, '1.0000 USDT', 'vaccount:testing111', {
    //     actor: 'liquidmarios',
    //     permission: 'active',
    // });
}

async function checkStates(eosHelper, detfHelper, detfdexHelper) {
    // await detfdexHelper.getMarket(window.cfg.detfDexContract, 1);
    // await detfdexHelper.getMarket(window.cfg.detfDexContract, 2);
    // await detfdexHelper.getMarket(window.cfg.detfDexContract, 3);
}

init(function() {
    ReactDOM.render(<Index />, document.getElementById('root'));
});

// ScatterJS.scatter.connect('liquidWings').then((connected) => {
//   if (!connected) {
//     return false;
//   }
//   window.scatter = ScatterJS.scatter;
  
// })


