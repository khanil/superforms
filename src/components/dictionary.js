class Translate {
	constructor() {
		// translate into Russian
		this.engToRus = {
			// statuses
			active: 'Активен',
			baned: 'Заблокирован',
			waiting: 'Ожидает подтверждения регистрации',
			// roles
			admin: 'Администратор',
			employee: 'Сотрудник',
			// columns
			fullname: 'ФИО',
			email: 'Электронная почта',
			role: 'Роль',
			status: 'Статус',
			status_changed: 'Статус изменен',
			operations: ''
		}

		// translate into English
		this.rusToEng = {
			// roles
			'Администратор': 'admin',
			'Сотрудник': 'employee',
		}
	}

	intoRus(naming) {
		return this.engToRus[naming]
	} 

	intoEng(naming) {
		return this.rusToEng[naming]
	}
}

const translate = new Translate();
export default translate;
// export default new Translate();