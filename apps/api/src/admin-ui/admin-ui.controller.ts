import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class AdminUiController {
  private htmlCache: string | null = null;

  private getHtml(): string {
    if (this.htmlCache) return this.htmlCache;

    const possiblePaths = [
      join(__dirname, 'admin.html'), // dist/src/admin-ui/admin.html
      join(process.cwd(), 'src/admin-ui/admin.html'), // when cwd = apps/api
      join(process.cwd(), 'apps/api/src/admin-ui/admin.html'), // when cwd = root
      join(__dirname, '..', 'admin-ui', 'admin.html'),
    ];

    for (const p of possiblePaths) {
      try {
        if (existsSync(p)) {
          const content = readFileSync(p, 'utf8');
          if (content && content.length > 100) {
            this.htmlCache = content;
            return content;
          }
        }
      } catch {}
    }

    // fallback minimal login page if file not found
    return `<!doctype html><html><head><meta charset="utf-8"><title>СВОЙ Admin</title></head><body style="background:#0b1020;color:#fff;font-family:Arial;padding:24px">
<h1>СВОЙ — Admin fallback</h1>
<p>admin.html не найден в сборке. Но логин по паролю работает:</p>
<form id="f"><input id="l" placeholder="login" value="admin"/><input id="p" placeholder="password" type="password"/><button type="submit">Войти</button></form>
<div id="s"></div>
<script>
const API=location.origin;
document.getElementById('f').onsubmit=async(e)=>{
  e.preventDefault();
  const login=document.getElementById('l').value;
  const password=document.getElementById('p').value;
  const res=await fetch(API+'/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({login,password})});
  const t=await res.text();
  document.getElementById('s').textContent=t;
  if(res.ok) location.reload();
};
<\/script>
</body></html>`;
  }

  @Get('admin')
  adminPanel(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(this.getHtml());
  }

  @Get('admin-panel')
  adminPanelAlias(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(this.getHtml());
  }

  @Get('')
  root(@Res() res: Response) {
    const accept = (res.req.headers.accept || '') as string;
    // Если браузер просит html - даем админку, если API клиент - даем json
    if (accept.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(this.getHtml());
    } else {
      res.json({ ok: true, message: 'СВОЙ API', docs: '/docs', admin: '/admin', health: '/health' });
    }
  }
}
