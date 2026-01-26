# Debugging Production Issues

When I report a bug, follow this investigation protocol:

## 1. Information Gathering
Ask these questions first (if I haven't provided the info):
- **What**: Exact error message or behavior?
- **Where**: URL/Page where it happened?
- **Who**: User ID or Role involved?
- **When**: Time of occurrence?
- **Logs**: "Can you paste the backend logs or browser console errors?"

## 2. Root Cause Analysis
Propose top 3 likely causes:
1. ...
2. ...
3. ...

## 3. Investigation Steps
List distinct steps to narrow it down:
- "Check database user table for..."
- "Inspect network tab for 400/500 responses..."
- "Verify environment variable X..."

## 4. The Fix
Once the issue is identified:
- Propose the *safest, minimal* fix.
- Explain *why* this fixes it.
- **Verification**: How can I confirm it's gone? (e.g., "Retry the request with...")
