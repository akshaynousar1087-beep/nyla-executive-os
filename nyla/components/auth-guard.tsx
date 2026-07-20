"use client";
import {useEffect,useState} from "react";import {useRouter} from "next/navigation";import {auth,isConfigured} from "@/lib/supabase/client";
export function AuthGuard({children}:{children:React.ReactNode}){const router=useRouter();const[ready,setReady]=useState(false);useEffect(()=>{if(!isConfigured()){setReady(true);return}if(!auth.session())router.replace("/login");else setReady(true)},[router]);if(!ready)return <div className="boot"><div className="nyla-orb">N</div><p>Preparing your workspace…</p></div>;return <>{children}</>}
