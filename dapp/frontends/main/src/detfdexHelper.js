
export default function(eos, dappClient) {
  return {
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
    createMarket: async function(contract, issuer, market_id, name, initial_base, initial_quote) {
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
                    market_id,
                    name,
                    initial_base,
                    initial_quote
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    createMarketBulk: async function(contract, issuer, market_id, name, initial_base, initial_quote) {
        const auth = { actor: issuer, permission: 'active' };
        const result = await eos.transact({
            actions: [{
                account: initial_base.contract,
                name: 'transfer',
                authorization: [auth],
                data: {
                    from: issuer,
                    to: contract,
                    quantity: initial_base.quantity,
                    memo: 'deposit asset',
                }
            }, {
                account: initial_quote.contract,
                name: 'transfer',
                authorization: [auth],
                data: {
                    from: issuer,
                    to: contract,
                    quantity: initial_quote.quantity,
                    memo: 'deposit asset',
                }
            }, {
                account: contract,
                name: 'create',
                authorization: [
                {
                    actor: 'eosio',
                    permission: 'active'
                }],
                data: {
                    issuer,
                    market_id,
                    name,
                    initial_base,
                    initial_quote
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
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
    convert: async function(contract, account, market_id, from, transfer) {
        const auth = { actor: account, permission: 'active' }
        const result = await eos.transact({
            actions: [{
                account: from.contract,
                name: 'transfer',
                authorization: [auth],
                data: {
                    from: account,
                    to: contract,
                    quantity: from.quantity,
                    memo: 'deposit asset',
                }
            }, {
                account: contract,
                name: 'convert',
                authorization: [auth],
                data: {
                    market_id,
                    from,
                    transfer
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

    // - liquidaccounts -

    // Register LiquidAccount
    regaccount: async function(code, privateKey, vaccount) {
        const service = await dappClient.service('vaccounts', code);
        const response = await service.push_liquid_account_transaction(
            code,
            privateKey,
            "regaccount",
            {
                vaccount // increment to new account if fails
            }
        );
    },

    // retail customers (not market makers/etf issuers)
    // vconvert(name vaccount
    //          uint64_t market_id
    //          extended_asset from)
    vconvert: async function(code, privateKey, vaccount, market_id, from) {
        const service = await dappClient.service('vaccounts', code);
        const response = await service.push_liquid_account_transaction(
            code,
            privateKey,
            "vconvert",
            {
                vaccount,
                market_id,
                from
            }
        );
    },

    // vwithdraw(name vaccount
    //           name to
    //           std::optional<extended_asset> amount)
    vwithdraw: async function(code, privateKey, vaccount, to, amount) {
        const service = await dappClient.service('vaccounts', code);
        const response = await service.push_liquid_account_transaction(
            code,
            privateKey,
            "vconvert",
            {
                vaccount,
                to,
                amount
            }
        );
    }
  };
}

