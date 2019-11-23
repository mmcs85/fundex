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
class Success extends Component {
    constructor(props) {
        super(props)

    }


    componentDidMount() {
    }



    renderSuccess() {
        return (
                    <div>
                <h2>New Fund Created!</h2>
                Your new fund has been created. You can now exchange shares of this fund and redeem them for the underlying assets.
                <br /><br />
                <Link to='/dash'><Button size='large' content="Back to dashboard" /></Link>

            
            </div>   
        )
    }

    render() {
        return (
            <div>
                <Nav />
                {this.renderSuccess()}
            </div>
        )
    }

}

export default Success;
