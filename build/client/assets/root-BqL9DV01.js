import{o as y,p as x,q as S,t as f,r as i,_ as w,v as a,n as e,O as g,M as j,L as k,S as M}from"./components-DxCnMdio.js";/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function L({getKey:t,...c}){let{isSpaMode:u}=y(),o=x(),h=S();f({getKey:t,storageKey:l});let d=i.useMemo(()=>{if(!t)return null;let s=t(o,h);return s!==o.key?s:null},[]);if(u)return null;let m=((s,p)=>{if(!window.history.state||!window.history.state.key){let r=Math.random().toString(32).slice(2);window.history.replaceState({key:r},"")}try{let n=JSON.parse(sessionStorage.getItem(s)||"{}")[p||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(r){console.error(r),sessionStorage.removeItem(s)}}).toString();return i.createElement("script",w({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${m})(${a(JSON.stringify(l))}, ${a(JSON.stringify(d))})`}}))}const O="/assets/tailwind-Bf45aAgq.css",N=()=>[{rel:"stylesheet",href:O}];function R({children:t}){return e.jsxs("html",{lang:"en",className:"min-h-screen bg-gray-950 text-white",children:[e.jsxs("head",{children:[e.jsx("meta",{charSet:"utf-8"}),e.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),e.jsx(j,{}),e.jsx(k,{})]}),e.jsxs("body",{children:[t,e.jsx(L,{}),e.jsx(M,{})]})]})}function _(){return e.jsx(g,{})}export{R as Layout,_ as default,N as links};
