const GEMINI_API_KEY = "xxx";
const GEMINI_MODEL = "gemini-2.5-flash-lite";

const TOPICS = [
"💻 C",
"⚙️ C++",
"☕ JAVA",
"🐍 PYTHON",
"✨ JavaScript",
"🌐 HTML",
"🎨 CSS",
"📘 TypeScript",
"🐘 PHP",
"🟢 Node.js",
"📢 Digital Marketing",
"🗄️ SQL",
"🧠 DSA",
"💾 DBMS",
"🖥️ OS",
"📊 Data Science",
"🐧 Linux",
"📈 Advance Excel",
"💰 Tally",
"🅰️ Angular JS",
"📚 PL SQL",
"🎯 Laravel",
"📝 Wordpress",
"📱 Flutter",
"📐 MATLAB",
"⚛️ React JS",
"📂 MS Office",
"🔷 ASP.NET",
"Reasoning",
"Aptitude"
];
let qs=[],cur=0,score=0,ans=[],tims=[];
let topic='',diff='easy',qn=10;
let tick=null,left=30,ts=0;

// Build topic chips
const tg=document.getElementById('topicsGrid');
TOPICS.forEach(t=>{
  const b=document.createElement('button');
  b.className='tc';b.textContent=t;
  b.onclick=()=>{document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));b.classList.add('sel');topic=t.replace(/^\S+\s/,'');document.getElementById('customTopic').value='';};
  tg.appendChild(b);
});

// Difficulty
document.querySelectorAll('.db').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('.db').forEach(x=>{x.className='db';});b.className='db d'+b.dataset.d[0];diff=b.dataset.d;};
});

// Slider
const sl=document.getElementById('qsl'),vl=document.getElementById('qvl');
sl.oninput=()=>{qn=+sl.value;vl.textContent=qn;sl.style.setProperty('--pct',((qn-3)/17*100)+'%');};

document.getElementById('customTopic').oninput=e=>{if(e.target.value.trim())document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));};

function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function toast(msg,dur=3200){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),dur);}

async function go(){
  const ct=document.getElementById('customTopic').value.trim();
  const t=ct||topic;
  if(!t){toast('⚠️ Please select or type a topic first!');return;}
  topic=t;
  const btn = document.getElementById('genBtn');
  btn.disabled=true;
  document.getElementById('genBtn').disabled=true;
  showScreen('S1');

  const msgs=['GENERATING QUESTIONS…','CRAFTING OPTIONS…','VERIFYING ANSWERS…','ALMOST READY…'];
  let mi=0;
  const lp=setInterval(()=>{mi=(mi+1)%msgs.length;document.getElementById('lm').textContent=msgs[mi];},1800);

  const prompt=`Generate exactly ${qn} multiple-choice quiz questions about "${topic}" at ${diff} difficulty.

Return ONLY a raw JSON array. No markdown, no code fences, no explanation. Format:
[{"question":"...","options":["A","B","C","D"],"answer":0},...]

Rules:
- "answer" = 0-based index of the correct option
- All 4 options must be plausible, only one correct
- Keep each option under 70 characters
- Make questions varied and engaging
- Do not repeat questions`;

  try{
    const r=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:0.7}
        })
      }
    );
    if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.error?.message||'HTTP '+r.status);}
    const d=await r.json();
    let raw=(d.candidates?.[0]?.content?.parts?.[0]?.text||'').replace(/```[\w]*\n?/g,'').replace(/```/g,'').trim();
    const m=raw.match(/\[[\s\S]*\]/);
    if(!m)throw new Error('No JSON array found');
    qs=JSON.parse(m[0]);
    if(!Array.isArray(qs)||!qs.length)throw new Error('Empty questions');
    clearInterval(lp);
    cur=0;score=0;ans=[];tims=[];
    showScreen('S2');
    document.getElementById('qmeta').textContent=`${topic} • ${diff}`;
    renderQ();
  }catch(e){
    clearInterval(lp);
    console.error(e);
    toast('❌ Error: '+e.message,4000);
    showScreen('S0');
    document.getElementById('genBtn').disabled=false;
  }
}

function renderQ(){
  const q=qs[cur],total=qs.length;
  document.getElementById('qbadge').textContent=`Q ${cur+1} / ${total}`;
  document.getElementById('qnt').textContent=`QUESTION ${String(cur+1).padStart(2,'0')}`;
  document.getElementById('qtx').textContent=q.question;
  document.getElementById('pf').style.width=((cur/total)*100)+'%';

  const keys=['A','B','C','D'],grid=document.getElementById('og');
  grid.innerHTML='';
  q.options.forEach((opt,i)=>{
    const b=document.createElement('button');
    b.className='ob';
    b.innerHTML=`<span class="ok">${keys[i]}</span><span>${opt}</span>`;
    b.onclick=()=>pick(i);
    grid.appendChild(b);
  });

  const fb=document.getElementById('fb');fb.style.display='none';fb.className='fb';
  startTick();ts=Date.now();
}

function startTick(){
  clearInterval(tick);left=30;
  const el=document.getElementById('timerDisplay');
  el.textContent=30;el.style.color='var(--accent3)';
  tick=setInterval(()=>{
    left--;el.textContent=left;
    if(left<=10)el.style.color='var(--wrong)';
    if(left<=0){clearInterval(tick);timeout();}
  },1000);
}

function timeout(){
  lockAll();
  tims.push(30);
  ans.push({q:qs[cur].question,sel:-1,cor:qs[cur].answer,opts:qs[cur].options});
  showFb(null,true);
}

function pick(i){
  clearInterval(tick);
  tims.push(Math.min(Math.round((Date.now()-ts)/1000),30));
  const q=qs[cur],ok=i===q.answer;
  if(ok)score++;
  ans.push({q:q.question,sel:i,cor:q.answer,opts:q.options});
  document.querySelectorAll('.ob').forEach((b,j)=>{
    b.disabled=true;
    if(j===q.answer)b.classList.add('correct');
    else if(j===i&&!ok)b.classList.add('wrong');
  });
  showFb(ok,false);
}

function lockAll(){
  const q=qs[cur];
  document.querySelectorAll('.ob').forEach((b,j)=>{b.disabled=true;if(j===q.answer)b.classList.add('correct');});
}

function showFb(ok,to){
  const bar=document.getElementById('fb');
  bar.style.display='flex';
  if(to){bar.className='fb wf';document.getElementById('fbt').textContent="⏰ Time's up!";}
  else if(ok){bar.className='fb cf';document.getElementById('fbt').textContent='✅ Correct! Well done.';}
  else{bar.className='fb wf';document.getElementById('fbt').textContent=`❌ Correct: ${qs[cur].options[qs[cur].answer]}`;}
}

function nextQ(){cur++;if(cur>=qs.length)showResults();else renderQ();}

function showResults(){
  clearInterval(tick);showScreen('S3');
  const total=qs.length,pct=Math.round(score/total*100);
  const avg=tims.length?Math.round(tims.reduce((a,b)=>a+b,0)/tims.length):0;
  document.getElementById('scorePct').textContent=pct+'%';
  document.getElementById('sc').textContent=score;
  document.getElementById('sw').textContent=total-score;
  document.getElementById('st').textContent=avg+'s';

  let g,m,c;
  if(pct>=90){g='S RANK 🏆';m="Flawless! You're a genius.";c='#f59e0b';}
  else if(pct>=75){g='A RANK ⭐';m='Excellent performance!';c='var(--correct)';}
  else if(pct>=60){g='B RANK 👍';m='Good job, keep it up!';c='var(--accent2)';}
  else if(pct>=40){g='C RANK 📖';m='Keep practicing!';c='var(--accent)';}
  else{g='D RANK 💪';m='Study more and retry!';c='var(--wrong)';}

  document.getElementById('rg').textContent=g;document.getElementById('rg').style.color=c;
  document.getElementById('rm').textContent=m;
  document.getElementById('scorePct').style.color=c;

  const C=2*Math.PI*70,rf=document.getElementById('rf');
  rf.style.stroke=c;rf.style.strokeDasharray=C;
  setTimeout(()=>rf.style.strokeDashoffset=C*(1-pct/100),80);

  const rl=document.getElementById('rl');rl.innerHTML='';
  ans.forEach((a,i)=>{
    const ok=a.sel===a.cor,d=document.createElement('div');d.className='ri';
    d.innerHTML=`<div style="font-size:1rem;flex-shrink:0;margin-top:2px">${ok?'✅':'❌'}</div><div>
      <div class="riq">Q${i+1}. ${a.q}</div>
      <div class="ria">${a.sel===-1
        ?`Timed out · Correct: <span class="ca">${a.opts[a.cor]}</span>`
        :ok?`<span class="ca">${a.opts[a.sel]}</span>`
        :`Your answer: <span class="wa">${a.opts[a.sel]}</span> · Correct: <span class="ca">${a.opts[a.cor]}</span>`}</div></div>`;
    rl.appendChild(d);
  });
}

function reset(){
  clearInterval(tick);qs=[];cur=0;score=0;ans=[];tims=[];topic='';
  document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
  document.getElementById('customTopic').value='';
  document.getElementById('genBtn').disabled=false;
  showScreen('S0');
}
