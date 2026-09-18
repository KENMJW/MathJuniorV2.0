# -*- coding: utf-8 -*-
import json
import re
from collections import Counter

# Detailed classification rules for 107 KPs
KP_RULES = [
    ("KP-001", [r"科学记数法", r"科学计数法", r"用科学记数法表示", r"有理数", r"负数", r"正数", r"整数", r"正整数", r"负分数", r"非负数", r"非负整数"]),
    ("KP-002", [r"数轴", r"在数轴上", r"数轴上的点", r"数轴上表示"]),
    ("KP-003", [r"相反数", r"绝对值", r"倒数", r"互为相反数", r"互为倒数", r"\|[﹣\-\d]+"]),
    ("KP-004", [r"有理数的四则运算", r"有理数加减", r"有理数乘除", r"有理数混合运算", r"有理数运算", r"乘方运算", r"﹣\d+\s*[\+\-×÷]\s*\d+"]),
    ("KP-005", [r"无理数", r"实数的概念", r"实数包括", r"下列各数中，是无理数", r"无理数的个数"]),
    ("KP-006", [r"算术平方根", r"平方根", r"的平方根是", r"的算术平方根是"]),
    ("KP-007", [r"立方根", r"\\sqrt\[3\]", r"的立方根是"]),
    ("KP-008", [r"大小比较", r"估算", r"比较大小", r"比.*大", r"比.*小", r"最小的数", r"最大的数", r"实数.*的大小", r"在哪两个连续整数之间"]),
    ("KP-009", [r"代数式的值", r"代数式", r"同类项", r"若.*是同类项", r"求代数式的值", r"已知.*求.*的值"]),
    ("KP-010", [r"整式的加减", r"合并同类项", r"整式加减", r"去括号"]),
    ("KP-011", [r"同底数幂", r"幂的乘方", r"积的乘方", r"单项式乘单项式", r"单项式乘多项式", r"多项式乘多项式", r"整式的乘法", r"幂的运算"]),
    ("KP-012", [r"完全平方公式", r"平方差公式", r"乘法公式", r"\(a\s*[\+\-]\s*b\)\^2", r"\(x\s*[\+\-]\s*y\)\^2"]),
    ("KP-013", [r"整式的除法", r"单项式除以单项式", r"多项式除以单项式"]),
    ("KP-014", [r"因式分解", r"分解因式", r"提公因式", r"十字相乘", r"综合运用提公因式法和公式法"]),
    ("KP-015", [r"二次根式", r"最简二次根式", r"二次根式的加减", r"二次根式有意义", r"二次根式的乘除", r"二次根式的化简", r"化简二次根式"]),
    ("KP-016", [r"分式有意义", r"分式的基本性质", r"分式的值为0", r"最简分式", r"分式无意义", r"分式的概念"]),
    ("KP-017", [r"分式的加减", r"分式化简求值", r"分式的化简", r"分式的四则运算", r"分式乘除", r"先化简，再求值"]),
    ("KP-018", [r"分式方程", r"增根", r"检验.*是否是原方程的根", r"分式方程的解", r"关于.*的分式方程"]),
    ("KP-019", [r"一元一次方程", r"解一元一次方程"]),
    ("KP-020", [r"二元一次方程组", r"二元一次方程", r"解方程组", r"二元一次方程的解"]),
    ("KP-021", [r"一元二次方程的概念", r"一元二次方程的一般形式", r"一定是一元二次方程"]),
    ("KP-022", [r"直接开平方法"]),
    ("KP-023", [r"配方法", r"配方", r"配方后", r"用配方法解一元二次方程"]),
    ("KP-024", [r"求根公式", r"公式法解一元二次方程"]),
    ("KP-025", [r"因式分解法解一元二次方程", r"因式分解法解方程"]),
    ("KP-026", [r"根的判别式", r"有两个不相等的实数根", r"有两个相等的实数根", r"没有实数根", r"无实数根", r"韦达定理", r"两根之和", r"两根之积", r"根与系数的关系", r"根的情况"]),
    ("KP-027", [r"不等式的性质", r"不等式的基本性质", r"若a.*b.*则下列不等式"]),
    ("KP-028", [r"一元一次不等式", r"解不等式", r"不等式的解集"]),
    ("KP-029", [r"不等式组", r"解不等式组", r"不等式组无解", r"一元一次不等式组", r"不等式组的整数解"]),
    ("KP-030", [r"自变量.*取值范围", r"函数的概念", r"函数自变量", r"函数的自变量"]),
    ("KP-031", [r"平面直角坐标系", r"直角坐标系", r"象限", r"点的坐标", r"关于x轴对称", r"关于y轴对称", r"坐标平面内"]),
    ("KP-032", [r"正比例函数", r"正比例函数的图象", r"正比例函数的性质"]),
    ("KP-033", [r"待定系数法求一次函数", r"求一次函数解析式", r"一次函数解析式", r"一次函数的表达式"]),
    ("KP-034", [r"一次函数", r"一次函数的图象", r"一次函数的性质", r"经过第.*象限", r"y随x的增大而"]),
    ("KP-035", [r"一次函数与方程", r"一次函数与一元一次方程", r"一次函数与不等式", r"两直线交点坐标"]),
    ("KP-036", [r"反比例函数", r"反比例函数的图象", r"反比例函数的性质", r"双曲线", r"反比例函数.*经过点"]),
    ("KP-037", [r"反比例函数k的几何意义", r"k的几何意义", r"面积等于.*k", r"矩形面积等于.*k", r"反比例函数与几何综合"]),
    ("KP-038", [r"二次函数的三种表达式", r"求二次函数解析式", r"二次函数解析式", r"抛物线解析式", r"二次函数表达式"]),
    ("KP-039", [r"对称轴为直线", r"对称轴是直线", r"抛物线的顶点", r"二次函数的顶点", r"对称轴", r"顶点坐标", r"抛物线的对称轴"]),
    ("KP-040", [r"抛物线与x轴", r"抛物线与坐标轴", r"二次函数与x轴", r"抛物线交于A.*B两点"]),
    ("KP-041", [r"二次函数的最值", r"最大利润", r"利润最大", r"最大面积", r"面积最大", r"何时.*最大", r"何时.*最小", r"线段最值", r"最大值或最小值"]),
    ("KP-042", [r"二次函数与方程", r"二次函数与一元二次方程", r"二次函数与不等式", r"抛物线与方程", r"二次函数图象与系数的关系", r"2a\+b", r"4a\+2b\+c", r"二次函数综合题"]),
    ("KP-043", [r"函数的实际应用", r"函数建模", r"方案选择", r"收费标准", r"函数综合应用"]),
    ("KP-044", [r"点线面角", r"余角", r"补角", r"互为余角", r"互为补角", r"度分秒"]),
    ("KP-045", [r"两点之间线段最短", r"线段的中点", r"线段中点", r"线段长", r"线段和差", r"线段最短"]),
    ("KP-046", [r"角平分线", r"角的分类", r"角度计算", r"求∠.*的度数", r"角平分线的性质", r"角平分线的判定"]),
    ("KP-047", [r"对顶角", r"邻补角", r"垂线段最短", r"垂直的定义", r"相交线", r"垂线"]),
    ("KP-048", [r"平行线的性质", r"平行线的判定", r"同位角", r"内错角", r"同旁内角", r"两直线平行", r"a\s*\\parallel\s*b"]),
    ("KP-049", [r"三角形内角和", r"三角形的外角", r"三角形内角和定理", r"三角形的外角性质"]),
    ("KP-050", [r"三角形的三边关系", r"两边之和大于第三边", r"三角形三边关系", r"两边之差小于第三边"]),
    ("KP-051", [r"全等三角形的判定", r"证明全等", r"判定全等", r"SSS", r"SAS", r"ASA", r"AAS", r"HL"]),
    ("KP-052", [r"全等三角形的性质", r"全等三角形对应边", r"全等三角形对应角", r"≌", r"全等三角形"]),
    ("KP-053", [r"等腰三角形的性质", r"等边对等角", r"三线合一", r"等腰三角形底边", r"等腰三角形顶角"]),
    ("KP-054", [r"等腰三角形的判定", r"等角对等边"]),
    ("KP-055", [r"等边三角形", r"正三角形", r"等边三角形的性质", r"等边三角形的判定"]),
    ("KP-056", [r"直角三角形斜边中线", r"30°角所对直角边", r"直角三角形的性质", r"斜边上的中线", r"Rt△"]),
    ("KP-057", [r"勾股定理", r"勾股定理的逆定理", r"勾股逆定理", r"勾股数"]),
    ("KP-058", [r"相似三角形的判定", r"证明相似", r"判定相似", r"∽"]),
    ("KP-059", [r"相似三角形的性质", r"相似比", r"相似三角形对应高", r"相似三角形面积比", r"面积比等于相似比的平方"]),
    ("KP-060", [r"位似", r"位似中心", r"位似比", r"位似变换", r"位似图形"]),
    ("KP-061", [r"多边形内角和", r"多边形外角和", r"多边形的外角和", r"多边形的内角和", r"正多边形内角", r"边形内角和", r"边形外角和", r"正.*边形的一个外角", r"正.*边形的一个内角"]),
    ("KP-062", [r"平行四边形的性质", r"▱ABCD", r"平行四边形对边", r"平行四边形对角线"]),
    ("KP-063", [r"平行四边形的判定", r"判定为平行四边形", r"是平行四边形"]),
    ("KP-064", [r"矩形的性质", r"矩形的判定", r"矩形", r"长方形"]),
    ("KP-065", [r"菱形的性质", r"菱形的判定", r"菱形", r"菱形的对角线"]),
    ("KP-066", [r"正方形的性质", r"正方形的判定", r"正方形", r"正方形ABCD"]),
    ("KP-067", [r"等腰梯形", r"直角梯形", r"梯形"]),
    ("KP-068", [r"中点四边形", r"三角形中位线", r"中位线定理", r"中位线"]),
    ("KP-069", [r"圆的基本概念", r"圆心", r"半径", r"直径", r"弦", r"弧"]),
    ("KP-070", [r"点与圆的位置关系", r"点在圆内", r"点在圆上", r"点在圆外"]),
    ("KP-071", [r"直线与圆的位置关系", r"直线与圆相切", r"直线与圆相交", r"直线与圆相离"]),
    ("KP-072", [r"切线的判定", r"切线的性质", r"切线长定理", r"证明.*是⊙O的切线", r"与⊙O相切", r"切线", r"切点"]),
    ("KP-073", [r"圆周角定理", r"圆周角", r"圆心角", r"同弧所对的圆周角", r"直径所对的圆周角", r"圆内接四边形"]),
    ("KP-074", [r"垂径定理", r"垂直于弦的直径", r"弦心距", r"圆心到弦的距离"]),
    ("KP-075", [r"圆与圆的位置关系", r"两圆相切", r"两圆外切", r"两圆内切"]),
    ("KP-076", [r"内切圆", r"外接圆", r"内心", r"外心", r"三角形内切圆", r"三角形外接圆"]),
    ("KP-077", [r"弧长公式", r"扇形面积公式", r"弧长", r"扇形面积", r"阴影部分面积", r"阴影部分的面积", r"圆锥侧面积", r"圆锥母线", r"圆锥侧面展开图", r"求阴影部分面积"]),
    ("KP-078", [r"正多边形与圆", r"正六边形与圆", r"圆内接正多边形"]),
    ("KP-079", [r"轴对称图形", r"轴对称", r"折叠问题", r"翻折", r"沿.*折叠", r"对称轴条数"]),
    ("KP-080", [r"平移变换", r"向左平移", r"向右平移", r"向上平移", r"向下平移", r"平移"]),
    ("KP-081", [r"旋转变换", r"绕点.*旋转", r"顺时针旋转", r"逆时针旋转", r"旋转角", r"旋转中心", r"旋转"]),
    ("KP-082", [r"中心对称图形", r"中心对称", r"关于原点对称", r"关于中心对称"]),
    ("KP-083", [r"图形的综合变换", r"几何综合", r"动点问题", r"几何变换", r"手拉手模型", r"半角模型", r"一线三直角"]),
    ("KP-084", [r"主视图", r"俯视图", r"左视图", r"三视图", r"几何体的展开图", r"正方体展开图", r"几何体", r"直观图"]),
    ("KP-085", [r"正弦", r"\\sin", r"sin[A-Z]"]),
    ("KP-086", [r"余弦", r"\\cos", r"cos[A-Z]"]),
    ("KP-087", [r"正切", r"\\tan", r"tan[A-Z]"]),
    ("KP-088", [r"特殊角三角函数", r"sin30", r"cos60", r"tan45", r"特殊角的锐角三角函数"]),
    ("KP-089", [r"互余角.*三角函数"]),
    ("KP-090", [r"仰角", r"俯角", r"坡度", r"坡比", r"解直角三角形的实际应用", r"测高", r"测量建筑物", r"无人机", r"航行"]),
    ("KP-091", [r"解直角三角形", r"锐角三角函数"]),
    ("KP-092", [r"抽样调查", r"普查", r"全面调查", r"总体", r"个体", r"样本", r"样本容量"]),
    ("KP-093", [r"频数", r"频率", r"频数分布直方图", r"频率分布直方图", r"频数分布表", r"直方图"]),
    ("KP-094", [r"扇形统计图", r"圆心角度数", r"扇形图"]),
    ("KP-095", [r"折线统计图", r"折线图"]),
    ("KP-096", [r"茎叶图"]),
    ("KP-097", [r"加权平均数", r"平均数", r"平均分", r"平均成绩"]),
    ("KP-098", [r"中位数"]),
    ("KP-099", [r"众数"]),
    ("KP-100", [r"极差"]),
    ("KP-101", [r"方差", r"标准差", r"稳定性", r"方差越小", r"S\^2"]),
    ("KP-102", [r"利用统计量综合判断", r"统计量综合分析"]),
    ("KP-103", [r"必然事件", r"不可能事件", r"随机事件", r"确定性事件"]),
    ("KP-104", [r"概率的定义", r"概率的意义", r"摸球", r"质地均匀", r"古典概型", r"可能性的大小"]),
    ("KP-105", [r"列举法求概率", r"简单概率计算", r"随机抽取", r"随机摸出"]),
    ("KP-106", [r"树状图", r"列表法", r"画树状图", r"树状图法", r"两次抽取", r"两个骰子", r"两个转盘", r"放回", r"不放回"]),
    ("KP-107", [r"用频率估计概率", r"大量重复试验", r"模拟试验"])
]

def extract_answer_fill(ans_orig, sol_str, opts_str):
    if ans_orig and ans_orig != '__PENDING__' and ans_orig.strip():
        return None # already has answer
    if not sol_str or sol_str == '[]':
        return None
    try:
        sol_data = json.loads(sol_str)
        if not sol_data:
            return None
        text = sol_data[0].get('text', '')
        # Choice answer pattern: 故选：A 或 故选：\text{A} 或 故选A
        m_choice = re.search(r'故选[：:]?\s*(\\text\{)?([A-D])\}?', text)
        if m_choice:
            return m_choice.group(2)
        # Blank answer pattern: 故答案为：...
        m_blank = re.search(r'故答案为[：:]\s*([^\n\r]+)', text)
        if m_blank:
            ans_val = m_blank.group(1).strip().rstrip('．。')
            if len(ans_val) < 60 and not ans_val.startswith('【'):
                return ans_val
    except Exception:
        pass
    return None

def check_suspect_item(qid, src, qtype, stem, opts, ans, sol, imgs):
    if not stem or not stem.strip():
        return True, "题面内容为空"
    stem_s = stem.strip()
    
    # Missing figure required
    if qid == 'Q-2025-AX-0003':
        return True, "题面依赖配图但配图缺失，且未说明位似在同侧或异侧，导致坐标正负无法唯一确定"
    
    # Broken LaTeX line fragments
    if stem_s.endswith(r'\\') and len(stem_s) < 35:
        return True, f"题面为LaTeX换行片段，非完整题面: {stem_s}"
    
    # Broken scientific notation / cutoffs
    if stem_s.endswith('，\n>') and len(stem_s) < 35:
        return True, f"题面为截断数据片段: {stem_s}"
    
    # Handout text notes
    if stem_s in [
        '直角三角形斜边上的中线等于斜边的一半；',
        '以点*M*为圆心，*PQ*长为半径作弧，交步骤3中的弧于点*N*；',
        '折叠问题常见的类型有：\n\n[[IMG:0]]',
        '角度相等：常与线段的平行或特殊三角形结合，最终将角度问题转化为线段问题；'
    ]:
        return True, f"微专题讲义正文知识点摘录/作图步骤，非测试试题: {stem_s}"
    
    # Equations without question verbs in MZ
    if qid in ['Q-2025-MZ05-0007', 'Q-2025-MZ06-0005']:
        return True, f"微专题讲义方程碎片提取，无题干主体问句: {stem_s}"
        
    # Check pure answer fragments (common in MZ handouts)
    question_keywords = [
        '求', '计算', '化简', '证明', '解方程', '解不等式', '若', '设', '如图', '已知', '下列', '在', 
        '满足', '一个', '两个', '三个', '四个', '值是', '长为', '面积为', '坐标为', '度数为', '等于', 
        '表示', '结果是', '正确的是', '错误的是', '不正确的是', '假命题', '真命题', '无理数', '负数', 
        '相反数', '绝对值', '倒数', '因式分解', '分解因式', '科学记数法', '有意义', '无解', '中位数', 
        '众数', '平均数', '方差', '概率', '自变量', '函数的图象', '交点', '对称轴', '顶点', '根的情况', '圆锥'
    ]
    has_q_kw = any(kw in stem_s for kw in question_keywords)
    has_blank_or_choice = any(m in stem_s for m in ['[　', '[_', '(_', '（　', '（ ', '( ']) or '（\u3000\u3000）' in stem_s or '(\u3000\u3000)' in stem_s
    
    # If 0 Chinese characters and not standard expression fill-in
    hanzi = re.findall(r'[\u4e00-\u9fff]', stem_s)
    if len(hanzi) == 0 and not has_blank_or_choice:
        return True, f"题面无中文字符且无填空占位，疑似答案碎片: {stem_s}"
        
    if not has_q_kw and not has_blank_or_choice and len(stem_s) < 40:
        return True, f"微专题讲义答案表碎片提取，无题干主体问句: {stem_s}"
    
    return False, None

def classify_question(qid, src, qtype, stem, opts, ans, sol, imgs):
    # Suspect check
    is_susp, susp_reason = check_suspect_item(qid, src, qtype, stem, opts, ans, sol, imgs)
    if is_susp:
        return "KP-001", 1, "suspect", susp_reason, None
    
    sol_text = ""
    kc_text = ""
    if sol and sol != '[]':
        try:
            sol_obj = json.loads(sol)
            if sol_obj:
                sol_text = sol_obj[0].get('text', '')
                m_kc = re.search(r'(考查[了的]?|解题的关键是|掌握)([^，。；\n]+)', sol_text)
                if m_kc:
                    kc_text = m_kc.group(0)
        except Exception:
            pass
            
    scores = Counter()
    
    # 1. Solution analysis
    if kc_text:
        for kp_id, patterns in KP_RULES:
            for pat in patterns:
                if re.search(pat, kc_text):
                    scores[kp_id] += 50
                    break
    if sol_text:
        for kp_id, patterns in KP_RULES:
            for pat in patterns:
                if re.search(pat, sol_text):
                    scores[kp_id] += 10
                    break
                    
    # 2. Stem analysis
    if stem:
        for kp_id, patterns in KP_RULES:
            for pat in patterns:
                if re.search(pat, stem):
                    scores[kp_id] += 25
                    break
                    
    # 3. Source micro_topic hints
    if src:
        for kp_id, patterns in KP_RULES:
            for pat in patterns:
                if re.search(pat, src):
                    scores[kp_id] += 15
                    break

    # 4. Fallback if no scores
    best_kp = "KP-001"
    if scores:
        best_kp = scores.most_common(1)[0][0]
    else:
        # Fallback heuristic based on keywords
        if "方程" in stem:
            best_kp = "KP-021"
        elif "函数" in stem:
            best_kp = "KP-034"
        elif "角" in stem or "度" in stem:
            best_kp = "KP-046"
        elif "三角形" in stem:
            best_kp = "KP-049"
        elif "圆" in stem:
            best_kp = "KP-069"
        else:
            best_kp = "KP-004"

    # 5. Difficulty determination (1-9)
    q_num = 1
    m_num = re.search(r'-(\d+)$', qid)
    if m_num:
        q_num = int(m_num.group(1))
        
    diff = 2
    if qtype == 'single_choice':
        if q_num <= 5:
            diff = 2
        elif q_num <= 8:
            diff = 3
        else:
            diff = 4
    elif qtype == 'fill_blank':
        if q_num <= 12:
            diff = 3
        elif q_num <= 15:
            diff = 4
        else:
            diff = 5
    elif qtype == 'solution':
        if q_num <= 18:
            diff = 4
        elif q_num <= 21:
            diff = 5
        elif q_num <= 23:
            diff = 6
        elif q_num <= 25:
            diff = 7
        else:
            diff = 8
            
    # AoShu / AX or 拔尖 / 压轴
    if 'AX' in qid or '拔尖' in src:
        diff = max(diff, 6)
        if q_num > 10:
            diff = min(diff + 2, 9)
    if '微专题42' in src or '微专题45' in src or '微专题46' in src:
        diff = max(diff, 5)
        if qtype == 'solution':
            diff = max(diff, 7)
            
    # Adjust for elementary KPs
    if best_kp in ['KP-001', 'KP-002', 'KP-003', 'KP-004', 'KP-084'] and qtype == 'single_choice':
        diff = min(diff, 3)
    if best_kp in ['KP-038', 'KP-039', 'KP-041', 'KP-042', 'KP-083'] and qtype == 'solution':
        diff = max(diff, 6)

    diff = max(1, min(9, diff))
    
    # 6. Answer fill
    ans_fill = extract_answer_fill(ans, sol, opts)
    
    return best_kp, diff, "ok", None, ans_fill
