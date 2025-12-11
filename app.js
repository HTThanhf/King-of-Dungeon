// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDMWPQQqaCcWT9Zk_iY5CRwNKsFGmREvBg",
  authDomain: "king-of-dungeon.firebaseapp.com",
  databaseURL: "https://king-of-dungeon-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "king-of-dungeon",
  storageBucket: "king-of-dungeon.firebasestorage.app",
  messagingSenderId: "547329586582",
  appId: "1:547329586582:web:c34e66f6b08767766959b7",
  measurementId: "G-T54V37EH6B"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- Auth ---
function register(){
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email,password).then(user=>{
        alert('Đăng ký thành công');
        localStorage.setItem('uid', user.user.uid);
        window.location='lobby.html';
    }).catch(console.log);
}

function login(){
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email,password).then(user=>{
        localStorage.setItem('uid', user.user.uid);
        window.location='lobby.html';
    }).catch(console.log);
}

// --- Lobby ---
function createRoom(){
    const roomCode = Math.random().toString(36).substring(2,6).toUpperCase();
    const uid = localStorage.getItem('uid');
    db.ref('rooms/'+roomCode).set({turn:0,players:{[uid]:{hp:10,hand:[]}}});
    localStorage.setItem('roomCode', roomCode);
    window.location='game.html';
}

function joinRoom(){
    const code = document.getElementById('roomCode').value.toUpperCase();
    const uid = localStorage.getItem('uid');
    db.ref('rooms/'+code+'/players').once('value',snap=>{
        const players = snap.val()||{};
        if(Object.keys(players).length>=6){ alert('Room full'); return; }
        db.ref('rooms/'+code+'/players/'+uid).set({hp:10,hand:[]});
        localStorage.setItem('roomCode', code);
        window.location='game.html';
    });
}

// --- Game base ---
const baseDeck = [
    {name:"Attack 3", damage:3, heal:0},
    {name:"Attack 5", damage:5, heal:0},
    {name:"Heal 3", damage:0, heal:3}
];

let roomCode = localStorage.getItem('roomCode');
let uid = localStorage.getItem('uid');
let players = {};
let turn = 0;

if(roomCode && uid){
    // Listen realtime
    db.ref('rooms/'+roomCode+'/players').on('value',snap=>{ players=snap.val()||{}; renderBoard(); });
    db.ref('rooms/'+roomCode+'/turn').on('value',snap=>{ turn=snap.val(); renderBoard(); });
}

function renderBoard(){
    const board = document.getElementById('board');
    if(!board) return;
    board.innerHTML='';
    Object.keys(players).forEach(pid=>{
        const p = players[pid];
        const div=document.createElement('div');
        div.style.border='1px solid #fff'; div.style.margin='5px'; div.style.padding='5px';
        div.innerHTML=`<b>${pid===uid?'You':pid}</b><br>HP:${p.hp}`;
        board.appendChild(div);
    });
}

function playCard(cardIdx){
    const p = players[uid];
    const card = p.hand[cardIdx];
    const targets = Object.keys(players).filter(k=>k!==uid && players[k].hp>0);
    if(card.damage>0 && targets.length>0){
        const targetId = targets[Math.floor(Math.random()*targets.length)];
        db.ref('rooms/'+roomCode+'/players/'+targetId+'/hp').set(players[targetId].hp-card.damage);
    }
    if(card.heal>0){
        db.ref('rooms/'+roomCode+'/players/'+uid+'/hp').set(players[uid].hp+card.heal);
    }
    p.hand.splice(cardIdx,1);
    db.ref('rooms/'+roomCode+'/players/'+uid+'/hand').set(p.hand);
    db.ref('rooms/'+roomCode+'/turn').set((turn+1)%Object.keys(players).length);
}
