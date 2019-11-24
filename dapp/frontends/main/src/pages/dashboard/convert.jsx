import React, { Component } from 'react';
import Nav from './nav'
import EosHelper from './../../eosHelper'
import DetfdexHelper from './../../detfdexHelper'
import DetfHelper from './../../detfHelper'

import {
    Dropdown,
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
    Table
} from 'semantic-ui-react'



// Index component
class Convert extends Component {
    constructor(props) {
        super(props)
        this.eosHelper = new EosHelper(window.eos);
        this.detfHelper = new DetfHelper(window.eos, window.dspClient);
        this.detfdexHelper = new DetfdexHelper(window.eos, window.dspClient);

        this.state = {
            markets: [],
            marketSelected: 1,
            marketBaseBalanceSelected: '',
            marketQuoteBalanceSelected: '',
            tradeAmt: 100
        };

        this.selectNewMarket = this.selectNewMarket.bind(this)
        this.buy = this.buy.bind(this)
        this.sell = this.sell.bind(this)
        this.callConvert = this.callConvert.bind(this)
    }

    async componentDidMount() {
        let tokenBalances = window.cfg.tokenBalances;
        let fundBalances = window.cfg.fundBalances;
        let markets = window.cfg.markets;
        this.setState({ ...this.state, markets, tokenBalances, fundBalances });
    }

    async buy() {
        let marketSelected = this.state.markets[this.state.marketSelected - 1];
        await this.callConvert(marketSelected.quoteSymbol);
    }

    async sell() {
        let marketSelected = this.state.markets[this.state.marketSelected - 1];
        await this.callConvert(marketSelected.baseSymbol);
    }

    async callConvert(fromSymbol) {
        const marketId = this.state.marketSelected;
        const marketSelected = this.state.markets[this.state.marketSelected - 1];
        const quantity = `${this.state.tradeAmt} ${fromSymbol}`;
        const transferMemo = '';
        const isTransfer = true;

        await this.eosHelper.transfer(window.cfg.detfContract, window.cfg.loggedInAccount, window.cfg.detfDexContract, quantity, transferMemo, {
            actor: window.cfg.loggedInAccount,
            permission: 'active',
        });

        await this.detfdexHelper.convert(window.cfg.detfDexContract, window.cfg.loggedInAccount, marketId, {
            contract: window.cfg.detfContract,
            quantity
        }, isTransfer);
    }

    selectNewMarket(e, d) {
        console.log(d)
        this.setState({ ...this.state, marketSelected: d.value })
    }

    renderConvert() {
        console.log("markets")
        console.log(this.state.markets)
        let marketSelected = this.state.markets[this.state.marketSelected - 1]
        let fundBreakdown = 'Loading..'
        if (marketSelected) {
            let { basket_units } = marketSelected.detail
            fundBreakdown = basket_units.map((item) => {
                return item.quantity + "\n";
            });
            const baseBalance = this.state.fundBalances.find((b) => b.balance.includes(marketSelected.baseSymbol))
            const quoteBalance = this.state.tokenBalances.find((b) => b.balance.includes(marketSelected.quoteSymbol))

            this.state.marketBaseBalanceSelected = baseBalance ? baseBalance.balance : ''
            this.state.marketQuoteBalanceSelected = quoteBalance ? quoteBalance.balance : ''
        }

        return (
            <div>

                <b>Choose a ETF market</b><br />
                <Menu compact>
                    <Dropdown closeOnChange={true} value={this.state.marketSelected} onChange={this.selectNewMarket} label='Select a ETF market' size='large' options={this.state.markets} simple item />
                </Menu>

                <Table basic='very'>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Base Balance</Table.Cell>
                            <Table.Cell>{marketSelected ? this.state.marketBaseBalanceSelected : 'Loading..'}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Quote Balance</Table.Cell>
                            <Table.Cell>{marketSelected ? this.state.marketQuoteBalanceSelected : 'Loading..'}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Total Supply</Table.Cell>
                            <Table.Cell>{marketSelected ? marketSelected.detail.max_supply : 'Loading..'}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Holdings</Table.Cell>
                            <Table.Cell>{marketSelected ? fundBreakdown : 'Loading..'}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>

                <br />
                <Form.Field label='Quantity to trade' value={this.state.tradeAmt} onChange={(e) => { this.setState({ ...this.state, tradeAmt: e.target.value }) }}
                    control='input' size='large' type='number' min={0.0001} max={5000} />

                <br />
                <Button onClick={this.buy} disabled={Boolean(this.state.tradeAmt <= 0)} size='large' color='olive' content="Buy" />
                <Button onClick={this.sell} disabled={Boolean(this.state.tradeAmt <= 0)} size='large' color='olive' content="Sell" />

            </div>
        )
    }

    render() {
        return (
            <div>
                <Nav />
                {this.renderConvert()}
            </div>
        )
    }

}

export default Convert;
