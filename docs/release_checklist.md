# Release Checklist

## Pre-Release
- [ ] **Code Freeze**: No new feature commits.
- [ ] **Local Testing**: Run `docker-compose up` and verify critical paths.
  - [ ] Login/Register
  - [ ] Main Feature usage (Booking/Chat)
- [ ] **Tests**: Ensure CI pipeline passes (Green).
- [ ] **Migrations**: Check for pending DB migrations.
  - Test migration up/down locally.

## Deployment
- [ ] **Backup**: Trigger manual database backup (optional but recommended for major changes).
- [ ] **Merge**: Merge PR to `main`.
- [ ] **Monitor**: Watch CI/CD deployment logs.
  - [ ] Backend deploy success?
  - [ ] Frontend deploy success?
- [ ] **Database**: Apply migrations (if not automated).

## Post-Release Verification (Smoke Test)
- [ ] **Health Check**: Hit `/health` endpoint.
- [ ] **Login**: Log in with a test user in Prod.
- [ ] **Critical Flow**: Create a dummy record/action to verify DB writes.
- [ ] **Logs**: Check server logs for error spikes.

## Rollback Plan
- **Frontend**: Revert Vercel deployment to previous commit.
- **Backend**: Revert Railway/Render deployment.
- **Database**: 
  - If migration failed: Run `down` migration script (if data safely allows).
  - If data corrupted: Restore from backup taken in Pre-Release.
