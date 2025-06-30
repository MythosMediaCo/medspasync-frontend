# Gemini CLI Setup Guide for MedSpaSync Pro

## Overview

Gemini CLI is a powerful AI-powered tool that can enhance your ecosystem assessment, code analysis, and automation capabilities.

## Installation Status

✅ **Gemini CLI Installed**: Version 0.1.7  
❌ **API Key Required**: Need to set up authentication

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key (starts with `AIza...`)

### 2. Set Environment Variable

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

**Windows Command Prompt:**
```cmd
set GEMINI_API_KEY=your-api-key-here
```

**Permanent Setup (Windows):**
```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your-api-key-here", "User")
```

### 3. Verify Setup

```bash
gemini -p "Hello, test the connection" .
```

## Useful Gemini CLI Commands for MedSpaSync

### Security Analysis

```bash
# Find hardcoded secrets
gemini -p "Find all hardcoded API keys, secrets, passwords, or sensitive data in this codebase" -a

# Security vulnerability scan
gemini -p "Analyze this code for security vulnerabilities, focusing on authentication, authorization, and data protection" -a

# HIPAA compliance check
gemini -p "Check this healthcare application for HIPAA compliance issues, focusing on data protection, access controls, and audit logging" -a
```

### Code Quality Analysis

```bash
# Code review
gemini -p "Perform a comprehensive code review of this application, identifying bugs, performance issues, and improvement opportunities" -a

# Architecture analysis
gemini -p "Analyze the architecture of this multi-application system, identify potential issues, and suggest improvements" -a

# Dependency analysis
gemini -p "Review all package.json files and identify outdated, vulnerable, or unnecessary dependencies" -a
```

### Performance Analysis

```bash
# Performance optimization
gemini -p "Analyze this codebase for performance bottlenecks and suggest optimization strategies" -a

# Bundle size analysis
gemini -p "Review frontend code for bundle size optimization opportunities" -a
```

### Documentation Generation

```bash
# Generate documentation
gemini -p "Generate comprehensive documentation for this codebase, including API documentation, setup instructions, and deployment guides" -a

# Create README
gemini -p "Create a professional README.md file for this project" -a
```

## Advanced Usage

### Interactive Mode
```bash
gemini -p "Let's work together to improve this codebase. Start by analyzing the current state and suggest the top 3 improvements needed." -a
```

### File-Specific Analysis
```bash
# Analyze specific files
gemini -p "Review this security configuration file for best practices" medspasync-backend/config/azure-keyvault.js

# Compare implementations
gemini -p "Compare the Azure Key Vault implementations across all applications and identify inconsistencies" medspasync-*/**/azure-keyvault.js
```

### Automated Fixes
```bash
# Suggest fixes for security issues
gemini -p "Identify security issues in this code and suggest specific fixes with code examples" -a -y

# Refactor code
gemini -p "Refactor this code to follow best practices and improve maintainability" -a -y
```

## Integration with Development Workflow

### Pre-commit Analysis
```bash
# Add to your pre-commit hooks
gemini -p "Quick security check: scan for any hardcoded secrets or obvious vulnerabilities" -a
```

### CI/CD Integration
```bash
# Add to your CI pipeline
gemini -p "Automated code review: check for security issues, code quality, and compliance" -a
```

### Regular Audits
```bash
# Weekly security audit
gemini -p "Comprehensive security audit: check for vulnerabilities, compliance issues, and best practices" -a
```

## Best Practices

1. **Use Specific Prompts**: Be specific about what you want Gemini to analyze
2. **Include Context**: Use `-a` flag to include all files for comprehensive analysis
3. **Review Suggestions**: Always review Gemini's suggestions before implementing
4. **Iterative Analysis**: Use follow-up prompts to dive deeper into specific issues
5. **Document Findings**: Keep records of Gemini's analysis for future reference

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   # Check if API key is set
   echo $env:GEMINI_API_KEY
   
   # Re-set if needed
   $env:GEMINI_API_KEY="your-api-key-here"
   ```

2. **Rate Limiting**
   - Gemini has rate limits, add delays between requests
   - Use `-d` flag for debug mode to see detailed error messages

3. **Large Codebases**
   - Use `-a` flag carefully with large codebases
   - Consider analyzing specific directories or files

### Getting Help

```bash
# Debug mode
gemini -d -p "Test prompt" .

# Version info
gemini -v
```

## Example Workflow

1. **Initial Setup**
   ```bash
   $env:GEMINI_API_KEY="your-api-key"
   gemini -p "Hello, ready to analyze MedSpaSync Pro ecosystem" .
   ```

2. **Security Analysis**
   ```bash
   gemini -p "Find all security vulnerabilities in this healthcare application" -a
   ```

3. **Code Review**
   ```bash
   gemini -p "Review the Azure Key Vault integration for best practices" -a
   ```

4. **Generate Fixes**
   ```bash
   gemini -p "Suggest specific fixes for the security issues found" -a -y
   ```

---

**Ready to enhance your ecosystem assessment with AI-powered analysis!**

Set your API key and start with a security analysis to identify critical issues in your MedSpaSync Pro ecosystem. 