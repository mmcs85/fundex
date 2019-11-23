import React, { Component } from 'react';
import Nav from './nav'

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
class Dashboard extends Component {
    constructor(props) {
        super(props)
    }


    componentDidMount() {
    }


    renderFunds() {
        return (
                <Comment.Group size='large'>


      <Comment>
        <Comment.Avatar as='a' src='images/coin.jpg' />
        <Comment.Content>
          <Comment.Author as='a'>FUNDX</Comment.Author>
          <Comment.Metadata>
            <span>100 tokens</span>
          </Comment.Metadata>
          <Comment.Text><i>Holdings:</i> Bitcoin, Ethereum, XRP</Comment.Text>
          <Comment.Actions>
            <a>Buy</a> <a>Sell</a>
          </Comment.Actions>
        </Comment.Content>
      </Comment>
      <Comment>
        <Comment.Avatar as='a' src='images/coin.jpg' />
        <Comment.Content>
          <Comment.Author as='a'>EOSFUND</Comment.Author>
          <Comment.Metadata>
            <span>50 tokens</span>
          </Comment.Metadata>
          <Comment.Text><i>Holdings:</i> EOS, PEOS, DAPP</Comment.Text>
          <Comment.Actions>
            <a>Buy</a> <a>Sell</a>
          </Comment.Actions>
        </Comment.Content>
      </Comment>
    </Comment.Group>
        )
    }

    render() {
        return (
            <div>
            <Nav />
            {this.renderFunds()}
            </div>
        )
    }

}

export default Dashboard;
