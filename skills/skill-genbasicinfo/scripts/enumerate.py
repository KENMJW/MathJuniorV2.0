#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json, sys
from itertools import combinations as _comb
from collections import defaultdict
from datetime import datetime

def load_config(path):
    with open(path,"r",encoding="utf-8") as f: return json.load(f)

def build_graph(kps,edges):
    idx={kp["id"]:i for i,kp in enumerate(kps)}
    adj=[set() for _ in range(len(kps))]
    seen_edges=set()
    ve=[]
    for e in edges:
        a,b=e["from"],e["to"]
        if a in idx and b in idx:
            norm_edge=tuple(sorted([a,b]))
            if norm_edge not in seen_edges:
                seen_edges.add(norm_edge)
                i,j=idx[a],idx[b]
                adj[i].add(j);adj[j].add(i);ve.append((a,b))
    return adj,idx,ve

def bron_kerbosch(adj):
    maximal=[]
    def _bk(R,P,X):
        if not P and not X: maximal.append(sorted(R));return
        pivot=max(P|X,key=lambda v:len(adj[v]&P))
        for v in list(P-adj[pivot]):
            _bk(R|{v},P&adj[v],X&adj[v]);P.remove(v);X.add(v)
    _bk(set(),set(range(len(adj))),set())
    return maximal

def all_cliques(maximal):
    seen,res=set(),[]
    for mc in maximal:
        for sz in range(2,len(mc)+1):
            for sub in _comb(mc,sz):
                k=tuple(sorted(sub))
                if k not in seen: seen.add(k);res.append(list(k))
    return res

def quality(combo,kps,idx_map):
    rev={v:k for k,v in idx_map.items()}
    lk={kp["id"]:kp for kp in kps}
    m=3
    for i,j in _comb(combo,2):
        a,b=lk[rev[i]],lk[rev[j]]
        s=3 if a.get("subcategory")==b.get("subcategory") else (2 if a.get("domain")==b.get("domain") else 1)
        m=min(m,s)
    return m

def scope(combo,kps,idx_map):
    rev={v:k for k,v in idx_map.items()}
    lk={kp["id"]:kp for kp in kps}
    doms={lk[rev[i]].get("domain") for i in combo}
    subs={lk[rev[i]].get("subcategory") for i in combo}
    return "跨领域" if len(doms)>1 else ("跨类" if len(subs)>1 else "同类")

def main():
    if len(sys.argv)<2: print("用法: python3 enumerate.py <config.json> [out.json]");sys.exit(1)
    cfg=load_config(sys.argv[1])
    out_path=sys.argv[2] if len(sys.argv)>2 else "result.json"
    kps=cfg["knowledge_points"]
    raw=cfg.get("edges",[])
    dv={tuple(sorted(v["kp_ids"])):v for v in cfg.get("directed_validation",[])}

    print(f"[1/5] 考点数: {len(kps)}, 边数: {len(raw)}")
    adj,idx_map,ve=build_graph(kps,raw)
    print(f"[2/5] 构建图完成: {len(ve)} 条有效边 (去重后)")
    maximal=bron_kerbosch(adj)
    print(f"[3/5] 极大团: {len(maximal)} 个")
    combos=all_cliques(maximal)
    raw_dist=defaultdict(int)
    for c in combos: raw_dist[len(c)]+=1
    print(f"[4/5] 有效完全子图组合: {sum(raw_dist.values())} 种")
    for k in sorted(raw_dist): print(f"      k={k}: {raw_dist[k]}")

    rev={v:k for k,v in idx_map.items()}

    valid_combos_by_size=defaultdict(list)
    for i,kp in enumerate(kps):
        kp_id=kp["id"]
        d=dv.get(tuple([kp_id]),{})
        valid_combos_by_size[1].append({
            "size":1,"kp_ids":[kp_id],
            "scope":"单考点","quality_score":None,
            "directed_order":d.get("directed_order",d.get("order",[kp_id])),
            "question_hint_zh":d.get("question_hint_zh",d.get("hint","")),
            "question_hint_en":d.get("question_hint_en",""),
            "question_types":d.get("question_types",["single_choice","fill_blank","solution"])
        })

    for c in sorted(combos,key=lambda x:(len(x),[rev[i] for i in x])):
        ids=[rev[i] for i in c]
        key=tuple(sorted(ids))
        d=dv.get(key,{})
        if d.get("is_valid") is False:
            continue
        valid_combos_by_size[len(c)].append({
            "size":len(c),"kp_ids":ids,
            "scope":scope(c,kps,idx_map),"quality_score":quality(c,kps,idx_map),
            "directed_order":d.get("directed_order",d.get("order",ids)),
            "question_hint_zh":d.get("question_hint_zh",d.get("hint","")),
            "question_hint_en":d.get("question_hint_en",""),
            "question_types":d.get("question_types",["single_choice","fill_blank","solution"])
        })

    out_combos=[]
    final_dist={}
    for sz in sorted(valid_combos_by_size.keys()):
        items=valid_combos_by_size[sz]
        final_dist[str(sz)]=len(items)
        for seq,item in enumerate(items,start=1):
            item["id"]=f"C{sz}-{seq:04d}"
            out_combos.append(item)

    result={"meta":{"grade":cfg.get("grade","初中"),"subject":cfg.get("subject","数学"),
        "generated_at":datetime.now().isoformat(),"sources":cfg.get("sources",[]),
        "total_kp":len(kps),"total_edges":len(ve),"total_combinations":len(out_combos),
        "distribution":final_dist},
        "knowledge_points":kps,
        "edges":[{"from":a,"to":b,"direction":"bidirectional"} for a,b in ve],
        "combinations":out_combos}
    with open(out_path,"w",encoding="utf-8") as f: json.dump(result,f,ensure_ascii=False,indent=2)
    print(f"\n[5/5] ✅ 完成 → {out_path}  (共 {len(out_combos)} 种组合)")

if __name__=="__main__": main()
