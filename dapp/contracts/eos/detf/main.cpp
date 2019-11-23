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
        name contract;
        std::map<uint64_t, asset> assetmap;

        uint64_t primary_key() const { return contract.value; }
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

      TABLE shardbucket {
          std::vector<char> shard_uri;
          uint64_t shard;
          uint64_t primary_key() const { return shard; }
      };

      typedef eosio::multi_index<"deposits"_n, deposit> deposits;

      typedef dapp::multi_index<"accounts"_n, account> accounts;
      typedef eosio::multi_index<".accounts"_n, account> accounts_v_abi;
      typedef eosio::multi_index<"accounts"_n, shardbucket> accounts_abi;

      typedef eosio::multi_index<"stat"_n, etf_stats> stats;

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
            s.basket_units  = basket_units;
            s.supply.symbol = maximum_supply.symbol;
            s.max_supply    = maximum_supply;
            s.issuer        = issuer;
        });
     }

     [[eosio::action]] void issue( const name& account, const asset& quantity, const string& memo )
     {
        auto sym = quantity.symbol;
        
        check( sym.is_valid(), "invalid symbol name" );
        check( memo.size() <= 256, "memo has more than 256 bytes" );

        auto sym_code_raw = sym.code().raw();
        stats statstable( _self, sym_code_raw );
        auto existing = statstable.find( sym_code_raw );
        check( existing != statstable.end(), "token with symbol does not exist, create token before issue" );
        const auto& st = *existing;

        require_auth( account );

        check( quantity.is_valid(), "invalid quantity" );
        check( quantity.amount > 0, "must issue positive quantity" );

        check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );
        check( quantity.amount <= st.max_supply.amount - st.supply.amount, "quantity exceeds available supply");

        deposits deposittable(_self, account.value);

        for ( auto const& unit: st.basket_units ) {
            auto deposit_itr = deposittable.find(unit.contract.value);
            auto unit_symcode_raw = unit.quantity.symbol.code().raw();
            const auto& deposit_asset_itr = deposit_itr->assetmap.find(unit_symcode_raw);

            check(deposit_asset_itr != deposit_itr->assetmap.end(), "required a deposit of the asset");

            auto& deposit_asset = deposit_asset_itr->second;
            auto asset_amount = deposit_asset.amount;
            auto amt_amount = unit.quantity.amount * quantity.amount;

            check(asset_amount >= amt_amount, "not enough funds for this asset");

            if(asset_amount == amt_amount) {
                deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                    d.assetmap.erase(unit_symcode_raw);
                });
            } else {
                deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                    d.assetmap[unit_symcode_raw].amount -= amt_amount;
                });
            }
        }

        statstable.modify( st, same_payer, [&]( auto& s ) {
           s.supply += quantity;
        });

        add_balance( account, quantity, account );
      }

      [[eosio::action]] void redeem(const name& account, const asset& quantity, const string& memo )
      {
        auto sym = quantity.symbol;
        check( sym.is_valid(), "invalid symbol name" );
        check( memo.size() <= 256, "memo has more than 256 bytes" );

        stats statstable( get_self(), sym.code().raw() );
        auto existing = statstable.find( sym.code().raw() );
        check( existing != statstable.end(), "token with symbol does not exist" );
        const auto& st = *existing;

        require_auth( account );

        check( quantity.is_valid(), "invalid quantity" );
        check( quantity.amount > 0, "must retire positive quantity" );
        check( quantity.symbol == st.supply.symbol, "symbol precision mismatch" );

        statstable.modify( st, same_payer, [&]( auto& s ) {
            s.supply -= quantity;
        });

        sub_balance( account, quantity );

        for ( auto const& unit: st.basket_units ) {
            auto units_amount = unit.quantity.amount * quantity.amount;

            eosio::action(permission_level(_self, name("active")),
                  unit.contract, name("transfer"),
                  std::make_tuple(_self, account, units_amount, "withdraw asset action"))
            .send();
        }
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

        if(_first_receiver == _self) {
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
            if (from == _self ||
                to != _self ||
                (_first_receiver == name("eosio.token") &&
                (from == name("eosio.stake") ||
                from == name("eosio.ram"))))
            {
                return;
            }

            deposits deposittable(_self, from.value);
            auto new_deposit_asset = extended_asset(quantity, _first_receiver);
            add_deposit_asset(deposittable, from, new_deposit_asset);
        }
    }

    [[eosio::action]] void withdraw(name account, extended_asset amount)
    {
        require_auth(account);

        deposits deposittable(_self, account.value);

        check( amount.quantity.symbol.is_valid(), "invalid symbol name" );
        check( amount.quantity.amount > 0, "must be a positive quantity" );

        sub_deposit_asset(deposittable, account, amount);

        eosio::action(permission_level(_self, name("active")),
                amount.contract, name("transfer"),
                std::make_tuple(_self, account, amount.quantity.amount, "withdraw asset action"))
        .send();

        // } else {
        //     for ( auto const& asset: deposit.assetmap ) {
        //         eosio::action(permission_level(_self, name("active")),
        //                 asset.second.contract, name("transfer"),
        //                 std::make_tuple(_self, account, asset.second.quantity.amount, "withdraw asset action"))
        //         .send();
        //     }

        //     deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
        //         d.assetmap.clear();
        //     });
        // }
    }

   private:
    
    template<typename T>
    void sub_deposit_asset(T& deposittable, name account, const extended_asset& amt) 
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
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap.erase(deposit_asset_itr);
            });
        } else {
            deposittable.modify(deposit_itr, eosio::same_payer, [&](auto &d) {
                d.assetmap[asset_symcode_raw].amount -= amt_amount;
            });
        }
    }

    template<typename T>
    void add_deposit_asset(T& deposittable, name account, const extended_asset& amt) {
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
EOSIO_DISPATCH_SVC_TRX(CONTRACT_NAME(), (create)(issue)(redeem)(transfer)(withdraw))