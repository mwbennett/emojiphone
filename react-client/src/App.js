import React, { Component } from 'react';
import './App.css';
import Users from './components/users.jsx';
import Header from './components/header.jsx';

const MINIMUM_USERS_PER_GAME = 3;

class App extends Component {
  state = {
    users: [],
    newUsers: [],
    user: {}
  }

  componentDidMount() {
    let phoneNumber = new URLSearchParams(window.location.search).get('phoneNumber');
    fetch('/userByPhoneNumber/' + phoneNumber)
      .then(res => res.json())
      .then(user => this.setState({user}))

    // Could really do this by userId now, but yolooo
    fetch('/lastPlayedGame/' + phoneNumber)
      .then(res => res.json())
      .then(users => this.setState({ users }));
  }

  render() {
    return (
      <div className="App container-lg">
        <Header name={(this.state.user) ? this.state.user.firstName : "New Friend"} />
        <h1>Users</h1>
        <div className="row">
          <Users users={this.state.users} isAdd={true} onAdd={this.handleAdd} />
          <Users users={this.state.newUsers} isAdd={false} onDelete={this.handleDelete} />
        </div>
        <div className="row">
          <div className="col-4"></div>
          <div className="col-4"><button onClick={this.handleStartGame}>Start game</button></div>
          <div className="col-4"><button onClick={this.handleReset}>Reset</button></div>
        </div>
      </div>
    );
  }

  handleStartGame = () => {
    if (this.state.newUsers.length < MINIMUM_USERS_PER_GAME) {
      alert("Not enough users to start game. Please add at least " + MINIMUM_USERS_PER_GAME);
      return;
    }
    // const newUsers = [...this.state.newUsers]
    // newUsers.map(u => delete u.id)
    // fetch('/startGame', {
    //   method: "POST",
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(newUsers)
    // })

  }

  handleReset = () => {
    let allUsers = this.state.newUsers.concat(this.state.users);
    this.setState({
      users: allUsers,
      newUsers: []
    })
  }

  handleAdd = (user) => {
    const userToAdd = {...user};
    const users = [...this.state.users].filter(u => u.id != userToAdd.id);
    let newUsers = [...this.state.newUsers];
    newUsers.push(userToAdd);

    this.setState({users, newUsers});
  }

  handleDelete = (user) => {
    const userToDelete = {...user};
    const newUsers = [...this.state.newUsers].filter(u => u.id != userToDelete.id);
    let users = [...this.state.users];
    users.push(userToDelete);

    this.setState({users, newUsers});
  }
}

export default App;
