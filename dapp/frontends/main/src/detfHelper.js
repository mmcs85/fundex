
export default function(eos, dappClient) {
  return {
    // create(const name& issuer, 
    // 	   std::vector<extended_asset> basket_units, 
    // 	   const asset&  maximum_supply)
    //
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
    createDetf: async function(contract, issuer, basket_units, maximum_supply) {
        const result = await eos.transact({
            actions: [{
                account: contract,
                name: 'create',
                authorization: [
                {
                    actor: issuer,
                    permission: 'active'
                }],
                data: {
                    issuer,
                    basket_units,
                    maximum_supply
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    // issue(const name& account, 
    //       const asset& quantity,
    //  	  const string& memo )

    // {
    //     account: 'zach',
    //     quantity: '0.1000 ETF',
    //     memo: 'get etf tokens'
    // }
    issueDetf: async function(contract, account, quantity, memo) {
        const result = await eos.transact({
            actions: [{
                account: contract,
                name: 'issue',
                authorization: [{ actor: account, permission: 'active' }],
                data: {
                    account,
                    quantity,
                    memo
                }
        }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },

    issueDetfBulk: async function(contract, account, quantity, symbol, memo) {
        const stat = await this.getDetfStat(contract, symbol);
        const auth = { actor: account, permission: 'active' };
        const actions = [];
        for(let unit of stat.basket_units) {
            actions.push({
                account: unit.contract,
                name: 'transfer',
                authorization: [auth],
                data: {
                    from: account,
                    to: contract,
                    quantity: unit.quantity,
                    memo: 'deposit asset',
                }
            });
        }

        actions.push({
            account: contract,
            name: 'issue',
            authorization: [auth],
            data: {
                account,
                quantity,
                memo
            }
        });

        const result = await eos.transact({
            actions
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },

    // redeem(const name& account, 
    //        const asset& quantity, 
    // 	   const string& memo )
    //
    // {
    //     account: 'zach',
    //     quantity: '0.1000 ETF',
    //     memo: 'get etf tokens'
    // }
    redeem: async function(contract, account, quantity, memo) {
        const result = await eos.transact({
            actions: [{
                account: contract,
                name: 'redeem',
                authorization: [
                {
                    actor: account,
                    permission: 'active'
                }],
                data: {
                    account,
                    quantity,
                    memo
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },

    // withdraw(name account, 
    //          std::optional<extended_asset> amount)
    withdraw: async function(contract, account, amount) {
        const result = await eos.transact({
            actions: [{
                account: contract,
                name: 'withdraw',
                authorization: [
                {
                    actor: account,
                    permission: 'active'
                }],
                data: {
                    account,
                    amount
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    getDetfStat: async function(code, symbolCode) {
        const data = await eos.rpc.get_table_rows({
            json: true,
            code,
            scope: symbolCode,
            table: 'stat',
            limit: 1
        });
        return data.rows[0];
    },
    getDeposits: async function(code, account) {
        const data = await eos.rpc.get_table_rows({
            json: true,
            code,
            scope: account,
            table: 'deposits'
        });
        return data.rows;
    },
    getBalance: async function(code, account, symbolCode) {
        const service = await dappClient.service('ipfs', code);
        const response = await service.get_vram_row(code, account, 'accounts', symbolCode );
        console.log(response);
        return response;
    }
  };
}

