import React, { Component } from 'react';
import { HashRouter, Route, Link } from "react-router-dom";

// pages
import home from './home'
import register from './register'
import created from './created'
import login from './login'
import dash from './dashboard/dashboard'
import convert from './dashboard/convert'
import issue from './dashboard/issue'
import success from './dashboard/success'

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
                <a href="/">
                    <img src="/images/logo.png" style={{maxWidth: '250px', marginLeft:'1em'}} />
                </a>
                
                <Grid textAlign='center' style={{ height: '90vh' }} verticalAlign='middle'>
                    <Grid.Column style={{ maxWidth: 500 }}>

                        <Form size='large'>
                            <Segment padded stacked style={{textAlign:'left'}}>

                                <HashRouter>
                                    <Route exact path='/' component={home}/>
                                    <Route exact path='/go' component={register}/>
                                    <Route exact path='/created' component={created}/>
                                    <Route exact path='/login' component={login}/>
                                    <Route exact path='/dash' component={dash}/>
                                    <Route exact path='/dash/convert' component={convert}/>
                                    <Route exact path='/dash/issue' component={issue}/>
                                    <Route exact path='/dash/success' component={success}/>
                                </HashRouter>
                            </Segment>
                            <br />

                            <div className="foot">
                                <a href="#/">Home</a> | <a href="#/go">Register</a> | <a href="#/login">Login</a>
                            </div>
                            
                        </Form>
                    </Grid.Column>
                </Grid>
            </div>

        )
    }

}

export default Index;
