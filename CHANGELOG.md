# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2025-02-26

### Fix

HTTP/2 request are problematic with mitmdump and disabled for better stability.

## [0.2.3] - 2025-02-26

### Added

- **Enhanced Request/Response Body Viewer**
  - Syntax highlighting for JSON, XML, and form data
    - JSON: Colored keys (sky blue), strings (emerald green), numbers (amber), booleans (purple), null (red)
    - Form data: Colored keys with nested JSON highlighting
    - XML: Colored tags (pink), attributes (light blue), strings (green)
  - Auto-load small bodies (< 10KB) for better performance
  - Show "Load body (XX KB)" button for large bodies (> 10KB)
  - Support for rendering HTML (preview/source toggle), images, and JavaScript
  - Auto-detection of content type when MIME type is missing
  - Formatted view for URL-encoded form data with pretty-printed JSON values
- Show changelog/release notes in auto-updater dialog
- Multi-architecture support for macOS
  - Added Intel (x64) Mac support alongside Apple Silicon (arm64)
  - Both DMG files will be created during build process
- Dual-arch Homebrew cask support

### Changed

- Improved database migration system with better error handling and logging
- Added `verifyColumns()` to ensure database schema consistency on app boot

### Fixed

- Fixed database migrations not running properly for new columns
- Fixed SQLite error when `response_body_size` column didn't exist
