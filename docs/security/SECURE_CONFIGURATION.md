# 🔐 Secure Configuration Guide

## Environment Variables Setup

Create a `.env` file in the project root with the following variables:

```bash
# QuickBooks Integration
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# NYC API Keys (Optional)
DOF_API_KEY=your_dof_api_key_here
DSNY_API_KEY=your_dsny_api_key_here
FDNY_API_KEY=your_fdny_api_key_here

# Security Configuration
ENCRYPTION_KEY=your_32_character_encryption_key_here
JWT_SECRET=your_jwt_secret_here

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
```

## Security Best Practices

1. **Never commit .env files** - They are already in .gitignore
2. **Use strong encryption keys** - Generate 32-character random strings
3. **Rotate credentials regularly** - Especially for production
4. **Use different credentials** for development, staging, and production
5. **Monitor credential usage** - Set up alerts for unusual activity

## QuickBooks Credential Security

The QuickBooks credentials are now:
- ✅ Loaded from environment variables
- ✅ Encrypted in memory
- ✅ Never logged or exposed
- ✅ Rotated automatically when needed

## Supabase Security

- ✅ Row Level Security (RLS) enabled
- ✅ JWT authentication required
- ✅ Service role key encrypted
- ✅ API keys validated

## NYC API Security

- ✅ API keys encrypted at rest
- ✅ Rate limiting implemented
- ✅ Request validation enabled
- ✅ Error handling secure

## Implementation

The system now uses the `CredentialManager` class to:
1. Load credentials from environment variables
2. Encrypt sensitive data with AES-256
3. Validate credential formats
4. Rotate credentials when needed
5. Monitor credential health

## Migration from Hardcoded Credentials

If you have existing hardcoded credentials:
1. Remove them from the codebase
2. Add them to your `.env` file
3. Update your deployment configuration
4. Test the new secure implementation
