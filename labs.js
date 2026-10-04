const labData = {
  alp: {name:'ALP', longName:'alkaline phosphatase', unit:'U/L', range:[20,150], dates:['Feb 25','Apr 9','Jun 10','Aug 28','Oct 1'], values:[560,720,890,1120,1380], latestDate:'Oct 1, 2026', trend:'Increasing', note:'Up across recent checks'},
  alt: {name:'ALT', longName:'alanine aminotransferase', unit:'U/L', range:[10,125], dates:['Feb 25','Apr 9','Jun 10','Aug 28','Oct 1'], values:[310,83,74,68,62], latestDate:'Oct 1, 2026', trend:'Improving', note:'Down across recent checks'},
  creatinine: {name:'Creatinine', longName:'creatinine', unit:'mg/dL', range:[0.5,1.8], dates:['Feb 25','Apr 9','Jun 10','Aug 28','Oct 1'], values:[1.1,1.2,1.2,1.3,1.4], latestDate:'Oct 1, 2026', trend:'Stable', note:'Within sample reference range'},
  bun: {name:'BUN', longName:'blood urea nitrogen', unit:'mg/dL', range:[7,27], dates:['Feb 25','Apr 9','Jun 10','Aug 28','Oct 1'], values:[20,21,22,24,25], latestDate:'Oct 1, 2026', trend:'Stable', note:'Within sample reference range'},
  upc: {name:'UPC', longName:'urine protein-to-creatinine ratio', unit:'', range:[0,0.5], dates:['Jul 22','Aug 28','Sep 16','Sep 24','Oct 1'], values:[1.1,2.0,3.2,5.4,6.8], latestDate:'Oct 1, 2026', trend:'Increasing', note:'Above sample reference range'}
};
const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('lab-chart');
const select=document.getElementById('lab-select');
const make=(tag,attrs={})=>{const el=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); return el;};
const format=n=>Number.isInteger(n)?n.toLocaleString():n.toFixed(1);
function textEl(x,y,value,cls,anchor='middle'){const t=make('text',{x,y,class:cls,'text-anchor':anchor}); t.textContent=value; return t;}
function draw(key){
 const d=labData[key]; svg.replaceChildren();
 document.getElementById('latest-value').textContent=`${format(d.values.at(-1))}${d.unit?' '+d.unit:''}`;
 document.getElementById('latest-date').textContent=d.latestDate;
 document.getElementById('reference-value').textContent=`${format(d.range[0])}–${format(d.range[1])}${d.unit?' '+d.unit:''}`;
 document.getElementById('trend-value').textContent=d.trend; document.getElementById('trend-note').textContent=d.note;
 document.getElementById('chart-title').textContent=`${d.name} over time`; document.getElementById('chart-description').textContent=`Sample ${d.longName} history`;
 const W=760,H=330,m={l:64,r:28,t:28,b:52}, cw=W-m.l-m.r,ch=H-m.t-m.b;
 const max=Math.max(...d.values,d.range[1])*1.12, min=Math.min(0,...d.values,d.range[0]);
 const y=v=>m.t+ch-(v-min)/(max-min)*ch, x=i=>m.l+(cw/(d.values.length-1))*i;
 const grid=make('g');
 for(let i=0;i<=4;i++){const val=min+(max-min)*(i/4), yy=y(val); grid.append(make('line',{x1:m.l,y1:yy,x2:W-m.r,y2:yy,class:'chart-grid'})); grid.append(textEl(m.l-12,yy+4,format(val),'chart-axis-label','end'));}
 svg.append(grid);
 const rangeTop=y(d.range[1]), rangeBottom=y(d.range[0]); svg.append(make('rect',{x:m.l,y:rangeTop,width:cw,height:Math.max(2,rangeBottom-rangeTop),class:'chart-reference'}));
 let path=''; d.values.forEach((v,i)=>{path+=`${i?'L':'M'} ${x(i)} ${y(v)} `;}); svg.append(make('path',{d:path.trim(),class:'chart-line'}));
 d.values.forEach((v,i)=>{svg.append(make('circle',{cx:x(i),cy:y(v),r:6,class:'chart-point'})); svg.append(textEl(x(i),H-22,d.dates[i],'chart-date'));});
 svg.append(textEl(18,m.t+ch/2,d.unit||'Ratio','chart-y-title'));
}
select.addEventListener('change',e=>draw(e.target.value)); draw(select.value);
