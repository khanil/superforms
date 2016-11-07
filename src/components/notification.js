// const renderNotification = ({ notification, closeHandler }) => {
// 	const type = notification instanceof Error? 'danger' : 'info';
// 	const message = notification.message || notification;

// 	return (
// 		<div id={type} className={`alert alert-${type}`}>
// 			<a className="close" onClick={closeHandler}>×</a>
// 			<div dangerouslySetInnerHTML={{__html: message}}/>
// 		</div>
// 	)
// };

// const NotificationComponent = props => (
// 	props.notification? renderNotification(props) : null
// );


// export default NotificationComponent;


export default class Notification extends React.Component {
	renderNotification({ notification, closeHandler }) {
		const type = notification instanceof Error? 'danger' : 'info';
		const message = notification.message || notification;

		return (
			<div id={type} className={`alert alert-${type}`}>
				<a className="close" onClick={closeHandler}>×</a>
				<div dangerouslySetInnerHTML={{__html: message}}/>
			</div>)
	}

	render() {
		const props = this.props;
		console.log(props.closeHandler)
		return props.notification? this.renderNotification(props) : null
	}
};