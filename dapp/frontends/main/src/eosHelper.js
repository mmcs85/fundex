
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
    }
  };
}

