export default class Input extends React.Component {
	render() {
		const {
			className,
			id, 
			placeholder,
			value,
			changeStateHandler,
			helpBlock
		} = this.props;

		return (
			<div className={className}>
				<input 
					id={id}
					type="text" 
					placeholder={placeholder} 
					className="form-control"
					value={value}
					onChange={changeStateHandler}
				/>
				{helpBlock? <span className="help-block">{helpBlock}</span> : null}
			</div>
		)
	}
}