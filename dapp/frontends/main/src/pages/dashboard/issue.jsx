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
                <br />
                Use this form to create a new backed Fund.
                <br /><br />
                <Input label='Ticker' placeholder='Symbol...' />
                <br /><br />
                <Input label='Max Supply' placeholder='100000' />
                <br /><br />
                Optionally create a Market to trade against the fund
                <hr />
                <Form.Group widths='equal'>
                    <Form.Input fluid label='Name' placeholder='Name' />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid label='Contract' placeholder='xdummytokenx' />
                    <Form.Input fluid label='Amount' placeholder='500.0000 USDT' />
                    <Form.Input fluid label='Fee' placeholder='5' />
                </Form.Group>

                Enter the contract and amounts that will be used for this fund. You'll need to deposit these amounts before creation.
                <hr />
                <Form.Group widths='equal'>
                    <Form.Input fluid label='Contract' placeholder='xdummytokenx' />
                    <Form.Input fluid label='Amount' placeholder='1000.0000 EOS' />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid placeholder='xdummytokenx' />
                    <Form.Input fluid placeholder='5.0000 BTC' />
                </Form.Group>
                <Form.Group widths='equal'>
                    <Form.Input fluid placeholder='' />
                    <Form.Input fluid placeholder='' />
                </Form.Group>

                <Link to='/dash/success'><Button size='large' color='olive' content="Create new fund." /></Link>

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
