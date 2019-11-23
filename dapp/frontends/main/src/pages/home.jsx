import React, { Component } from 'react';
import { Link } from "react-router-dom";


import {
    Button,
    Container,
    Divider,
    Grid,
    Header,
    Icon,
    Image,
    List,
    Menu,
    Responsive,
    Segment,
    Sidebar,
    Visibility,
    Form,
    Message,
    Search
} from 'semantic-ui-react'



// Index component
class Home extends Component {
    constructor(props) {
        super(props)
        this.state = {
        };
    }


    componentDidMount() {
    }


    render() {

        return (

            <div>
                            <h1>Funds you Control</h1>
                With liquidwings, you can generate funds based on any basket of assets. All decentralized. Always Liquid.
                
                <br />
                
                <img src="/images/funds.png" style={{maxWidth:'80%'}}/>
                </div>


        )
    }

}

export default Home;
