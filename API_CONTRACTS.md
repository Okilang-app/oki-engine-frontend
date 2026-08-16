# Oki Creator Localization Engine — API Contracts

## Base URL
```
http://127.0.0.1:8000/api
```

## Common Patterns
- All endpoints return RFC 9457 problem details on error
- `X-Correlation-ID` header is propagated (UUIDv7)
- Command endpoints accept `Idempotency-Key` header
- Auth: Bearer token (Keycloak OIDC)

## Creators
### POST /creators
Create a new creator.
```json
{
  "legal_name": "string",
  "public_name": "string",
  "channel_url": "string",
  "primary_language": "string",
  "contact_email": "string"
}
```
Response: `CreatorResponse`

### GET /creators/{creator_id}
Response: `CreatorResponse`

### POST /creators/{creator_id}/agreements
Create agreement for creator.
Response: `AgreementResponse`

## Rights
### POST /agreements/{agreement_id}/approve
Approve an agreement.
Response: `AgreementDecisionResponse`

### POST /agreements/{agreement_id}/revoke
Revoke an agreement.
Response: `AgreementDecisionResponse`

## Assets
### POST /assets/upload-url
Get presigned multipart upload URLs.
Response:
```json
{
  "upload_id": "uuid",
  "presigned_urls": ["string"]
}
```

### POST /assets/complete-upload
Complete upload with SHA-256 checksum.
```json
{
  "upload_id": "uuid",
  "sha256": "string"
}
```
Response: `AssetResponse`

### POST /assets/{asset_id}/validate-rights
Validate rights for an asset.
Response: `{ "valid": boolean }`

## Jobs
### POST /jobs/analyze
Start analysis pipeline.
```json
{ "job_id": "uuid" }
```
Response: `{ "task_id": "uuid" }`

### POST /jobs/translate
Start translation.
```json
{ "job_id": "uuid", "target_language": "string" }
```
Response: `{ "task_id": "uuid" }`

### POST /jobs/dub
Start dubbing.
Response: `{ "task_id": "uuid" }`

### POST /jobs/render
Start rendering.
Response: `{ "task_id": "uuid" }`

### POST /jobs/generate-shorts
Generate Shorts candidates.
Response: `{ "task_id": "uuid" }`

### POST /jobs/cancel
Cancel a job.
Response: `{ "cancelled": boolean }`

### GET /jobs/{job_id}/timeline
Get analysis timeline.
Response: `TimelineItem[]`

## Translations
### GET /jobs/{job_id}/translations/{language}
Response: `{ segments: TranslationSegment[] }`

### POST /translations/{translation_id}/segments/{segment_id}/revise
```json
{ "text": "string" }
```
Response: `TranslationSegment`

## Reviews
### GET /reviews/{job_id}
Response: `ReviewPackageResponse`

### POST /reviews/{job_id}/approve
Response: `{ "approved": boolean }`

### POST /reviews/{job_id}/reject
Response: `{ "rejected": boolean }`

## Publications
### POST /publications
Create publication.
Response: `PublicationResponse`

### POST /publications/{id}/upload-private
Upload as private.
Response: `{ "uploaded": boolean }`

### POST /publications/{id}/publish
Publish video.
Response: `{ "published": boolean }`

### POST /publications/{id}/unpublish
Unpublish video.
Response: `{ "unpublished": boolean }`

## YouTube
### POST /youtube/connect
Initiate OAuth flow.

### POST /youtube/callback
OAuth callback.

### POST /youtube/revoke
Revoke OAuth connection.

## Analytics
### GET /analytics/creators
### GET /analytics/videos
### GET /analytics/languages
### GET /analytics/campaigns
### GET /analytics/oki-conversions
All return: `AnalyticsSummary`

## Finance
### GET /finance/payouts
### POST /finance/payouts/{run_id}/approve
Response: `PayoutRunResponse`
