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
            funds: [],
            fundSelected: 1,
            tradeAmt: 100
        };

        this.selectNewFund = this.selectNewFund.bind(this)

    }


    async componentDidMount() {

        let funds = await this.getFunds()
        this.setState({ ...this.state, funds })
    }

    async getFunds() {
        const funds = [
            { key: 1, symbol: 'RETF', text: 'Resources ETF', value: 1 },
            { key: 2, symbol: 'SVETF', text: 'Store of Value ETF', value: 2 },
            { key: 3, symbol: 'SCETF', text: 'Stable coins ETF', value: 3 },
        ];

        for (let fund of funds) {
            fund.detail = await this.detfHelper.getDetfStat(window.cfg.detfContract, fund.symbol);
        }
        return funds;
    }

    async callConvert() {
        const userAccount = 'liquidmarios';
        const marketId = this.state.fundSelected;
        const quantity = '0.0001 RETF';
        const transferMemo = '';
        const isTransfer = true;

        await this.eosHelper.transfer(window.cfg.detfContract, userAccount, window.cfg.detfDexContract, quantity, transferMemo, {
            actor: userAccount,
            permission: 'active',
        });

        await this.detfdexHelper.convert(window.cfg.detfDexContract, userAccount, marketId, {
            contract: window.cfg.detfContract,
            quantity
        }, isTransfer);
    }

    selectNewFund(e, d) {
        console.log(d)
        this.setState({ ...this.state, fundSelected: d.value })
    }

    renderConvert() {

        console.log("funds")
        console.log(this.state.funds)
        let fundSelected = this.state.funds[this.state.fundSelected - 1]
        let fundBreakdown = 'Loading..'
        if (fundSelected) {
            let { basket_units } = fundSelected.detail
            fundBreakdown = basket_units.map((item) => {
                return item.quantity + "\n";
            });
        }

        return (
            <div>

                <b>Choose a fund</b><br />
                <Menu compact>
                    <Dropdown closeOnChange={true} value={this.state.fundSelected} onChange={this.selectNewFund} label='Select a fund' size='large' options={this.state.funds} simple item />
                </Menu>

                <Table basic='very'>

                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>Your Balance</Table.Cell>
                            <Table.Cell>{fundSelected ? fundSelected.detail.supply : 'Loading..'}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Total Supply</Table.Cell>
                            <Table.Cell>{fundSelected ? fundSelected.detail.max_supply : 'Loading..'}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Holdings</Table.Cell>
                            <Table.Cell>{fundSelected ? fundBreakdown : 'Loading..'}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>

                <br />
                <Form.Field label='Quantity to trade' value={this.state.tradeAmt} onChange={(e) => { this.setState({ ...this.state, tradeAmt: e.target.value }) }}
                    control='input' size='large' type='number' min={0.0001} max={5000} />

                <br />
                <Button disabled={Boolean(this.state.tradeAmt <= 0)} size='large' color='olive' content="Convert" />

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
