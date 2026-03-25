---
name: network-proxy
description: Helps when network-related commands (like curl, git, npm, pip, brew) are failing, timing out, or running slowly due to network issues. It suggests and applies proxy environment variables to fix connectivity problems.
---

# Network Proxy Skill

This skill helps you troubleshoot and fix network connectivity issues by applying proxy settings.

## When to use
- A command fails with a network error (e.g., "connection refused", "timeout", "network unreachable").
- A download or installation is extremely slow.
- You explicitly ask to "use proxy" or "turn on proxy".

## Default Proxy Configuration
Unless the user specifies otherwise, assume the local proxy is running at:
- HTTP Proxy: `http://127.0.0.1:7897`
- HTTPS Proxy: `http://127.0.0.1:7897`
- SOCKS Proxy: `socks5://127.0.0.1:7897`

(Note: Port 7897 is common for tools like Clash/V2Ray. Adjust if the user provides a different port.)

## How to Apply

### 1. Temporary (One-off command)
For a single command execution, prepend the environment variables:

```bash
export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897 all_proxy=socks5://127.0.0.1:7897
[original command]
```

Example:
```bash
export https_proxy=http://127.0.0.1:7897 http_proxy=http://127.0.0.1:7897 all_proxy=socks5://127.0.0.1:7897
git clone https://github.com/some/repo.git
```

### 2. Session-wide (Current terminal)
To set it for the current session:

```bash
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export all_proxy=socks5://127.0.0.1:7897
```

### 3. Unset (Turn off)
To clear the proxy settings:

```bash
unset https_proxy http_proxy all_proxy
```

## Troubleshooting
If the default port (7897) doesn't work:
1. Ask the user for their proxy port (common alternatives: 1080, 1087, 8080).
2. Check if a proxy tool is running.
