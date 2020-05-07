import React from 'react';

export default class Header extends React.Component {
	render() {
		return (
			<h1>Make new game for {this.props.name}</h1>
		);
	}
}
