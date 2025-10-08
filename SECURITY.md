# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in UniStay, please report it by emailing the maintainers directly. Please do not open a public issue for security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Best Practices

### For Developers

1. **Never commit secrets**: Always use `.env` files for sensitive data
2. **Rotate API keys**: If secrets are accidentally exposed, rotate them immediately
3. **Keep dependencies updated**: Run `pnpm audit` and `pnpm update` regularly
4. **Use HTTPS**: Always use HTTPS in production environments
5. **Validate input**: All user input should be validated and sanitized
6. **Rate limiting**: Implement rate limiting for API endpoints in production

### For Deployments

1. **Strong secrets**: Use cryptographically strong random keys for JWT_SECRET and ADMIN_SECRET_KEY
   ```bash
   # Generate strong keys using Node.js
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Environment variables**: Never hardcode secrets in code
3. **Database access**: Restrict database access to only necessary services
4. **Regular backups**: Maintain regular database backups
5. **Monitor logs**: Set up monitoring and alerting for suspicious activity

### Authentication & Authorization

- Passwords are hashed using bcrypt with 10 rounds
- JWT tokens are used for session management
- Email verification is required for new accounts
- Admin routes are protected by admin secret key

### Known Security Considerations

- Currently no rate limiting implemented (add in production)
- Consider implementing CSRF protection for state-changing operations
- Consider adding 2FA for admin accounts
- Consider implementing password reset functionality with time-limited tokens

## Security Checklist Before Going Public

- [x] `.env` files in `.gitignore`
- [x] No secrets committed to git history
- [x] Example environment files provided
- [x] Security documentation created
- [ ] Rotate any exposed API keys (check your .env file!)
- [ ] Use strong random secrets in production
- [ ] Enable HTTPS in production
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Review and update dependencies

## Dependencies

We use automated dependency scanning. To check for vulnerabilities:

```bash
# In backend or frontend directory
pnpm audit

# Fix automatically if possible
pnpm audit --fix
```

## Disclosure Timeline

- Day 0: Vulnerability reported to maintainers
- Day 1-2: Maintainers confirm and assess severity
- Day 3-7: Fix developed and tested
- Day 7-14: Fix deployed and users notified
- Day 14+: Public disclosure (if appropriate)
