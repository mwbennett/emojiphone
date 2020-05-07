import React from 'react';
import User from './user.jsx';

export default class Users extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="col-6">
				<table className="table">
					<thead className="thead-dark">
					   <tr>
					     <th scope="col">First</th>
					     <th scope="col">Last</th>
					     <th scope="col">Phone Number</th>
					     <th scope="col"></th>
					   </tr>
					 </thead>
					<tbody>
						{this.props.users.map(user => 
							<User 
								key={user.id} 
								user={user} 
								isAdd={this.props.isAdd} 
								onAdd={this.props.onAdd} 
								onDelete={this.props.onDelete}
							/>
						)}
					</tbody>
				</table>
			</div>
		);
	}
}
