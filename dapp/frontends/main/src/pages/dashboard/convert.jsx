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
    Search
} from 'semantic-ui-react'



// Index component
class Convert extends Component {
    constructor(props) {
        super(props)
        this.eosHelper = new EosHelper(window.eos);
        this.detfHelper = new DetfHelper(window.eos, window.dspClient);
        this.detfdexHelper = new DetfdexHelper(window.eos, window.dspClient);

        this.state = {
            funds: await this.getFunds()
        };

    }


    componentDidMount() {
    }

    async getFunds() {
        const funds = [
            { key: 1, symbol: 'RETF', text: 'Resources ETF',       value: 1 },
            { key: 2, symbol: 'SVETF', text: 'Store of Value ETF', value: 2 },
            { key: 3, symbol: 'SCETF', text: 'Stable coins ETF',   value: 3 },
        ];

        for(let fund of funds) {
            //fund.detail = await this.detfHelper.getDetfStat(window.cfg.detfContract, fund.symbol);
        }
        return funds;
    }

    async callConvert() {
        const userAccount = 'liquidmarios';
        const marketId = 1;
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

    renderConvert() {

        console.log("funds")
        console.log(this.state.funds)
        return (
            <div>

  <Menu compact>
    <Dropdown text='Select a fund' size='large' options={this.state.funds} simple item />
  </Menu>

            <br /><br />
                <Form.Field label='Quantity to trade' control='input' size='large' type='number' max={5000} />

            <br />
            <Button size='large' color='olive' content="Convert" />

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
