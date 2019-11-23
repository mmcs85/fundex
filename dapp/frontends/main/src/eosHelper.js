
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
            }, {
                account: 'eosio',
                name: 'buyram',
                authorization: [{
                    actor: 'eosio',
                    permission: 'active',
                }],
                data: {
                    payer: 'eosio',
                    receiver: name,
                    quant: `1000.0000 SYS`,
                }
            },
            {
                account: 'eosio',
                name: 'delegatebw',
                authorization: [{
                    actor: 'eosio',
                    permission: 'active',
                }],
                data: {
                    from: 'eosio',
                    receiver: name,
                    stake_net_quantity: `1000.0000 SYS`,
                    stake_cpu_quantity: `1000.0000 SYS`,
                    transfer: false
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
    },
    transfer: async function(code, from, to, quantity, memo, auth) {
        const result = await eos.transact({
            actions: [{
            account: code,
            name: 'transfer',
            authorization: [auth],
                data: {
                    from,
                    to,
                    quantity,
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
                    actor: 'eosio.token',
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
    issueToken: async function(issuer, to, quantity, memo ) {
        const result = await eos.transact({
            actions: [{
                account: 'eosio.token',
                name: 'issue',
                authorization: [{                    
                    actor: issuer,
                    permission: 'active'
                }],
                data: {
                    issuer,
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
    getTableRows: async function(code, scope, table, lower_bound, upper_bound, limit) {
        const data = await eos.rpc.get_table_rows({
            json: true,
            code,
            scope,
            table,
            lower_bound,
            upper_bound,
            limit
        })
        return data.rows
    },
    getBalances: async function(code, account) {
        const data = await eos.rpc.get_table_rows({
            json: true,
            code,
            scope: account,
            table: 'deposits'
        });
        return data.rows;
    },
  };
}

