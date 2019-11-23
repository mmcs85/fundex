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


            <Menu pointing secondary>
                <Link to='/dash'><Menu.Item
                    name='My Funds'
                    active={window.location.pathname === '/dash'}
                /></Link>
                <Link to='/dash/convert'><Menu.Item
                    name='Convert'
                    active={window.location.pathname === '/dash/convert'}
                /></Link>
                <Link to='/dash/issue'><Menu.Item
                    name='Issue'
                    active={window.location.pathname === '/dash/issue'}
                /></Link>
                <Menu.Menu position='right'>
                    <Link to='#'><Menu.Item
                        name='logout'
                        active={'activeItem' === 'logout'}
                    /></Link>
                </Menu.Menu>
            </Menu>



        )
    }

}

export default Nav;
