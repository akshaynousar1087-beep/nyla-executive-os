"use client";
import type {ModuleName,Session} from "./types";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||"";
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
const sessionKey="nyla.supabase.session";
export const isConfigured=()=>Boolean(url&&key);
const headers=(token?:string,extra:Record<string,string>={})=>({apikey:key,...(token?{Authorization:`Bearer ${token}`}:{}),"Content-Type":"application/json",...extra});
async function parse(r:Response){const body=await r.text();if(!r.ok)throw new Error(body?JSON.parse(body)?.msg||JSON.parse(body)?.message||body:`Request failed (${r.status})`);return body?JSON.parse(body):null}
export const auth={
  session():Session|null{if(typeof window==="undefined")return null;try{return JSON.parse(localStorage.getItem(sessionKey)||"null")}catch{return null}},
  async signIn(email:string,password:string){if(!isConfigured())throw new Error("Supabase environment variables are not configured.");const data=await parse(await fetch(`${url}/auth/v1/token?grant_type=password`,{method:"POST",headers:headers(),body:JSON.stringify({email,password})}));const session={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};localStorage.setItem(sessionKey,JSON.stringify(session));return session as Session},
  async signUp(email:string,password:string,fullName:string){if(!isConfigured())throw new Error("Supabase environment variables are not configured.");return parse(await fetch(`${url}/auth/v1/signup`,{method:"POST",headers:headers(),body:JSON.stringify({email,password,data:{full_name:fullName}})}))},
  async refresh(){const s=this.session();if(!s?.refresh_token)return null;const data=await parse(await fetch(`${url}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:headers(),body:JSON.stringify({refresh_token:s.refresh_token})}));const next={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};localStorage.setItem(sessionKey,JSON.stringify(next));return next as Session},
  signOut(){localStorage.removeItem(sessionKey)}
};
async function token(){let s=auth.session();if(s?.expires_at&&s.expires_at<Math.floor(Date.now()/1000)+30)s=await auth.refresh();if(!s)throw new Error("Not authenticated");return s.access_token}
export const db={
 async list(table:ModuleName,query="order=created_at.desc"){return parse(await fetch(`${url}/rest/v1/${table}?select=*&${query}`,{headers:headers(await token())}))},
 async create(table:ModuleName,value:Record<string,unknown>){const s=auth.session()!;return parse(await fetch(`${url}/rest/v1/${table}`,{method:"POST",headers:headers(await token(),{Prefer:"return=representation"}),body:JSON.stringify({...value,user_id:s.user.id})}))},
 async update(table:ModuleName,id:string,value:Record<string,unknown>){return parse(await fetch(`${url}/rest/v1/${table}?id=eq.${id}`,{method:"PATCH",headers:headers(await token(),{Prefer:"return=representation"}),body:JSON.stringify(value)}))},
 async remove(table:ModuleName,id:string){return parse(await fetch(`${url}/rest/v1/${table}?id=eq.${id}`,{method:"DELETE",headers:headers(await token(),{Prefer:"return=minimal"})}))}
};
export async function chat(message:string,conversationId?:string){const bearer=await token();return parse(await fetch(`${url}/functions/v1/nyla-chat`,{method:"POST",headers:headers(bearer),body:JSON.stringify({message,conversation_id:conversationId})}))}
