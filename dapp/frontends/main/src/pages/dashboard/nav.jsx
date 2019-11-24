import React, { Component } from 'react';
import { Link } from "react-router-dom";


import {
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
class Nav extends Component {



    render() {

        return (
            <div>
                <b>Account: {window.cfg.loggedInAccount}</b><br />

                <Menu pointing secondary style={{marginBottom:'1em'}}>
                    <Link to='/dash'><Menu.Item
                        name='My Funds'
                        active={window.location.pathname === '/dash'}
                    /></Link>
                    <Link to='/dash/convert'><Menu.Item
                        name='Convert'
                        active={window.location.pathname === '/dash/convert'}
                    /></Link>
                    <Link to='/dash/issue'><Menu.Item
                        name='Create Fund'
                        active={window.location.pathname === '/dash/issue'}
                    /></Link>
                    <Menu.Menu position='right'>
                        <Link to='/'><Menu.Item
                            name='logout'
                            active={window.location.pathname === '/'}
                        /></Link>
                    </Menu.Menu>
                </Menu>
            </div>
        )
    }

}

export default Nav;
