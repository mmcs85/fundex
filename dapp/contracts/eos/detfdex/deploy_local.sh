#!/bin/bash

export DSP_ENDPOINT=http://localhost:13015/
export LOCAL_TEST_ACCOUNT=liquidwingsx
export LOCAL_TEST_PUBLIC_KEY=EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
# Buy RAM:
echo Buy RAM
cleos -u $DSP_ENDPOINT system buyram $LOCAL_TEST_ACCOUNT $LOCAL_TEST_ACCOUNT "200.0000 SYS" -p $LOCAL_TEST_ACCOUNT@active
# Set contract code and abi
echo Set contract code and abi
cleos -u $DSP_ENDPOINT set contract $LOCAL_TEST_ACCOUNT ../detfdex -p $LOCAL_TEST_ACCOUNT@active

# Set contract permissions
echo Set contract permissions
cleos -u $DSP_ENDPOINT set account permission $LOCAL_TEST_ACCOUNT active "{\"threshold\":1,\"keys\":[{\"weight\":1,\"key\":\"$LOCAL_TEST_PUBLIC_KEY\"}],\"accounts\":[{\"permission\":{\"actor\":\"$LOCAL_TEST_ACCOUNT\",\"permission\":\"eosio.code\"},\"weight\":1}]}" owner -p $LOCAL_TEST_ACCOUNT@active