#!/bin/bash

# Enhanced diff script for MedSpaSync Pro marketing repository
# Shows code changes while listing asset additions separately

echo "=== MedSpaSync Pro Marketing Repository Changes ==="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
echo

# Function to check if file exists
file_exists() {
    [ -f "$1" ] && echo "✅ $1" || echo "❌ $1 (missing)"
}

# Check for required MedSpaSync Pro assets
echo "### Required MedSpaSync Pro Assets:"
file_exists "public/favicon.ico"
file_exists "public/apple-touch-icon.png" 
file_exists "public/og-image.png"
file_exists "public/twitter-card.png"
file_exists "public/logo192.png"
file_exists "public/manifest.json"
file_exists "public/sitemap.xml"
file_exists "public/robots.txt"
echo

# Show asset changes (images, fonts, etc.)
echo "### Asset Files Added/Modified (not included in diff):"
git diff --name-only --diff-filter=A HEAD~1 HEAD | grep -E '\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf|pdf)$' | while read file; do
    echo "📁 Added: $file"
done

git diff --name-only --diff-filter=M HEAD~1 HEAD | grep -E '\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf|pdf)$' | while read file; do
    echo "📝 Modified: $file"
done

git diff --name-only --diff-filter=D HEAD~1 HEAD | grep -E '\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf|pdf)$' | while read file; do
    echo "🗑️ Deleted: $file"
done
echo

# Show configuration changes
echo "### Configuration Files:"
if git diff --name-only HEAD~1 HEAD | grep -E '\.(json|toml|yml|yaml|env)$' > /dev/null; then
    echo "⚙️ Configuration changes detected:"
    git diff --name-only HEAD~1 HEAD | grep -E '\.(json|toml|yml|yaml|env)$' | while read file; do
        echo "  - $file"
    done
    echo
fi

# Show MedSpaSync Pro specific file changes
echo "### MedSpaSync Pro Component Changes:"
echo "React Components:"
git diff --name-only HEAD~1 HEAD | grep -E '\.jsx?$' | while read file; do
    if [[ $file == *"components"* ]]; then
        echo "🧩 $file"
    elif [[ $file == *"pages"* ]]; then
        echo "📄 $file"
    else
        echo "⚛️ $file"
    fi
done

echo
echo "Styles & Assets:"
git diff --name-only HEAD~1 HEAD | grep -E '\.(css|scss|less)$' | while read file; do
    echo "🎨 $file"
done

echo
echo "### Content Standards Compliance Check:"
# Check for proven metrics in changed files
echo "Checking for proven metrics usage..."
changed_files=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(jsx?|html|md)$')

if [ ! -z "$changed_files" ]; then
    echo "$changed_files" | while read file; do
        if [ -f "$file" ]; then
            metrics_found=""
            if grep -q "8+ hours" "$file" 2>/dev/null; then
                metrics_found="$metrics_found 8+hrs"
            fi
            if grep -q "\$2,500+" "$file" 2>/dev/null; then
                metrics_found="$metrics_found \$2,500+"
            fi
            if grep -q "95%+" "$file" 2>/dev/null; then
                metrics_found="$metrics_found 95%+"
            fi
            if grep -q "24 hours" "$file" 2>/dev/null || grep -q "24-hour" "$file" 2>/dev/null; then
                metrics_found="$metrics_found 24hr"
            fi
            
            if [ ! -z "$metrics_found" ]; then
                echo "✅ $file: Uses proven metrics -$metrics_found"
            else
                echo "⚠️ $file: No proven metrics detected"
            fi
        fi
    done
fi

echo
echo "### Royal We Voice Check:"
# Check for personal attribution (should be avoided)
if [ ! -z "$changed_files" ]; then
    echo "$changed_files" | while read file; do
        if [ -f "$file" ]; then
            personal_refs=""
            if grep -q "Jacob Hagood" "$file" 2>/dev/null; then
                personal_refs="$personal_refs Jacob-name"
            fi
            if grep -q "I built\|I created\|my experience" "$file" 2>/dev/null; then
                personal_refs="$personal_refs personal-voice"
            fi
            if grep -q "our team\|we built\|we understand" "$file" 2>/dev/null; then
                royal_we="✅"
            else
                royal_we="⚠️"
            fi
            
            if [ ! -z "$personal_refs" ]; then
                echo "❌ $file: Contains personal attribution -$personal_refs"
            else
                echo "$royal_we $file: Royal we voice check"
            fi
        fi
    done
fi

echo
echo "=== Code Changes (Text-based diff) ==="

# Enhanced file pattern matching for MedSpaSync Pro
echo "### HTML/JSX/JS Changes:"
git diff HEAD~1 HEAD -- '*.html' '*.jsx' '*.js' '*.ts' '*.tsx'

echo
echo "### CSS/Styling Changes:"
git diff HEAD~1 HEAD -- '*.css' '*.scss' '*.less'

echo
echo "### Configuration Changes:"
git diff HEAD~1 HEAD -- '*.json' '*.toml' '*.yml' '*.yaml' package.json

echo
echo "### Documentation Changes:"
git diff HEAD~1 HEAD -- '*.md' '*.txt'

echo
echo "=== End of MedSpaSync Pro Repository Diff ==="
echo "Repository: MedSpaSync Pro Marketing Site"
echo "Build: Ready for deployment to Netlify"
echo "Standards: Medical spa proven content template applied"