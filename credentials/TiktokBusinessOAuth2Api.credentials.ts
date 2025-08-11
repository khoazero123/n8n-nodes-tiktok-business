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
			type: 'hidden',
			required: false,
			default: '',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'hidden',
			required: false,
			default: '',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'App Secret',
			name: 'appSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
		{
			displayName: 'Advertiser ID',
			name: 'advertiserId',
			type: 'string',
			default: '',
			required: false,
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Code',
			name: 'code',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://business-api.tiktok.com/open_api/v1.3/',
			required: true,
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://business-api.tiktok.com/portal/auth',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			required: true,
			default: 'https://api.tiktok-business.workers.dev/open_api/v1.3/oauth2/access_token/',
			hint: 'The URL https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/ is not working, because it requires a auth_code in the body instead of code field',
		},

		{
			displayName: 'Additional Body Properties',
			name: 'additionalBodyProperties',
			type: 'hidden',
			default:
				'={"app_id":"{{ $self["appId"] }}","secret":"{{$self["appSecret"]}}","auth_code":"{{$self["code"]}}"}',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '=app_id={{ $self["appId"] }}',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'hidden',
			default: '',
		},
	];
}
