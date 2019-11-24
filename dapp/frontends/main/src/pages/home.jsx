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

            <div style={{
    alignAtems: 'center',
    justifyContent: 'center'}}>
    <center>

                            <h1>Funds YOU Control!</h1>
                With <b>FundEX</b>, you can issue & trade funds based on a basket of crypto assets. <b>All decentralized. Always Liquid.</b>
                
                <br /><br /><br />
                
                <img src="/images/rocket.gif" style={{maxWidth:'80%', margin:'-4em'}}/>

                <br /><br /><br />

                <Link to='/login'><Button size='large' content="Login" /></Link>
                <Link to='/go'><Button size='large' primary content="Create Account" /></Link>

                <br /><br />

                </center>
                </div>


        )
    }

}

export default Home;
