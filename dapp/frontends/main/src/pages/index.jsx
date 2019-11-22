import React, { Component } from 'react';


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


                <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                    <Grid.Column style={{ maxWidth: 500 }}>
                        <Header as='h2' style={{ color: 'white' }} textAlign='center'>
                            Logo Here
      </Header>
                        <Form size='large'>
                            <Segment stacked>

                                <Grid columns={2} stackable textAlign='center'>
                                    <Divider vertical>Or</Divider>

                                    <Grid.Row verticalAlign='middle'>
                                        <Grid.Column>
                                            <Header icon>
                                                <Icon name='search' />
                                                Browse ETFs
          </Header>

                                            <Search placeholder='Enter ETF ticker...' />
                                        </Grid.Column>

                                        <Grid.Column>
                                            <Header icon>
                                                <Icon name='user' />
                                                Create an account
          </Header>
                                            <Button primary>Sign up</Button>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>


                            </Segment>
                            <br />
                            &copy; 2019, Liquidwings
                        </Form>
                    </Grid.Column>
                </Grid>
            </div>

        )
    }

}

export default Index;
