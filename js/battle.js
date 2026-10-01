'use strict';
// ============================================================
//  Battle — conditional turn order (CTB), 五灵 matchups,
//  telegraphed boss attacks, GBC-style effects
// ============================================================
const FY = 14;          // battlefield top
const FH = 82;          // battlefield height
const BOT = 96;         // bottom panel top

const Battle = {
  active: false,
  // ---------- setup ----------
  start(cfg) {
    return new Promise((resolve) => {
      this.cfg = cfg;
      this.resolve = resolve;
      this.allies = State.party.map((id, i) => mkAlly(id, i));
      this.enemies = cfg.enemies.map((k, i) => mkEnemy(k, i, cfg.enemies.length));
      layoutEnemies(this.enemies);
      this.all = () => this.allies.concat(this.enemies);
      this.parts = []; this.pops = []; this.fx = [];
      this.msg = null; this.msgT = 0;
      this.menu = null; this.desc = null;
      this.bg = drawBattleBg(cfg.bg || 'snow');
      this.introT = 0;
      this.over = false;
      this.turn = 0;
      this.active = true;
      this.auto = false;
      this.prevScene = Game.scene;
      Game.setScene(this);
      this.run();
    });
  },
  enter() {},
  // ---------- main loop ----------
  async run() {
    Sound.music(this.cfg.music || (this.cfg.boss ? 'boss' : 'battle'));
    // enemies slide in from the left, party from the right
    for (const e of this.enemies) e.ox = -100;
    for (const a of this.allies) a.ox = 60;
    await fadeIn(2);
    await anim((f) => {
      const t = Math.min(1, f / 24);
      const ease = 1 - Math.pow(1 - t, 3);
      for (const e of this.enemies) e.ox = Math.round(-100 * (1 - ease));
      for (const a of this.allies) a.ox = Math.round(60 * (1 - ease));
      return f >= 24;
    });
    if (this.cfg.intro) await this.cfg.intro(this);
    else {
      const names = [...new Set(this.enemies.map((e) => e.name))].join('、');
      await this.say(`${names} 出现了！`);
    }
    while (!this.over) {
      const b = this.nextActor();
      this.turn++;
      await this.takeTurn(b);
      if (this.checkEnd()) break;
      if (this.cfg.onTurn) { await this.cfg.onTurn(this); if (this.checkEnd()) break; }
    }
  },
  nextActor() {
    const live = this.all().filter((b) => !b.dead);
    let best = null, bt = Infinity;
    for (const b of live) {
      const t = (100 - b.ct) / effSpd(b);
      if (t < bt) { bt = t; best = b; }
    }
    for (const b of live) b.ct += effSpd(b) * bt;
    best.ct = 100;
    return best;
  },
  // predicted order of the next n turns (for the top bar)
  predict(n = 6) {
    const sim = this.all().filter((b) => !b.dead).map((b) => ({ b, ct: b.ct }));
    const out = [];
    if (this.current && !this.current.dead) { out.push(this.current); const s = sim.find((x) => x.b === this.current); if (s) s.ct = this.current.defending ? 30 : 0; }
    while (out.length < n && sim.length) {
      let best = null, bt = Infinity;
      for (const s of sim) { const t = (100 - s.ct) / effSpd(s.b); if (t < bt) { bt = t; best = s; } }
      for (const s of sim) s.ct += effSpd(s.b) * bt;
      out.push(best.b); best.ct = 0;
    }
    return out;
  },
  checkEnd() {
    if (this.over) return true;
    if (this.enemies.every((e) => e.dead)) { this.over = true; this.victory(); return true; }
    if (this.allies.every((a) => a.dead)) { this.over = true; this.defeat(); return true; }
    if (this.cfg.endWhen && this.cfg.endWhen(this)) { this.over = true; this.finish('scripted'); return true; }
    return false;
  },
  // ---------- one turn ----------
  async takeTurn(b) {
    this.current = b;
    b.defending = false;
    // status ticks at start of turn
    if (b.status.poison) {
      const d = Math.max(1, Math.round(b.mhp * 0.07));
      await this.say(`${b.name} 毒发！`, 18);
      this.damage(b, d, { color: 'poison' });
      await wait(20);
      if (b.dead) { await this.killAnim(b); return; }
    }
    if (b.status.sleep) {
      if (--b.status.sleep <= 0) { delete b.status.sleep; await this.say(`${b.name} 醒了过来。`); }
      else { await this.say(`${b.name} 正在沉睡……`); b.ct = 0; this.decayBuffs(b); return; }
    }
    if (b.status.stun) { delete b.status.stun; await this.say(`${b.name} 头晕目眩，动弹不得！`); b.ct = 0; this.decayBuffs(b); return; }
    let act;
    if (b.side === 'ally') {
      b.step = 1;
      act = this.auto ? autoAction(b, this) : await this.playerCommand(b);
      if (act && act.type === 'auto') { this.auto = true; act = autoAction(b, this); }
    } else act = enemyAction(b, this);
    if (act) await this.execute(b, act);
    b.step = 0;
    if (b.status.seal) { b.status.seal--; if (b.status.seal <= 0) delete b.status.seal; }
    this.decayBuffs(b);
    b.ct = act && act.type === 'defend' ? 30 : act && act.quick ? 25 : 0;
    this.current = null;
  },
  decayBuffs(b) {
    for (const k in b.buff) if (--b.buff[k] <= 0) delete b.buff[k];
    for (const k in b.debuff) if (--b.debuff[k] <= 0) delete b.debuff[k];
  },
  // ---------- player command ----------
  async playerCommand(b) {
    for (;;) {
      const cmd = await this.openMenu(new CmdMenu(b));
      if (cmd === 'attack') {
        const t = await this.pickTarget('enemy', b);
        if (t) return { type: 'attack', target: t };
      } else if (cmd === 'skill') {
        const sk = await this.openMenu(new SkillMenu(b));
        if (!sk) continue;
        const S = SKILLS[sk];
        const t = await this.pickTarget(S.target, b, S);
        if (t) return { type: 'skill', skill: sk, target: t };
      } else if (cmd === 'item') {
        const it = await this.openMenu(new ItemMenu(b));
        if (!it) continue;
        const t = await this.pickTarget(ITEMS[it].target, b);
        if (t) return { type: 'item', item: it, target: t };
      } else if (cmd === 'defend') return { type: 'defend' };
      else if (cmd === 'flee') return { type: 'flee' };
      else if (cmd === 'auto') return { type: 'auto' };
    }
  },
  openMenu(m) {
    return new Promise((res) => { m.done = (v) => { this.menu = null; this.desc = null; res(v); }; this.menu = m; });
  },
  pickTarget(kind, user, skill) {
    if (kind === 'self' || kind === 'none') return Promise.resolve(user);
    if (kind === 'enemies') return this.openMenu(new TargetPicker(this.enemies.filter((e) => !e.dead), true, user, skill)).then((r) => (r ? this.enemies.filter((e) => !e.dead) : null));
    if (kind === 'allies') return this.openMenu(new TargetPicker(this.allies.filter((a) => !a.dead), true, user, skill)).then((r) => (r ? this.allies.filter((a) => !a.dead) : null));
    if (kind === 'enemy') return this.openMenu(new TargetPicker(this.enemies.filter((e) => !e.dead), false, user, skill));
    if (kind === 'ally') return this.openMenu(new TargetPicker(this.allies.filter((a) => !a.dead), false, user, skill));
    if (kind === 'dead') {
      const dead = this.allies.filter((a) => a.dead);
      if (!dead.length) { Sound.sfx('bump'); return Promise.resolve(null); }
      return this.openMenu(new TargetPicker(dead, false, user, skill));
    }
    return Promise.resolve(null);
  },
  // ---------- execution ----------
  async execute(b, act) {
    if (act.type === 'defend') { b.defending = true; Sound.sfx('guard'); await this.say(`${b.name} 摆出防御架势。`, 24); return; }
    if (act.type === 'flee') return this.tryFlee(b);
    if (act.type === 'charge') { b.charge = act.skill; await this.say(act.text || `${b.name} 正在蓄力……`, 40); return; }
    if (act.type === 'talk') { await this.say(act.text, 50); return; }
    if (act.type === 'attack') {
      const t = retarget(act.target, b, this);
      if (!t) return;
      await this.say(`${b.name} 的攻击！`, 1);
      await this.lunge(b);
      await this.hitPhys(b, t, 1, null, b.side === 'ally' ? 'slash' : 'claw');
      await this.unlunge(b);
      return;
    }
    if (act.type === 'item') return this.useItem(b, act.item, act.target);
    if (act.type === 'skill') return this.useSkill(b, act.skill, act.target);
  },
  async useSkill(b, id, target) {
    const S = SKILLS[id];
    if (b.side === 'ally') {
      if (S.mp && b.mp < S.mp) { await this.say('真气不足！'); return; }
      if (S.gold && State.gold < S.gold) { await this.say('钱不够……'); return; }
      if (b.status.seal) { await this.say(`${b.name} 被封咒，施展不了！`); return; }
      b.mp -= S.mp || 0;
      if (S.gold) State.gold -= S.gold;
    }
    let targets = Array.isArray(target) ? target : [target];
    if (S.target === 'enemies') targets = (b.side === 'ally' ? this.enemies : this.allies).filter((x) => !x.dead);
    else if (S.target === 'allies') targets = (b.side === 'ally' ? this.allies : this.enemies).filter((x) => !x.dead);
    else if (S.target === 'self') targets = [b];
    else if (S.target === 'enemy') { const t = retarget(targets[0], b, this); targets = t ? [t] : []; }
    if (!targets.length) return;
    this.msg = S.name; this.msgT = 999; this.msgBig = true;
    Sound.sfx('magic');
    if (b.side === 'ally') b.pose = S.kind === 'phys' || S.kind === 'steal' || S.kind === 'coins' ? 'attack' : 'cast';
    else b.flashT = 10;
    await wait(16);
    const fxName = S.fx || (S.kind === 'phys' ? 'slash' : 'magic');
    if (S.kind === 'phys') {
      if (b.side === 'ally') await this.lunge(b);
      const hits = S.hits || 1;
      for (let h = 0; h < hits; h++) {
        await playFx(this, fxName, targets, b);
        for (const t of targets) if (!t.dead) await this.hitPhys(b, t, S.power, S.el, null, S, true);
        await wait(8);
      }
      if (S.recoil) { await wait(10); this.damage(b, Math.round(b.mhp * S.recoil), { color: 'hurt' }); await wait(20); }
      if (b.side === 'ally') await this.unlunge(b);
    } else if (S.kind === 'mag') {
      await playFx(this, fxName, targets, b);
      for (const t of targets) if (!t.dead) this.hitMag(b, t, S.power, S.el, S);
      await wait(36);
      for (const t of targets) if (t.dead && !t.gone) await this.killAnim(t);
    } else if (S.kind === 'heal') {
      await playFx(this, 'heal', targets, b);
      for (const t of targets) {
        const amt = S.scale ? Math.round((S.power + eff(b, 'mag') * S.scale) * rnd(0.95, 1.05)) : Math.round(t.mhp * S.power);
        this.heal(t, amt);
      }
      await wait(30);
    } else if (S.kind === 'buff') {
      await playFx(this, 'buff', targets, b);
      for (const t of targets) { t.buff[S.buff] = 4; this.pop(t, BUFF_NAME[S.buff] + '↑', 'buff'); }
      Sound.sfx('buff');
      await wait(30);
    } else if (S.kind === 'debuff') {
      await playFx(this, fxName, targets, b);
      for (const t of targets) {
        const imm = immuneTo(t, S.status);
        if (!imm && Math.random() < (S.chance || 1)) { applyStatus(t, S.status); this.pop(t, STATUS_NAME[S.status], 'status'); }
        else this.pop(t, '无效', 'miss');
      }
      Sound.sfx('debuff');
      await wait(34);
    } else if (S.kind === 'cleanse') {
      await playFx(this, 'heal', targets, b);
      for (const t of targets) { for (const k of ['poison', 'sleep', 'seal', 'stun']) delete t.status[k]; this.pop(t, '清心', 'buff'); }
      await wait(24);
    } else if (S.kind === 'revive') {
      const t = targets[0];
      if (!t.dead) { await this.say('没有效果。'); return; }
      await playFx(this, 'heal', [t], b);
      t.dead = false; t.gone = false; t.hp = Math.round(t.mhp * 0.5); t.ct = 0;
      this.pop(t, t.hp, 'heal'); Sound.sfx('heal');
      await wait(30);
    } else if (S.kind === 'steal') {
      const t = targets[0];
      await this.lunge(b);
      await playFx(this, 'slash', [t], b);
      await this.unlunge(b);
      const E = t.E;
      if (!E.steal || t.stolen) { await this.say('什么也没摸到。'); return; }
      const chance = clamp(0.55 + (eff(b, 'luk') - E.lv) * 0.03, 0.2, 0.95) * (E.boss ? 0.6 : 1);
      if (Math.random() < chance) {
        t.stolen = true; addItem(E.steal, 1); Sound.sfx('coin');
        await this.say(`摸到了 {${ITEMS[E.steal].name}}！`, 60);
      } else await this.say('手慢了一步，没摸到。');
    } else if (S.kind === 'coins') {
      const t = targets[0];
      await playFx(this, 'coins', [t], b);
      const dmg = Math.round((S.power + b.c.lv * 10) * rnd(0.95, 1.05));
      this.damage(t, dmg, {});
      Sound.sfx('coin');
      await wait(30);
      if (t.dead) await this.killAnim(t);
    } else if (S.kind === 'grab') {
      const t = targets[0];
      await this.hitPhys(b, t, S.power, null, 'claw');
      const g = Math.min(State.gold, irnd(8, 20) * (b.E.lv || 1));
      if (g > 0) { State.gold -= g; b.grabbed = (b.grabbed || 0) + g; await this.say(`${b.name} 抢走了 ${g} 文钱！`); }
    } else if (S.kind === 'drain') {
      const t = targets[0];
      const d = await this.hitPhys(b, t, S.power, null, 'claw');
      if (d > 0) { this.heal(b, Math.round(d * 0.5)); await wait(20); }
    }
    b.pose = null;
    this.msg = null; this.msgBig = false;
    if (S.stun) for (const t of targets) if (!t.dead && !t.E?.boss && Math.random() < S.stun) { t.status.stun = 1; this.pop(t, '晕', 'status'); }
    if (S.debuff) for (const t of targets) if (!t.dead) { t.debuff[S.debuff] = 3; }
    await wait(10);
  },
  async useItem(b, id, target) {
    const I = ITEMS[id];
    if (!State.items[id]) return;
    State.items[id]--; if (State.items[id] <= 0) delete State.items[id];
    this.msg = I.name; this.msgT = 999;
    b.pose = 'cast';
    await wait(12);
    let targets = Array.isArray(target) ? target : [target];
    if (I.target === 'enemies') targets = this.enemies.filter((e) => !e.dead);
    if (I.dmg) {
      await playFx(this, I.el === '火' ? 'fire' : 'ice', targets, b);
      for (const t of targets) this.damage(t, Math.round(I.dmg * elemMult(I.el, t.el) * rnd(0.95, 1.05)), { el: elemMult(I.el, t.el) });
      await wait(30);
      for (const t of targets) if (t.dead) await this.killAnim(t);
    } else {
      const t = targets[0];
      if (I.revive) {
        if (!t.dead) { await this.say('没有效果。'); b.pose = null; this.msg = null; return; }
        t.dead = false; t.gone = false; t.hp = Math.round(t.mhp * I.revive); t.ct = 0;
        await playFx(this, 'heal', [t], b); this.pop(t, t.hp, 'heal');
      } else {
        await playFx(this, 'heal', [t], b);
        if (I.heal) this.heal(t, I.heal);
        if (I.full) { this.heal(t, t.mhp); t.mp = t.mmp; }
        if (I.mp) { t.mp = Math.min(t.mmp, t.mp + I.mp); this.pop(t, I.mp, 'mp', I.heal ? 12 : 0); }
        if (I.cure) for (const k of I.cure) delete t.status[k];
        if (I.cure && !I.heal) this.pop(t, '痊愈', 'buff');
      }
      Sound.sfx('heal');
      await wait(30);
    }
    b.pose = null; this.msg = null;
  },
  async tryFlee(b) {
    if (this.cfg.boss || this.cfg.noFlee) { await this.say('无路可逃！'); return; }
    const ps = avg(this.allies.filter((a) => !a.dead).map((a) => effSpd(a)));
    const es = avg(this.enemies.filter((e) => !e.dead).map((e) => effSpd(e)));
    const chance = clamp(0.55 + (ps - es) * 0.04 + (this.fleeTries || 0) * 0.15, 0.25, 0.95);
    this.fleeTries = (this.fleeTries || 0) + 1;
    if (Math.random() < chance) {
      Sound.sfx('escape');
      await this.say('三十六计，走为上计！', 40);
      this.over = true;
      this.finish('flee');
    } else await this.say('没能逃掉！');
  },
  // ---------- damage ----------
  async hitPhys(a, t, power, el, fx, S, noFx) {
    // evade
    const dodge = clamp(0.04 + (effSpd(t) - effSpd(a)) * 0.006 + (eff(t, 'luk') - eff(a, 'luk')) * 0.003, 0.02, 0.18);
    if (!noFx) await playFx(this, fx || 'slash', [t], a);
    if (Math.random() < dodge && !(S && S.sure)) {
      Sound.sfx('miss'); this.pop(t, '闪', 'miss'); t.dodgeT = 12; await wait(24); return 0;
    }
    const A = eff(a, 'atk'), D = eff(t, 'def');
    let dmg = (A * A) / (A + D) * power * rnd(0.9, 1.1);
    const em = elemMult(el, t.el);
    dmg *= em;
    let crit = false;
    if (Math.random() < clamp(0.05 + eff(a, 'luk') * 0.003, 0.05, 0.2)) { dmg *= 1.6; crit = true; }
    if (t.defending) dmg *= 0.5;
    if (t.status.sleep) { delete t.status.sleep; }
    dmg = Math.max(1, Math.round(dmg));
    this.damage(t, dmg, { crit, el: em });
    if (crit) { shake(10, 3); Sound.sfx('crit'); } else Sound.sfx(t.side === 'ally' ? 'hurt' : 'hit');
    await wait(crit ? 26 : 20);
    if (t.dead) await this.killAnim(t);
    return dmg;
  },
  hitMag(a, t, power, el, S) {
    const M = eff(a, 'mag'), R = eff(t, 'mag') * 0.6 + eff(t, 'def') * 0.2;
    let dmg = (M * M) / (M + R) * power * 1.15 * rnd(0.93, 1.07);
    const em = elemMult(el, t.el);
    dmg *= em;
    if (t.defending) dmg *= 0.5;
    if (t.status.sleep) delete t.status.sleep;
    dmg = Math.max(1, Math.round(dmg));
    this.damage(t, dmg, { el: em });
    Sound.sfx(t.side === 'ally' ? 'hurt' : 'hit');
    return dmg;
  },
  damage(t, n, opt) {
    t.hp = Math.max(0, t.hp - n);
    t.hitT = 14; t.flashT = 6;
    this.pop(t, n, opt.crit ? 'crit' : opt.color || (t.side === 'ally' ? 'hurt' : 'dmg'));
    if (opt.el && opt.el > 1) this.pop(t, '克', 'weak', -10);
    else if (opt.el && opt.el < 1) this.pop(t, '抗', 'resist', -10);
    if (t.hp <= 0) { t.dead = true; t.status = {}; t.buff = {}; t.charge = null; }
    if (t.side === 'ally') shake(6, 1);
  },
  heal(t, n) {
    const before = t.hp;
    t.hp = Math.min(t.mhp, t.hp + n);
    this.pop(t, t.hp - before, 'heal');
  },
  async killAnim(t) {
    if (t.gone) return;
    t.gone = true;
    if (t.side === 'enemy') {
      Sound.sfx('die');
      await anim((f) => { t.dissolve = f / 28; return f >= 28; });
    }
  },
  pop(t, val, kind, dy = 0) {
    const p = t.side === 'enemy' ? { x: t.x + t.w / 2, y: t.y + 4 } : { x: t.x + 8 + (t.ox || 0), y: t.y - 2 };
    this.pops.push({ x: p.x, y: p.y + dy, val: String(val), kind, t: 0 });
  },
  async lunge(b) {
    if (b.side === 'ally') { b.pose = 'run'; await anim((f) => { b.ox = -Math.round(f * 2.5); return f >= 8; }); b.pose = 'attack'; }
    else { await anim((f) => { b.ox = Math.round(Math.sin((f / 10) * Math.PI) * 8); return f >= 10; }); b.ox = 0; }
  },
  async unlunge(b) {
    if (b.side === 'ally') { await wait(6); b.pose = 'run'; await anim((f) => { b.ox = -20 + Math.round(f * 2.5); return f >= 8; }); b.ox = 0; b.pose = null; }
  },
  say(text, t = 40) {
    this.msg = text; this.msgBig = false;
    return wait(t).then(() => { if (this.msg === text) this.msg = null; });
  },
  // ---------- end ----------
  async victory() {
    await wait(20);
    Sound.jingle('victory');
    let exp = 0, gold = 0; const drops = [];
    for (const e of this.enemies) {
      exp += e.E.exp; gold += e.E.gold + (e.grabbed || 0);
      for (const [it, ch] of e.E.drops || []) if (Math.random() < ch) drops.push(it);
    }
    State.gold += gold;
    for (const a of this.allies) { a.pose = a.dead ? null : 'win'; }
    const lines = exp || gold ? [`胜利！获得 ${exp} 点经验，${gold} 文钱。`] : [];
    for (const it of drops) { addItem(it, 1); lines.push(`得到了 {${ITEMS[it].name}}。`); }
    for (const a of this.allies) {
      if (a.dead) continue;
      const c = a.c;
      const before = charSkills(c);
      c.exp += exp;
      let up = false;
      while (c.lv < 40 && c.exp >= EXP_TABLE[c.lv + 1]) { c.lv++; up = true; }
      if (up) {
        const s = stats(c);
        lines.push(`${a.name} 升到了 ${c.lv} 级！`);
        const gained = charSkills(c).filter((k) => !before.includes(k));
        for (const k of gained) lines.push(`${a.name} 领悟了「${SKILLS[k].name}」！`);
        a.mhp = s.mhp; a.mmp = s.mmp;
        a.hp = Math.min(s.mhp, a.hp + Math.round(s.mhp * 0.25));
      }
    }
    this.syncBack();
    this.result = { exp, gold };
    for (const ln of lines) await this.resultBox(ln, ln.includes('升到') ? 'lvup' : null);
    this.finish('win');
  },
  resultBox(text, sound) {
    if (sound === 'lvup') Sound.sfx('save');
    return new Promise((res) => { this.menu = new ResultBox(text); this.menu.done = () => { this.menu = null; res(); }; });
  },
  async defeat() {
    await wait(30);
    if (this.cfg.loseOk) { this.syncBack(true); this.finish('lose'); return; }
    Sound.stopMusic();
    await this.say('……', 40);
    this.finish('lose');
  },
  syncBack(restore) {
    for (const a of this.allies) {
      const c = a.c;
      c.hp = a.dead ? (restore ? 1 : 0) : a.hp;
      c.mp = a.mp;
      c.status = {};
      if (a.status.poison) c.status.poison = true;
      if (c.hp <= 0 && !restore) c.hp = 0;
    }
  },
  async finish(result) {
    if (result !== 'win' && result !== 'lose') this.syncBack();
    if (result === 'scripted') this.syncBack();
    await fadeOut('black', 3);
    this.active = false;
    Game.setScene(this.prevScene);
    // KO'd allies stand back up with 1 HP after battle (classic)
    for (const id of State.party) if (State.chars[id].hp <= 0 && result !== 'lose') State.chars[id].hp = 1;
    this.resolve(result);
  },
  // ---------- update/draw ----------
  update() {
    if (this.menu && this.menu.update) this.menu.update();
    for (const b of this.all()) {
      if (b.hitT > 0) b.hitT--;
      if (b.flashT > 0) b.flashT--;
      if (b.dodgeT > 0) b.dodgeT--;
    }
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g || 0; p.life--; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.pops) p.t++;
    this.pops = this.pops.filter((p) => p.t < 46);
    for (const f of this.fx) f.t++;
    this.fx = this.fx.filter((f) => f.t < f.life);
    if (this.auto && (Input.pressed.b || Input.pressed.select)) { this.auto = false; Sound.sfx('cancel'); }
  },
  draw(g) {
    rect(g, 0, 0, SW, SH, PAL.K);
    g.drawImage(this.bg, 0, FY);
    // enemies
    for (const e of this.enemies) drawEnemy(g, e, this);
    // party
    for (const a of this.allies) drawAlly(g, a, this);
    // effects
    for (const f of this.fx) f.draw(g, f.t);
    for (const p of this.parts) {
      if (p.img) g.drawImage(p.img, Math.round(p.x), Math.round(p.y));
      else rect(g, Math.round(p.x), Math.round(p.y), p.s || 1, p.s || 1, p.c);
    }
    this.drawTop(g);
    for (const p of this.pops) drawPop(g, p);
    this.drawBottom(g);
    if (this.menu && this.menu.draw) this.menu.draw(g);
  },
  drawTop(g) {
    if (this.msg) {
      drawBox(g, 0, 0, SW, 16, { plain: true });
      const txt = this.msg;
      if (this.msgBig) {
        const w = Font.measure(txt);
        rect(g, Math.round(SW / 2 - w / 2) - 6, 7, 3, 3, PAL.r);
        Font.draw(g, txt, Math.round(SW / 2 - w / 2), 2, INK);
      } else drawRich(g, txt, 5, 2);
      return;
    }
    if (this.desc) { drawBox(g, 0, 0, SW, 16, { plain: true }); drawRich(g, this.desc, 5, 2); return; }
    // turn order strip
    rect(g, 0, 0, SW, FY, PAL.K);
    const order = this.predict(7);
    Font.draw(g, '序', 2, 1, PAL.n);
    order.forEach((b, i) => drawTurnIcon(g, b, 18 + i * 20, 1, i === 0));
    if (this.auto) Font.draw(g, '自动', SW - 26, 1, PAL.y);
  },
  drawBottom(g) {
    drawBox(g, 0, BOT, SW, SH - BOT);
    // party status (right side)
    const x0 = 66;
    rect(g, x0, BOT + 4, 1, SH - BOT - 8, PAL.P);
    this.allies.forEach((a, i) => {
      const y = BOT + 4 + i * 13;
      const active = this.current === a;
      const nameCol = a.dead ? PAL.g : active ? PAL.r : INK;
      Font.draw(g, a.short, x0 + 4, y, nameCol);
      const hpCol = a.dead ? PAL.g : a.hp < a.mhp * 0.25 ? PAL.r : INK;
      drawNum(g, a.hp, x0 + 52, y, hpCol);
      drawNum(g, a.mp, x0 + 76, y, PAL.B);
      drawBar(g, x0 + 30, y + 11, 22, a.hp / a.mhp, a.hp < a.mhp * 0.25 ? PAL.r : PAL.G, PAL.P);
      drawBar(g, x0 + 58, y + 11, 18, a.mp / Math.max(1, a.mmp), PAL.C, PAL.P);
      const st = Object.keys(a.status)[0];
      if (st && !a.dead) Font.draw(g, STATUS_NAME[st], x0 + 82, y, PAL.Q);
      else if (a.dead) Font.draw(g, '倒', x0 + 82, y, PAL.g);
    });
  },
};

// ---------- battlers ----------
function mkAlly(id, i) {
  const c = State.chars[id];
  const s = stats(c);
  return {
    side: 'ally', id, c, name: CHARS[id].name, short: id === 'linfeng' ? '临风' : CHARS[id].name,
    hp: Math.min(c.hp, s.mhp), mhp: s.mhp, mp: Math.min(c.mp, s.mmp), mmp: s.mmp,
    atk: s.atk, def: s.def, spd: s.spd, mag: s.mag, luk: s.luk, el: CHARS[id].el,
    buff: {}, debuff: {}, status: Object.assign({}, c.status || {}), ct: rnd(10, 40),
    dead: c.hp <= 0, gone: c.hp <= 0,
    x: 112 + i * 12, y: FY + 18 + i * 20, w: 16, h: 16, ox: 0, idx: i,
    immune: [].concat(...['weapon', 'armor', 'acc'].map((k) => (c.equip[k] && ITEMS[c.equip[k]] && ITEMS[c.equip[k]].immune) || [])),
  };
}
function mkEnemy(key, i, n) {
  const E = ENEMIES[key];
  const img = enemyImage(E);
  const letters = 'ABC';
  const same = 0;
  return {
    side: 'enemy', key, E, name: E.name, hp: E.hp, mhp: E.hp, mp: 999, mmp: 999,
    atk: E.atk, def: E.def, spd: E.spd, mag: E.mag, luk: E.lv, el: E.el,
    buff: {}, debuff: {}, status: {}, ct: rnd(0, 50), img, w: img.width, h: img.height, ox: 0, idx: i,
    immune: E.boss ? ['sleep', 'stun'] : [],
  };
}
function layoutEnemies(list) {
  const n = list.length;
  // name suffixes for duplicates
  const count = {};
  for (const e of list) count[e.name] = (count[e.name] || 0) + 1;
  const seen = {};
  for (const e of list) if (count[e.name] > 1) { seen[e.name] = (seen[e.name] || 0) + 1; e.name = e.name + 'ABC'[seen[e.name] - 1]; }
  const slots = {
    1: [[40, 22]],
    2: [[16, 12], [56, 36]],
    3: [[6, 8], [52, 14], [24, 44]],
  }[n] || [[40, 22]];
  list.forEach((e, i) => {
    const [sx, sy] = slots[i];
    e.x = sx + (32 - e.w) / 2; e.y = FY + sy + (32 - e.h) + 2;
    if (e.h > 32) { e.x = Math.round(48 - e.w / 2); e.y = FY + Math.round(FH - e.h - 6); }
    e.x = Math.round(e.x); e.y = Math.round(e.y);
  });
}
function eff(b, k) {
  let v = b[k];
  if (b.buff && b.buff[k]) v *= k === 'def' ? 1.5 : 1.35;
  if (b.debuff && b.debuff[k]) v *= 0.7;
  return v;
}
function effSpd(b) { let v = b.spd * (b.buff && b.buff.spd ? 1.4 : 1); return Math.max(1, v); }
function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
function immuneTo(t, st) { return (t.immune || []).includes(st); }
function applyStatus(t, st) {
  if (st === 'poison') t.status.poison = true;
  else if (st === 'sleep') t.status.sleep = irnd(2, 3);
  else if (st === 'seal') t.status.seal = 3;
  else if (st === 'stun') t.status.stun = 1;
}
function retarget(t, b, B) {
  if (t && !t.dead) return t;
  const pool = (t && t.side === 'ally') || (!t && b.side === 'enemy') ? B.allies : B.enemies;
  const live = pool.filter((x) => !x.dead);
  return live.length ? pick(live) : null;
}
function addItem(id, n = 1) { State.items[id] = (State.items[id] || 0) + n; }

// ---------- enemy AI ----------
function enemyAction(e, B) {
  const live = B.allies.filter((a) => !a.dead);
  const target = () => {
    // a little focus: slightly prefer whoever has lower HP
    const w = live.map((a) => 1 + (1 - a.hp / a.mhp));
    let r = Math.random() * w.reduce((s, x) => s + x, 0);
    for (let i = 0; i < live.length; i++) { r -= w[i]; if (r <= 0) return live[i]; }
    return live[0];
  };
  if (e.charge) { const sk = e.charge; e.charge = null; return { type: 'skill', skill: sk, target: target() }; }
  const ai = e.E.ai;
  if (typeof ai === 'string') return BOSS_AI[ai](e, B, target);
  const opts = ai.filter(([id, w, cond]) => !cond || cond(e));
  let total = opts.reduce((s, o) => s + o[1], 0);
  let r = Math.random() * total;
  let choice = opts[0][0];
  for (const [id, w] of opts) { r -= w; if (r <= 0) { choice = id; break; } }
  if (choice === 'attack') return { type: 'attack', target: target() };
  return { type: 'skill', skill: choice, target: target() };
}
const BOSS_AI = {
  dragon(e, B, target) {
    e.n = (e.n || 0) + 1;
    const every = e.hp < e.mhp * 0.5 ? 3 : 4;
    if (e.n % every === 0) return { type: 'charge', skill: 'e_glacier', text: '冰蛟 张口吸聚寒气……（防御！）' };
    const r = Math.random();
    if (r < 0.35) return { type: 'skill', skill: 'e_frost', target: target() };
    if (r < 0.6) return { type: 'skill', skill: 'e_tail', target: target() };
    if (r < 0.8) return { type: 'skill', skill: 'e_icefang', target: target() };
    return { type: 'attack', target: target() };
  },
  jin(e, B, target) {
    e.n = (e.n || 0) + 1;
    if (!e.raged && e.hp < e.mhp * 0.6) { e.raged = true; return { type: 'skill', skill: 'e_rage', target: e, quick: true }; }
    if (e.n % 5 === 0) return { type: 'charge', skill: 'e_hellfire', text: '烬 周身燃起黑焰……（防御！）' };
    if (e.n === 2) return { type: 'talk', text: '烬：“就这点本事？他当年可不是这样。”' };
    const r = Math.random();
    if (r < 0.4) return { type: 'skill', skill: 'e_demonslash', target: target() };
    if (r < 0.6 && e.hp < e.mhp * 0.35) return { type: 'skill', skill: 'e_hellfire', target: target() };
    return { type: 'attack', target: target() };
  },
  yan1(e, B, target) {
    e.n = (e.n || 0) + 1;
    if (e.n % 4 === 0) return { type: 'charge', skill: 'e_void', text: '魇 张开了深渊之口……（防御！）' };
    const r = Math.random();
    if (r < 0.3) return { type: 'skill', skill: 'e_nightmare', target: target() };
    if (r < 0.65) return { type: 'skill', skill: 'e_shadow', target: target() };
    return { type: 'skill', skill: 'e_swordrain', target: target() };
  },
  yan2(e, B, target) {
    e.n = (e.n || 0) + 1;
    if (e.n % 3 === 0) return { type: 'charge', skill: 'e_void', text: '归墟之力汇聚……（防御！）' };
    const r = Math.random();
    if (r < 0.25) return { type: 'skill', skill: 'e_wail', target: target() };
    if (r < 0.55) return { type: 'skill', skill: 'e_hellfire', target: target() };
    if (r < 0.8) return { type: 'skill', skill: 'e_glacier', target: target() };
    return { type: 'skill', skill: 'e_demonslash', target: target() };
  },
};
function autoAction(b, B) {
  const live = B.enemies.filter((e) => !e.dead);
  return { type: 'attack', target: live.sort((x, y) => x.hp - y.hp)[0] };
}

// ---------- menus ----------
class CmdMenu {
  constructor(b) {
    this.b = b;
    const skillWord = { shenmo: '剑技', suli: '仙术', linfeng: '剑诀' }[b.id] || '技能';
    this.items = [['attack', '攻击'], ['skill', skillWord], ['item', '物品'], ['defend', '防御'], ['flee', '逃跑'], ['auto', '自动']];
    this.i = Battle.lastCmd && Battle.lastCmd[b.id] || 0;
  }
  update() {
    const col = this.i % 2, row = Math.floor(this.i / 2);
    if (Input.rep.down) { this.i = (this.i + 2) % 6; Sound.sfx('cursor'); }
    if (Input.rep.up) { this.i = (this.i + 4) % 6; Sound.sfx('cursor'); }
    if (Input.rep.left || Input.rep.right) { this.i = row * 2 + (1 - col); Sound.sfx('cursor'); }
    const [k] = this.items[this.i];
    Battle.desc = { attack: `${this.b.name}：普通攻击`, skill: '施展招式', item: '使用物品', defend: '减半受到的伤害，并更快行动', flee: '逃离战斗', auto: '自动攻击，按 B 取消' }[k];
    if (Input.ok()) { Sound.sfx('ok'); Battle.lastCmd = Battle.lastCmd || {}; Battle.lastCmd[this.b.id] = this.i; this.done(k); }
  }
  draw(g) {
    this.items.forEach(([k, label], j) => {
      const x = 9 + (j % 2) * 30, y = BOT + 4 + Math.floor(j / 2) * 13;
      Font.draw(g, label, x, y, INK);
    });
    drawCursor(g, 3 + (this.i % 2) * 30, BOT + 6 + Math.floor(this.i / 2) * 13);
  }
}
class ListMenu {
  // entries: [{label, right, ok, desc, value}]
  constructor(entries) { this.e = entries; this.i = 0; this.top = 0; }
  update() {
    const n = this.e.length;
    if (!n) { if (Input.cancel() || Input.ok()) { Sound.sfx('cancel'); this.done(null); } return; }
    if (Input.rep.down) { this.i = Math.min(n - 1, this.i + 2); Sound.sfx('cursor'); }
    if (Input.rep.up) { this.i = Math.max(0, this.i - 2); Sound.sfx('cursor'); }
    if (Input.rep.right && this.i % 2 === 0 && this.i + 1 < n) { this.i++; Sound.sfx('cursor'); }
    if (Input.rep.left && this.i % 2 === 1) { this.i--; Sound.sfx('cursor'); }
    const row = Math.floor(this.i / 2);
    if (row < this.top) this.top = row;
    if (row > this.top + 2) this.top = row - 2;
    const cur = this.e[this.i];
    Battle.desc = cur.desc;
    if (Input.ok()) {
      if (cur.ok === false) { Sound.sfx('bump'); return; }
      Sound.sfx('ok'); this.done(cur.value);
    } else if (Input.cancel()) { Sound.sfx('cancel'); this.done(null); }
  }
  draw(g) {
    drawBox(g, 0, BOT, SW, SH - BOT);
    if (!this.e.length) { Font.draw(g, '什么也没有。', 12, BOT + 17, PAL.n); return; }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const j = (this.top + r) * 2 + c;
      const en = this.e[j];
      if (!en) continue;
      const x = 12 + c * 76, y = BOT + 4 + r * 13;
      Font.draw(g, en.label, x, y, en.ok === false ? PAL.g : INK);
      if (en.right !== undefined) { const s = String(en.right); Font.draw(g, s, x + 70 - Font.measure(s), y, en.ok === false ? PAL.g : en.gold ? PAL.Y : PAL.B); }
    }
    const r = Math.floor(this.i / 2) - this.top;
    drawCursor(g, 4 + (this.i % 2) * 76, BOT + 6 + r * 13);
    if (this.top > 0) drawArrow(g, SW - 9, BOT + 2, true);
    if ((this.top + 3) * 2 < this.e.length) drawArrow(g, SW - 9, SH - 7, false);
  }
}
class SkillMenu extends ListMenu {
  constructor(b) {
    const list = charSkills(b.c).map((k) => {
      const S = SKILLS[k];
      const cost = S.gold ? S.gold : S.mp;
      const ok = !b.status.seal && (S.gold ? State.gold >= S.gold : b.mp >= S.mp);
      const elTxt = S.el ? `[${S.el}]` : '';
      return { label: S.name.length > 4 ? S.name.slice(0, 4) : S.name, right: cost, gold: !!S.gold, ok, desc: `${elTxt}${S.desc}${S.gold ? '（花费' + S.gold + '文）' : ''}`, value: k };
    });
    super(list);
  }
}
class ItemMenu extends ListMenu {
  constructor(b) {
    const list = Object.entries(State.items).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].kind === 'use' && !ITEMS[k].fieldOnly)
      .map(([k, n]) => ({ label: ITEMS[k].name.slice(0, 4), right: n, desc: ITEMS[k].desc, value: k }));
    super(list);
  }
}
class TargetPicker {
  constructor(list, all, user, skill) { this.l = list; this.all = all; this.i = 0; this.user = user; this.skill = skill; if (list.length && list[0].side === 'ally' && !all) this.i = Math.max(0, list.indexOf(user)); }
  update() {
    if (!this.l.length) { this.done(null); return; }
    const n = this.l.length;
    if (!this.all) {
      if (Input.rep.down || Input.rep.right) { this.i = (this.i + 1) % n; Sound.sfx('cursor'); }
      if (Input.rep.up || Input.rep.left) { this.i = (this.i + n - 1) % n; Sound.sfx('cursor'); }
    }
    const t = this.l[this.i];
    if (this.all) Battle.desc = this.l[0].side === 'enemy' ? '敌方全体' : '我方全体';
    else if (t.side === 'enemy') {
      const S = this.skill;
      const m = S && S.el ? elemMult(S.el, t.el) : 1;
      Battle.desc = `${t.name}${t.el ? '［' + t.el + '］' : ''}${m > 1 ? '  {克制}' : m < 1 ? '  [被抗]' : ''}`;
    } else Battle.desc = `${t.name}  ${t.hp}/${t.mhp}`;
    if (Input.ok()) { Sound.sfx('ok'); this.done(this.all ? true : t); }
    else if (Input.cancel()) { Sound.sfx('cancel'); this.done(null); }
  }
  draw(g) {
    const bob = Math.floor(frameCount / 10) % 2;
    const show = this.all ? this.l : [this.l[this.i]];
    for (const t of show) {
      if (!t) continue;
      if (t.side === 'enemy') drawPointer(g, t.x + t.w / 2 - 3, t.y - 9 + bob, false);
      else drawPointer(g, t.x + (t.ox || 0) - 9 - bob, t.y + 4, true);
    }
  }
}
class ResultBox {
  constructor(text) { this.text = text; this.t = 0; }
  update() { this.t++; if (this.t > 12 && Input.ok()) { Sound.sfx('text'); this.done(); } }
  draw(g) {
    drawBox(g, 0, BOT, SW, SH - BOT);
    const rows = wrapRich(parseRich(this.text), 148);
    rows.slice(0, 3).forEach((r, i) => { let x = 6; for (const c of r) { Font.draw(g, c.ch, x, BOT + 5 + i * 13, c.col || INK); x += Font.width(c.ch); } });
    if (this.t > 12) drawMore(g, SW - 11, SH - 8);
  }
}

// ---------- drawing helpers ----------
function drawRich(g, text, x, y) {
  for (const c of parseRich(text)) { Font.draw(g, c.ch, x, y, c.col || INK); x += Font.width(c.ch); }
}
function drawNum(g, n, rightX, y, col) {
  const s = String(Math.max(0, Math.round(n)));
  Font.draw(g, s, rightX - s.length * 6, y, col);
}
const ARROW_UP = ['..K..', '.KrK.', 'KrrrK', 'KKKKK'];
let arrowImgs = null;
function drawArrow(g, x, y, up) {
  if (!arrowImgs) arrowImgs = [art(ARROW_UP), art(ARROW_UP.slice().reverse())];
  g.drawImage(arrowImgs[up ? 0 : 1], x, y);
}
const POINTER = ['KKKKKKK', 'KyyyyyK', '.KyyyK.', '..KyK..', '...K...'];
let pointerImgs = null;
function drawPointer(g, x, y, side) {
  if (!pointerImgs) {
    pointerImgs = [art(POINTER), art(['K....', 'KyK..', 'KyyK.', 'KyyyK', 'KyyK.', 'KyK..', 'K....'].map((r) => r.split('').reverse().join('')))];
  }
  g.drawImage(pointerImgs[side ? 1 : 0], Math.round(x), Math.round(y));
}
function drawTurnIcon(g, b, x, y, first) {
  rect(g, x, y, 18, 12, first ? PAL.r : PAL.k);
  rect(g, x + 1, y + 1, 16, 10, b.side === 'ally' ? PAL.p : PAL.N);
  if (b.side === 'ally') {
    const img = BATTLE_MINI[b.id];
    if (img) g.drawImage(img, x + 1, y + 1);
  } else {
    const img = b.mini || (b.mini = miniOf(b.img));
    g.drawImage(img, x + 1, y + 1);
  }
}
const BATTLE_MINI = {};
function miniOf(img) {
  // crop the centre of a sprite into a 16x10 badge
  const c = makeCanvas(16, 10);
  const g = c.getContext('2d');
  const sx = Math.max(0, Math.round(img.width / 2 - 8)), sy = Math.max(0, Math.round(img.height * 0.25));
  g.drawImage(img, sx, sy, 16, 10, 0, 0, 16, 10);
  return c;
}
function drawPop(g, p) {
  const t = p.t;
  let dy = t < 8 ? -t * 1.2 : t < 14 ? -9.6 + (t - 8) * 0.8 : -4.8;
  const y = Math.max(15, Math.round(p.y + dy - 12));
  const col = { dmg: PAL.W, hurt: PAL.W, crit: PAL.y, heal: PAL.l, mp: PAL.C, miss: PAL.w, buff: PAL.y, status: PAL.q, weak: PAL.o, resist: PAL.i, poison: PAL.q }[p.kind] || PAL.W;
  const w = Font.measure(p.val);
  if (t > 38 && t % 2) return;
  Font.drawOutlined(g, p.val, Math.round(p.x - w / 2), y, col, PAL.K);
}
function drawEnemy(g, e, B) {
  if (e.gone && (e.dissolve || 0) >= 1) return;
  let x = e.x + (e.ox || 0), y = e.y;
  if (e.hitT > 0) x += (e.hitT % 4 < 2 ? -2 : 2);
  if (!e.dead || e.dissolve !== undefined) {
    // idle bob for floaters
    if (!e.dead && e.E.float) y += Math.round(Math.sin(frameCount / 14 + e.idx) * 1.5);
  }
  // shadow
  rect(g, Math.round(x + e.w * 0.2), e.y + e.h - 2, Math.round(e.w * 0.6), 2, 'rgba(0,0,0,0.25)');
  let img = e.img;
  if (e.flashT > 0 && e.flashT % 2 === 0) img = silhouette(e.img, PAL.W);
  if (e.charge && frameCount % 16 < 8) img = silhouette(e.img, e.E.el === '火' ? PAL.o : PAL.c);
  if (e.dissolve) img = dissolveOf(e.img, e.dissolve);
  g.drawImage(img, Math.round(x), Math.round(y));
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dissolveCache = new Map();
function dissolveOf(img, t) {
  const step = Math.min(16, Math.floor(t * 16));
  let m = dissolveCache.get(img);
  if (!m) { m = []; dissolveCache.set(img, m); }
  if (m[step]) return m[step];
  const c = makeCanvas(img.width, img.height);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (BAYER[(y % 4) * 4 + (x % 4)] < step) d.data[(y * c.width + x) * 4 + 3] = 0;
    else if (BAYER[(y % 4) * 4 + (x % 4)] < step + 3 && d.data[(y * c.width + x) * 4 + 3]) { const i = (y * c.width + x) * 4; d.data[i] = 248; d.data[i + 1] = 248; d.data[i + 2] = 248; }
  }
  g.putImageData(d, 0, 0);
  return (m[step] = c);
}
function drawAlly(g, a, B) {
  if (a.dead) {
    const img = BSPR[a.id] && BSPR[a.id].ko;
    if (img) g.drawImage(img, a.x, a.y + 4);
    return;
  }
  const S = BSPR[a.id];
  if (!S) return;
  let pose = a.pose;
  let img;
  const lowHp = a.hp < a.mhp * 0.25;
  if (a.hitT > 0) img = S.hurt;
  else if (pose === 'attack') img = S.attack;
  else if (pose === 'cast') img = S.cast;
  else if (pose === 'run') img = S.run[Math.floor(frameCount / 6) % 2];
  else if (pose === 'win') img = Math.floor(frameCount / 20) % 2 ? S.win : S.idle[0];
  else if (lowHp || a.status.sleep) img = S.weak;
  else if (a.defending) img = S.guard;
  else img = S.idle[Math.floor(frameCount / 24 + a.idx) % 2];
  let x = a.x + (a.ox || 0) - (a.step ? 6 : 0);
  if (a.hitT > 0) x += a.hitT % 4 < 2 ? 1 : -1;
  if (a.dodgeT > 0) x += 6;
  rect(g, x + 3, a.y + 15, 10, 2, 'rgba(0,0,0,0.25)');
  if (a.flashT > 0 && a.flashT % 2 === 0) img = silhouette(img, PAL.W);
  g.drawImage(img, Math.round(x), a.y);
  if (a.status.sleep && frameCount % 40 < 30) Font.draw(g, 'z', x + 12, a.y - 8 - Math.floor((frameCount % 40) / 10), PAL.W);
}

// ---------- launching from the field ----------
async function fieldBattle(grp) {
  if (!grp) return;
  const r = await startBattle({ enemies: grp.enemies, bg: grp.bg, music: grp.music });
  return r;
}
async function startBattle(cfg) {
  Sound.sfx('encounter');
  // GBC-style intro: flash, then horizontal blinds close
  for (let i = 0; i < 3; i++) { FX.invert = 3; await wait(5); await wait(3); }
  await anim((f) => { Game.wipe = f / 20; return f >= 20; });
  FX.fade = 4; FX.fadeTo = 'black';
  Game.wipe = 0;
  const r = await Battle.start(cfg);
  if (r === 'lose' && !cfg.loseOk) { await gameOver(cfg); return 'lose'; }
  if (Game.scene === Field) { Field.draw(ctx); Sound.music(typeof Field.map.def.music === 'function' ? Field.map.def.music() : Field.map.def.music); }
  await fadeIn(3);
  return r;
}
