var { Navbar, Nav, NavItem, Glyphicon } = ReactBootstrap;

var TopMenu = React.createClass({
    render: function() {
        return (
            <div className="topMenu">
              <Navbar inverse fixedTop={true}>
                <Navbar.Header>
                  <Navbar.Brand>nslides</Navbar.Brand>
                  <Navbar.Toggle />
                </Navbar.Header>

                <Navbar.Collapse>
                  <Nav>
                    <NavItem eventKey={1} href="/slides">Slides List</NavItem>
                    <NavItem eventKey={2} href="/slides/new">New Slide</NavItem>
                  </Nav>
                </Navbar.Collapse>
              </Navbar>
            </div>
        );
    }
});
