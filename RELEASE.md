# 1.5.5

_2025_01_15_

## New features

- Live Session
  - In LinTO Studio, you can now connect external audio streams with live transcription and translation
  - It also supports live transcription of your device microphone
  - Once finished, these live transcriptions are saved to your media library, with support for multiple channels and translation languages
- Backoffice and platform roles
  - Add platform administrator role for managing all organizations and users
  - Other platform roles are also available:
    - Organization initiators who have the right to create new organizations
    - Session operators for managing live sessions
    - System administrators who can manages all organizations
  - Add permissions per organization so you can customize each organization
    - 'Upload media' permission
    - 'Generate summary' permission
    - 'Create session' permission
- SSO
  - New login page with support of external SSO login by OIDC
  - Organizations can specify a matching mail domain to automatically add users to that organization

## Improvements

- Add search in transcription and highlights
- New speaker menu in editor
- Improve docx export
- Add support for interface themes
- The upload page has been improved and renamed "Start menu"
- Users can now import media from an external url

## Fixes

- Fix subtitle editor when deleting the last screen
- Fix default organization permissions upon user creation
- Select first transcription service by default when uploading media
- Multi-language support on media upload
- Fix member rights when uploading a media
- Fix tab name in export page to come from api instead of being hardcoded in interface
- Fix max number of speaker when diarization is set to auto
- Improved and better handling of LLM results

# 1.4.2

- English language support for the transcription

# 1.4.1

- Added metadata

# 1.4.0

- Merge conversation-manager to one repository
- Rename conversation-manager to linto-studio
