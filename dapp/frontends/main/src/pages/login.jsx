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
            showPassForm: false
        };

    }


    componentDidMount() {
    }

    renderLoginForm() {
        return (
            <Form>
                <Form.Field>
                    <label>Username</label>
                    <input placeholder='myuseracct' />
                </Form.Field>
                <Form.Field>
                    <label>Password</label>
                    <input type="password" placeholder='**********' />
                </Form.Field>
                <Link to='/dash'><Button type='submit'>Submit</Button></Link>
            </Form>
        )
    }



    render() {

        if(this.state.showPassForm) return this.renderLoginForm()

        return (

            <Grid columns={2} stackable textAlign='center'>
                <Divider vertical>Or</Divider>

                <Grid.Row verticalAlign='middle'>
                    <Grid.Column>
                        <Header icon>
                            <Icon name='user' />
                            User Login
          </Header>

                        <Button onClick={this.setState({...this.state,showPassForm:true})}>Enter Password</Button>

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
