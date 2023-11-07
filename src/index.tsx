import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app';
import reportWebVitals from './reportWebVitals';
import { getApiClient } from './http-client';
import { AuthData } from './model';

document.addEventListener('DOMContentLoaded', async () => {
	const urlParams = new URLSearchParams(document.location.search);

	const user = urlParams.get('userId');
	if (!user) {
		return null;
	}
	const authData = await getApiClient<AuthData>({
		url: `/users/${user}/chatsAuth`,
		method: 'POST',
	});
	const rootContainer = document.getElementById('root');
	if (!rootContainer) {
		throw new TypeError('Root container is not found!');
	}
	const root = createRoot(rootContainer);
	root.render(<App user={user} token={authData.accessToken} />);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
