"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Aperture, ArrowDownToLine, Bookmark, Check, ChevronLeft, ChevronRight, Clapperboard, Film, ImagePlus, Music2, Play, Plus, RotateCcw, Settings2, Shuffle, Sparkles, Trash2, Upload, Volume2, WandSparkles, X } from "lucide-react";

type Item={id:string;name:string;kind:"image"|"video";url:string;file:File};
type Preset={id:string;name:string;tag:string;colors:[string,string];fx:"zoom"|"slide"|"pulse"|"glitch"|"tilt"|"cinema"|"float"|"flash";variants:number};
const presets:Preset[]=[
{id:"velocity",name:"Velocity",tag:"Beat & Energy",colors:["#06b6d4","#2563eb"],fx:"pulse",variants:12},
{id:"cinema",name:"Cinematic",tag:"Filmes hangulat",colors:["#f59e0b","#111827"],fx:"cinema",variants:10},
{id:"neon",name:"Neon Rush",tag:"Éjszakai fények",colors:["#e879f9","#3b82f6"],fx:"glitch",variants:9},
{id:"memory",name:"Memories",tag:"Emlékek",colors:["#fbbf24","#f97316"],fx:"float",variants:8},
{id:"travel",name:"Wanderlust",tag:"Utazás",colors:["#22d3ee","#16a34a"],fx:"slide",variants:10},
{id:"luxury",name:"Luxury",tag:"Prémium",colors:["#eab308","#64748b"],fx:"tilt",variants:8},
{id:"food",name:"Food Story",tag:"Gasztro",colors:["#fb923c","#ef4444"],fx:"zoom",variants:8},
{id:"flash",name:"Flash Cut",tag:"Gyors montázs",colors:["#60a5fa","#e879f9"],fx:"flash",variants:12}
];
const sizes={"9:16":[540,960],"1:1":[720,720],"16:9":[960,540]} as const;
type Ratio=keyof typeof sizes;
function paint(ctx:CanvasRenderingContext2D, source:CanvasImageSource, sw:number,sh:number,w:number,h:number,t:number,p:Preset,variant:number){
  const scale=Math.max(w/sw,h/sh); const m=variant%5;
  const zoom=p.fx==="cinema"?1.035+0.045*t:p.fx==="pulse"?1+0.055*Math.sin(t*Math.PI*2*(m+1)):p.fx==="zoom"?1.05+0.10*t:1.025+0.025*Math.sin(t*Math.PI);
  const k=scale*zoom;let x=(w-sw*k)/2,y=(h-sh*k)/2;
  if(p.fx==="slide"||p.fx==="float"){x+=Math.sin(t*Math.PI*2)*(w*.06); y+=Math.cos(t*Math.PI*2)*(h*.045)}
  if(p.fx==="glitch"){x+=Math.sin(t*100+variant)*w*.008}
  if(p.fx==="tilt"){x+=Math.sin(t*2*Math.PI)*w*.02}
  ctx.drawImage(source,x,y,sw*k,sh*k);
  if(p.fx==="cinema"){ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(0,0,w,h);}
  if(p.fx==="flash"&&t<.09){ctx.fillStyle="rgba(255,255,255,"+(.32*(1-t/.09))+")";ctx.fillRect(0,0,w,h)}
  if(p.fx==="glitch"&&t<.10){ctx.fillStyle="rgba(34,211,238,.14)";ctx.fillRect(0,h*.32,w,h*.035)}
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"rgba(0,0,0,.11)");g.addColorStop(1,"rgba(0,0,0,.26)");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}
function mediaMime(){return ["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"].find(x=>typeof MediaRecorder!=="undefined"&&MediaRecorder.isTypeSupported(x))||""}
export default function Home(){
const [items,setItems]=useState<Item[]>([]),[music,setMusic]=useState<{name:string;url:string;file:File}|null>(null);
const [selected,setSelected]=useState("velocity"),[variant,setVariant]=useState(0),[ratio,setRatio]=useState<Ratio>("9:16"),[duration,setDuration]=useState(15),[bpm,setBpm]=useState(120),[offset,setOffset]=useState(0),[caption,setCaption]=useState(""),[preview,setPreview]=useState(false),[progress,setProgress]=useState(0),[status,setStatus]=useState(""),[exporting,setExporting]=useState(false),[favorites,setFavorites]=useState<string[]>([]);
const fileRef=useRef<HTMLInputElement>(null),musicRef=useRef<HTMLInputElement>(null),canvasRef=useRef<HTMLCanvasElement>(null),audioRef=useRef<HTMLAudioElement>(null),clockRef=useRef(0);
const preset=presets.find(p=>p.id===selected)||presets[0];
const cache=useRef<Map<string,HTMLImageElement|HTMLVideoElement>>(new Map());
useEffect(()=>()=>{items.forEach(i=>URL.revokeObjectURL(i.url));if(music)URL.revokeObjectURL(music.url)},[]); // lifetime handled on explicit removal too
useEffect(()=>{for(const item of items){if(cache.current.has(item.id))continue;if(item.kind==="image"){const img=new Image();img.src=item.url;cache.current.set(item.id,img)}else{const video=document.createElement("video");video.src=item.url;video.muted=true;video.loop=true;video.playsInline=true;video.preload="auto";cache.current.set(item.id,video)}}for(const [id,obj] of cache.current){if(!items.some(i=>i.id===id)){if(obj instanceof HTMLVideoElement){obj.pause();obj.removeAttribute("src");obj.load()}cache.current.delete(id)}}},[items]);
const addMedia=(files:FileList|null)=>{if(!files)return;const chosen=Array.from(files).filter(f=>f.type.startsWith("image/")||f.type.startsWith("video/")).slice(0,30-items.length);setItems(old=>[...old,...chosen.map(f=>({id:crypto.randomUUID(),name:f.name,kind:f.type.startsWith("video")?"video" as const:"image" as const,url:URL.createObjectURL(f),file:f}))]);};
const remove=(id:string)=>setItems(old=>{const found=old.find(i=>i.id===id);if(found)URL.revokeObjectURL(found.url);return old.filter(i=>i.id!==id)});
const [w,h]=sizes[ratio];
const draw=useCallback((time:number,context:CanvasRenderingContext2D)=>{
 const n=items.length; context.fillStyle="#0b0f14";context.fillRect(0,0,w,h);
 const accent=context.createLinearGradient(0,0,w,h);accent.addColorStop(0,preset.colors[0]);accent.addColorStop(1,preset.colors[1]);
 if(!n){context.fillStyle=accent;context.globalAlpha=.26;context.fillRect(0,0,w,h);context.globalAlpha=1;context.fillStyle="#fff";context.textAlign="center";context.font="bold "+Math.round(w*.045)+"px sans-serif";context.fillText("TÖLTS FEL KÉPEKET",w/2,h/2);return;}
 // Align shot length to a musical subdivision, using user-adjustable BPM.
 const beat=60/Math.max(60,bpm);const ideal=duration/n;const beatsPerShot=Math.max(1,Math.round(ideal/beat));const shotLength=beatsPerShot*beat;
 const shot=Math.floor(time/shotLength);const index=(shot+variant)%n;const local=(time%shotLength)/shotLength;
 const i=items[index],obj=cache.current.get(i.id);
 if(obj && (obj instanceof HTMLImageElement ? obj.complete&&obj.naturalWidth>0 : obj.readyState>=2)){
 const sw=obj instanceof HTMLImageElement?obj.naturalWidth:obj.videoWidth;const sh=obj instanceof HTMLImageElement?obj.naturalHeight:obj.videoHeight;
 if(sw&&sh){context.save();paint(context,obj,sw,sh,w,h,local,preset,variant);context.restore();}
 }
 const vignette=context.createRadialGradient(w/2,h/2,w*.12,w/2,h/2,w*.73);vignette.addColorStop(0,"transparent");vignette.addColorStop(1,"rgba(0,0,0,.34)");context.fillStyle=vignette;context.fillRect(0,0,w,h);
 if(caption.trim()){const fs=Math.round(w*.048);context.font="700 "+fs+"px system-ui";context.textAlign="center";context.shadowColor="#000";context.shadowBlur=12;context.fillStyle="#fff";context.fillText(caption.slice(0,50),w/2,h*.83,w*.89);context.shadowBlur=0;}
},[items,preset,variant,bpm,duration,w,h,caption]);
useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");if(!ctx)return;let frame=0;let started=performance.now();const loop=(now:number)=>{if(preview){const t=((now-started)/1000)%duration;clockRef.current=t;setProgress(t/duration);draw(t,ctx)}else{draw(clockRef.current,ctx)}frame=requestAnimationFrame(loop)};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame)},[draw,preview,duration,w,h]);
useEffect(()=>{for(const obj of cache.current.values())if(obj instanceof HTMLVideoElement){if(preview){void obj.play().catch(()=>{})}else obj.pause()}if(audioRef.current){if(preview){audioRef.current.currentTime=offset;void audioRef.current.play().catch(()=>{})}else audioRef.current.pause()}},[preview,offset,items]);
const choose=(p:Preset)=>{setSelected(p.id);setVariant(v=>p.id===selected?(v+1)%p.variants:0)};
const exportVideo=async()=>{
if(!items.length){setStatus("Először adj hozzá legalább egy képet vagy videót.");return}
const canvas=canvasRef.current;if(!canvas||!canvas.captureStream||!mediaMime()){setStatus("Ez a böngésző nem támogatja a videóexportot. Próbáld Chrome-ban vagy Safari újabb verziójában.");return}
setExporting(true);setPreview(false);setProgress(0);setStatus("Export előkészítése…");
let ac:AudioContext|null=null;let stream:MediaStream|null=null;let recorder:MediaRecorder|null=null;let activeVideos:HTMLVideoElement[]=[];
try{
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas nem érhető el.");
 const mime=mediaMime();stream=canvas.captureStream(30);
 if(music){ac=new AudioContext();const elem=document.createElement("audio");elem.src=music.url;elem.preload="auto";elem.currentTime=Math.max(0,offset);await new Promise<void>(resolve=>{if(elem.readyState>=2)return resolve();elem.onloadeddata=()=>resolve();elem.onerror=()=>resolve();setTimeout(resolve,2500)});const src=ac.createMediaElementSource(elem);const dest=ac.createMediaStreamDestination();src.connect(dest);const gain=ac.createGain();gain.gain.value=0;src.connect(gain);gain.connect(ac.destination);const tr=dest.stream.getAudioTracks()[0];if(tr)stream.addTrack(tr);await ac.resume();await elem.play().catch(()=>{});(stream as MediaStream&{_audio?:HTMLAudioElement})._audio=elem;}
 activeVideos=Array.from(cache.current.values()).filter((o):o is HTMLVideoElement=>o instanceof HTMLVideoElement);
 for(const video of activeVideos){try{video.currentTime=0;await video.play()}catch{}}
 const chunks:BlobPart[]=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5_000_000});const rec=recorder;
 const stopped=new Promise<void>((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onerror=()=>reject(Error("A rögzítés megszakadt."));rec.onstop=()=>resolve()});
 rec.start(200);const start=performance.now();
 await new Promise<void>((resolve,reject)=>{const tick=(now:number)=>{if(rec.state==="inactive")return reject(Error("A rögzítés leállt."));const t=Math.min(duration,(now-start)/1000);draw(t,ctx);setProgress(t/duration);if(t>=duration)resolve();else requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 rec.stop();await stopped;
 const blob=new Blob(chunks,{type:mime});if(blob.size<1000)throw Error("A videófájl üres lett.");
 const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="video-sablon-"+Date.now()+"."+(mime.includes("mp4")?"mp4":"webm");document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60_000);setStatus("Elkészült! A videó letöltése elindult ("+(mime.includes("mp4")?"MP4":"WebM")+").");
}catch(e){setStatus("Export hiba: "+(e instanceof Error?e.message:String(e)))}finally{for(const v of activeVideos)v.pause();const withAudio=stream as (MediaStream&{_audio?:HTMLAudioElement})|null;withAudio?._audio?.pause();stream?.getTracks().forEach(t=>t.stop());if(ac)await ac.close();setExporting(false);}
};
const saveSettings=()=>{const data={version:1,preset:selected,variant,ratio,duration,bpm,offset,caption,mediaNames:items.map(i=>i.name),musicName:music?.name||null};const link=document.createElement("a");const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));link.href=url;link.download="video-sablon-projekt.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);setStatus("Projektbeállítások mentve. A médiafájlokat később ismét ki kell választani.")};
const chooseProject=async(file:File|undefined)=>{if(!file)return;try{const d=JSON.parse(await file.text());if(!presets.some(p=>p.id===d.preset))throw Error("Ismeretlen sablon");setSelected(d.preset);setVariant(Number(d.variant)||0);setRatio(d.ratio in sizes?d.ratio:"9:16");setDuration([10,15,30].includes(d.duration)?d.duration:15);setBpm(Math.max(60,Math.min(200,Number(d.bpm)||120)));setOffset(Math.max(0,Number(d.offset)||0));setCaption(String(d.caption||""));setStatus("Projektbeállítások betöltve. Töltsd fel újra a képeket és zenét.")}catch{setStatus("Hibás projektfájl.")}};
return <main className="shell">
 <aside className="sidebar"><div className="brand"><span className="logo"><Clapperboard size={23}/></span><div><strong>VIDEO SABLON</strong><small>CREATIVE STUDIO</small></div></div><div className="nav active"><Aperture size={19}/> Stúdió</div><div className="nav"><Film size={19}/> Sablonkönyvtár</div><div className="nav"><Bookmark size={19}/> Mentett variációk</div><div className="sidebar-bottom"><span className="live-dot"/> BÖNGÉSZŐBEN FUTÓ STÚDIÓ <p>A médiafájljaidat nem töltjük fel szerverre.</p></div></aside>
 <section className="workspace"><header className="top"><div><div className="eyebrow"><Sparkles size={14}/> AUTOMATIKUS KLIPKÉSZÍTŐ</div><h1>Készíts látványos klipet.</h1><p>Képek be. Sablon kiválaszt. Zene igazít. Kész.</p></div><button className="export top-export" disabled={exporting||!items.length} onClick={exportVideo}><ArrowDownToLine size={18}/>{exporting?"Exportálás…":"Videó exportálása"}</button></header>
 <div className="workspace-grid"><section className="editor">
 <div className="section-heading"><h2><span className="number">01</span> Média hozzáadása</h2><span className="muted">{items.length} / 30 elem</span></div>
 <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={e=>{addMedia(e.target.files);e.target.value=""}}/>
 <button className="upload" onClick={()=>fileRef.current?.click()}><span className="upload-icon"><ImagePlus size={25}/></span><strong>Képek és videók feltöltése</strong><small>JPG, PNG, HEIC (ha a böngésző kezeli), MP4, MOV · maximum 30 elem</small><span className="upload-cta"><Plus size={15}/> Fájlok kiválasztása</span></button>
 {items.length>0&&<div className="media-grid">{items.map((item,index)=><div className="media-thumb" key={item.id}><div className="thumb-body">{item.kind==="image"?<img src={item.url} alt={item.name}/>:<video src={item.url} muted playsInline/>}<span className="thumb-index">{index+1}</span></div><button aria-label="Eltávolítás" className="thumb-remove" onClick={()=>remove(item.id)}><X size={13}/></button><small title={item.name}>{item.name}</small></div>)}</div>}
 <div className="section-heading spaced"><h2><span className="number">02</span> Sablon kiválasztása</h2><button className="subtle" onClick={()=>setVariant(v=>(v+1)%preset.variants)}><Shuffle size={15}/> Másik variáció</button></div>
 <div className="template-grid">{presets.map(p=><button key={p.id} onClick={()=>choose(p)} className={"template "+(p.id===selected?"selected":"")} style={{"--a":p.colors[0],"--b":p.colors[1]} as React.CSSProperties}><span className="template-art"><span className="template-orb"/><WandSparkles size={25}/><span className="template-check">{p.id===selected?<Check size={13}/>:null}</span></span><span className="template-info"><strong>{p.name}</strong><small>{p.tag}</small><small className="variant-count">{p.variants} variáció</small></span></button>)}</div>
 <div className="variant-actions"><span className="muted">Aktív: <b>{preset.name}</b> · {variant+1}. változat / {preset.variants}</span><button className="outline" onClick={()=>setFavorites(old=>old.includes(selected+":"+variant)?old.filter(x=>x!==selected+":"+variant):[...old,selected+":"+variant])}><Bookmark size={15} fill={favorites.includes(selected+":"+variant)?"currentColor":"none"}/>{favorites.includes(selected+":"+variant)?"Mentve":"Variáció mentése"}</button></div>
 <div className="section-heading spaced"><h2><span className="number">03</span> Zene és ritmus</h2><span className="muted">BPM-alapú vágás</span></div>
 <input ref={musicRef} type="file" accept="audio/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f){if(music)URL.revokeObjectURL(music.url);setMusic({name:f.name,url:URL.createObjectURL(f),file:f});setOffset(0)}e.target.value=""}}/>
 <div className="music-panel"><div className="music-title"><span className="music-icon"><Music2 size={22}/></span><div><strong>{music?.name||"Nincs zene kiválasztva"}</strong><small>{music?"Saját hangfájl":"MP3, WAV vagy más támogatott hang"}</small></div><button className="outline" onClick={()=>musicRef.current?.click()}><Upload size={15}/>{music?"Csere":"Zene feltöltése"}</button></div>
 <audio ref={audioRef} src={music?.url} controls={!!music} className="audio-controls" />
 <div className="wave">{Array.from({length:55},(_,i)=><i key={i} style={{height:(18+Math.abs(Math.sin(i*2.7)*Math.cos(i*.39))*78)+"%",background:i%7===0?"#22d3ee":"#3b82f6"}}/>)}</div>
 <label className="field-row"><span>Zene kezdőpontja <b>{offset.toFixed(1)} mp</b></span><input type="range" min="0" max="90" step=".5" value={offset} onChange={e=>setOffset(Number(e.target.value))}/></label>
 <label className="field-row"><span>Ütem (BPM) <b>{bpm}</b></span><input type="range" min="60" max="200" step="1" value={bpm} onChange={e=>setBpm(Number(e.target.value))}/></label><p className="hint">Az ütemet most kézzel állítod be. A vágások ehhez igazodnak; az automatikus zeneelemzés későbbi fejlesztés.</p></div>
 <div className="section-heading spaced"><h2><span className="number">04</span> Klipbeállítások</h2></div><div className="settings-grid"><div><label>Képarány</label><div className="segmented">{(["9:16","1:1","16:9"] as Ratio[]).map(r=><button key={r} className={ratio===r?"on":""} onClick={()=>setRatio(r)}>{r}</button>)}</div></div><div><label>Hossz</label><div className="segmented">{[10,15,30].map(d=><button key={d} className={duration===d?"on":""} onClick={()=>setDuration(d)}>{d} mp</button>)}</div></div></div>
 <label className="caption-label">Felirat (opcionális)<input placeholder="Pl. Egy felejthetetlen nap…" value={caption} maxLength={50} onChange={e=>setCaption(e.target.value)}/></label>
 <div className="project-actions"><button className="outline" onClick={saveSettings}><Bookmark size={16}/> Projektbeállítások mentése</button><label className="outline file-label"><Upload size={16}/> Projekt betöltése<input hidden type="file" accept=".json,application/json" onChange={e=>{void chooseProject(e.target.files?.[0]);e.target.value=""}}/></label></div>
 </section>
 <aside className="preview-column"><div className="sticky"><div className="preview-heading"><h2>Élő előnézet</h2><span className="chip"><span className="live-dot"/> {ratio}</span></div><div className="preview-stage"><div className="canvas-frame" style={{aspectRatio:w+"/"+h}}><canvas ref={canvasRef} className="preview-canvas"/>{!preview&&<button className="play-overlay" onClick={()=>items.length&&setPreview(true)} aria-label="Előnézet lejátszása"><Play fill="currentColor" size={26}/></button>}</div></div><div className="playback"><button disabled={!items.length} onClick={()=>setPreview(!preview)}>{preview?"Szünet":"Lejátszás"} <Play size={15}/></button><div className="progress"><i style={{width:(progress*100)+"%"}}/></div><small>{(progress*duration).toFixed(1)} / {duration} mp</small></div><button className="export wide" disabled={!items.length||exporting} onClick={exportVideo}><ArrowDownToLine size={19}/>{exporting?"Klip készítése…":"Klip exportálása"}</button>{exporting&&<div className="export-progress"><div style={{width:(progress*100)+"%"}}/> </div>}<div className="note"><Settings2 size={16}/><span>A végső formátum a böngésző támogatásától függ: MP4 vagy WebM. Az export valós időben történik.</span></div>{status&&<div className="message" role="status">{status}<button onClick={()=>setStatus("")}><X size={14}/></button></div>}<div className="mini-favs"><div className="preview-heading"><h3>Mentett variációk</h3><small>{favorites.length} db</small></div>{favorites.length?favorites.map(f=><button key={f} className="fav" onClick={()=>{const [id,n]=f.split(":");setSelected(id);setVariant(Number(n))}}><Bookmark size={14}/>{presets.find(p=>p.id===f.split(":")[0])?.name} · {Number(f.split(":")[1])+1}. variáció<ChevronRight size={14}/></button>):<p className="muted">A kedvenceid itt jelennek meg a munkamenet alatt.</p>}</div></div></aside></div></section></main>
}
