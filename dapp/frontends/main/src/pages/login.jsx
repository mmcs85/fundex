import React, { Component } from 'react';
import { Link } from "react-router-dom";


import {
    Button,
    Container,
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
class Login extends Component {
    constructor(props) {
        super(props)
        this.state = {

        };

    }


    componentDidMount() {
    }

  


    render() {

        return (

            <Grid columns={2} stackable textAlign='center'>
                <Divider vertical>Or</Divider>

                <Grid.Row verticalAlign='middle'>
                    <Grid.Column>
                        <Header icon>
                            <Icon name='user' />
                            User Login
          </Header>

                        <Button>Enter Password</Button>

                    </Grid.Column>

                    <Grid.Column>
                        <Header icon>
                            <Icon name='world' />
                            Login with Scatter
          </Header>
                        <Button primary>Link Scatter</Button>
                    </Grid.Column>
                </Grid.Row>
            </Grid>



        )
    }

}

export default Login;
