# How to Change Default Shell to Zsh on macOS

## Quick Method (macOS Catalina and later)

Zsh is already the default shell on macOS Catalina (10.15) and later. However, if you need to explicitly set it:

### Option 1: Using System Preferences (macOS Ventura and later)
1. Open **System Settings**
2. Go to **Users & Groups**
3. Right-click your user account and select **Advanced Options**
4. In the **Login shell** dropdown, select `/bin/zsh`
5. Click **OK** and restart your terminal

### Option 2: Using Terminal Command
Open Terminal and run:
```bash
chsh -s /bin/zsh
```

You'll be prompted for your password. After entering it, restart your terminal.

### Option 3: For VS Code Integrated Terminal
1. Open VS Code Settings (Cmd+,)
2. Search for "terminal integrated shell"
3. Click "Edit in settings.json"
4. Add or modify:
```json
{
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.profiles.osx": {
    "zsh": {
      "path": "/bin/zsh",
      "args": ["-l"]
    }
  }
}
```
5. Restart VS Code

## Verify Your Shell

Check your current shell:
```bash
echo $SHELL
```

Should output: `/bin/zsh`

Check available shells:
```bash
cat /etc/shells
```

## Configure Zsh (Optional)

### Install Oh My Zsh (Popular Zsh Framework)
```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Basic .zshrc Configuration
Create or edit `~/.zshrc`:
```bash
# Enable colors
autoload -U colors && colors

# History settings
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history

# Enable completion
autoload -U compinit && compinit

# Aliases
alias ll='ls -lah'
alias gs='git status'
alias gp='git pull'

# Node.js (if using nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

## Troubleshooting

### Command Not Found After Switching
If commands like `npm` or `node` are not found after switching to zsh:

1. Check your PATH:
```bash
echo $PATH
```

2. Add to `~/.zshrc`:
```bash
# Add common paths
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Add Node.js (if installed via Homebrew)
export PATH="/usr/local/opt/node/bin:$PATH"

# Or if using nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

3. Reload configuration:
```bash
source ~/.zshrc
```

### VS Code Terminal Still Using Bash
1. Close all terminal instances in VS Code
2. Restart VS Code completely
3. Open new terminal (Ctrl+` or Cmd+`)
4. Verify with: `echo $SHELL`

## Note About execute_command Tool

Even after changing your system's default shell to zsh, the `execute_command` tool in this AI assistant may still use `/bin/sh` due to how the VS Code extension is configured. This is a limitation of the tool's execution environment, not your system configuration.

For the Loan Origination System project, you can still:
- Use your terminal directly to start servers
- Run commands manually in VS Code's integrated terminal
- The application code itself is complete and functional

## Testing the Document Viewer Feature

After setting up zsh, start the servers manually:

**Terminal 1 (Backend):**
```zsh
cd backend
npm start
```

**Terminal 2 (Frontend):**
```zsh
cd frontend
npm run dev
```

Then test the document viewer as described in `START_SERVERS.md`.