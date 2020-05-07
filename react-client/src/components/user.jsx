import React from 'react';

export default class User extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const {user} = this.props
		return (
			<tr>
				<td>{user.firstName}</td>
				<td>{user.lastName}</td>
				<td>{user.phoneNumber}</td>
				{this.renderButton()}
			</tr>
		);
	}

	renderButton() {
		if (this.props.isAdd) {
			return <td><button onClick={() => this.props.onAdd(this.props.user)} >Add to game</button></td>
		} else {
			return <td><button onClick={() => this.props.onDelete(this.props.user)} >Remove from game</button></td>
		}
	}
}
