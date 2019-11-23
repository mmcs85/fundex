#include "../dappservices/multi_index.hpp"
#include "../dappservices/vaccounts.hpp"

#define DAPPSERVICES_ACTIONS() \
  XSIGNAL_DAPPSERVICE_ACTION \
  IPFS_DAPPSERVICE_ACTIONS \
  VACCOUNTS_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()VACCOUNTS_SVC_COMMANDS()
#define CONTRACT_NAME() detfdex
#define DELAYED_CLEANUP 60
#define FEE_PRECISION 1000
using std::string;

std::string extended_asset_to_string(const extended_asset& asset) {
    if(!asset.contract)
        return std::string();
    return std::string("'" + asset.contract.to_string() + ", " + asset.quantity.symbol.code().to_string() + "'");
}

CONTRACT_START()

    TABLE deposit
    {
        name contract;
        std::map<uint64_t, asset> assetmap;

        uint64_t primary_key() const { return contract.value; }
    };

    TABLE market
    {
        uint64_t id;
        name issuer;
        string name;
        uint64_t fee;
        extended_asset base;
        extended_asset quote;

        uint64_t primary_key() const { return id; }

        extended_asset convert(const extended_asset& from)
        {
            check(from.quantity.amount > 0, "Quantity must be greater than zero");
            extended_asset out = extended_asset();
            if (from.contract == base.contract &&
                from.quantity.symbol == base.quantity.symbol)
            {
                out.contract = quote.contract;
                out.quantity.symbol = quote.quantity.symbol;
                out.quantity.amount = get_output(base.quantity.amount, quote.quantity.amount, from.quantity.amount);
                base += from;
                quote -= out;
            }
            else if (from.contract == quote.contract &&
                     from.quantity.symbol == quote.quantity.symbol)
            {
                out.contract = base.contract;
                out.quantity.symbol = base.quantity.symbol;
                out.quantity.amount = get_output(quote.quantity.amount, base.quantity.amount, from.quantity.amount);
                quote += from;
                base -= out;
            }
            else
            {
                check(false, "Invalid conversion, base: "  + extended_asset_to_string(base) + 
                                                " quote: " + extended_asset_to_string(quote) + 
                                                " from: "  + extended_asset_to_string(from));
            }

            check(out.quantity.amount > 0, "converted asset: " + extended_asset_to_string(out) + " must be positive");

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

    typedef eosio::multi_index<"deposits"_n, deposit> deposits;
    typedef eosio::multi_index<"vdeposits"_n, deposit> vdeposits;

    typedef dapp::multi_index<"markets"_n, market> markets;
    typedef eosio::multi_index<".markets"_n, market> markets_v_abi;
    typedef eosio::multi_index<"markets"_n, shardbucket> markets_abi;

    [[eosio::action]] void create(const name& issuer,
                                  uint64_t market_id,
                                  uint64_t fee,
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

        require_auth(issuer);

        deposits deposittable(_self, issuer.value);

        sub_deposit_asset(deposittable, initial_base);
        sub_deposit_asset(deposittable, initial_quote);

        markets markettable(_self, _self.value, 1024, 64, false, false, DELAYED_CLEANUP);

        markettable.emplace(_self, [&]( auto& m ) {
            m.id = market_id;
            m.name = name;
            m.fee = fee;
            m.issuer = issuer;
            m.base = initial_base;
            m.quote = initial_quote;
        });
    }

    [[eosio::action]] void retire(const name& issuer,
                                  uint64_t market_id)
    {
        require_auth(issuer);

        markets markettable(_self, _self.value, 1024, 64, false, false, DELAYED_CLEANUP);
        auto market_itr = markettable.find(market_id);

        check(market_itr->issuer == issuer, "only market creator can retire fund");

        markettable.erase(market_itr);

        eosio::action(permission_level(_self, name("active")),
            market_itr->base.contract, name("transfer"),
            std::make_tuple(_self, issuer, market_itr->base.quantity, std::string("withdraw asset action")))
        .send();

        eosio::action(permission_level(_self, name("active")),
            market_itr->quote.contract, name("transfer"),
            std::make_tuple(_self, issuer, market_itr->quote.quantity, std::string("withdraw asset action")))
        .send();
    }

    [[eosio::action]] void fund(const name& issuer,
                                uint64_t market_id,
                                extended_asset& base,
                                extended_asset& quote)
    {
        check( base.quantity.symbol.is_valid(), "base asset invalid symbol name" );
        check( quote.quantity.symbol.is_valid(), "quote asset invalid symbol name" );
        check( base.quantity.amount > 0, "base must be a positive quantity" );
        check( quote.quantity.amount > 0, "quote must be a positive quantity" );
        check( base.quantity.symbol.precision() == quote.quantity.symbol.precision(),
         "base precision must match quote precision");

        require_auth(issuer);

        markets markettable(_self, _self.value, 1024, 64, false, false, DELAYED_CLEANUP);
        auto market_itr = markettable.find(market_id);

        check(market_itr->issuer == issuer, "only market creator is allowed to fund");

        // TODO check if funding doesnt bias market price by a max % of slippage

        deposits deposittable(_self, issuer.value);

        sub_deposit_asset(deposittable, base);
        sub_deposit_asset(deposittable, quote);

        markettable.modify(market_itr, _self, [&]( auto& m ) {
            m.base += base;
            m.quote += quote;
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

        deposits deposittable(_self, account.value);
        sub_deposit_asset(deposittable, from);

        markets markettable(_self, _self.value);
        auto market_itr = markettable.find(market_id);
        auto market_fee = market_itr->fee;

        auto from_fee = from.quantity * market_fee / FEE_PRECISION;
        check(from_fee.amount >= 0, "order is to low to charge fee");
        from.quantity -= from_fee;
        
        extended_asset out = extended_asset();
        markettable.modify(market_itr, _self, [&]( auto& m ) {
            out = m.convert(from);
        });

        auto out_fee = out.quantity * market_fee / FEE_PRECISION;
        check(out_fee.amount >= 0, "order is to low to charge fee");

        deposits issuer_deposittable(_self, market_itr->issuer.value);
        add_deposit_asset(issuer_deposittable, extended_asset(from_fee, from.contract));
        add_deposit_asset(issuer_deposittable, extended_asset(out_fee, out.contract));

        if(transfer) {
            eosio::action(permission_level(_self, name("active")),
                  out.contract, name("transfer"),
                  std::make_tuple(_self, account, out.quantity, std::string("withdraw asset action")))
            .send();
        } else {
            add_deposit_asset(deposittable, out);
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

        vdeposits vdeposittable(_self, payload.vaccount.value);

        sub_deposit_asset(vdeposittable, payload.from);

        markets markettable(_self, _self.value);
        auto market_itr = markettable.find(payload.market_id);
        auto market_fee = market_itr->fee;

        auto from_fee = payload.from.quantity * market_fee / FEE_PRECISION;
        check(from_fee.amount >= 0, "order is to low to charge fee");
        payload.from.quantity -= from_fee;

        extended_asset out = extended_asset();
        markettable.modify(market_itr, _self, [&]( auto& m ) {
            out = m.convert(payload.from);
        });

        auto out_fee = out.quantity * market_fee / FEE_PRECISION;
        check(out_fee.amount >= 0, "order is to low to charge fee");

        deposits issuer_deposittable(_self, market_itr->issuer.value);
        add_deposit_asset(issuer_deposittable, extended_asset(from_fee, payload.from.contract));
        add_deposit_asset(issuer_deposittable, extended_asset(out_fee, out.contract));

        add_deposit_asset(vdeposittable, out);
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
          char* memocopy = strdup(memo.c_str());
          char* token = strtok(memocopy, ":");
          if(std::string(token) == "vaccount") {
            name to_act;
            token = strtok(NULL, ":");
            if(token != NULL) {
                to_act = name(dapp::stoull(token));
            }
            else {
                check( false, "vaccount not found" );
            }

            check(is_account(to_act), "The account name supplied is not valid");          
            vdeposits deposittable(_self, to_act.value);
            add_deposit_asset(deposittable, new_deposit_asset);
            return;
          }
        }

        deposits deposittable(_self, from.value);
        add_deposit_asset(deposittable, new_deposit_asset);
    }

    [[eosio::action]] void withdraw(name account, extended_asset amount)
    {
        require_auth(account);

        deposits deposittable(_self, account.value);

        check( amount.quantity.symbol.is_valid(), "invalid symbol name" );
        check( amount.quantity.amount > 0, "must be a positive quantity" );

        sub_deposit_asset(deposittable, amount);

        eosio::action(permission_level(_self, name("active")),
                amount.contract, name("transfer"),
                std::make_tuple(_self, account, amount.quantity, std::string("withdraw asset action")))
        .send();
    }

    struct action_vwithdraw {
        name vaccount;
        name to;
        extended_asset amount;

        EOSLIB_SERIALIZE( action_vwithdraw, (vaccount)(to)(amount) )
    };

    [[eosio::action]] void vwithdraw(action_vwithdraw payload)
    {
        require_vaccount(payload.vaccount);

        vdeposits vdeposittable(_self, payload.vaccount.value);

        auto wamount = payload.amount;
        check( wamount.quantity.symbol.is_valid(), "invalid symbol name" );
        check( wamount.quantity.amount > 0, "must be a positive quantity" );

        sub_deposit_asset(vdeposittable, wamount);

        eosio::action(permission_level(_self, name("active")),
                wamount.contract, name("transfer"),
                std::make_tuple(_self, payload.to, wamount.quantity.amount, "withdraw asset action"))
        .send();
    }

   private:

    template<typename T>
    void sub_deposit_asset(T& deposittable, const extended_asset& amt) 
    {
        auto deposit_itr = deposittable.find(amt.contract.value);
        auto asset_symcode_raw = amt.quantity.symbol.code().raw();
        const auto& deposit_asset_itr = deposit_itr->assetmap.find(asset_symcode_raw);

        check(deposit_asset_itr != deposit_itr->assetmap.end(), "asset deposit required");

        auto& deposit_asset = deposit_asset_itr->second;
        auto asset_amount = deposit_asset.amount;
        auto amt_amount = amt.quantity.amount;

        check(asset_amount >= amt_amount, "not enough funds for this asset");

        if(asset_amount == amt_amount) {
            deposittable.modify(deposit_itr, _self, [&](auto &d) {
                d.assetmap.erase(deposit_asset_itr);
            });
        } else {
            deposittable.modify(deposit_itr, _self, [&](auto &d) {
                d.assetmap[asset_symcode_raw].amount -= amt_amount;
            });
        }
    }

    template<typename T>
    void add_deposit_asset(T& deposittable, const extended_asset& amt) {
        auto deposit_itr = deposittable.find(amt.contract.value);
        auto asset_symcode_raw = amt.quantity.symbol.code().raw();

        if(deposit_itr == deposittable.end()) {
            deposittable.emplace(_self, [&](auto &d) {
                d.contract = amt.contract;
                d.assetmap[asset_symcode_raw] = amt.quantity;
            });
        } else {
            deposittable.modify(deposit_itr, _self, [&](auto &d) {
                const auto& deposit_asset_itr = d.assetmap.find(asset_symcode_raw);

                if(deposit_asset_itr == d.assetmap.end()) {
                    d.assetmap[asset_symcode_raw] = amt.quantity;
                } else {
                    d.assetmap[asset_symcode_raw] += amt.quantity;
                }
            });
        }
    }

    VACCOUNTS_APPLY(((action_vconvert)(vconvert))((action_vwithdraw)(vwithdraw)))
};
EOSIO_DISPATCH_SVC_TRX(CONTRACT_NAME(), (create)(retire)(fund)(convert)(withdraw)(regaccount))