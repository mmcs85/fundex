import React, { Component } from 'react';


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
class Register extends Component {
    constructor(props) {
        super(props)
        let pass = [...Array(14)].map(i=>(~~(Math.random()*36)).toString(36)).join('')
        this.state = {
            agreed: false,
            pass
        };

        this.agree = this.agree.bind(this)
    }


    componentDidMount() {
    }

    agree() {
        this.setState({...this.state, agreed: !this.state.agreed})
    }


    render() {

        return (

            <div>
                <h2>Oh Yea! New Account.</h2>
                We've created a new fund management account for you with the following password, please store it somewhere safe.
                 <br /><br />
                <Input size='massive' type="text" placeholder='Generating password' value={this.state.pass} disabled={true} tabindex="-1" />
                <br /><br />
                <Checkbox onClick={this.agree} label={{ children: 'I have saved my password in a safe place.' }} />
                <br /><br />
                <Button size='large' disabled={!this.state.agreed} content="Let's Go" primary />

            
            </div>



        )
    }

}

export default Register;
