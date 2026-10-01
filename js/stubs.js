'use strict';
// temporary stand-ins while modules are written
if (typeof PORTRAIT === 'undefined') window.PORTRAIT = {};
if (typeof openMainMenu === 'undefined') window.openMainMenu = () => {};
if (typeof pickEncounter === 'undefined') window.pickEncounter = () => null;
if (typeof fieldBattle === 'undefined') window.fieldBattle = async () => {};
if (typeof gameOver === 'undefined') window.gameOver = async () => {};
