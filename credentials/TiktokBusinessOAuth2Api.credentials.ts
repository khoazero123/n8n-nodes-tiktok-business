import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class TiktokBusinessOAuth2Api implements ICredentialType {
	name = 'tiktokBusinessOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Tiktok Business OAuth2 API';

	documentationUrl = 'https://business-api.tiktok.com/portal/docs?id=1832209711206401';

	icon: Icon = 'file:../nodes/TiktokBusiness/tiktokbusiness.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
			default: '',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://business-api.tiktok.com/open_api/v1.3',
			required: true,
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://business-api.tiktok.com/portal/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			required: true,
			default: 'https://business-api.tiktok.com/open_api/v1.3/oauth/token/',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '=app_id={{ $self["clientId"] }}',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
