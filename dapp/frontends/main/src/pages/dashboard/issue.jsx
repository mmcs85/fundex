import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Nav from './nav'

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

    }


    componentDidMount() {
    }



    renderIssue() {
        return (
            <div>
                Use this form to issue a new Fund backed by a given quantity of assets.
                <br /><br />
                <Input label='Ticker' placeholder='Symbol...' />
                <br /><br />
                <Input label='Max Supply' placeholder='100000' />
                <br /><br />
                <hr />
                Enter the contract and amounts that will be used for this fund. You'll need to deposit these amounts before creation.
                <hr />
                <Form.Group widths='equal'>
                    <Form.Input fluid label='Contract' placeholder='eosio.token' />
                    <Form.Input fluid label='Amount' placeholder='10000.0000 EOS' />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid placeholder='btc.token' />
                    <Form.Input fluid placeholder='5000.0000 EBTC' />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid placeholder='' />
                    <Form.Input fluid placeholder='' />
                </Form.Group>
                <br />
                <Link to='/dash/success'><Button size='large' color='olive' content="Issue new fund." /></Link>

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
