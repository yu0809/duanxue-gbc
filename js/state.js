'use strict';
// ============================================================
//  Game state — everything that goes into a save file
// ============================================================
const PARTY_SPRITE = { shenmo: 'shenmo', suli: 'suli', linfeng: 'linfeng' };
let State = null;
function freshState() {
  return {
    map: 'forge', x: 3, y: 3, dir: 'down',
    party: ['shenmo'], followers: true, leaderSprite: 'shenmo',
    chars: {},            // per-character stats, filled by newChar()
    items: {},            // id -> count
    gold: 30,
    flags: {},
    opened: {},           // chest ids
    shards: [],           // 雪忆 memory shards found
    ledger: [],           // 账本 entries
    sword: 0,             // 断雪 forge stage (number of 灵 absorbed)
    repel: 0,
    playTime: 0,
    lastTitle: null,
    chapter: '序章',
  };
}
State = freshState();
function flag(k) { return !!State.flags[k]; }
function setFlag(k, v = true) { State.flags[k] = v; }
