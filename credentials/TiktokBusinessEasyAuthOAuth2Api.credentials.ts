import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class TiktokBusinessEasyAuthOAuth2Api implements ICredentialType {
	name = 'tiktokBusinessEasyAuthOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'Tiktok Business Easy Auth OAuth2 API';

	documentationUrl = 'https://business-api.tiktok.com/portal/docs?id=1832209711206401';

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
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Advertiser Get URL',
			name: 'advertiserGetUrl',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '=n8n_oauth_redirect_uri={{process.env.WEBHOOK_URL?.endsWith("/") ? process.env.WEBHOOK_URL?.slice(0, -1) : process.env.WEBHOOK_URL}}{{ process.env.N8N_ENDPOINT_REST ? process.env.N8N_ENDPOINT_REST : "/rest" }}/oauth2-credential/callback',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
