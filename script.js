/* =========================================================
   小黑子鉴定中心（自封） · 交互逻辑
   纯原生 JS，无依赖；file:// 与静态托管均可运行
   ========================================================= */
(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pad = (n, len = 2) => String(n).padStart(len, '0');

  /* ---------------- 音效（Web Audio 实时合成，无音频文件） ---------------- */
  let soundOn = true;
  let actx = null;
  const getCtx = () => {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  };
  const tone = (freq, dur, type = 'square', vol = 0.045, delay = 0, endFreq = null) => {
    if (!soundOn) return;
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };
  const sfx = {
    click: () => tone(620, 0.06, 'square', 0.03),
    beep:  () => tone(880, 0.05, 'square', 0.025),
    ok:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.05, i * 0.1)),
    stamp: () => { tone(150, 0.16, 'sawtooth', 0.07, 0, 60); tone(90, 0.2, 'square', 0.04, 0.02, 45); },
    boing: () => tone(420, 0.4, 'sine', 0.07, 0, 120),
    alarm: () => [0, 0.18, 0.36].forEach((d) => tone(740, 0.13, 'square', 0.05, d, 520))
  };

  $('#soundBtn').addEventListener('click', () => {
    soundOn = !soundOn;
    const btn = $('#soundBtn');
    btn.setAttribute('aria-pressed', String(soundOn));
    btn.textContent = soundOn ? '🔊 提示音' : '🔇 提示音关';
    if (soundOn) sfx.click();
    toast(soundOn ? '提示音已打开（BGM 由右下角唱片单独控制）' : '提示音已关，BGM 不受影响');
  });

  /* ---------------- Toast ---------------- */
  let toastTimer = null;
  function toast(msg, ms = 2600) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /* ---------------- 背景音乐（本地 mp3，循环 23s） ---------------- */
  const bgm = $('#bgm');
  const bgmDock = $('#bgmDock');
  const bgmToggle = $('#bgmToggle');
  const bgmState = $('#bgmState');
  const bgmVolume = $('#bgmVolume');
  bgm.volume = Number(bgmVolume.value) / 100;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };

  function syncBgmUI(playing) {
    document.body.classList.toggle('bgm-on', playing);
    bgmToggle.setAttribute('aria-pressed', String(playing));
    bgmState.textContent = playing ? '循环播放中 · 收好鸡脚' : '点一下，有内味了';
  }

  function playBgm(silent = false) {
    const p = bgm.play();
    if (p && typeof p.then === 'function') {
      p.then(() => syncBgmUI(true)).catch(() => {
        syncBgmUI(false);
        if (!silent) toast('🎵 浏览器拦住了自动播放，点右下角唱片手动开启');
      });
    } else syncBgmUI(true);
    store.del('jijiao-bgm-off');
  }
  function pauseBgm() {
    bgm.pause();
    syncBgmUI(false);
    store.set('jijiao-bgm-off', '1');
  }

  bgmToggle.addEventListener('click', () => {
    if (bgm.paused) playBgm(); else pauseBgm();
    sfx.click();
  });
  bgmVolume.addEventListener('input', () => { bgm.volume = Number(bgmVolume.value) / 100; });
  bgm.addEventListener('play', () => syncBgmUI(true));
  bgm.addEventListener('pause', () => syncBgmUI(false));
  bgm.addEventListener('error', () => {
    bgmDock.classList.add('error');
    bgmState.textContent = '音频未找到，请检查 assets/';
  });

  // 浏览器要求用户手势才能出声：首次交互自动起播；手动关过就不再打扰
  let autoTried = false;
  function autoBgm(e) {
    if (autoTried) return;
    autoTried = true;
    if (e.target && e.target.closest && e.target.closest('#bgmDock')) return;
    if (store.get('jijiao-bgm-off') === '1') return;
    playBgm(true);
    toast('🎵 BGM 已就位：音量在右下角，随时可暂停');
  }
  document.addEventListener('pointerdown', autoBgm);
  document.addEventListener('keydown', autoBgm);

  /* ---------------- 顶栏时钟 / 在线人数 ---------------- */
  function tickClock() {
    const d = new Date();
    $('#clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(() => {
    $('#onlineNum').textContent = randInt(188000, 196000).toLocaleString('en-US');
  }, 4200);

  /* ---------------- 首页数字滚动 ---------------- */
  const animateNumber = (el) => {
    const target = Number(el.dataset.target);
    const dur = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(target * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animateNumber(e.target); statObserver.unobserve(e.target); } });
  }, { threshold: 0.4 });
  $$('.stat-num').forEach((el) => statObserver.observe(el));

  /* ---------------- 预载吉祥物 PNG，供 Canvas 证书使用（失败回退内置 SVG） ---------------- */
  const chickImg = new Image();
  let chickReady = false;
  chickImg.onload = () => { chickReady = true; };
  chickImg.onerror = () => {
    try {
      const sym = document.querySelector('#ico-chick');
      const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320"><use href="#ico-chick"/>${new XMLSerializer().serializeToString(sym)}</svg>`;
      chickImg.onerror = null;
      chickImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    } catch (_) { /* 证书降级为不带头像 */ }
  };
  chickImg.src = 'assets/chick.png';

  /* 页面里的 PNG 若加载失败，切回同一套内置 SVG */
  $$('.chick-photo').forEach((img) => {
    const fail = () => img.parentElement.classList.add('img-failed');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------------- 扫描终端 ---------------- */
  const SCAN_LINES = [
    ['正在连接全国 ikun 数据库…', '连接成功（其实并没有这个库）', 'info'],
    ['正在扫描中分发型轮廓…', '命中可疑中分：置信度 114.5%', 'warn'],
    ['正在检索背带裤穿搭记录…', '发现 2.5 条高度相关记录', ''],
    ['正在分析「你干嘛哈哈哎哟」声纹…', '相似度 191.981%', 'warn'],
    ['正在比对背景音乐声纹…', '命中《鸡你太美》，证据 +1', 'warn'],
    ['正在比对铁山靠动作特征…', '动作完全吻合，建议立即控制', ''],
    ['正在读取练习生档案…', '读取失败：档案已被本人销毁', 'err'],
    ['正在测算鸡脚外露长度…', '警告：已完全露出，超出量程', 'err'],
    ['正在询问专家意见…', '专家表示：这还用问？', 'info'],
    ['正在生成鉴定报告并加盖公章…', '盖章成功（章是画上去的）', 'info']
  ];

  async function runScan() {
    const scan = $('#scanSection');
    const log = $('#termLog');
    const bar = $('#progressBar');
    const pct = $('#progressPct');
    const text = $('#progressText');
    scan.hidden = false;
    log.innerHTML = '';
    bar.style.width = '0%';
    pct.textContent = '0%';
    text.textContent = '正在初始化随机数生成器…';
    scan.scrollIntoView({ behavior: 'smooth', block: 'start' });
    sfx.click();

    const base = Date.now();
    for (let i = 0; i < SCAN_LINES.length; i++) {
      await sleep(rand(330, 520));
      const [main, sub, cls] = SCAN_LINES[i];
      const secs = ((Date.now() - base) / 1000).toFixed(2);
      const line = document.createElement('div');
      line.className = 'line';
      line.innerHTML = `<span class="info">[${pad(secs, 5)}]</span> ${main} <span class="${cls}">${sub}</span>`;
      // 转义由受控常量构造，无用户输入参与
      log.appendChild(line);
      sfx.beep();
      const p = Math.round(((i + 1) / SCAN_LINES.length) * 100);
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      text.textContent = p < 100 ? main : '鉴定完成，正在出具报告…';
      log.scrollTop = log.scrollHeight;
    }
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    log.appendChild(cursor);
    await sleep(620);
    sfx.stamp();
    showResult();
  }

  /* ---------------- 鉴定结果 ---------------- */
  const VERDICTS = [
    '小黑子，实锤了',
    '重度小黑子（晚期）',
    '伪装失败，鸡脚没收',
    '鸡脚露出 ≥ 99%',
    '鉴定失败：太明显',
    '纯路人（才怪）'
  ];
  const COMMENTS = [
    '该同志在声称「只是路过」时，脚趾不自觉地打起了节拍。系统建议：不要再挣扎了，承认吧，这样大家都轻松。',
    '经专家组连夜研究（其实只花了 0.3 秒），一致认为：你不是路过，你是专程来的。',
    '检测到极强的唱跳 rap 肌肉记忆，以及听到前奏就自动起身的conditioned reflex。鉴定结论无可辩驳。',
    '该被鉴定人全程否认，但背带裤褶皱、中分弧度与铁山靠预备姿势均已构成完整证据链。',
    '系统原本准备放行，直到你在第 3 题犹豫了 1.4 秒——这个时长，恰好是那段前奏的长度。',
    '本中心郑重提示：鸡脚不是缺点，是勋章。请挺起胸膛，把脚也挺起来。',
    '鉴定过程中，被鉴定人多次试图假装不认识「两年半」这个单位，反而暴露了对该单位异常精确的理解。',
    '数据表明：你和全国 8,919,141 名被鉴定人的回答高度雷同。这说明什么？说明大家都一样。'
  ];
  const METER_NAMES = ['ikun 浓度', '鸡脚外露程度', '背带裤匹配度', '抽象指数'];
  let report = null;

  function makeReport() {
    const rawName = $('#nickname').value.trim();
    const name = rawName || `匿名 ikun №${randInt(1000, 9999)}`;
    const meters = METER_NAMES.map((label) => {
      const value = Number(rand(61, 99.8).toFixed(1));
      return { label, value, suffix: '%' };
    });
    const footCm = Number(rand(11.4, 114.5).toFixed(1));
    return {
      name,
      no: `IKUN-2026-${randInt(1000, 9999)}${pick('ABCDEFGHIKUN')}`,
      verdict: pick(VERDICTS),
      comment: pick(COMMENTS),
      footCm,
      meters,
      date: new Date().toLocaleDateString('zh-CN')
    };
  }

  function showResult() {
    report = makeReport();
    const sec = $('#resultSection');
    sec.hidden = false;
    $('#certNo').textContent = report.no;
    $('#resName').textContent = report.name;
    const v = $('#verdictBig');
    v.textContent = report.verdict;
    v.style.animation = 'none';
    void v.offsetWidth;
    v.style.animation = '';
    $('#resComment').textContent = report.comment;

    $('#meters').innerHTML = report.meters.map((m) => `
      <div class="meter">
        <div class="meter-top"><span>${m.label}</span><b>${m.value}${m.suffix}</b></div>
        <div class="meter-track"><div class="meter-fill" data-w="${m.value}"></div></div>
      </div>`).join('');
    requestAnimationFrame(() => {
      $$('.meter-fill').forEach((el) => { el.style.width = el.dataset.w + '%'; });
    });

    sfx.ok();
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- 表单提交 ---------------- */
  $('#quizForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!$('#promise').checked) {
      toast('⚠️ 请先勾选承诺：不承诺的话，鸡脚不会承认自己露出来的');
      sfx.boing();
      return;
    }
    runScan();
  });
  $$('.opts input').forEach((input) => input.addEventListener('change', () => sfx.beep()));

  $('#retryBtn').addEventListener('click', () => {
    sfx.click();
    $('#resultSection').hidden = true;
    $('#scanSection').hidden = true;
    $('#quizForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('再测一次？系统表示：结果不会有任何不同');
  });

  /* ---------------- 复制鉴定结果 ---------------- */
  function reportText() {
    const url = location.protocol.startsWith('http') ? location.href.split('#')[0] : '小黑子鉴定中心（自封）';
    return [
      '🦶【小黑子身份鉴定报告】',
      `编号：${report.no}`,
      `被鉴定人：${report.name}`,
      `鉴定结论：${report.verdict}`,
      `鸡脚外露长度：${report.footCm} cm（超出量程）`,
      ...report.meters.map((m) => `${m.label}：${m.value}${m.suffix}`),
      `专家评语：${report.comment}`,
      `出具日期：${report.date}`,
      '—— 由「小黑子鉴定中心（自封）」出具，纯属整活，概不负责',
      `👉 来测测你的鸡脚：${url}`
    ].join('\n');
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) { /* 降级 */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (_) { return false; }
  }
  $('#copyBtn').addEventListener('click', async () => {
    if (!report) return;
    sfx.click();
    const ok = await copyText(reportText());
    toast(ok ? '📋 鉴定结果已复制，去发给你最可疑的那个朋友' : '复制失败，请手动长按选择文字');
  });

  /* ---------------- Canvas 生成鉴定证书 PNG ---------------- */
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
    const chars = Array.from(text);
    let line = '', lines = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        lines++;
        line = chars[i];
        if (lines >= maxLines) return y;
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lineHeight; }
    return y;
  }

  function drawFoot(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 腿
    ctx.fillStyle = '#f2a63b';
    ctx.strokeStyle = '#8a4b12';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-24, 150); ctx.lineTo(-24, 20); ctx.quadraticCurveTo(0, 4, 24, 20); ctx.lineTo(24, 150);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#d98a20'; ctx.lineWidth = 4;
    for (let y = 40; y <= 140; y += 22) { ctx.beginPath(); ctx.moveTo(-22, y); ctx.lineTo(22, y); ctx.stroke(); }
    // 脚掌
    ctx.fillStyle = '#ffc45c';
    ctx.strokeStyle = '#8a4b12'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(0, 4, 50, 34, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 脚趾
    const toes = [[-32, -8, -72, -66], [0, -18, 0, -92], [32, -8, 72, -66], [36, 16, 74, 42]];
    toes.forEach(([x1, y1, x2, y2]) => {
      ctx.strokeStyle = '#8a4b12'; ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = '#ffc45c'; ctx.lineWidth = 24;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = '#fff8e6';
      ctx.strokeStyle = '#8a4b12';
      ctx.lineWidth = 4;
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.save(); ctx.translate(x2, y2); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-10, 6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function buildCertificate() {
    const W = 900, H = 1340;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const F = '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif';

    c.fillStyle = '#fffdf3'; c.fillRect(0, 0, W, H);
    // 纸纹
    c.fillStyle = 'rgba(18,58,140,.035)';
    for (let y = 0; y < H; y += 34) c.fillRect(0, y, W, 1);
    // 外框
    c.strokeStyle = '#123a8c'; c.lineWidth = 10; c.strokeRect(24, 24, W - 48, H - 48);
    c.strokeStyle = '#123a8c'; c.lineWidth = 2; c.setLineDash([8, 8]); c.strokeRect(46, 46, W - 92, H - 92); c.setLineDash([]);
    // 红色角标
    c.strokeStyle = '#e1251b'; c.lineWidth = 7;
    [[62, 62, 1, 1], [W - 62, 62, -1, 1], [62, H - 62, 1, -1], [W - 62, H - 62, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.beginPath(); c.moveTo(x + 34 * sx, y); c.lineTo(x, y); c.lineTo(x, y + 34 * sy); c.stroke();
    });

    c.textAlign = 'center';
    c.fillStyle = '#6b6455'; c.font = `22px monospace`;
    c.fillText(`鉴定报告 № ${report.no}`, W / 2, 118);
    c.fillStyle = '#0b2360'; c.font = `900 58px ${F}`;
    c.fillText('小黑子身份鉴定报告', W / 2, 192);
    c.fillStyle = '#6b6455'; c.font = `20px ${F}`;
    c.fillText('本证书由「小黑子鉴定中心（自封）」郑重颁发', W / 2, 232);

    c.strokeStyle = '#123a8c'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(100, 262); c.lineTo(W - 100, 262); c.stroke();

    c.fillStyle = '#1b1b1b'; c.font = `26px ${F}`;
    c.fillText(`被鉴定人：${report.name}`, W / 2, 316);
    c.fillStyle = '#e1251b'; c.font = `900 70px ${F}`;
    c.fillText(report.verdict, W / 2, 404);
    c.fillStyle = '#6b6455'; c.font = `18px monospace`;
    c.fillText('CHICKEN FOOT FULLY EXPOSED · CASE CLOSED', W / 2, 442);

    // 鸡脚插画
    drawFoot(c, W / 2, 620, 1.35);
    c.fillStyle = '#123a8c'; c.font = `900 24px ${F}`;
    c.fillText('🦶 鸡脚已露出', W / 2, 830);

    // 左侧「嫌疑人快照」：与网页版鉴定报告保持一致
    if (chickReady) {
      try {
        const px = 118, py = 486, pw = 126, ph = 132;
        c.save();
        c.fillStyle = '#fff'; c.fillRect(px - 12, py - 12, pw + 24, ph + 46);
        c.strokeStyle = '#123a8c'; c.lineWidth = 2; c.setLineDash([7, 6]);
        c.strokeRect(px - 12, py - 12, pw + 24, ph + 46); c.setLineDash([]);
        // 等比绘制，避免把方形的 PNG 拉成长脸
        const ir = (chickImg.naturalWidth / chickImg.naturalHeight) || 0.75;
        const iw = Math.min(pw, ph * ir), ih = iw / ir;
        c.drawImage(chickImg, px + (pw - iw) / 2, py + (ph - ih) / 2, iw, ih);
        c.fillStyle = '#123a8c'; c.fillRect(px - 12, py + ph + 4, pw + 24, 22);
        c.fillStyle = '#fff'; c.font = `800 15px ${F}`; c.textAlign = 'center';
        c.fillText('嫌疑人快照', px + pw / 2, py + ph + 20);
        c.restore();
      } catch (_) { /* 画不上就跳过，不影响证书 */ }
    }

    // 指标
    c.textAlign = 'left';
    let y = 884;
    report.meters.forEach((m, i) => {
      const x = 110 + (i % 2) * 370;
      const yy = y + Math.floor(i / 2) * 72;
      c.fillStyle = '#1b1b1b'; c.font = `800 22px ${F}`;
      c.fillText(`${m.label}  ${m.value}${m.suffix}`, x, yy);
      c.fillStyle = '#eae2cf'; c.fillRect(x, yy + 12, 320, 14);
      c.strokeStyle = '#123a8c'; c.lineWidth = 2; c.strokeRect(x, yy + 12, 320, 14);
      c.fillStyle = '#e1251b'; c.fillRect(x + 2, yy + 14, 316 * m.value / 100, 10);
    });

    // 评语
    c.textAlign = 'left';
    c.fillStyle = '#1b1b1b'; c.font = `800 22px ${F}`;
    c.fillText('【专家评语】', 110, 1030);
    c.fillStyle = '#4a4538'; c.font = `21px ${F}`;
    wrapText(c, report.comment, 110, 1068, 530, 32, 3);

    // 红章
    c.save();
    c.translate(W - 160, 1070); c.rotate(-0.28);
    c.strokeStyle = 'rgba(225,37,27,.85)'; c.lineWidth = 8;
    c.beginPath(); c.arc(0, 0, 76, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 66, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(225,37,27,.85)'; c.textAlign = 'center'; c.font = `900 30px ${F}`;
    c.fillText('鉴定专用章', 0, 0); c.fillText('（自封）', 0, 36);
    c.restore();

    // 页脚
    c.textAlign = 'center';
    c.fillStyle = '#6b6455'; c.font = `18px ${F}`;
    c.fillText(`出具日期：${report.date}　·　本结果由 Math.random() 权威出具`, W / 2, H - 90);
    c.fillText('纯娱乐整活作品，不针对任何真实个人，请勿当真', W / 2, H - 60);
    return cv;
  }

  $('#downloadBtn').addEventListener('click', async () => {
    if (!report) return;
    sfx.stamp();
    // 头像若还没加载完，最多等 1.5 秒，保证证书里带上小黄鸡
    for (let i = 0; i < 30 && !chickReady; i++) await sleep(50);
    try {
      const cv = buildCertificate();
      const a = document.createElement('a');
      a.download = `鸡脚鉴定证书-${report.name.replace(/[\\/:*?"<>|]/g, '_')}.png`;
      a.href = cv.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('🖼️ 证书已生成，建议打印出来贴在工位上');
    } catch (err) {
      toast('证书生成失败，可以截图鉴定报告代替');
    }
  });

  /* ---------------- 访客归属地（可选，失败静默回退到随机省份） ----------------
     Cloudflare Pages：优先读同源 /cdn-cgi/trace，访客 IP 不离开请求链路，零第三方。
     其他静态托管：浏览器直连免费公共 API，只取省 / 国家，不存储、不上传。
     想彻底关闭整个功能：把下面的 GEO_ENABLED 改成 false 即可。              */
  const GEO_ENABLED = true;
  let visitorRegion = null;

  const SAR = {
    'hong kong': '中国香港', 'hong kong sar': '中国香港', 'hk': '中国香港',
    'taiwan': '中国台湾', 'taiwan, province of china': '中国台湾', 'tw': '中国台湾',
    'macao': '中国澳门', 'macau': '中国澳门', 'mo': '中国澳门'
  };
  const CN_REGION = {
    'beijing': '北京', 'tianjin': '天津', 'shanghai': '上海', 'chongqing': '重庆',
    'hebei': '河北', 'shanxi': '山西', 'liaoning': '辽宁', 'jilin': '吉林',
    'heilongjiang': '黑龙江', 'jiangsu': '江苏', 'zhejiang': '浙江', 'anhui': '安徽',
    'fujian': '福建', 'jiangxi': '江西', 'shandong': '山东', 'henan': '河南',
    'hubei': '湖北', 'hunan': '湖南', 'guangdong': '广东', 'hainan': '海南',
    'sichuan': '四川', 'guizhou': '贵州', 'yunnan': '云南', 'shaanxi': '陕西',
    'gansu': '甘肃', 'qinghai': '青海', 'inner mongolia': '内蒙古',
    'guangxi': '广西', 'tibet': '西藏', 'xizang': '西藏', 'ningxia': '宁夏',
    'xinjiang': '新疆'
  };
  const COUNTRY_CODE = {
    'CN': '中国', 'US': '美国', 'JP': '日本', 'KR': '韩国', 'GB': '英国',
    'DE': '德国', 'FR': '法国', 'CA': '加拿大', 'AU': '澳大利亚', 'NZ': '新西兰',
    'SG': '新加坡', 'MY': '马来西亚', 'TH': '泰国', 'VN': '越南', 'PH': '菲律宾',
    'ID': '印度尼西亚', 'IN': '印度', 'RU': '俄罗斯', 'BR': '巴西',
    'NL': '荷兰', 'IT': '意大利', 'ES': '西班牙', 'AE': '阿联酋', 'ZA': '南非'
  };
  const COUNTRY_NAME = {
    'china': '中国', 'united states': '美国', 'united states of america': '美国',
    'japan': '日本', 'south korea': '韩国', 'korea, republic of': '韩国',
    'united kingdom': '英国', 'germany': '德国', 'france': '法国',
    'canada': '加拿大', 'australia': '澳大利亚', 'new zealand': '新西兰',
    'singapore': '新加坡', 'malaysia': '马来西亚', 'thailand': '泰国',
    'vietnam': '越南', 'philippines': '菲律宾', 'indonesia': '印度尼西亚',
    'india': '印度', 'russia': '俄罗斯', 'brazil': '巴西', 'netherlands': '荷兰',
    'italy': '意大利', 'spain': '西班牙', 'united arab emirates': '阿联酋',
    'south africa': '南非'
  };

  function localizeGeo(d) {
    const region = String(d.region || d.region_name || '').trim()
      .replace(/\s+(sheng|province|shi|municipality|autonomous region)$/i, '');
    const country = String(d.country || d.country_name || '').trim();
    const code = String(d.country_code || '').toUpperCase();
    const k = (s) => s.toLowerCase();
    const sar = SAR[k(region)] || SAR[k(country)] || SAR[k(code)];
    if (sar) return sar;
    if (code === 'CN' || k(country) === 'china') return CN_REGION[k(region)] || '中国';
    return COUNTRY_NAME[k(country)] || COUNTRY_CODE[code] || country || code || null;
  }

  async function geoFetch(url, wantJson, ms = 2200) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (!r.ok) return null;
      return wantJson ? await r.json() : await r.text();
    } catch (_) { return null; }
    finally { clearTimeout(timer); }
  }

  async function detectVisitorRegion() {
    if (!GEO_ENABLED || !window.fetch) return null;
    const trace = await geoFetch('/cdn-cgi/trace', false, 1200);
    const loc = trace && /^loc=([A-Z]{2})$/m.exec(trace);
    if (loc && loc[1] !== 'XX' && loc[1] !== 'T1') {
      return { label: SAR[loc[1].toLowerCase()] || COUNTRY_CODE[loc[1]] || loc[1], source: 'Cloudflare 边缘节点' };
    }
    const a = await geoFetch('https://ipwho.is/', true);
    if (a && a.success !== false) {
      const label = localizeGeo(a);
      if (label) return { label, source: 'ipwho.is' };
    }
    const b = await geoFetch('https://get.geojs.io/v1/ip/geo.json', true);
    if (b) {
      const label = localizeGeo(b);
      if (label) return { label, source: 'GeoJS' };
    }
    return null;
  }

  /* ---------------- 实时播报 ---------------- */
  const CITIES = ['广东', '江苏', '浙江', '山东', '四川', '湖南', '河南', '河北', '福建', '安徽', '湖北', '陕西', '北京', '上海', '重庆'];
  const WHOS = ['网友', '同学', '打工人', '路人甲', '程序员', '大学生', '保安大叔', '食堂阿姨', '课代表', '练习生'];
  const EVENTS = [
    (w, n) => `某${w}在电梯里哼出「鸡你太美」，鸡脚外露 ${n} cm，已被系统记录`,
    (w, n) => `一名${w}声称「只是路过」，但背带裤褶皱出卖了他`,
    (w, n) => `某${w}听到前奏 0.${randInt(1, 9)} 秒后完成铁山靠，判定为高危`,
    (w, n) => `某${w}试图用帽子遮掩中分，失败，露出长度 ${n} cm`,
    (w, n) => `疑似集体露出事件，共 ${randInt(3, 26)} 只鸡脚同时外露`,
    (w, n) => `某${w}坚称不会唱，却在 KTV 点了那首歌，系统沉默了 ${n} 秒`,
    (w, n) => `某${w}被问到「练习时长」时心率上升 ${randInt(20, 88)}%，原因不明`,
    (w, n) => `某${w}在评论区打出「不知道」，但打了 ${randInt(3, 9)} 遍，疑似心虚`
  ];
  let feedTotal = randInt(8919000, 8919300);

  function addFeed(initial = false, own = false) {
    const li = document.createElement('li');
    const d = new Date(Date.now() - (initial ? randInt(1, 500) * 1000 : 0));
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const isOwn = own && !!visitorRegion;
    const place = isOwn ? visitorRegion.label : pick(CITIES);
    const text = isOwn
      ? `${place} · 检测到本机接入，系统已自动把鸡脚收回去 0.5 秒`
      : `${place} · ${pick(EVENTS)(pick(WHOS), randInt(3, 99))}`;
    if (isOwn) li.className = 'is-you';
    const t = document.createElement('time'); t.textContent = time;
    const s = document.createElement('span'); s.textContent = text;
    li.append(t, s);
    const list = $('#feedList');
    list.prepend(li);
    while (list.children.length > 9) list.lastElementChild.remove();
    feedTotal++;
    $('#feedCount').textContent = `已记录 ${feedTotal.toLocaleString('en-US')} 条`;
  }
  for (let i = 0; i < 7; i++) addFeed(true);
  setInterval(() => addFeed(), 2800);

  /* 异步探测：不阻塞渲染，失败就当没发生过，播报继续用随机省份 */
  detectVisitorRegion().then((hit) => {
    if (!hit) return;
    visitorRegion = hit;
    const badge = $('#geoBadge');
    if (badge) {
      badge.textContent = `📍 本次访问：${hit.label}`;
      badge.title = `数据来源：${hit.source} · 仅在本机显示，不存储、不上传`;
      badge.hidden = false;
    }
    addFeed(false, true);
  }).catch(() => { /* 静默降级 */ });

  /* ---------------- 抽象指数柱状图：按真实日期生成最近 7 天 ---------------- */
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  let gaugeDateKey = '';

  function renderGauge(animate = true) {
    const now = new Date();
    const todayIdx = now.getDay();
    gaugeDateKey = now.toDateString();
    const dateEl = $('#gaugeDate');
    if (dateEl) dateEl.textContent = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} · ${WEEK[todayIdx]}`;
    const days = Array.from({ length: 7 }, (_, i) => WEEK[(todayIdx - 6 + i + 7) % 7]);
    $('#bars').innerHTML = days.map((d, i) => {
      const isToday = i === 6;
      const h = isToday ? 96 : randInt(28, 82);
      const tip = isToday ? `${d}（今天）` : d;
      return `<div class="bar-col${isToday ? ' is-today' : ''}" title="${tip} 抽象指数 ${h}%"><i style="height:${animate ? 0 : h}%" data-h="${h}"></i><span>${d}</span></div>`;
    }).join('');
    if (!animate) return;
    const barObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        $$('#bars .bar-col i').forEach((el, i) => setTimeout(() => { el.style.height = el.dataset.h + '%'; }, i * 90));
        barObserver.disconnect();
      }
    }, { threshold: 0.3 });
    barObserver.observe($('#bars'));
  }
  renderGauge();
  // 跨过零点后按新日期重排标签（不再播放入场动画）
  setInterval(() => {
    if (new Date().toDateString() !== gaugeDateKey) renderGauge(false);
  }, 60000);

  /* ---------------- 「全员露出」彩蛋 ---------------- */
  let exposeTimer = null;
  function openExpose() {
    const ov = $('#exposeOverlay');
    if (!ov.hidden) return;
    ov.hidden = false;
    ov.classList.add('shake');
    document.body.style.overflow = 'hidden';
    sfx.alarm();
    setTimeout(() => sfx.boing(), 420);
    let left = 3;
    const btn = $('#closeExpose');
    btn.disabled = true;
    btn.textContent = `把脚收回去（${left}）`;
    clearInterval(exposeTimer);
    exposeTimer = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(exposeTimer);
        btn.disabled = false;
        btn.textContent = '把脚收回去 ✓';
      } else btn.textContent = `把脚收回去（${left}）`;
    }, 1000);
  }
  function closeExpose() {
    const ov = $('#exposeOverlay');
    if (ov.hidden || $('#closeExpose').disabled) return;
    ov.hidden = true;
    ov.classList.remove('shake');
    document.body.style.overflow = '';
    clearInterval(exposeTimer);
    sfx.click();
    const el = $('.stat-num');
    el.textContent = (Number(el.dataset.target) + 1).toLocaleString('en-US');
    toast('脚收回去了，但系统已经截图了');
  }
  ['#exposeBtn', '#exposeBtn2'].forEach((s) => $(s).addEventListener('click', openExpose));
  $('#closeExpose').addEventListener('click', closeExpose);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeExpose(); });
  $('#peek').addEventListener('click', () => { sfx.boing(); toast('嘘——被你发现了，快装作没看见'); });

  // 吉祥物可戳：每戳满 5 下触发一次「全员露出」
  const mascot = $('#mascot');
  const MASCOT_LINES = [
    '🐤 别戳我，我刚做完 2.5 年练习，累',
    '🐤 你干嘛～哈哈哎哟！',
    '🐤 中分是天生的，背带裤是借的，篮球是捡的',
    '🐤 再戳我要叫保安了（保安也是我）',
    '🐤 你盯着我看太久，鸡脚已悄悄露出 3cm'
  ];
  mascot.addEventListener('click', () => {
    sfx.boing();
    mascot.classList.remove('poked');
    void mascot.offsetWidth;
    mascot.classList.add('poked');
    setTimeout(() => mascot.classList.remove('poked'), 520);
    const n = Number(store.get('jijiao-poke') || 0) + 1;
    store.set('jijiao-poke', String(n));
    if (n % 5 === 0) { openExpose(); toast('🐤 戳够 5 下了：全员露出，无处可藏'); }
    else toast(pick(MASCOT_LINES));
  });
  $('#adminBtn').addEventListener('click', () => {
    sfx.boing();
    toast('⛔ 权限不足：检测到你的鸡脚已经露出，无法进入后台');
  });

  /* ---------------- 跟随鼠标的篮球 ---------------- */
  const ball = $('#ball');
  let bx = -100, by = -100, tx = -100, ty = -100, ballEnabled = true;
  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('mousemove', (e) => { tx = e.clientX - 26; ty = e.clientY - 26; });
    const loop = () => {
      bx += (tx - bx) * 0.16;
      by += (ty - by) * 0.16;
      if (ballEnabled) ball.style.transform = `translate(${bx}px,${by}px)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } else {
    ball.classList.add('off');
    $('#ballToggle').style.display = 'none';
    ballEnabled = false;
  }
  $('#ballToggle').addEventListener('click', () => {
    ballEnabled = !ballEnabled;
    ball.classList.toggle('off', !ballEnabled);
    $('#ballToggle').textContent = ballEnabled ? '🏀 关闭篮球' : '🏀 放球出来';
    sfx.click();
  });

  /* ---------------- Konami Code 隐藏彩蛋 ---------------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let keyIdx = 0;
  document.addEventListener('keydown', (e) => {
    keyIdx = (e.key === KONAMI[keyIdx]) ? keyIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (keyIdx === KONAMI.length) {
      keyIdx = 0;
      openExpose();
      toast('🎮 隐藏指令已触发：全员露出，无处可藏');
    }
  });

  /* ---------------- 首次交互解锁音频 ---------------- */
  document.addEventListener('pointerdown', () => { if (soundOn) getCtx(); }, { once: true });
})();
