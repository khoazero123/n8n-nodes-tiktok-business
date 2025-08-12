import type {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
} from 'n8n-workflow';
import { ApplicationError, NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { createHash } from 'crypto';
import { basename } from 'path';
import FormData from 'form-data';

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
			},
		],

		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			json: true,
			headers: {
				'Access-Token': '={{$credentials.oauthTokenData.access_token}}',
			},
		},
		usableAsTool: true,
		properties: [
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
					},
				},
				options: [
					{
						name: 'Get Authorized Ad Accounts',
						value: 'getAdvertiserInfo',
						description: 'Get up to date information about a advertiser',
						action: 'Get advertiser info',
						routing: {
							send: {
								preSend: [async function (this: IExecuteSingleFunctions,
									requestOptions: IHttpRequestOptions,
								): Promise<IHttpRequestOptions> {
									const credentials = await this.getCredentials<{
										clientId: string;
										clientSecret: string;
									}>('tiktokBusinessOAuth2Api');
									requestOptions.qs = {
										app_id: credentials.clientId,
										secret: credentials.clientSecret,
									};
									return requestOptions;
								}],
							},
							request: {
								method: 'GET',
								url: '/oauth2/advertiser/get/',
							},
						},
					},
				],
				default: 'getAdvertiserInfo',
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
									const {baseUrl} = await this.getCredentials<{
										baseUrl: string;
									}>('tiktokBusinessOAuth2Api');
									requestOptions.headers = {
										...requestOptions.headers,
									}
									// const inputData = this.getInputData();
									const additionalFields = this.getNodeParameter('additionalFields', {}) as any;
									const apiVersion = additionalFields.apiVersion;
									if (apiVersion && apiVersion != '1.3') {
										requestOptions.baseURL = baseUrl.replace('v1.3', `v${apiVersion}`);
										this.logger.debug(`Set baseURL to: ${requestOptions.baseURL}`);
									}

									const body = new FormData();
									body.append('advertiser_id', this.getNodeParameter('advertiserId', undefined, { extractValue: true }) as string);

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
										requestOptions.headers['Content-Type'] =
											`multipart/related; boundary=${body.getBoundary()}`;
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
				displayOptions: { show: { resource: ['image'] } },
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
				displayName: 'Image IDs',
				name: 'imageIds',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getInfoAboutImages'],
						resource: ['image'],
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
						operation: ['updateImageName'],
						resource: ['image'],
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
				default: false,
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
						operation: [
							'uploadImage',
						],
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
						type: 'string',
						default: '',
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
				const { baseUrl, oauthTokenData, clientId, clientSecret } = await this.getCredentials<{
					clientId: string;
					clientSecret: string;
					baseUrl: string;
					oauthTokenData: {
						access_token: string;
						advertiser_ids: string[];
						scope: number[];
					};
				}>('tiktokBusinessOAuth2Api');

				const response = await this.helpers.request({
					baseURL: baseUrl,
					method: 'GET',
					url: 'oauth2/advertiser/get/',
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
}
