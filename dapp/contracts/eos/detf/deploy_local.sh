#!/bin/bash

export DSP_ENDPOINT=http://localhost:13015/
export LOCAL_TEST_ACCOUNT=liquidwingse
export LOCAL_TEST_PUBLIC_KEY=EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
export PROVIDER=pprovider1
export PACKAGE_ID=package1

# create account
echo create account
cleos -u $DSP_ENDPOINT system newaccount eosio $LOCAL_TEST_ACCOUNT $LOCAL_TEST_PUBLIC_KEY $LOCAL_TEST_PUBLIC_KEY --stake-cpu "10.0000 SYS" --stake-net "10.0000 SYS" --buy-ram "200.0000 SYS"

# Set contract code and abi
echo Set contract code and abi
cleos -u $DSP_ENDPOINT set contract $LOCAL_TEST_ACCOUNT ../detf -p $LOCAL_TEST_ACCOUNT@active

# Set contract permissions
echo Set contract permissions
cleos -u $DSP_ENDPOINT set account permission $LOCAL_TEST_ACCOUNT active "{\"threshold\":1,\"keys\":[{\"weight\":1,\"key\":\"$LOCAL_TEST_PUBLIC_KEY\"}],\"accounts\":[{\"permission\":{\"actor\":\"$LOCAL_TEST_ACCOUNT\",\"permission\":\"eosio.code\"},\"weight\":1}]}" owner -p $LOCAL_TEST_ACCOUNT@active

# issue DAPP tokens
cleos -u $DSP_ENDPOINT push action dappservices issue "[\"$LOCAL_TEST_ACCOUNT\",\"10000.0000 DAPP\", \"get some tokens\"]" -p dappservices@active

# select your package: 
export SERVICE=ipfsservice1
cleos -u $DSP_ENDPOINT push action dappservices selectpkg "[\"$LOCAL_TEST_ACCOUNT\",\"$PROVIDER\",\"$SERVICE\",\"$PACKAGE_ID\"]" -p $LOCAL_TEST_ACCOUNT@active

# Stake your DAPP to the DSP that you selected the service package for:
cleos -u $DSP_ENDPOINT push action dappservices stake "[\"$LOCAL_TEST_ACCOUNT\",\"$PROVIDER\",\"$SERVICE\",\"10.0000 DAPP\"]" -p $LOCAL_TEST_ACCOUNT@active
