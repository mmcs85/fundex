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
class Created extends Component {
    constructor(props) {
        super(props)
        let user = 'somerandacct'
        this.state = {
            user
        };

        this.agree = this.agree.bind(this)
        this.createAccount = this.createAccount.bind(this)
    }


    componentDidMount() {
    }

    agree() {
        this.setState({...this.state, agreed: !this.state.agreed})
    }

    createAccount() {
        // generated password = this.state.password
        console.log("wow")
    }


    render() {

        return (

            <div>
                <h2>One last thing..</h2>
                Your account was successfully created, you'll also need to save this username to access your account in the future.
                 <br /><br />
                <Input size='massive' type="text" transparent placeholder='Loading username' value={this.state.user} disabled={true} tabindex="-1" />
                <br /><br />
                <Link to='/dash'><Button size='large' color='olive' content="Understood, take me to my account" /></Link>

            
            </div>



        )
    }

}

export default Created;
