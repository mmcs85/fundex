#include "../dappservices/multi_index.hpp"
#include "../dappservices/vaccounts.hpp"

#define DAPPSERVICES_ACTIONS() \
  XSIGNAL_DAPPSERVICE_ACTION \
  IPFS_DAPPSERVICE_ACTIONS \
  VACCOUNTS_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()VACCOUNTS_SVC_COMMANDS()
#define CONTRACT_NAME() detfdex
using std::string;

CONTRACT_START()

    TABLE deposit
    {
        name account;
        std::map<std::pair<uint64_t, uint64_t>, extended_asset> assetmap;

        uint64_t primary_key() const { return account.value; }
    };

    TABLE market
    {
        uint64_t id;
        name issuer;
        string name;
        extended_asset base;
        extended_asset quote;

        uint64_t primary_key() const { return id; }

        extended_asset convert(const extended_asset from)
        {
            check(from.quantity.amount > 0, "Quantity must be greater than zero");
            extended_asset out = extended_asset();
            if (from.quantity.symbol == base.quantity.symbol)
            {
                out.contract = quote.contract;
                out.quantity.symbol = quote.quantity.symbol;
                out.quantity.amount = get_output(base.quantity.amount, quote.quantity.amount, from.quantity.amount);
                base += from;
                quote -= out;
            }
            else if (from.quantity.symbol == quote.quantity.symbol)
            {
                out.contract = base.contract;
                out.quantity.symbol = base.quantity.symbol;
                out.quantity.amount = get_output(quote.quantity.amount, base.quantity.amount, from.quantity.amount);
                quote += from;
                base -= out;
            }
            else
            {
                check(false, "Invalid conversion");
            }
            return out;
        }

        int64_t get_output(int64_t in_reserve,
                            int64_t out_reserve,
                            int64_t input)
        {
            // TODO check for int64_t overflows
            // TODO We are assuming same precision of assets here
            // Might need to change if we want to support different precisions
            const double in_balance = in_reserve;
            const double out_balance = out_reserve;
            const double in = input;
            int64_t out = int64_t(in * out_balance / (in_balance + in));
            if (out < 0)
            {
                out = 0;
            }
            return out;
        }
    };

    TABLE shardbucket {
        std::vector<char> shard_uri;
        uint64_t shard;
        uint64_t primary_key() const { return shard; }
    };

    typedef dapp::multi_index<"deposits"_n, deposit> deposits;
    typedef eosio::multi_index<".deposits"_n, deposit> deposits_v_abi;
    typedef eosio::multi_index<"deposits"_n, shardbucket> deposits_abi;

    typedef dapp::multi_index<"vdeposits"_n, deposit> vdeposits;
    typedef eosio::multi_index<".vdeposits"_n, deposit> vdeposits_v_abi;
    typedef eosio::multi_index<"vdeposits"_n, shardbucket> vdeposits_abi;

    typedef dapp::multi_index<"markets"_n, market> markets;
    typedef eosio::multi_index<".markets"_n, market> markets_v_abi;
    typedef eosio::multi_index<"markets"_n, shardbucket> markets_abi;

    [[eosio::action]] void create(const name& issuer,
                                  uint64_t market_id,
                                  string& name,
                                  extended_asset& initial_base,
                                  extended_asset& initial_quote)
    {
        check( initial_base.quantity.symbol.is_valid(), "initial base asset invalid symbol name" );
        check( initial_quote.quantity.symbol.is_valid(), "initial quote asset invalid symbol name" );
        check( initial_base.quantity.amount > 0, "initial base must be a positive quantity" );
        check( initial_quote.quantity.amount > 0, "initial quote must be a positive quantity" );
        check( initial_base.quantity.symbol.precision() == initial_quote.quantity.symbol.precision(),
         "initial base precision must match initial quote precision");

        require_auth(_self);

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(issuer.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        sub_deposit_asset(deposittable, issuer, initial_base);
        sub_deposit_asset(deposittable, issuer, initial_quote);

        markets markettable(_self, _self.value);

        markettable.emplace(_self, [&]( auto& m ) {
            m.id = market_id;
            m.name = name;
            m.issuer = issuer;
            m.base = initial_base;
            m.quote = initial_quote;
        });
    }

    [[eosio::action]] void convert(name account,
                                   uint64_t market_id,
                                   extended_asset& from,
                                   bool transfer)
    {
        check( from.quantity.symbol.is_valid(), "from asset invalid symbol name" );
        check( from.quantity.amount > 0, "from asset must be a positive quantity" );

        require_auth(account);

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(account.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        sub_deposit_asset(deposittable, account, from);

        markets markettable(_self, _self.value);

        extended_asset out = extended_asset();

        markettable.emplace(_self, [&]( auto& m ) {
            out = m.convert(from);
        });

        if(transfer) {
            eosio::action(permission_level(_self, name("active")),
                  out.contract, name("transfer"),
                  std::make_tuple(_self, account, out.quantity.amount, "withdraw asset action"))
            .send();
        } else {
            add_deposit_asset(deposittable, account, out);
        }
    }

    struct action_vconvert {
        name vaccount;
        uint64_t market_id;
        extended_asset from;

        EOSLIB_SERIALIZE( action_vconvert, (vaccount)(market_id)(from) )
    };

    [[eosio::action]] void vconvert(action_vconvert payload)
    {
        check( payload.from.quantity.symbol.is_valid(), "from asset invalid symbol name" );
        check( payload.from.quantity.amount > 0, "from asset must be a positive quantity" );

        require_vaccount(payload.vaccount);

        vdeposits vdeposittable(_self, _self.value);
        auto deposit_itr = vdeposittable.find(payload.vaccount.value);

        check(deposit_itr != vdeposittable.end(), "A deposit must exist");

        sub_deposit_asset(vdeposittable, payload.vaccount, payload.from);

        markets markettable(_self, _self.value);

        extended_asset out = extended_asset();

        markettable.emplace(_self, [&]( auto& m ) {
            out = m.convert(payload.from);
        });

        add_deposit_asset(vdeposittable, payload.vaccount, out);
    }

    //Handle deposit transfers only
    void transfer( const name&    from,
                   const name&    to,
                   const asset&   quantity,
                   const string&  memo )
    {
        check( from != to, "cannot transfer to self" );
        require_auth( from );
        check( is_account( to ), "to account does not exist");

        if (from == _self ||
            to != _self ||
            (_first_receiver == name("eosio.token") &&
            (from == name("eosio.stake") ||
            from == name("eosio.ram"))))
        {
            return;
        }

        auto new_deposit_asset = extended_asset(quantity, _first_receiver);

        if (memo.size() > 0) {
          name to_act = name(memo.c_str());
          check(is_account(to_act), "The account name supplied is not valid");          
          vdeposits deposittable(_self, _self.value);
          add_deposit_asset(deposittable, to_act, new_deposit_asset);
        } else {
          deposits deposittable(_self, _self.value);
          add_deposit_asset(deposittable, to, new_deposit_asset);
        }
    }

    [[eosio::action]] void withdraw(name account, std::optional<extended_asset> amount)
    {
        require_auth(account);

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(account.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        auto deposit = *deposit_itr;

        if (amount != std::nullopt) {
            auto wamount = amount.value();
            check( wamount.quantity.symbol.is_valid(), "invalid symbol name" );
            check( wamount.quantity.amount > 0, "must be a positive quantity" );

            sub_deposit_asset(deposittable, account, wamount);

            eosio::action(permission_level(_self, name("active")),
                    wamount.contract, name("transfer"),
                    std::make_tuple(_self, account, wamount.quantity.amount, "withdraw asset action"))
            .send();
        } else {
            for ( auto const& asset: deposit.assetmap ) {
                eosio::action(permission_level(_self, name("active")),
                        asset.second.contract, name("transfer"),
                        std::make_tuple(_self, account, asset.second.quantity.amount, "withdraw asset action"))
                .send();
            }

            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap.clear();
            });
        }
    }

    struct action_vwithdraw {
        name vaccount;
        name to;
        std::optional<extended_asset> amount;

        EOSLIB_SERIALIZE( action_vwithdraw, (vaccount)(to)(amount) )
    };

    [[eosio::action]] void vwithdraw(action_vwithdraw payload)
    {
        require_vaccount(payload.vaccount);

        vdeposits vdeposittable(_self, _self.value);
        auto deposit_itr = vdeposittable.find(payload.vaccount.value);

        check(deposit_itr != vdeposittable.end(), "A deposit must exist");

        auto deposit = *deposit_itr;

        if (payload.amount != std::nullopt) {
            auto wamount = payload.amount.value();
            check( wamount.quantity.symbol.is_valid(), "invalid symbol name" );
            check( wamount.quantity.amount > 0, "must be a positive quantity" );

            sub_deposit_asset(vdeposittable, payload.vaccount, wamount);

            eosio::action(permission_level(_self, name("active")),
                    wamount.contract, name("transfer"),
                    std::make_tuple(_self, payload.to, wamount.quantity.amount, "withdraw asset action"))
            .send();
        } else {
            for ( auto const& asset: deposit.assetmap ) {
                eosio::action(permission_level(_self, name("active")),
                        asset.second.contract, name("transfer"),
                        std::make_tuple(_self, payload.to, asset.second.quantity.amount, "withdraw asset action"))
                .send();
            }

            vdeposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap.clear();
            });
        }
    }

   private:

      template<typename T>
      void sub_deposit_asset(T& deposittable, name account, const extended_asset& amt)
      {
        auto deposit_itr = deposittable.find(account.value);
        const auto& asset_key = std::pair<uint64_t, uint64_t>(amt.contract.value, amt.quantity.symbol.code().raw());
        const auto& deposit_asset_itr = deposit_itr->assetmap.find(asset_key);

        check(deposit_asset_itr != deposit_itr->assetmap.end(), "required a deposit of the asset");

        auto& deposit_asset = deposit_asset_itr->second;
        auto asset_amount = deposit_asset.quantity.amount;
        auto amt_amount = amt.quantity.amount;

        check(asset_amount >= amt_amount, "not enough funds for this asset");

        if(asset_amount == amt_amount) {
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap.erase(deposit_asset_itr);
            });
        } else {
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap[asset_key].quantity.amount -= amt_amount;
            });
        }
    }

    template<typename T>
    void add_deposit_asset(T& deposittable, name account, const extended_asset& amt) {
        auto deposit_itr = deposittable.find(account.value);
        const auto& asset_key = std::pair<uint64_t, uint64_t>(amt.contract.value, amt.quantity.symbol.code().raw());

        if(deposit_itr == deposittable.end()) {
            deposittable.emplace(account, [&](auto &d) {
                d.account = account;
                d.assetmap[asset_key] = amt;
            });
        } else {
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                const auto& deposit_asset_itr = d.assetmap.find(asset_key);

                if(deposit_asset_itr == d.assetmap.end()) {
                    d.assetmap[asset_key] = amt;
                } else {
                    d.assetmap[asset_key] += amt;
                }
            });
        }
    }

    VACCOUNTS_APPLY(((action_vconvert)(vconvert))((action_vwithdraw)(vwithdraw)))
};
EOSIO_DISPATCH_SVC_TRX(CONTRACT_NAME(), (create)(convert)(withdraw)(regaccount))