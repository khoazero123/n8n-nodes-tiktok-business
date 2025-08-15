import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class TiktokBusinessEasyAuthOAuth2Api implements ICredentialType {
	name = 'tiktokBusinessEasyAuthOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Tiktok Business Easy Auth OAuth2 API';

	documentationUrl = 'https://ads.tiktok.com/';

	icon: Icon = 'file:../nodes/TiktokBusiness/tiktokbusiness.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'hidden',
			required: false,
			default: 'n8n-nodes-tiktok-business',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'hidden',
			required: false,
			default: 'n8n-nodes-tiktok-business',
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
			type: 'hidden',
			default: 'https://business-api.tiktok.com/open_api/v1.3',
			required: true,
		},
		{
			displayName: 'Proxy Base URL',
			name: 'proxyBaseUrl',
			type: 'string',
			default: 'https://oauth.tiktok-business.workers.dev',
			required: true,
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: '={{$self["proxyBaseUrl"]}}/auth',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			required: true,
			default: '={{$self["proxyBaseUrl"]}}/token',
		},
		{
			displayName: 'Advertiser Get URL',
			name: 'advertiserGetUrl',
			type: 'hidden',
			required: true,
			default: '={{$self["proxyBaseUrl"]}}/advertiser/get/',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
