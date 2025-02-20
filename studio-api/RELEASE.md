# 1.5.5

More information on RELEASE file in the main folder

- Added global platform role
- Added global organization role
- Handle an oidc connection (sso)
- Added a backoffice API
  - Organization can have an matchin mail that will auto add user to that organization
- Switched the polling of llm to a websocket
  - Improved and better handling of llm result (error, success, ...)
- Session API
  - Added bot, template and session proxy
  - Added a proxy to the session API
  - Handle a better handling of session saving process
  - Save multiple translation per conversation
  - Added WS connection and MQTT connection

# 1.5.0

- Added type to conversation
  - Allow to handle multi channel conversation
- Merged the session and delivery api to linto-studio

# 1.4.3

- Update export
- Handle llm
  - Fetch running llm service with llm-gateway
  - Handle summary generation with llm-gateway api
  - Generate summary docx / pdf
  - Added pdf preview

# 1.4.2

- Refactored Taxonomy API:
  - Added a scope for category
  - Cleaned and optimized code
  - Reworked category / type to manage highlight and conversation_metadata type
- Normalization feature
  - Support for english transcription
  - Handle segment language support

# 1.4.1

- Added metadata api

# 1.4.0

- Added An hightlight API
- Change the default keyword category color

# 1.3.0

- Introduced a new feature: Subtitle API
  - Enables the generation of subtitles with customizable settings such as screen size, screen lines, etc.
  - Supports the generation of SRT, VTT, and Studio formats.
- Added DOCX conversion export functionality.
- Improved user notification handling via email.
- Implemented a validator for a fixed structure.
- Included multiple tests for normalization.
- Various fixes made to the API.
- Modified to fetch 'jobs_log' only in the event of a job error.
- Several minor fixes.

# 1.2.0

- Manage multiple auth
- Added refresh token

# 1.1.3

- Refactoring some api path to handle new role
- Fixing mailing
  - Manage the email checking on the module side
- Handle default category on organization creation (highlights)
- On keywords generation, handle the tag creation
- Added highlight api
- Added a batch support for action on conversation
- Replace polling by fetching ressource on conversation access

# 1.1.2

- Added pagination on conversation listing (shared and favorite)
- Multiple optimisation
- Handle tags for shared and favorite conversation listing
- Update migration for memberRights string to int and new role
- Add a new role : uploader
- Refactoring some api path to handle new role
- Fixing mailing
  - Manage the email checking on the module side
- Handle default category on organization creation (highlights)
- On keywords generation, handle the tag creation
- Added highlight api

# 1.1.1

- Added tags feature
- Document creation now return their information
- Refactoring of all search api to use the same query
- All search api now can be used on the listing api
- Updated API path
- Updated Swagger documentation
- Update MongoDB model with an update on the component MongoMigration
- Added an docx download feature on conversation

# 1.1.0

- Mongo model update
- Refactoring of mailing library

# 1.0.3

- Implementation of a migration system
  - Swagger schema match the database version
- Added an import endpoint to create conversation
- Manage email sending on some route (share external user, reset password, create user)
- Fix a bug on missing conversation audio
- Fix a bug on first mongo migration (on version collection creation)

# 1.0.2

- Swagger
  - Added swagger documentation
  - Added swagger ui
- Handle mailing service
  - reset password
- Handle magic-link authentification
- API now manage split conversation turn
- API now manage multi-file for conversation
- Update list service to get information on gateway
- Added an merge turn api

# 1.0.1

- API updates
  - Update transcription on job completion (not other information)
  - Added api to handle turn
  - Removed lock system
  - Handle file deletion
  - Update conversation creation
  - Added a list-service from api gateway
- Cleaned up code
  - Original file is now send to the transcription service
  - Original file is now deleted after transcription
  - Remove folder path configuration from environment
- Environement
  - Change STT_SERVICE to GATEWAY_SERVICE
  - TRANSCRIPTION_SERVICE is a json object
- Component
  - Added a WorkerWatcher to manage worker container

# 1.0.0

- Handle sharedBy user information
- Added user middleware to protect private user
- Better management of private user / orga

# 0.2.0

- Split backend and frontend
- Audio transformation with ffmpeg
- Added a lock system
- Lot of fix
- Add a cron backup system

# 0.1.2 - 2022/02/22

- New transcribe API
- Handle transcription job status updates
- Big cleanup (component, lib, exctract vue_app from component, etc)
- Remove unused environement variables

# 0.1.1 - 2021/07/20

Unstable version

- completion of "editText" function + add "updateSpeakerMap" (to be tested)
- front-end css updates
- front end bug fix
- Add "user settings" view
- interface traduced in FR and EN
- add environment variable
- Add docker files and a script to start services
- Add Jenkins config

# 0.1.0

- First version of Conversation-Manager
