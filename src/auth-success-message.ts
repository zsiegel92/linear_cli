export const SUCCESS_MESSAGE = `<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb;">
  <div style="text-align: center; max-width: 480px; padding: 40px;">
	<h1 style="font-size: 24px; color: #111; margin-bottom: 8px;">Login successful</h1>
	<p style="color: #555; font-size: 16px; line-height: 1.5;">You can close this window. Your OAuth token is stored at</p>
	<code style="display: inline-block; background: #e5e7eb; padding: 8px 16px; border-radius: 6px; font-size: 14px; color: #111; margin-top: 4px;">~/.config/linear-select-issue-cli/oauth-token.json</code>
	<p style="color: #777; font-size: 14px; line-height: 1.6; margin-top: 20px;">Your token was sent from Linear directly to your browser and stored on your computer by the CLI. The CLI has no server and your credentials are only ever held on your device.</p>
	<div style="background: #f0f0f0; border-radius: 8px; padding: 20px; margin-top: 24px; text-align: left;">
	  <p style="color: #111; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Usage</p>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli</code> <span style="color: #666; font-size: 13px;">Browse issues with fzf</span></div>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -m</code> <span style="color: #666; font-size: 13px;">Only your issues</span></div>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -p</code> <span style="color: #666; font-size: 13px;">Filter by project</span></div>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -l</code> <span style="color: #666; font-size: 13px;">Loop actions (copy branch, open in browser, etc.)</span></div>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -j</code> <span style="color: #666; font-size: 13px;">Output as JSON (good for agents!)</span></div>
	  <div style="margin-bottom: 8px;"><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -ut2</code> <span style="color: #666; font-size: 13px;">Unassigned, triaged, priority &ge; (High) &mdash; my personal favorite</span></div>
	  <div><code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 13px;">linear-cli -h</code> <span style="color: #666; font-size: 13px;">See all options</span></div>
	  <p style="color: #111; font-size: 14px; font-weight: 600; margin: 16px 0 8px 0;">Update</p>
	  <code style="display: block; background: #e5e7eb; padding: 8px 12px; border-radius: 4px; font-size: 13px;">npm install -g linear-select-issue-cli@latest</code>
	</div>
	<p style="color: #777; font-size: 13px; margin-top: 20px;">This is open-source software that you can audit yourself.</p>
	<div style="margin-top: 12px; display: flex; gap: 12px; justify-content: center;">
	  <a href="https://github.com/zsiegel92/linear_cli" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #24292e; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;"><svg height="18" width="18" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>GitHub</a>
	  <a href="https://www.npmjs.com/package/linear-select-issue-cli" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #cb3837; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;"><svg height="18" width="18" viewBox="0 0 256 256" fill="white"><path d="M0 256V0h256v256z" fill="#cb3837"/><path d="M48 48v160h80V80h48v128h32V48z" fill="white"/></svg>npm</a>
	</div>
	<p style="color: #aaa; font-size: 13px; margin-top: 28px;">Made with Love by Zach Siegel</p>
  </div>
</body>
</html>`;
