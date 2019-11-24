import React, { Component } from 'react';
import Nav from './nav'
import EosHelper from './../../eosHelper'
import DetfHelper from './../../detfHelper'
import DetfdexHelper from './../../detfdexHelper'

import {
    Button,
    Container,
    Comment,
    Divider,
    Grid,
    Header,
    Icon,
    Input,
    Image,
    List,
    Menu,
    Responsive,
    Segment,
    Sidebar,
    Visibility,
    Form,
    Message,
    Checkbox,
    Search
} from 'semantic-ui-react'



// Index component
class Dashboard extends Component {
    constructor(props) {
        super(props)
        this.eosHelper = new EosHelper(window.eos);
        this.detfHelper = new DetfHelper(window.eos, window.dspClient);
        this.detfdexHelper = new DetfdexHelper(window.eos, window.dspClient);
        this.getFunds = this.getFunds.bind(this)
        this.getMarkets = this.getMarkets.bind(this)

        this.state = {
            funds: []
        }
    }


    async componentDidMount() {
        let funds = await this.getFunds()
        let markets = await this.getMarkets()
        this.setState({ ...this.state, funds, markets })
    }

    async getFunds() {
        const userAccount = 'liquidmarios';

        let eosTokenBalances;
        try {
            eosTokenBalances = [...await this.eosHelper.getBalances(window.cfg.tokensContract, userAccount)];
        } catch(e) {

        }

        const fundsBalances = [];
        for(let etf of window.cfg.etfs) {
            try {
                const balance = await this.detfHelper.getVRamBalance(window.cfg.detfContract, userAccount, etf);
                console.log(balance)
                fundsBalances.push(balance.row);
            } catch(e) {

            } 
        }
        const balances = [...eosTokenBalances, ...fundsBalances];

        console.log("balances")
        console.log(balances)
        return balances;
    }

    async getMarkets() {
        const markets = [
            (await this.detfdexHelper.getMarket(window.cfg.detfDexContract, 1)).row,
            (await this.detfdexHelper.getMarket(window.cfg.detfDexContract, 2)).row,
            (await this.detfdexHelper.getMarket(window.cfg.detfDexContract, 3)).row,
        ];
        console.log('markets')
        console.log(markets)
        return markets;
    }

    renderFunds() {
        return (
                <Comment.Group size='large'>


      <Comment>
        <Comment.Avatar as='a' src='images/coin.jpg' />
        <Comment.Content>
          <Comment.Author as='a'>FUNDX</Comment.Author>
          <Comment.Metadata>
            <span>100 tokens</span>
          </Comment.Metadata>
          <Comment.Text><i>Holdings:</i> Bitcoin, Ethereum, XRP</Comment.Text>
          <Comment.Actions>
            <a>Buy</a> <a>Sell</a>
          </Comment.Actions>
        </Comment.Content>
      </Comment>
      <Comment>
        <Comment.Avatar as='a' src='images/coin.jpg' />
        <Comment.Content>
          <Comment.Author as='a'>EOSFUND</Comment.Author>
          <Comment.Metadata>
            <span>50 tokens</span>
          </Comment.Metadata>
          <Comment.Text><i>Holdings:</i> EOS, PEOS, DAPP</Comment.Text>
          <Comment.Actions>
            <a>Buy</a> <a>Sell</a>
          </Comment.Actions>
        </Comment.Content>
      </Comment>
    </Comment.Group>
        )
    }

    render() {
        return (
            <div>
            <Nav />
            {this.renderFunds()}
            </div>
        )
    }

}

export default Dashboard;
