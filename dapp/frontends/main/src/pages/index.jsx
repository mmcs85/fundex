import React, { Component } from 'react';
import { BrowserRouter, Route, Link } from "react-router-dom";

// pages
import home from './home'
import register from './register'
import login from './login'

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
class Index extends Component {
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
                <img src="/images/logo.png" style={{maxWidth: '200px', marginLeft:'1em'}} />

                <Grid textAlign='center' style={{ height: '90vh' }} verticalAlign='middle'>
                    <Grid.Column style={{ maxWidth: 500 }}>

                        <Form size='large'>
                            <Segment padded stacked>

                                <BrowserRouter>
                                    <Route exact path='/' component={home}/>
                                    <Route exact path='/go' component={register}/>
                                    <Route exact path='/login' component={login}/>
                                </BrowserRouter>
                            </Segment>
                            <br />

                            <div className="foot">
                                <a href="/">Home</a> | <a href="/go">Register</a> | <a href="/login">Login</a>
                            </div>
                            
                        </Form>
                    </Grid.Column>
                </Grid>
            </div>

        )
    }

}

export default Index;
