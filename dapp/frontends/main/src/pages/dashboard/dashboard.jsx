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

        this.state = {
            fundBalances: [],
            etfs: []
        }

        this.renderFundsList = this.renderFundsList.bind(this)
    }


    async componentDidMount() {
        let fundBalances = window.cfg.fundBalances
        let etfs = window.cfg.etfs;

        //TODO filter markets by balances to show Fund balances and market detail
        console.log("fundBalances")
        console.log(fundBalances)
        console.log("etfs")
        console.log(etfs)


        this.setState({ ...this.state, fundBalances, etfs })
    }

    renderFundsList() {

        let fundsList = []
        let j=0

        if(this.state.fundBalances == []) return (<div>No Funds yet..</div>)
        for(const fb of this.state.fundBalances)
        {

            let bal = fb.balance.split(" ")
            // get corresponding etf...
            let etf = this.state.etfs.find(obj => obj.symbol == bal[1])

            console.log("the etf")
            console.log(etf)

            let { basket_units } = etf.detail
            let fundBreakdown = basket_units.map((item) => {
                return item.quantity + "\n";
            });

            fundsList.push (
                <Comment key={++j}>
                    <Comment.Avatar as='a' src='images/coin.jpg' />
                    <Comment.Content>
                        <Comment.Author as='a'>{bal[1]}</Comment.Author>
                        <Comment.Metadata>
                            <span>{bal[0]} tokens</span>
                        </Comment.Metadata>
                        <Comment.Text>{etf.text}</Comment.Text>
                        <Comment.Text><b>Holdings:</b> {fundBreakdown}</Comment.Text>
                        <Comment.Actions>
                            <a>Buy</a> <a>Sell</a> <a>Issue</a> <a>Redeem</a>
                        </Comment.Actions>
                    </Comment.Content>
                </Comment>
            )
        }

        return fundsList
    }

    renderFunds() {
        return (
            <Comment.Group size='large'>

                {this.renderFundsList()}

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
