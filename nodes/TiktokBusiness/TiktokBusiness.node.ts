import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

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
			baseURL: '={{ $credentials.baseUrl }}',
			headers: {
				'Access-Token': '={{ $credentials.accessToken }}',
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
					},
				],
				default: 'getUserInfo',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);

		const { baseUrl, oauthTokenData } = await this.getCredentials<{
			baseUrl: string;
			oauthTokenData: {
				data: {
					access_token: string;
					advertiser_ids: string[];
				};
			};
		}>('tiktokBusinessOAuth2Api');

		let item: INodeExecutionData;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];
				switch (resource) {
					case 'user':
						switch (operation) {
							case 'getUserInfo':
								const response = await this.helpers.request({
									baseURL: baseUrl,
									method: 'GET',
									url: 'user/info/',
									headers: {
										'Access-Token': oauthTokenData.data.access_token,
									},
								});
								item.json = JSON.parse(response);
								break;
						}
						break;
				}
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
