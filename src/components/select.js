import Translate from './dictionary'

export default class Select extends React.Component {
	renderOptions(options) {
		return options.map(opt => (
			<option>{Translate.intoRus(opt)}</option>
		))
	}

	render() {
		const {
			className,
			id, 
			changeStateHandler,
			options,
			helpBlock
		} = this.props;

		return (
			<div className="col-sm-4 registration">
				<select 
					id={id} 
					className="form-control"
					onChange={changeStateHandler}>
					{this.renderOptions(options)}
				</select>
				{helpBlock? <span className="help-block">{helpBlock}</span> : null}
			</div>
		)
	}
}