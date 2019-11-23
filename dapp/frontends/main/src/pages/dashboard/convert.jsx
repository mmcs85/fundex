import React, { Component } from 'react';
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
class Convert extends Component {
    constructor(props) {
        super(props)
        this.state = {
            funds: [
                { key: 1, text: 'FUNDX', value: 1 },
                { key: 2, text: 'EOSFUND', value: 2 },
                { key: 3, text: 'FUND123', value: 3 },
            ]
        };


    }


    componentDidMount() {
    }


    callConvert() {
        // @ mario - make call to convert funds... (I will fill in variables)
    }

    renderConvert() {
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
