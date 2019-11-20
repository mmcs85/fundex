#include "../dappservices/multi_index.hpp"

#define DAPPSERVICES_ACTIONS() \
  XSIGNAL_DAPPSERVICE_ACTION \
  IPFS_DAPPSERVICE_ACTIONS
#define DAPPSERVICE_ACTIONS_COMMANDS() \
  IPFS_SVC_COMMANDS()
#define CONTRACT_NAME() detf
using std::string;

CONTRACT_START()

      TABLE deposit
      {
        name account;
        std::map<std::pair<uint64_t, uint64_t>, extended_asset> assetmap;

        uint64_t primary_key() const { return account.value; }
      };

      TABLE account {
        asset    balance;
        uint64_t primary_key()const { return balance.symbol.code().raw(); }
      };

      TABLE etf_stats {
         std::vector<extended_asset> basket_units;
         asset    supply;
         asset    max_supply;
         name     issuer;

         uint64_t primary_key()const { return supply.symbol.code().raw(); }
      };

      typedef eosio::multi_index< "deposits"_n, deposit > deposits;
      typedef eosio::multi_index< "accounts"_n, account > accounts;
      typedef eosio::multi_index< "stat"_n, etf_stats > stats;

      [[eosio::action]] void create(const name& issuer, std::vector<extended_asset> basket_units, const asset&  maximum_supply) 
      {
        require_auth( issuer );

        auto sym = maximum_supply.symbol;
        check( sym.is_valid(), "invalid symbol name" );
        check( maximum_supply.is_valid(), "invalid supply");
        check( maximum_supply.amount > 0, "max-supply must be positive");

        stats statstable( get_self(), sym.code().raw() );
        auto existing = statstable.find( sym.code().raw() );
        check( existing == statstable.end(), "token with symbol already exists" );

        statstable.emplace(issuer, [&]( auto& s ) {
            s.basket_units = basket_units;
            s.supply.symbol = maximum_supply.symbol;
            s.max_supply    = maximum_supply;
            s.issuer        = issuer;
        });
     }

     [[eosio::action]] void issue( const name& to, const asset& quantity, const string& memo )
     {
        auto sym = quantity.symbol;
        check( sym.is_valid(), "invalid symbol name" );
        check( memo.size() <= 256, "memo has more than 256 bytes" );

        stats statstable( get_self(), sym.code().raw() );
        auto existing = statstable.find( sym.code().raw() );
        check( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
        const auto& st = *existing;

        require_auth( to );

        check( quantity.is_valid(), "invalid quantity" );
        check( quantity.amount > 0, "must issue positive quantity" );

        check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
        check( quantity.amount <= st.max_supply.amount - st.supply.amount, "quantity exceeds available supply");

        deposits deposittable(_self, _self.value);
        auto deposit_itr = deposittable.find(to.value);

        check(deposit_itr != deposittable.end(), "A deposit must exist");

        auto deposit = *deposit_itr;

        for ( auto const& unit: st.basket_units ) {
            const auto& unit_key = std::pair<uint64_t, uint64_t>(unit.contract.value, unit.quantity.symbol.code().raw());
            const auto& deposit_asset_itr = deposit.assetmap.find(unit_key);

            check(deposit_asset_itr != deposit.assetmap.end(), "required a deposit of the etf underlying assets");

            auto& deposit_asset = deposit_asset_itr->second;
            auto asset_amount = deposit_asset.quantity.amount;
            auto units_amount = unit.quantity.amount * quantity.amount;

            check(asset_amount >= units_amount, "not enough funds for required ");

            if(asset_amount == units_amount) {
                deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                    deposit.assetmap.erase(deposit_asset_itr);
                });
            } else {
                deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                    deposit.assetmap[unit_key].quantity.amount -= units_amount;
                });
            }
        }

        statstable.modify( st, same_payer, [&]( auto& s ) {
           s.supply += quantity;
        });

        add_balance( to, quantity, to );
      }

      [[eosio::action]] void redeem( const asset& quantity, const string& memo ) 
      {
        auto sym = quantity.symbol;
        check( sym.is_valid(), "invalid symbol name" );
        check( memo.size() <= 256, "memo has more than 256 bytes" );

        stats statstable( get_self(), sym.code().raw() );
        auto existing = statstable.find( sym.code().raw() );
        check( existing != statstable.end(), "token with symbol does not exist" );
        const auto& st = *existing;

        require_auth( st.issuer );
        check( quantity.is_valid(), "invalid quantity" );
        check( quantity.amount > 0, "must retire positive quantity" );

        check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );

        statstable.modify( st, same_payer, [&]( auto& s ) {
        s.supply -= quantity;
        });

        sub_balance( st.issuer, quantity );
      }

      [[eosio::action]] void transfer( const name&    from,
                        const name&    to,
                        const asset&   quantity,
                        const string&  memo )
      {
        check( from != to, "cannot transfer to self" );
        require_auth( from );
        check( is_account( to ), "to account does not exist");

        // handle two use cases
        // 1 - normal etf token transfers
        // 2 - deposits of tokens to issue etf token

        if(get_first_receiver() == get_self()) {
            auto sym = quantity.symbol.code();
            stats statstable( get_self(), sym.raw() );
            const auto& st = statstable.get( sym.raw() );

            require_recipient( from );
            require_recipient( to );

            check( quantity.is_valid(), "invalid quantity" );
            check( quantity.amount > 0, "must transfer positive quantity" );
            check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
            check( memo.size() <= 256, "memo has more than 256 bytes" );

            auto payer = has_auth( to ) ? to : from;

            sub_balance( from, quantity );
            add_balance( to, quantity, payer );
        } else {
            /*for(auto& unit : basket_units ) {
                auto& unit_key = std::pair<uint64_t, uint64_t>(unit.contract.value, unit.quantity.symbol.code().raw());
                s.basket_units[unit_key] = unit;
            }*/
        }
      }

/*
      TABLE account {
         extended_asset balance;
         uint64_t primary_key()const { return balance.contract.value; }
      };

      typedef dapp::multi_index<"vaccounts"_n, account> cold_accounts_t;
      typedef eosio::multi_index<".vaccounts"_n, account> cold_accounts_t_v_abi;
      TABLE shardbucket {
          std::vector<char> shard_uri;
          uint64_t shard;
          uint64_t primary_key() const { return shard; }
      };
      typedef eosio::multi_index<"vaccounts"_n, shardbucket> cold_accounts_t_abi;


     [[eosio::action]] void withdraw( name to, name token_contract){

            require_auth( to );
            require_recipient( to );
            auto received = sub_all_cold_balance(to, token_contract);
            action(permission_level{_self, "active"_n}, token_contract, "transfer"_n,
               std::make_tuple(_self, to, received, std::string("withdraw")))
            .send();
      }

     void transfer( name from,
                     name to,
                     asset        quantity,
                     string       memo ){
        require_auth(from);
        if(to != _self || from == _self || from == "eosio"_n || from == "eosio.stake"_n || from == to)
            return;
        if(memo == "seed transfer")
            return;
        if (memo.size() > 0){
          name to_act = name(memo.c_str());
          eosio::check(is_account(to_act), "The account name supplied is not valid");
          require_recipient(to_act);
          from = to_act;
        }
        extended_asset received(quantity, get_first_receiver());
        add_cold_balance(from, received);
     }
*/
   private:

    void sub_balance( const name& owner, const asset& value ) {
        accounts from_acnts( get_self(), owner.value );

        const auto& from = from_acnts.get( value.symbol.code().raw(), "no balance object found" );
        check( from.balance.amount >= value.amount, "overdrawn balance" );

        from_acnts.modify( from, owner, [&]( auto& a ) {
                a.balance -= value;
            });
    }

    void add_balance( const name& owner, const asset& value, const name& ram_payer )
    {
        accounts to_acnts( get_self(), owner.value );
        auto to = to_acnts.find( value.symbol.code().raw() );
        if( to == to_acnts.end() ) {
            to_acnts.emplace( ram_payer, [&]( auto& a ){
                a.balance = value;
            });
        } else {
            to_acnts.modify( to, same_payer, [&]( auto& a ) {
                a.balance += value;
            });
        }
    }
};
EOSIO_DISPATCH_SVC_TRX(CONTRACT_NAME(), (create)(issue)(redeem)(transfer))