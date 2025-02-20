# LinTO Studio API

Transcription / summarization / annotation api for recorded audio files

## Installation

### Install dependencies

```bash
  npm install
```

### Set environment variables

Duplicate _".envdefault"_ file to create _".env"_ file

```bash
cp .envdefault .env
```

### Run the project

```bash
  npm run start
```

## Migration

MongoMigration is a component that allows to migrate data from one version of the conversation manager to another one.

### Enabling migration

Two environment variables are required to use the component:

- `COMPONENTS` must contain the desired to be loaded `MongoMigration`.
- `DB_MIGRATION_TARGET` must be set to the desired version (1.0.0)

### Migration process

The migration process is composed of two steps:

### Add migration version

The first step to add a new version is done by the creation of a new folder in `components/MongoMigration/version/`. The name of the folder must be the version number of the migration (it's better if they match _RELEASE.md_ format). Then create a new file `collections_name.js` in that contain the needed data:

```javascript
module.exports = {
  up: async (db) => {
    // migration code example
    // db.collection(collections_name).updateMany({}, { $set: migration_update })
  },
  down: async (db) => {
    // rollback code example
    // db.collection(collections_name).updateMany({}, { $unset: migration_update })
  },
}
```

Make sure to create a `version.js` file to update the version on a migration step.

### Enable session API

To enable `linto-studio` to load the session API feature, set the `SESSION_API_ENDPOINT=http://session_api:8002/v1` environment variable. Once configured, the API will automatically load the proxy and redirect all requests to the session API. The corresponding Swagger documentation will also be loaded when the environment variable is set.

To enable live session monitoring, the MQTT broker environment must be properly configured.

```bash
BROKER_HOST=localhost
BROKER_PORT=1883
BROKER_USERNAME=
BROKER_PASSWORD=
BROKER_KEEPALIVE=60
BROKER_PROTOCOL=mqtt
```

### Back Office Access

#### Creating a Superuser for Back Office Access

The superuser has an administrative access to the back office, which includes managing organization creation, assigning default permissions, and overseeing users within organizations. To set up a superuser, configure the following environment variables in your `.env` file:

```bash
SUPER_ADMIN_EMAIL=superadmin@mail.fr
SUPER_ADMIN_PWD=superadminpassword
```

The superuser will have the authority to define organization-wide settings, manage user roles and can monitore all live sessions.

#### Default Permissions for User-Created Organizations

By default, each newly created organization is granted the following permissions, which define what members can do within the organization:

- **Upload**: Grants access to use the transcription service to upload and process media.
- **Summary**: Enables the use of large language models (LLM) to generate summaries for uploaded media.
- **Session**: Provides access to the Session API, allowing the organization to create live meetings.

These default permissions can be set up on project startup or adjusted individually in the back office by the superuser.
To configure default permissions at startup, set the following variable in the `.env` file:

```bash
ORGANIZATION_DEFAULT_PERMISSIONS=upload,summary,session
```

> **Note**: If any default permission is removed, future organizations will not have access to that functionality unless the superuser grants it in the back office.
> **Note**: To disable all permissions, set `ORGANIZATION_DEFAULT_PERMISSIONS=none`

#### Member Roles in an Organization

An organization can be structured with various user roles, each granting specific permissions. The default role is **Member**, and each subsequent role inherits the permissions of the previous one, as outlined below:

- **Member**: Can view and edit any media regarding of the media permission.
- **Uploader**: Can create and upload new media.
- **Meeting Manager**: Has the ability to initiate and manage sessions.
- **Maintainer**: Manages all users within the organization.
- **Admin**: Has full control over all organization actions and settings, including permissions and user management.

These roles allow for a structured, role-based permission system within each organization, ensuring that each user has the appropriate level of access based on their responsibilities.
