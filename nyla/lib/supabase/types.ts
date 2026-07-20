export type Session={access_token:string;refresh_token:string;expires_at?:number;user:{id:string;email:string}};
export type Row={id:string;user_id:string;created_at:string;updated_at?:string;[key:string]:unknown};
export type ModuleName="clients"|"projects"|"studio_bookings"|"transactions";
