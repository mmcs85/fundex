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

        markettable.emplace(issuer, [&]( auto& m ) {
            m.id = market_id;
            m.name = name;
            m.issuer = issuer;
            m.base = initial_base;
            m.quote = initial_quote;
        });
    }

    [[eosio::action]] void convert(name account,
                                   uint64_t market_id,
                                   extended_asset& from)
    {
        check( from.quantity.symbol.is_valid(), "from asset invalid symbol name" );
        check( from.quantity.amount > 0, "from asset must be a positive quantity" );

        require_auth(account);

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(account.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        sub_deposit_asset(deposittable, account, from);

        markets markettable(_self, _self.value);
        auto market_itr = markettable.find(market_id);
        extended_asset out;

        markettable.modify(market_itr, account, [&]( auto& m ) {
            out = m.convert(from);
        });

        eosio::action(permission_level(_self, name("active")),
                out.contract, name("transfer"),
                std::make_tuple(_self, account, out.quantity.amount, "convert asset action"))
        .send();
    }

    [[eosio::action]] void withdraw(name account)
    {
        require_auth(account);

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(account.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        auto deposit = *deposit_itr;

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

    void transfer( const name&    from,
                   const name&    to,
                   const asset&   quantity,
                   const string&  memo )
    {
        check( from != to, "cannot transfer to self" );
        require_auth( from );
        check( is_account( to ), "to account does not exist");

        if (_first_receiver == _self ||
            from == _self ||
            to != _self ||
            (_first_receiver == name("eosio.token") &&
            (from == name("eosio.stake") ||
            from == name("eosio.ram"))))
        {
            return;
        }

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(from.value);

        const auto& unit_key = std::pair<uint64_t, uint64_t>(_first_receiver.value, quantity.symbol.code().raw());
        auto new_deposit_asset = extended_asset(quantity, _first_receiver);

        if(deposit_itr == deposittable.end()) {
            deposittable.emplace(from, [&](auto &d) {
                d.account = from;
                d.assetmap[unit_key] = new_deposit_asset;
            });
        } else {
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                const auto& deposit_asset_itr = d.assetmap.find(unit_key);

                if(deposit_asset_itr == d.assetmap.end()) {
                    d.assetmap[unit_key] = new_deposit_asset;
                } else {
                    d.assetmap[unit_key] += new_deposit_asset;
                }
            });
        }
    }

    //   TABLE stat {
    //       uint64_t   counter = 0;
    //   };

    //   typedef eosio::singleton<"stat"_n, stat> stats_def;
    //   bool timer_callback(name timer, std::vector<char> payload, uint32_t seconds){

    //     stats_def statstable(_self, _self.value);
    //     stat newstats;
    //     if(!statstable.exists()){
    //       statstable.set(newstats, _self);
    //     }
    //     else{
    //       newstats = statstable.get();
    //     }
    //     auto reschedule = false;
    //     if(newstats.counter++ < 3){
    //       reschedule = true;
    //     }
    //     statstable.set(newstats, _self);
    //     return reschedule;
    //     // reschedule

    //   }
    //  [[eosio::action]] void testschedule() {
    //     std::vector<char> payload;
    //     schedule_timer(_self, payload, 2);
    //   }


    //   struct dummy_action_hello {
    //       name vaccount;
    //       uint64_t b;
    //       uint64_t c;

    //       EOSLIB_SERIALIZE( dummy_action_hello, (vaccount)(b)(c) )
    //   };

    //   [[eosio::action]] void hello(dummy_action_hello payload) {
    //     require_vaccount(payload.vaccount);

    //     print("hello from ");
    //     print(payload.vaccount);
    //     print(" ");
    //     print(payload.b + payload.c);
    //     print("\n");
    //   }

    //   [[eosio::action]] void hello2(dummy_action_hello payload) {
    //     print("hello2(default action) from ");
    //     print(payload.vaccount);
    //     print(" ");
    //     print(payload.b + payload.c);
    //     print("\n");
    //   }



    //   TABLE account {
    //      extended_asset balance;
    //      uint64_t primary_key()const { return balance.contract.value; }
    //   };

    //   typedef dapp::multi_index<"vaccounts"_n, account> cold_accounts_t;
    //   typedef eosio::multi_index<".vaccounts"_n, account> cold_accounts_t_v_abi;
    //   TABLE shardbucket {
    //       std::vector<char> shard_uri;
    //       uint64_t shard;
    //       uint64_t primary_key() const { return shard; }
    //   };
    //   typedef eosio::multi_index<"vaccounts"_n, shardbucket> cold_accounts_t_abi;


    //  [[eosio::action]] void withdraw( name to, name token_contract){

    //         require_auth( to );
    //         require_recipient( to );
    //         auto received = sub_all_cold_balance(to, token_contract);
    //         action(permission_level{_self, "active"_n}, token_contract, "transfer"_n,
    //            std::make_tuple(_self, to, received, std::string("withdraw")))
    //         .send();
    //   }

    //  void transfer( name from,
    //                  name to,
    //                  asset        quantity,
    //                  string       memo ){
    //     require_auth(from);
    //     if(to != _self || from == _self || from == "eosio"_n || from == "eosio.stake"_n || from == to)
    //         return;
    //     if(memo == "seed transfer")
    //         return;
    //     if (memo.size() > 0){
    //       name to_act = name(memo.c_str());
    //       eosio::check(is_account(to_act), "The account name supplied is not valid");
    //       require_recipient(to_act);
    //       from = to_act;
    //     }
    //     extended_asset received(quantity, get_first_receiver());
    //     add_cold_balance(from, received);
    //  }

   private:
      void sub_deposit_asset(deposits& deposittable, name account, const extended_asset& amt) {
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

      /*extended_asset sub_all_cold_balance( name owner, name token_contract){
           cold_accounts_t from_acnts( _self, owner.value );
           const auto& from = from_acnts.get( token_contract.value, "no balance object found" );
           auto res = from.balance;
           from_acnts.erase( from );
           return res;
      }

      void add_cold_balance( name owner, extended_asset value){
           cold_accounts_t to_acnts( _self, owner.value );
           auto to = to_acnts.find( value.contract.value );
           if( to == to_acnts.end() ) {
              to_acnts.emplace(_self, [&]( auto& a ){
                a.balance = value;
              });
           } else {
              to_acnts.modify( *to, eosio::same_payer, [&]( auto& a ) {
                a.balance += value;
              });
           }
      }*/

    VACCOUNTS_APPLY()
};
EOSIO_DISPATCH_SVC_TRX(CONTRACT_NAME(), (create)(convert)(withdraw)(regaccount))