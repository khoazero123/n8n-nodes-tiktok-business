import type {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { createHash } from 'crypto';
import { basename } from 'path';
import FormData from 'form-data';

type AuthenticationType = 'oAuth2' | 'easyAuth' | 'cookie';

const credentialByAuthentication: Record<AuthenticationType, string> = {
	oAuth2: 'tiktokBusinessOAuth2Api',
	easyAuth: 'tiktokBusinessEasyAuthOAuth2Api',
	cookie: 'tiktokBusinessCookieApi',
};

export class TiktokBusiness implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Tiktok Business',
		name: 'tiktokBusiness',
		icon: 'file:tiktokbusiness.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Tiktok Business Node',
		defaults: {
			name: 'Tiktok Business',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'tiktokBusinessOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'tiktokBusinessEasyAuthOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['easyAuth'],
					},
				},
			},
			{
				name: 'tiktokBusinessCookieApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['cookie'],
					},
				},
			},
		],
		usableAsTool: true,
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			json: true,
			headers: {
				'Access-Token': '={{$credentials.oauthTokenData.access_token}}',
			},
		},
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
					{
						name: 'Easy Auth',
						value: 'easyAuth',
					},
					{
						name: 'Cookie (Experimental)',
						value: 'cookie',
					},
				],
				default: 'oAuth2',
			},
			{
				displayName: 'Credentials',
				name: 'credentials',
				type: 'credentials',
				default: '',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'User',
						value: 'user',
					},
					{
						name: 'Advertiser',
						value: 'advertiser',
					},
					{
						name: 'Image',
						value: 'image',
					},
					{
						name: 'Creative Tool',
						value: 'creativeTool',
					},
				],
				default: 'user',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get User Info',
						value: 'getUserInfo',
						description: 'Get up to date information about a user',
						action: 'Get user info',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									if (authentication === 'cookie') {
										requestOptions.url = 'https://ads.tiktok.com/passport/web/account/info/';
									}
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/user/info/',
							},
						},
					},
				],
				default: 'getUserInfo',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['advertiser'],
						// authentication: ['oAuth2', 'easyAuth'],
					},
				},
				options: [
					{
						name: 'Get Authorized Ad Accounts',
						value: 'getAuthorizedAdAccounts',
						description: 'Get up to date information about a advertiser',
						action: 'Get authorized ad accounts',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									const credentialType = credentialByAuthentication[authentication];
									if (authentication === 'cookie') {
										const {csrfToken, sessionId} = await this.getCredentials<{
											csrfToken: string;
											sessionId: string;
										}>(credentialType);
										requestOptions.headers = {
											...requestOptions.headers,
										}
										requestOptions.baseURL = undefined;
										requestOptions.url = 'https://ads.tiktok.com/api/v2/i18n/account/account_switch_list/';
										requestOptions.headers['x-csrftoken'] = csrfToken;
										requestOptions.headers['Cookie'] = `csrftoken=${csrfToken}; sessionid_ss_ads=${sessionId};`;
										return requestOptions;
									}
									const {clientId, clientSecret, advertiserGetUrl, oauthTokenData} = await this.getCredentials<{
										clientId: string;
										clientSecret: string;
										advertiserGetUrl: string;
										oauthTokenData: {
											access_token: string;
											advertiser_ids: string[];
										};
									}>(credentialType);

									if (authentication === 'oAuth2') {
										requestOptions.qs = {
											app_id: clientId,
											secret: clientSecret,
										};

									} else {
										// oauthTokenData.advertiser_ids are not correct
										// requestOptions.url = '/advertiser/info/';
										// requestOptions.qs = {
										// 	advertiser_ids: `[${oauthTokenData.advertiser_ids.map((item: string) => `"${item}"`).join(',')}]`,
										// };
										requestOptions.url = advertiserGetUrl;
									}
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/oauth2/advertiser/get/',
							},
							output: {
								postReceive: [
									async function (
										this: IExecuteSingleFunctions,
										items,
										response: IN8nHttpFullResponse,
									): Promise<INodeExecutionData[]> {
										return this.helpers.returnJsonArray(response.body as any);
										const authentication = this.getNodeParameter('authentication', 0);
										if (authentication === 'cookie') {
											this.logger.debug(`response: ${JSON.stringify(response)}`);
											const {data} = response.body as any;
											const child = (data?.data || []).reduce((acc: any, item: any) => {
												acc.push(...item.child);
												return acc;
											}, []);

											return this.helpers.returnJsonArray(child);
										}

										const data = response.body as any;
										return this.helpers.returnJsonArray(data?.data?.list || data?.data || data || []);
									}
								],
							},
						},
					},
					{
						name: 'Get Ad Account Details',
						value: 'getAdAccountDetails',
						description: 'Get up to date information about a advertiser',
						action: 'Get ad account details',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									if (authentication === 'cookie') {
										throw new NodeOperationError(this.getNode(), 'Not implemented yet');
									}
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/advertiser/info/',
								qs: {
									advertiser_ids: '={{$parameter["advertiserIds"]}}',
									fields: '={{$parameter["fields"]}}',
								},
							},
						},
					},
				],
				default: 'getAuthorizedAdAccounts',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['image'],
					},
				},
				options: [
					{
						name: 'List Images',
						value: 'listImages',
						description: 'List images in an advertiser',
						action: 'List images',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									if (authentication === 'cookie') {
										const credentialType = credentialByAuthentication[authentication];
										const {csrfToken, sessionId} = await this.getCredentials<{
											csrfToken: string;
											sessionId: string;
										}>(credentialType);
										requestOptions.method = 'POST';
										requestOptions.headers = {
											...requestOptions.headers,
											'x-csrftoken': csrfToken,
											'Cookie': `csrftoken=${csrfToken}; sessionid_ss_ads=${sessionId};`,
										};
										const advertiserId = this.getNodeParameter('advertiserId', undefined, { extractValue: true }) as string;
										requestOptions.baseURL = undefined;
										requestOptions.url = 'https://ads.tiktok.com/mi/api/v4/i18n/creation/material/list/';
										requestOptions.qs = {
											aadvid: advertiserId,
										};
										requestOptions.body = {
											page: this.getNodeParameter('page', undefined, { extractValue: true }) as number,
											limit: this.getNodeParameter('pageSize', undefined, { extractValue: true }) as number,
											item_source: 0,
											sort_order: 1,
											sort_type: 1,
											material_type: 2,
										};
										this.logger.debug(`requestOptions: ${JSON.stringify(requestOptions)}`);
									}
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/file/image/ad/search/',
								qs: {
									advertiser_id: '={{$parameter["advertiserId"]}}',
									page: '={{$parameter["page"]}}',
									page_size: '={{$parameter["pageSize"]}}',
									filtering: '={{$parameter["filtering"]}}',
								},
							},
						},
					},
					{
						name: 'Get Info About Images',
						value: 'getInfoAboutImages',
						description: 'Get info about images in an advertiser',
						action: 'Get info about images',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									if (authentication === 'cookie') {
										throw new NodeOperationError(this.getNode(), 'Not implemented yet');
									}
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/file/image/ad/info/',
								qs: {
									advertiser_id: '={{$parameter["advertiserId"]}}',
									image_ids: '={{$parameter["imageIds"]}}',
								},
							},
						},
					},
					{
						name: 'Update The Name Of An Image',
						value: 'updateImageName',
						action: 'Update image name',
						routing: {
							request: {
								method: 'POST',
								url: '/file/image/ad/update/',
								body: {
									advertiser_id: '={{$parameter["advertiserId"]}}',
									image_id: '={{$parameter["imageId"]}}',
									file_name: '={{$parameter["fileName"]}}',
								},
							},
						},
					},
					{
						name: 'Upload Image',
						value: 'uploadImage',
						description: 'Upload an image to TikTok',
						action: 'Upload image',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
									const credentialType = credentialByAuthentication[authentication];
									const {baseUrl} = await this.getCredentials<{
										baseUrl: string;
									}>(credentialType);

									requestOptions.headers = {
										...requestOptions.headers,
									}

									const body = new FormData();

									const advertiserId = this.getNodeParameter('advertiserId', undefined, { extractValue: true }) as string;
									this.logger.debug(`advertiserId: ${advertiserId}`);
									if (authentication === 'cookie') {
										const credentialType = credentialByAuthentication[authentication];
										const {csrfToken, sessionId} = await this.getCredentials<{
											csrfToken: string;
											sessionId: string;
										}>(credentialType);
										requestOptions.headers = {
											...requestOptions.headers,
											'x-csrftoken': csrfToken,
											'Cookie': `csrftoken=${csrfToken}; sessionid_ss_ads=${sessionId};`,
										};

										this.logger.debug(`requestOptions.headers: ${JSON.stringify(requestOptions.headers)}`);

										const isBinaryData = this.getNodeParameter('binaryData', false) as boolean;
									  if (!isBinaryData) {
											throw new NodeOperationError(this.getNode(), 'Binary data is required');
										}
										const binaryPropertyName = this.getNodeParameter('binaryPropertyName') as string;
										if (!binaryPropertyName) {
											throw new NodeOperationError(this.getNode(), 'Binary property name is required');
										}

										const binaryData = this.helpers.assertBinaryData(binaryPropertyName);
										if (!binaryData) {
											throw new NodeOperationError(this.getNode(), 'Binary data is required');
										}

										const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(binaryPropertyName);
										const fileName = binaryData.fileName?.toString();
										if (!fileName) {
											throw new NodeOperationError(this.getNode(), `File name is needed to upload image. Make sure the property that holds the binary data has the file name property set.`);
										}

										requestOptions.url = 'https://ads.tiktok.com/mi/api/v2/i18n/material/image/upload/?req_src=ad_creation';
										requestOptions.qs = {
											req_src: 'ad_creation',
											aadvid: advertiserId,
										};
										body.append('Filedata', binaryDataBuffer, {
											filename: binaryData.fileName,
											contentType: binaryData.mimeType,
											knownLength: binaryDataBuffer.length,
										});

										// Remove json flag and let n8n handle content-type for multipart
										requestOptions.json = false;
										requestOptions.headers['Content-Length'] = body.getLengthSync();
										requestOptions.headers['Content-Type'] = `multipart/related; boundary=${body.getBoundary()}`;
										requestOptions.body = body;
									  return requestOptions;
									}
									// const inputData = this.getInputData();
									const additionalFields = this.getNodeParameter('additionalFields', {}) as any;
									const apiVersion = additionalFields.apiVersion;
									if (apiVersion && apiVersion != '1.3') {
										requestOptions.baseURL = baseUrl.replace('v1.3', `v${apiVersion}`);
										this.logger.debug(`Set baseURL to: ${requestOptions.baseURL}`);
									}
									body.append('advertiser_id', advertiserId);

									const isBinaryData = this.getNodeParameter('binaryData', false) as boolean;
									if (isBinaryData) {
										const binaryPropertyName = this.getNodeParameter('binaryPropertyName') as string;
										if (!binaryPropertyName) {
											throw new NodeOperationError(this.getNode(), 'Binary property name is required');
										}

										const binaryData = this.helpers.assertBinaryData(binaryPropertyName);
										// const binaryData = inputData.binary![binaryPropertyName];
										if (!binaryData) {
											throw new NodeOperationError(this.getNode(), 'Binary data is required');
										}

										// Convert binary data to buffer correctly
										// const binaryDataBuffer = Buffer.from(binaryData.data, 'base64');
										const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(binaryPropertyName);
										const fileName = additionalFields.fileName as string;

										const filename = fileName || binaryData.fileName?.toString();
										if (!filename) {
											throw new NodeOperationError(this.getNode(), `File name is needed to upload image. Make sure the property that holds the binary data has the file name property set or set it manually in the node using the File Name parameter under Additional Fields.`);
										}

										body.append('file_name', filename);
										body.append('upload_type', 'UPLOAD_BY_FILE');

										// Calculate image signature
										const imageSignature = createHash('md5').update(binaryDataBuffer).digest('hex');
										body.append('image_signature', imageSignature);

										// Set the file data directly as buffer - n8n will handle multipart form data automatically
										body.append('image_file', binaryDataBuffer, {
											filename: binaryData.fileName,
											contentType: binaryData.mimeType,
											knownLength: binaryDataBuffer.length,
										});

										// Remove json flag and let n8n handle content-type for multipart
										requestOptions.json = false;
										requestOptions.headers['Content-Length'] = body.getLengthSync();
										requestOptions.headers['Content-Type'] = `multipart/related; boundary=${body.getBoundary()}`;
									} else {
										const fileIdOrUrl = this.getNodeParameter('fileIdOrUrl') as string;
										if (!fileIdOrUrl) {
											throw new NodeOperationError(this.getNode(), 'File ID or URL is required');
										}

										if (fileIdOrUrl && fileIdOrUrl.startsWith('http')) {
											const fileName = additionalFields.fileName as string;
											const filename = fileName || basename(fileIdOrUrl);
											body.append('upload_type', 'UPLOAD_BY_URL');
											body.append('image_url', fileIdOrUrl);
											body.append('file_name', filename);
										} else {
											body.append('upload_type', 'UPLOAD_BY_FILE_ID');
											body.append('file_id', fileIdOrUrl);
										}
									}
									requestOptions.body = body;
									return requestOptions;
								}],
							},
							request: {
								method: 'POST',
								url: '/file/image/ad/upload/',
							},
						},
					},
				],
				default: 'uploadImage',
			},
			{
				displayName: 'Advertiser',
				name: 'advertiserId',
				required: true,
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				description: 'The specific location or business associated with the account',
				displayOptions: {
					show: {
						resource: ['image', 'creativeTool'],
						// operation: ['uploadImage', 'listImages', 'getInfoAboutImages', 'updateImageName', 'deleteCreativeAssets']
					}
				},
				modes: [
					{
						displayName: 'From list',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'searchAdvertisers',
							searchable: false,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						hint: 'Enter the advertiser ID',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '[0-9]+',
									errorMessage: 'The ID must be a number',
								},
							},
						],
						placeholder: 'e.g. 0123456789',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['creativeTool'],
					},
					hide: {
						authentication: ['cookie'],
					},
				},
				options: [
					{
						name: 'Delete Creative Assets',
						value: 'deleteCreativeAssets',
						action: 'Delete creative assets',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const advertiserId = this.getNodeParameter('advertiserId', undefined, { extractValue: true }) as string;
									const imageIds = JSON.parse(this.getNodeParameter('imageIds', {}) as string);
									const videoIds = JSON.parse(this.getNodeParameter('videoIds', {}) as string);

									requestOptions.body = {
										advertiser_id: advertiserId,
										image_ids: imageIds,
										video_ids: videoIds,
									};
									return requestOptions;
								}],
							},
							request: {
								method: 'POST',
								url: '/creative/asset/delete/',
							},
						},
					},
					{
						name: 'Edit An Image',
						value: 'editAnImage',
						action: 'Edit an image',
						routing: {
							request: {
								method: 'POST',
								url: '/creative/image/edit/',
								body: {
									advertiser_id: '={{$parameter["advertiserId"]}}',
									image_id: '={{$parameter["imageId"]}}',
									edit_method: '={{$parameter["imageEditMethod"]}}',
									width: '={{$parameter["imageWidth"]}}',
									height: '={{$parameter["imageHeight"]}}',
									image_name: '={{$parameter["imageName"]}}',
								},
							},
						},
					},
				],
				default: 'deleteCreativeAssets',
			},
			{
				displayName: 'Image Edit Method',
				name: 'imageEditMethod',
				type: 'options',
				default: 'fix_size',
				options: [
					{
						name: 'Fix Size',
						value: 'fix_size',
					},
					{
						name: 'Only Gauss Pad',
						value: 'only_gauss_pad',
					},
					{
						name: 'Gauss Padding Reserve Score',
						value: 'gauss_padding_reserve_score',
					},
				],
				required: true,
				displayOptions: {
					show: {
						operation: ['editAnImage'],
						resource: ['creativeTool'],
					},
				},
				description: 'Supported methods: fix_size, only_gauss_pad, and gauss_padding_reserve_score. Default value: fix_size.',
				placeholder: 'e.g: fix_size',
			},
			{
				displayName: 'Image Width',
				name: 'imageWidth',
				type: 'number',
				default: 1080,
				required: true,
				displayOptions: {
					show: {
						operation: ['editAnImage'],
						resource: ['creativeTool'],
					},
				},
				description: 'The width of the image. Default value: 1080.',
				placeholder: 'e.g: 1080',
			},
			{
				displayName: 'Image Height',
				name: 'imageHeight',
				type: 'number',
				default: 1920,
				required: true,
				displayOptions: {
					show: {
						operation: ['editAnImage'],
						resource: ['creativeTool'],
					},
				},
				description: 'The height of the image. Default value: 1920.',
				placeholder: 'e.g: 1920',
			},
			{
				displayName: 'Image Name',
				name: 'imageName',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['editAnImage'],
						resource: ['creativeTool'],
					},
				},
				description: 'Image name after editing. If the name is not set, this will be automatically generated.',
				placeholder: 'e.g: "New Image Name"',
			},
			{
				displayName: 'Advertiser IDs',
				name: 'advertiserIds',
				type: 'json',
				default: '[]',
				required: true,
				displayOptions: {
					show: {
						operation: ['getAdAccountDetails'],
						resource: ['advertiser'],
					},
				},
				description: 'Advertiser IDs to get details about',
				placeholder: 'e.g: ["1234567890", "1234567891"]',
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['getAdAccountDetails'],
						resource: ['advertiser'],
					},
				},
				description: 'Fields to get details about',
				placeholder: 'e.g: ["telephone_number", "contacter", "currency", "cellphone_number", "timezone", "advertiser_id", "role", "company", "status", "description", "rejection_reason", "address", "name", "language", "industry", "license_no", "email", "license_url", "country", "balance", "create_time", "display_timezone", "owner_bc_id", "company_name_editable"]',
			},
			{
				displayName: 'Image IDs',
				name: 'imageIds',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['getInfoAboutImages', 'deleteCreativeAssets'],
						resource: ['image', 'creativeTool'],
					},
				},
				description: 'Image IDs to get info about',
				placeholder: 'e.g: ["ad-site-i18n-sg/1234567890", "ad-site-i18n-sg/1234567891"]',
			},
			{
				displayName: 'Video IDs',
				name: 'videoIds',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['deleteCreativeAssets'],
						resource: ['creativeTool'],
					},
				},
				description: 'Image IDs to get info about',
				placeholder: 'e.g: ["ad-site-i18n-sg/1234567890", "ad-site-i18n-sg/1234567891"]',
			},
			{
				displayName: 'Image ID',
				name: 'imageId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateImageName', 'editAnImage'],
						resource: ['image', 'creativeTool'],
					},
				},
				description: 'Image ID to update the name of',
				placeholder: 'e.g: ad-site-i18n-sg/1234567890',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateImageName'],
						resource: ['image'],
					},
				},
				description: 'New name for the image',
				placeholder: 'e.g. "New Image Name"',
			},
			{
				displayName: 'Binary File',
				name: 'binaryData',
				type: 'boolean',
				default: true,
				required: true,
				displayOptions: {
					show: {
						operation: [
							'uploadImage',
						],
						resource: ['image'],
					},
				},
				description: 'Whether the data to upload should be taken from binary field',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				hint: 'The name of the input binary field containing the file to be written',
				displayOptions: {
					show: {
						operation: ['uploadImage'],
						resource: ['image'],
						binaryData: [true],
					},
				},
				placeholder: '',
				description: 'Name of the binary property that contains the data to upload',
			},
			{
				displayName: 'File ID or URL',
				name: 'fileIdOrUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadImage'],
						resource: ['image'],
						binaryData: [false],
					},
					hide: {
						authentication: ['cookie'],
					},
				},
				description:
					'Photo to send. Pass a file_id to send a photo that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a photo from the Internet.',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				required: true,
				displayOptions: {
					show: {
						operation: [
							'listImages',
						],
						resource: ['image'],
					},
				},
				description: 'Page number to list images from',
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				default: 10,
				required: true,
				displayOptions: {
					show: {
						operation: [
							'listImages',
						],
						resource: ['image'],
					},
				},
				description: 'Page size to list images from',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: [
							'uploadImage',
							'listImages',
						],
						resource: ['image'],
					},
					hide: {
						authentication: ['cookie'],
					},
				},
				default: {
					// apiVersion: '1.3', // uncomment will show this field as default
				},
				options: [
					{
						displayName: 'API Version',
						name: 'apiVersion',
						type: 'options',
						default: '1.3',
						displayOptions: {
							show: {
								'/operation': [
									'uploadImage',
								],
							},
						},
						options: [
							{
								name: '1.3',
								value: '1.3',
							},
							{
								name: '1.2',
								value: '1.2',
							},
						],
					},
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								'/operation': [
									'uploadImage',
								],
							},
						},
						placeholder: 'image.png',
					},
					{
						displayName: 'Filtering',
						name: 'filtering',
						type: 'json',
						default: '{}',
						displayOptions: {
							show: {
								'/operation': [
									'listImages',
								],
							},
						},
						placeholder: '{"image_ids":["ad-site-i18n-sg/1234567890", "ad-site-i18n-sg/1234567891"]}',
					},
				]
			}
		],
	};

	methods = {
		listSearch: {
			searchAdvertisers: async function (this: ILoadOptionsFunctions) {
				const authentication = this.getNodeParameter('authentication', 0) as AuthenticationType;
				const credentialType = credentialByAuthentication[authentication];

				if (authentication === 'cookie') {
					const { baseUrl, csrfToken, sessionId } = await this.getCredentials<{
						baseUrl: string;
						csrfToken: string;
						sessionId: string;
					}>(credentialType);
					const response = await this.helpers.request({
						baseURL: baseUrl,
						method: 'GET',
						url: 'https://ads.tiktok.com/api/v2/i18n/account/account_switch_list/',
						headers: {
							'x-csrftoken': csrfToken,
							'Cookie': `csrftoken=${csrfToken}; sessionid_ss_ads=${sessionId};`,
						},
						json: true,
					});
					// this.logger.debug(`response: ${JSON.stringify(response)}`);
					const data = response?.data?.data || [];
					const child = data.reduce((acc: any, item: any) => {
						acc.push(...item.child);
						return acc;
					}, []);
					// this.logger.debug(`child: ${JSON.stringify(child)}`);
					return {
						results: child.map((item: any) => ({
							name: item.name,
							value: item.id,
						})),
					};
				}

				const { baseUrl, oauthTokenData, clientId, clientSecret, advertiserGetUrl } = await this.getCredentials<{
					clientId: string;
					clientSecret: string;
					baseUrl: string;
					advertiserGetUrl: string;
					oauthTokenData: {
						access_token: string;
						advertiser_ids: string[];
						scope: number[];
					};
				}>(credentialType);

				const response = await this.helpers.request({
					baseURL: baseUrl,
					method: 'GET',
					url: authentication === 'easyAuth' ? advertiserGetUrl : 'oauth2/advertiser/get/',
					headers: {
						'Access-Token': oauthTokenData.access_token,
					},
					qs: {
						app_id: clientId,
						secret: clientSecret,
					},
				});
				const advertisers = JSON.parse(response)?.data?.list || [];
				return {
					results: advertisers.map((item: any) => ({
						name: item.advertiser_name,
						value: item.advertiser_id,
					})),
				};
			},
		},
	};

	/* async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	  const authentication = this.getNodeParameter('authentication', 0);
		return [];
	} */
}
