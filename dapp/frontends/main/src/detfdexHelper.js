
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

export default function(eos) {
  return {
    createAccount: async function(name, publicKey) {
        const auth = {
            threshold: 1,
            keys: [{ weight: 1, key: publicKey }],
            accounts: [],
            waits: []
        }
        const result = await eos.transact({
            actions: [{
                account: 'eosio',
                name: 'newaccount',
                authorization: [
                {
                    actor: 'eosio',
                    permission: 'active'
                }],
                data: {
                    creator: 'eosio',
                    name,
                    owner: auth,
                    active: auth
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    transfer: async function(from, to, asset, memo, auth) {
        const result = await eos.transact({
            actions: [{
            account: asset.contract,
            name: 'transfer',
            authorization: [auth],
                data: {
                    from,
                    to,
                    quantity: asset.quantity,
                    memo,
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    createToken: async function(issuer, maximum_supply) {
        const result = await eos.transact({
            actions: [{
                account: 'eosio.token',
                name: 'create',
                authorization: [
                {
                    actor: 'eosio',
                    permission: 'active'
                }],
                data: {
                    issuer,
                    maximum_supply
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    issueToken: async function(to, quantity, memo, auth ) {
        const result = await eos.transact({
            actions: [{
                account: 'eosio.token',
                name: 'create',
                authorization: [auth],
                data: {
                    to,
                    quantity,
                    memo
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    getDeposits: async function(limit, fromAcc, toAcc) {
        const data = await eos.rpc.get_table_rows({
            json: true,
            code: this.contract,
            scope: this.contract,
            table: 'deposits',
            lower_bound: fromAcc,
            upper_bound: toAcc,
            limit
        })
        return data.rows
    }
  };
}

