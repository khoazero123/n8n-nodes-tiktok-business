import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class TiktokBusinessCookieApi implements ICredentialType {
	name = 'tiktokBusinessCookieApi';

	displayName = 'Tiktok Business Cookie API';

	documentationUrl = 'https://business-api.tiktok.com/portal/docs?id=1832209711206401';

	icon: Icon = 'file:../nodes/TiktokBusiness/tiktokbusiness.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'hidden',
			default: 'https://ads.tiktok.com/api',
			required: true,
		},
		{
			displayName: 'Csrf Token',
			name: 'csrfToken',
			// eslint-disable-next-line n8n-nodes-base/cred-class-field-type-options-password-missing
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Session Ads ID',
			name: 'sessionId',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-csrftoken': '={{$credentials.csrfToken}}',
				'Cookie': '=csrftoken={{$credentials.csrfToken}}; sessionid_ss_ads={{$credentials.sessionId}};',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			url: '={{$credentials.baseUrl}}/v2/i18n/account/account_switch_list/',
			method: 'GET',
		},
	};
}
