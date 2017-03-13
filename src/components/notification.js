export default class Notification extends React.Component {
	renderNotification({ notification, closeHandler }) {
		const type = notification instanceof Error? 'danger' : 'info';
		const message = notification.message || notification;

		return (
			<div id={type} className={`alert alert-${type}`}>
				<a className="close" onClick={closeHandler}>×</a>
				<div dangerouslySetInnerHTML={{__html: message}}/>
			</div>
		)
	}

	render() {
		return this.props.notification?
			this.renderNotification(this.props) :
			null
	}
};