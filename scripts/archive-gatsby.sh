#!/bin/bash
set -e

echo "Archiving Gatsby files..."

# Delete build artifacts and dependencies (if they exist)
[ -d ".cache" ] && rm -rf .cache && echo "Deleted .cache"
[ -d "node_modules" ] && rm -rf node_modules && echo "Deleted node_modules"
[ -d "public" ] && rm -rf public && echo "Deleted public"
[ -f ".env.production" ] && rm .env.production && echo "Deleted .env.production"

# Create archive directory
mkdir -p _gatsby

# Move all files/folders except:
# - z_*.md (planning docs)
# - .github folder
# - .git folder
# - static folder (needed for Astro)
# - _gatsby itself
# - archive script
for item in *; do
  # Skip items that should not be moved
  if [[ "$item" == z_*.md ]] || \
     [[ "$item" == ".github" ]] || \
     [[ "$item" == ".git" ]] || \
     [[ "$item" == "static" ]] || \
     [[ "$item" == "_gatsby" ]] || \
     [[ "$item" == "scripts" ]]; then
    echo "Keeping: $item"
    continue
  fi
  
  # Move everything else
  echo "Moving to _gatsby: $item"
  mv "$item" _gatsby/
done

# Also move hidden files (except .git and .github)
for item in .[^.]*; do
  if [[ "$item" == ".git" ]] || \
     [[ "$item" == ".github" ]]; then
    continue
  fi
  
  if [[ -e "$item" ]]; then
    echo "Moving to _gatsby: $item"
    mv "$item" _gatsby/
  fi
done

# Add _gatsby to .gitignore
if ! grep -q "^_gatsby/$" .gitignore 2>/dev/null; then
  echo "_gatsby/" >> .gitignore
  echo "Added _gatsby/ to .gitignore"
fi

echo "✅ Gatsby files archived to _gatsby/"
echo "You can now reference old files in _gatsby/ during migration"
