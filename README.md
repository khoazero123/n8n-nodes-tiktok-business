# n8n-nodes-tiktok-business

This is an n8n community node. It lets you use TikTok Business API in your n8n workflows.

TikTok Business API is a comprehensive platform that allows advertisers to programmatically manage their TikTok advertising campaigns, creative assets, and account information.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### User Actions
- **Get User Info**: Retrieve up-to-date information about the authenticated user

### Advertiser Actions
- **Get Authorized Ad Accounts**: Retrieve all ad accounts that the authenticated user has access to
- **Get Ad Account Details**: Get detailed information about specific advertiser accounts

### Image Actions
- **List Images**: Retrieve a paginated list of images in an advertiser account
- **Get Info About Images**: Get detailed information about specific images
- **Update Image Name**: Rename an existing image in your account
- **Upload Image**: Upload new images to your TikTok Business account from binary data, URLs, or file IDs

### Creative Tool Actions
- **Delete Creative Assets**: Remove images and videos from your creative asset library
- **Edit an Image**: Modify images using various editing methods (fix size, gaussian padding, etc.)

## Credentials

This node supports two authentication methods:

### OAuth2 Authentication
1. Create a TikTok Business API application in the [TikTok for Business Developer Portal](https://business-api.tiktok.com/portal/)
2. Obtain your Client ID and Client Secret
3. Configure the OAuth2 redirect URL in your TikTok app settings
4. Use the "TikTok Business OAuth2 API" credential type in n8n

### Easy Auth (Simplified OAuth2)
1. Use the "TikTok Business Easy Auth OAuth2 API" credential type
2. Provide the authorization URL, access token URL, and advertiser get URL
3. This method is useful for custom OAuth2 implementations or when using pre-configured endpoints

### Cookie Authentication
1. Use the "TikTok Business Cookie API" credential type
2. Provide the CSRF token and session ID

**Prerequisites:**
- A TikTok Business account
- A registered application in the TikTok for Business Developer Portal
- Appropriate permissions for the operations you want to perform

## Compatibility

- **Minimum n8n version**: 1.100.0
- **Tested with n8n versions**: 1.100.0+
- **Node.js version**: 20.15+
- **TikTok Business API versions**: v1.2, v1.3 (default)

## Usage

### Basic Workflow Examples

**Getting Started:**
1. Set up your TikTok Business API credentials
2. Use "Get Authorized Ad Accounts" to retrieve your advertiser IDs
3. Use the advertiser ID in subsequent operations

**Image Management:**
- Upload images from your workflow using binary data or URLs
- List and manage your creative assets
- Edit images programmatically with various methods

**Account Management:**
- Retrieve user information and account details
- Get comprehensive advertiser account information including contact details, balance, and settings

### Important Notes
- Some operations require specific advertiser permissions
- Image uploads support multiple formats and methods (binary data, URLs, file IDs)
- The node supports both v1.2 and v1.3 of the TikTok Business API
- Rate limits apply according to TikTok's API documentation

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [TikTok Business API Documentation](https://business-api.tiktok.com/portal/docs)
* [TikTok for Business Developer Portal](https://business-api.tiktok.com/portal/)
* [TikTok Business API Authentication Guide](https://business-api.tiktok.com/portal/docs?id=1832209711206401)
