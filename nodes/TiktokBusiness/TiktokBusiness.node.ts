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
						name: 'Upload Image',
						value: 'uploadImage',
						description: 'Upload an image to TikTok',
						action: 'Upload image',
					},
					{
						name: 'List Images',
						value: 'listImages',
						description: 'List images in an advertiser',
						action: 'List images',
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
				default: {},
				options: [
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
						displayName: 'Image IDs',
						name: 'imageIds',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								'/operation': [
									'listImages',
								],
							},
						},
						placeholder: '["1234567890", "1234567891"]',
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

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials<{
			clientId: string;
			clientSecret: string;
			baseUrl: string;
			oauthTokenData: {
				access_token: string;
				advertiser_ids: string[];
				scope: number[];
			};
		}>('tiktokBusinessOAuth2Api');

		const { baseUrl, oauthTokenData, clientId, clientSecret } = credentials;

		let item: INodeExecutionData;

		const accessToken = oauthTokenData.access_token;
		if (!accessToken) {
			this.logger.info(`Credentials: ${JSON.stringify(credentials)}`);
			throw new ApplicationError('No access token found');
		}

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			item = items[itemIndex];
			try {

				const operation = this.getNodeParameter('operation', itemIndex);
				const resource = this.getNodeParameter('resource', itemIndex);
				const binaryData = this.getNodeParameter('binaryData', itemIndex, false);
				const fileIdOrUrl = this.getNodeParameter('fileIdOrUrl', itemIndex, '') as string;
				this.logger.info(`fileIdOrUrl: ${fileIdOrUrl}`);

				const requestOptions: IRequestOptions = {
					baseURL: baseUrl,
					headers: {
						'Access-Token': accessToken,
						'content-type': 'application/json; charset=utf-8',
					},
					json: true,
				};

				switch (resource) {
					case 'user':
						switch (operation) {
							case 'getUserInfo':
								this.logger.info(`Client ID: ${clientId}`);
								requestOptions.method = 'GET';
								requestOptions.url = 'user/info/';
								const response = await this.helpers.request(requestOptions);
								returnData.push({ json: response?.data || response });
								break;
						}
						break;
					case 'advertiser':
						switch (operation) {
							case 'getAdvertiserInfo':
								requestOptions.method = 'GET';
								requestOptions.url = 'oauth2/advertiser/get/';
								requestOptions.qs = {
									app_id: clientId,
									secret: clientSecret,
								};
								const response = await this.helpers.request(requestOptions);
								returnData.push(...(response?.data?.list || response?.data || []));
								break;
						}
						break;
					case 'image':


						const advertiserId = encodeURI(
							this.getNodeParameter('advertiserId', itemIndex, undefined, {
								extractValue: true,
							}) as string,
						);
						switch (operation) {
							case 'uploadImage':
								this.logger.info(`Advertiser ID: ${advertiserId}`);

								requestOptions.method = 'POST';
								requestOptions.url = 'file/image/ad/upload/';
								requestOptions.body = {
									advertiser_id: advertiserId,
								};

								if (binaryData) {
									if (!item.binary) {
										throw new NodeOperationError(this.getNode(), 'Binary data is required', {
											itemIndex,
										});
									}
									requestOptions.body.upload_type = 'UPLOAD_BY_FILE';
									requestOptions.headers!['content-type'] = 'multipart/form-data; charset=utf-8';

									const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0);
									const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
									const fileName = this.getNodeParameter('additionalFields.fileName', 0, '') as string;

									const filename = fileName || binaryData.fileName?.toString();

									this.logger.info(`File Name: ${filename}`);

									if (!filename) {
										throw new NodeOperationError(
											this.getNode(),
											`File name is needed to ${operation}. Make sure the property that holds the binary data
										has the file name property set or set it manually in the node using the File Name parameter under
										Additional Fields.`,
										);
									}

									const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
										itemIndex,
										binaryPropertyName,
									);

									requestOptions.body.file_name = filename;
									requestOptions.body.image_file = {
										value: binaryDataBuffer,
										options: {
											filename: binaryData.fileName,
											contentType: binaryData.mimeType,
										},
									};
									requestOptions.body.image_signature = createHash('md5').update(binaryDataBuffer).digest('hex');
									this.logger.info(`Image Signature: ${requestOptions.body.image_signature}`);
								} else if (fileIdOrUrl && fileIdOrUrl.startsWith('http')) {
									requestOptions.body.upload_type = 'UPLOAD_BY_URL';
									requestOptions.body.image_url = fileIdOrUrl;
								} else if (fileIdOrUrl) {
									requestOptions.body.upload_type = 'UPLOAD_BY_FILE_ID';
									requestOptions.body.file_id = fileIdOrUrl;
								}

								try {
									// log requestOptions
									// this.logger.info(JSON.stringify(requestOptions));
									const response = await this.helpers.request(requestOptions);
									this.logger.info(JSON.stringify(response));
									returnData.push({ json: response?.data || response });
								} catch (error) {
									this.logger.error(JSON.stringify(error), {
										advertiserId,
									});
									throw new NodeOperationError(this.getNode(), error, {
										itemIndex,
									});
								}
								break;
							case 'listImages':
								const page = this.getNodeParameter('page', itemIndex, 1);
								const pageSize = this.getNodeParameter('pageSize', itemIndex, 100);
								const imageIds = this.getNodeParameter('additionalFields.imageIds', itemIndex, '') as string;
								this.logger.info(`Advertiser ID: ${advertiserId}`);
								this.logger.info(`Page: ${page}`);
								this.logger.info(`Page Size: ${pageSize}`);
								this.logger.info(`Image IDs: ${imageIds}`);
								const filtering: any = {};
								if (imageIds) {
									filtering.image_ids = JSON.parse(imageIds);
								}

								requestOptions.method = 'GET';
								requestOptions.url = 'file/image/ad/search/';
								requestOptions.qs = {
									advertiser_id: advertiserId,
									page: page,
									page_size: pageSize,
									filtering: JSON.stringify(filtering),
								};
								this.logger.info(JSON.stringify(requestOptions));
								const response = await this.helpers.request(requestOptions);
								this.logger.info(JSON.stringify(response));
								returnData.push({ json: response?.data || response });
								break;
						}
						break;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
