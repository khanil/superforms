import translate from './dictionary'

export default class Select extends React.Component {
	renderOptions(options, selected) {
		let translatedOpt;
		
		return options.map(opt => {
			translatedOpt = translate.intoRus(opt);
			return opt === selected?
				<option selected="selected">{translatedOpt}</option> :
				<option>{translatedOpt}</option>
			})
	}

	render() {
		const {
			className,
			id, 
			changeStateHandler,
			options,
			helpBlock,
			selected
		} = this.props;

		return (
			<div className="col-sm-4 registration">
				<select selected={selected}
					id={id} 
					className="form-control"
					onChange={changeStateHandler}>
					{this.renderOptions(options, selected)}
				</select>
				{helpBlock? <span className="help-block">{helpBlock}</span> : null}
			</div>
		)
	}
}