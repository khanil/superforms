import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

import configureStore from '../../super-forms-client/app/redux/create';
import rootReducer from '../../super-forms-client/app/responses-app/reducer';
import { ResponsesApp } from '../../super-forms-client/app/responses-app/components';

export default function renderReactHTML(preloadedState) {
  // Create a new Redux store instance
  const store = configureStore(rootReducer, preloadedState);

  // Render the component to a string
  const html = renderToString(
    <Provider store={store}>
      <ResponsesApp />
    </Provider>
  );

  return html;
}