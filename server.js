const http=require("http"),fs=require("fs"),path=require("path"),crypto=require("crypto"),WebSocket=require("ws");
const PORT=process.env.PORT||8080, HOST=process.env.HOST||"0.0.0.0";
const rooms=new Map(), clients=new Map(), pub=path.join(__dirname,"public");
const clean=(v,n)=>String(v??"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,n);
function send(ws,o){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(o))}
function members(r){return rooms.get(r)||new Map()}
function users(r){return [...members(r).values()].map(w=>clients.get(w)).filter(Boolean).map(c=>({id:c.id,name:c.name}))}
function broadcast(r,o,except){for(const w of members(r).values())if(w!==except)send(w,o)}
function update(r){broadcast(r,{type:"users",users:users(r),count:members(r).size})}
function remove(ws){const c=clients.get(ws);if(!c)return;members(c.room).delete(c.id);if(!members(c.room).size)rooms.delete(c.room);clients.delete(ws);broadcast(c.room,{type:"system",text:c.name+" ออกจากห้องสนทนา"});update(c.room)}
const server=http.createServer((req,res)=>{let p=new URL(req.url,"http://localhost").pathname;if(p==="/")p="/index.html";let f=path.resolve(pub,"."+p);if(!f.startsWith(pub+path.sep)){res.writeHead(403);return res.end("Forbidden")}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":f.endsWith(".html")?"text/html; charset=utf-8":"application/octet-stream","X-Content-Type-Options":"nosniff"});res.end(d)})});
const wss=new WebSocket.Server({server,maxPayload:4096});
wss.on("connection",ws=>{ws.on("message",raw=>{let m;try{m=JSON.parse(raw)}catch{return send(ws,{type:"error",text:"ข้อมูลไม่ถูกต้อง"})}
if(m.type==="join"){if(clients.has(ws))return;let name=clean(m.name,24),room=clean(m.room,32).replace(/[^a-zA-Z0-9ก-๙_-]/g,"");if(!name||!room)return send(ws,{type:"error",text:"กรุณากรอกชื่อและรหัสห้อง"});let c={id:crypto.randomUUID(),name,room,last:0};if(!rooms.has(room))rooms.set(room,new Map());clients.set(ws,c);rooms.get(room).set(c.id,ws);send(ws,{type:"joined",id:c.id,room,users:users(room),count:members(room).size});broadcast(room,{type:"system",text:name+" เข้าร่วมห้อง"},ws);update(room);return}
let c=clients.get(ws);if(!c)return send(ws,{type:"error",text:"กรุณาเข้าห้องก่อน"});if(m.type==="chat"){let now=Date.now(),text=clean(m.text,1000);if(now-c.last<350)return send(ws,{type:"error",text:"ส่งเร็วเกินไป กรุณารอสักครู่"});if(!text)return;c.last=now;broadcast(c.room,{type:"chat",id:crypto.randomUUID(),senderId:c.id,sender:c.name,text,time:new Date().toISOString()})}
});ws.on("close",()=>remove(ws));ws.on("error",()=>remove(ws))});
server.listen(PORT,HOST,()=>console.log(`Player chat listening on http://${HOST}:${PORT}`));
