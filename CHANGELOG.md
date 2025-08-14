# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6] - 2025-08-14

### Added
- Cookie authentication support for some API endpoints
- New `TiktokBusinessCookieApi` credential type for cookie-based authentication

## [0.0.5] - 2025-08-13

### Added
- **TikTok Business Easy Auth OAuth2 API**: New simplified OAuth2 authentication method
  - Custom authorization URL configuration
  - Custom access token URL configuration  
  - Custom advertiser get URL configuration
  - Simplified setup for custom OAuth2 implementations
- **Creative Tool APIs**: New creative asset management capabilities
  - Delete Creative Assets: Remove images and videos from creative asset library
  - Edit an Image: Modify images using various editing methods (fix size, gaussian padding, etc.)
- **Enhanced Image Management**: Extended image API support
  - List Images: Retrieve paginated list of images in advertiser account
  - Get Info About Images: Get detailed information about specific images
  - Update Image Name: Rename existing images in account
  - Upload Image: Upload new images from binary data, URLs, or file IDs
- **API Version Support**: Added support for TikTok Business API v1.2
  - Image upload functionality now supports both v1.2 and v1.3 API versions
  - Backward compatibility maintained with v1.3 as default

### Changed
- Updated README with comprehensive documentation for all new features
- Enhanced authentication options with multiple credential types
- Improved image upload capabilities with multiple input methods

### Technical Details
- Added `TiktokBusinessEasyAuthOAuth2Api` credential class
- Extended node operations with Creative Tool resource
- Enhanced image operations with full CRUD capabilities
- Added support for multiple API versions (v1.2, v1.3)

---

## Previous Releases

For releases prior to v0.0.5, please refer to the git commit history.
