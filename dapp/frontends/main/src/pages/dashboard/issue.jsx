import React, { Component } from 'react';
import { Link } from 'react-router-dom'
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
class Issue extends Component {
    constructor(props) {
        super(props)
        this.eosHelper = new EosHelper(window.eos);
        this.detfHelper = new DetfHelper(window.eos, window.dspClient);
        this.detfdexHelper = new DetfdexHelper(window.eos, window.dspClient);

        this.state = {
            symbol: '',
            maxSupply: '',
            marketName: '',
            fee: '',
            BaseAmount: '',
            QuoteContract: '',
            QuoteAmount: '',
            Asset1Contract: '',
            Asset1Amount: '',
            Asset2Contract: '',
            Asset2Amount: '',
            Asset3Contract: '',
            Asset3Amount: ''
        };

        this.callCreateFund = this.callCreateFund.bind(this)
        this.onChange = this.onChange.bind(this)
    }


    componentDidMount() {
        this.setState({ ...this.state });
    }

    onChange = e => this.setState({ [e.target.name]: e.target.value })


    async callCreateFund(fromSymbol) {
        const newMarketId = Math.floor(Math.random*1000000)
        let basket_units = []

        if(this.state.Asset1Contract && this.state.Asset1Amount) {
            basket_units.push({
                contract: this.state.Asset1Contract,
                quantity: this.state.Asset1Amount
            })
        }

        if(this.state.Asset2Contract && this.state.Asset2Amount) {
            basket_units.push({
                contract: this.state.Asset2Contract,
                quantity: this.state.Asset2Amount
            })
        }

        if(this.state.Asset3Contract && this.state.Asset3Amount) {
            basket_units.push({
                contract: this.state.Asset3Contract,
                quantity: this.state.Asset3Amount
            })
        }

        const unitQuantity = `0.0001 ${this.state.symbol}`;

        await this.detfHelper.createDetf(window.cfg.detfContract, window.cfg.loggedInAccount, basket_units, `${this.state.maxSupply} ${this.state.symbol}`);
        await this.detfHelper.issueDetfBulk(window.cfg.detfContract, window.cfg.loggedInAccount, unitQuantity, this.state.symbol, 'get some shares');

        await this.eosHelper.transfer(window.cfg.detfContract, window.cfg.loggedInAccount, window.cfg.detfDexContract, unitQuantity, '', {
            actor: window.cfg.loggedInAccount,
            permission: 'active',
        });
        await this.eosHelper.transfer(window.cfg.tokensContract, window.cfg.loggedInAccount, window.cfg.detfDexContract, this.state.QuoteAmount, '', {
            actor: window.cfg.loggedInAccount,
            permission: 'active',
        });
        await this.detfdexHelper.createMarket(window.cfg.detfDexContract, this.state.QuoteAmount, newMarketId, this.state.fee, this.state.marketName, {
            contract: window.cfg.detfContract,
            quantity: unitQuantity
        }, {
            contract: this.state.QuoteContract,
            quantity: this.state.QuoteAmount
        })
    }

    renderIssue() {
        return (
            <div>
                <br />
                Use this form to create a new backed Fund.
                <br /><br />
                <Input name='symbol' onChange={this.onChange} label='Ticker' placeholder='Symbol...' value={this.state.symbol} />
                <br /><br />
                <Input name='maxSupply' onChange={this.onChange} label='Max Supply' placeholder='100000.0000' value={this.state.maxSupply} />
                <br /><br />
                Optionally create a Market to trade against the fund
                <hr />
                <Form.Group widths='equal'>
                    <Form.Input fluid name='marketName' onChange={this.onChange} label='Name' placeholder='Name' value={this.state.marketName} />
                    <Form.Input fluid name='BaseAmount' onChange={this.onChange} label='Base Amount' placeholder='500.0000' value={this.state.BaseAmount} />
                    <Form.Input fluid name='fee' onChange={this.onChange} label='Fee' placeholder='5' value={this.state.fee} />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid name='QuoteContract' onChange={this.onChange} label='Quote Contract' placeholder='xdummytokenx' value={this.state.QuoteContract} />
                    <Form.Input fluid name='QuoteAmount' onChange={this.onChange} label='Quote Amount' placeholder='500.0000 USDT' value={this.state.QuoteAmount} />                    
                </Form.Group>

                Enter the contract and amounts that will be used for this fund. You'll need to deposit these amounts before creation.
                <hr />
                <Form.Group widths='equal'>
                    <Form.Input fluid name='Asset1Contract' onChange={this.onChange} label='Contract' placeholder='xdummytokenx' value={this.state.Asset1Contract} />
                    <Form.Input fluid name='Asset1Amount' onChange={this.onChange} label='Amount' placeholder='1000.0000 EOS'  value={this.state.Asset1Amount} />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid name='Asset2Contract' onChange={this.onChange} placeholder='xdummytokenx' value={this.state.Asset2Contract} />
                    <Form.Input fluid name='Asset2Amount' onChange={this.onChange} placeholder='5.0000 BTC'   value={this.state.Asset2Amount} />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid name='Asset3Contract' onChange={this.onChange} placeholder='' value={this.state.Asset3Contract} />
                    <Form.Input fluid name='Asset3Amount' onChange={this.onChange} placeholder='' value={this.state.Asset3Amount} />
                </Form.Group>

                <Link to='/dash/success'><Button onClick={this.callCreateFund} size='large' color='olive' content="Create new fund." /></Link>
            </div>
        )
    }

    render() {
        return (
            <div>
                <Nav />
                {this.renderIssue()}
            </div>
        )
    }

}

export default Issue;
