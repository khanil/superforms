import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

import configureStore from '../../super-forms-client/app/redux/create';
import rootReducer from '../../super-forms-client/app/forms-app/reducer';
import FormsListApp from '../../super-forms-client/app/forms-app/components';
import forms from '../../super-forms-client/app/forms-app/modules/forms';
import modal from '../../super-forms-client/app/forms-app/modules/modal';

export function renderReactHTML(preloadedState) {
  // Create a new Redux store instance
  const store = configureStore(rootReducer, preloadedState);

  // Render the component to a string
  const html = renderToString(
    <Provider store={store}>
      <FormsListApp />
    </Provider>
  );

  return html;
}

export function normalizeState(foundForms, userId) {
  const state = {
    forms: forms.initialState,
    modal: modal.initialState,
    user: userId,
  };

  state.forms.db = forms.model.init(foundForms);

  return state;
}