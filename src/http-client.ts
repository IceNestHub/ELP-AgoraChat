import { apiUrl } from './const';

export interface Request {
	readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
	readonly url: string;
	readonly query?: string;
	readonly body?: unknown;
	readonly mode?: RequestMode;
	readonly headers?: Record<string, unknown>;
}

function buildUrl(url: string, query?: string): string {
	return query ? `${url}?${query}` : url;
}

export const httpClient = (baseURL: string) => {
	return <T extends unknown>(request: Request) => {
		const url = `${baseURL}${buildUrl(request.url, request.query)}`;

		const init: RequestInit = {
			method: request.method,
			credentials: 'include',
			body: JSON.stringify(request.body),
			cache: 'no-cache',
			mode: 'cors',
			redirect: 'follow',
		};

		return fetch(url, init).then(response => {
			return response.json().then(data => {
				return data as T;
			});
		});
	};
};

export const getApiClient = httpClient(apiUrl);
