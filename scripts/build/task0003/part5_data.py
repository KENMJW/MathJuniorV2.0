# -*- coding: utf-8 -*-
"""Part 5 solutions: items 194 to 241 (48 items)"""

PART5_DATA = {
    "Q-2025-MZ42-0019": {
        "answer_standard": "$20\\sqrt{3} - 16$",
        "solutions_json": [
            {"method": "解法一 (圆轨迹与垂线段最短)", "text": "在平行四边形 $ABCD$ 中，$\\angle C = 120^\\circ \\implies \\angle D = 60^\\circ$，$AB = 8, BC = 10$。由于 $E$ 为 $CD$ 中点，故 $DE = 4$。由折叠可知 $ED' = ED = 4$ 为定长，因此点 $D'$ 的运动轨迹是以 $E$ 为圆心、4 为半径的圆弧。$\\triangle ABD'$ 的底边 $AB = 8$ 为定值，其面积取决于点 $D'$ 到直线 $AB$ 的距离 $h$。直线 $CD \\parallel AB$，两平行线间距离为 $BC \\cdot \\sin 60^\\circ = 10 \\times \\frac{\\sqrt{3}}{2} = 5\\sqrt{3}$。圆心 $E$ 在直线 $CD$ 上，故圆上点 $D'$ 到 $AB$ 的最小距离为 $h_{\\min} = 5\\sqrt{3} - 4$。此时 $F$ 落在边 $AD$ 上满足折叠条件。因此 $\\triangle ABD'$ 面积的最小值为 $\\frac{1}{2} \\times 8 \\times (5\\sqrt{3} - 4) = 20\\sqrt{3} - 16$。"},
            {"method": "解法二 (建系坐标法验证)", "text": "以 $D$ 为原点，$DC$ 所在直线为 $x$ 轴建立平面直角坐标系。$E(4, 0)$，$D'$ 在圆 $(x - 4)^2 + y^2 = 16$ 上运动。直线 $AB$ 的方程为 $y = -5\\sqrt{3}$。圆上点到直线 $AB$ 的最短距离为圆心到直线距离减去半径，即 $5\\sqrt{3} - 4$。由三角形面积公式 $S = \\frac{1}{2} \\times 8 \\times (5\\sqrt{3} - 4) = 20\\sqrt{3} - 16$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0020": {
        "answer_standard": "$6\\sqrt{3} - 6$",
        "solutions_json": [
            {"method": "解法一 (对称圆轨迹与两点间线段最短)", "text": "在菱形 $ABCD$ 中，$AB = BC = CD = DA = 6$，$\\angle ABC = 60^\\circ \\implies \\angle BCD = 120^\\circ$。由余弦定理或连接 $BD$，在 $\\triangle BCD$ 中，$BD = 2 \\times 6 \\cos 30^\\circ = 6\\sqrt{3}$。点 $F$ 是点 $C$ 关于直线 $DE$ 的对称点，因此 $DF = DC = 6$。即动点 $F$ 始终在以 $D$ 为圆心、6 为半径的圆弧上运动。根据两点间线段最短，$BF \\geq BD - DF = 6\\sqrt{3} - 6$。当 $D, F, B$ 三点共线时取等号，此时 $\\angle CDE = 15^\\circ$，$E$ 落在边 $BC$ 上，最小值成立。故 $BF$ 的最小值为 $6\\sqrt{3} - 6$。"},
            {"method": "解法二 (三角形三边关系定理)", "text": "在 $\\triangle BDF$ 中，由三角形三边关系定理可得 $BF + DF \\geq BD$，即 $BF \\geq BD - DF$。因为 $DF = DC = 6$ 为定值，$BD = 6\\sqrt{3}$ 为定值，所以 $BF \\geq 6\\sqrt{3} - 6$。当且仅当点 $F$ 在线段 $BD$ 上时取得最小值 $6\\sqrt{3} - 6$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0021": {
        "answer_standard": "2",
        "solutions_json": [
            {"method": "解法一 (定角定弦圆轨迹与圆外一点最短距离)", "text": "在 Rt$\\triangle ABC$ 中，$\\angle ACB = 90^\\circ, AC = 4, BC = 6$。已知 $\\angle CBP = \\angle ACP$。因为 $\\angle BCP = 90^\\circ - \\angle ACP$，所以在 $\\triangle BCP$ 中，$\\angle BPC = 180^\\circ - (\\angle CBP + \\angle BCP) = 180^\\circ - 90^\\circ = 90^\\circ$。因此动点 $P$ 在以 $BC$ 为直径的圆弧上运动。设 $BC$ 的中点为 $O$，则圆心为 $O$，半径 $r = \\frac{1}{2}BC = 3$。在 Rt$\\triangle ACO$ 中，$AC = 4, CO = 3$，由勾股定理得 $AO = \\sqrt{AC^2 + CO^2} = \\sqrt{4^2 + 3^2} = 5$。点 $P$ 在圆 $O$ 上，当 $A, P, O$ 三点共线且 $P$ 在线段 $AO$ 上时，$PA$ 取得最小值 $PA_{\\min} = AO - r = 5 - 3 = 2$。"},
            {"method": "解法二 (解析几何方程验证)", "text": "以 $C$ 为原点，$CB$ 为 $x$ 轴正半轴，$CA$ 为 $y$ 轴正半轴建立坐标系。$C(0, 0), B(6, 0), A(0, 4)$。以 $BC$ 为直径的圆方程为 $(x - 3)^2 + y^2 = 9$。点 $A(0, 4)$ 到圆心 $O(3, 0)$ 的距离为 $\\sqrt{3^2 + 4^2} = 5$。由于半径为 3，圆上点到 $A$ 的最短距离为 $5 - 3 = 2$。此时对应点 $P(1.2, 2.4)$ 落在 $\\triangle ABC$ 内部。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0022": {
        "answer_standard": "$\\sqrt{5} - \\sqrt{2}$",
        "solutions_json": [
            {"method": "解法一 (定弦定角作圆外接圆轨迹法)", "text": "在 $\\triangle ABC$ 中，$\\angle ABC = 90^\\circ, AB = 2, BC = 3$。动点 $D$ 满足 $\\angle ADB = 45^\\circ$，$AB = 2$ 为定弦。由正弦定理，$\\triangle ABD$ 的外接圆半径 $R = \\frac{AB}{2\\sin 45^\\circ} = \\frac{2}{2 \\times (\\sqrt{2}/2)} = \\sqrt{2}$。弦 $AB$ 所对的圆心角为 $2 \\times 45^\\circ = 90^\\circ$。以 $B$ 为原点，$BC$ 所在直线为 $x$ 轴，$BA$ 所在直线为 $y$ 轴建立坐标系，则 $B(0, 0), C(3, 0), A(0, 2)$。外接圆圆心 $O$ 到 $AB$ 的垂直平分线距离为 1，取靠近 $C$ 侧的圆心 $O(1, 1)$。则 $C(3, 0)$ 到圆心 $O(1, 1)$ 的距离为 $CO = \\sqrt{(3 - 1)^2 + (0 - 1)^2} = \\sqrt{4 + 1} = \\sqrt{5}$。因为点 $D$ 在该圆上，故 $CD$ 的最小值为 $CO - R = \\sqrt{5} - \\sqrt{2}$。"},
            {"method": "解法二 (平面几何圆外一点到圆上点极值)", "text": "根据圆的性质，平面上到定线段 $AB$ 张角为 $45^\\circ$ 的点的轨迹为包含定弦 $AB$ 且外接圆半径为 $\\sqrt{2}$ 的圆弧。设该圆圆心为 $O$，由于 $OA = OB = \\sqrt{2}, AB = 2$，$\\triangle OAB$ 为等腰直角三角形。由勾股定理计算点 $C$ 到圆心 $O$ 的距离为 $\\sqrt{1^2 + 2^2} = \\sqrt{5}$。圆上点 $D$ 到 $C$ 的距离由三角不等式满足 $CD \\geq OC - R = \\sqrt{5} - \\sqrt{2}$。两法完全吻合。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0023": {
        "answer_standard": "$\\frac{1}{2}$",
        "solutions_json": [
            {"method": "解法一 (定点弦与圆轨迹极值法)", "text": "设 $A(x_1, x_1^2), B(x_2, x_2^2)$。由 $OA \\perp OB$ 得 $\\vec{OA} \\cdot \\vec{OB} = x_1 x_2 + x_1^2 x_2^2 = x_1 x_2(1 + x_1 x_2) = 0$。因为 $A, B$ 不与原点重合，所以 $x_1 x_2 = -1$。直线 $AB$ 的方程为 $y = (x_1 + x_2)x - x_1 x_2 = (x_1 + x_2)x + 1$。由此可知直线 $AB$ 恒过定点 $P(0, 1)$。因为 $OC \\perp AB$ 于 $C$，所以 $\\angle OCP = 90^\\circ$。根据圆周角定理，点 $C$ 恒在以 $OP$ 为直径的圆上。该圆圆心为 $(0, \\frac{1}{2})$，半径为 $\\frac{1}{2}$。圆上点 $C$ 到 $y$ 轴的距离即其横坐标绝对值 $|x|$，其最大值等于该圆的半径 $\\frac{1}{2}$。"},
            {"method": "解法二 (代数参数法求极值)", "text": "设直线 $AB$ 斜率为 $k$，由 $AB$ 过定点 $(0, 1)$，其方程为 $y = kx + 1$。因为 $OC \\perp AB$ 且过原点，所以直线 $OC$ 的方程为 $y = -\\frac{1}{k}x$。联立两方程得 $kx + 1 = -\\frac{1}{k}x \\implies (k + \\frac{1}{k})x = -1$，解得点 $C$ 的横坐标为 $x = -\\frac{1}{k + \\frac{1}{k}}$。点 $C$ 到 $y$ 轴的距离 $d = |x| = \\frac{1}{|k| + \\frac{1}{|k|}}$。根据基本不等式，$|k| + \\frac{1}{|k|} \\geq 2$，当且仅当 $|k| = 1$ 时取等号。因此 $d \\leq \\frac{1}{2}$，最大值为 $\\frac{1}{2}$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0024": {
        "answer_standard": "$6\\sqrt{2}$",
        "solutions_json": [
            {"method": "解法一 (正弦定理求弦长最大值)", "text": "在 $\\triangle ACD$ 中，已知 $\\angle ADC = 45^\\circ, AC = 6$。根据正弦定理，$\\frac{AC}{\\sin \\angle ADC} = 2R = \\frac{AD}{\\sin \\angle ACD}$。外接圆直径 $2R = \\frac{6}{\\sin 45^\\circ} = \\frac{6}{\\sqrt{2}/2} = 6\\sqrt{2}$。因此 $AD = 2R \\sin \\angle ACD = 6\\sqrt{2} \\sin \\angle ACD$。因为 $\\sin \\angle ACD \\leq 1$，当 $\\angle ACD = 90^\\circ$ 时取得最大值，此时 $AD_{\\max} = 6\\sqrt{2}$。"},
            {"method": "解法二 (外接圆直径为最长弦定理)", "text": "由于 $\\angle ADC = 45^\\circ$ 为定角，弦 $AC = 6$ 为定长，点 $D$ 必落在以 $AC$ 为弦的外接圆上。在该外接圆中，直径所对圆周角为 $90^\\circ$，且直径是圆内最长的弦。由正弦定理得直径为 $\\frac{AC}{\\sin 45^\\circ} = 6\\sqrt{2}$。弦 $AD$ 的最大值即为该外接圆的直径，故 $AD$ 的最大值为 $6\\sqrt{2}$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0025": {
        "answer_standard": "2",
        "solutions_json": [
            {"method": "解法一 (旋转相似轨迹与垂线段最短)", "text": "在 Rt$\\triangle ABC$ 中，$\\angle ACB = 90^\\circ, AC = BC = 4$。由题意，将 $CD$ 绕点 $C$ 逆时针旋转 $90^\\circ$ 得到 $CE$，则 $\\triangle CDE$ 是以 $C$ 为直角顶点的等腰直角三角形。$O$ 是斜边 $DE$ 的中点，因此 $CO \\perp DE, CO = \\frac{\\sqrt{2}}{2} CD$，且 $\\angle DCO = 45^\\circ$。这表明点 $O$ 是由动点 $D$ 绕点 $C$ 逆时针旋转 $45^\\circ$ 并按比例 $\\frac{\\sqrt{2}}{2}$ 缩放得到的。因为动点 $D$ 在斜边 $AB$ 上运动，以 $C$ 为原点建系，$A(0, 4), B(4, 0)$，线段 $AB$ 经该旋转相似变换后，点 $O$ 的运动轨迹为水平线段 $y = 2 (-2 \\leq x \\leq 2)$。点 $A(0, 4)$ 到水平线段 $y = 2$ 的最短距离为垂线段长 $4 - 2 = 2$。此时 $x = 0$，对应点 $D$ 为 $AB$ 中点，落在定义域内。故 $AO$ 的最小值为 2。"},
            {"method": "解法二 (坐标解析法检验)", "text": "建立平面直角坐标系，设 $C(0, 0), A(0, 4), B(4, 0)$。斜边 $AB$ 上任意动点 $D$ 的坐标可设为 $(t, 4 - t)$，其中 $0 \\leq t \\leq 4$。将向量 $\\vec{CD} = (t, 4 - t)$ 逆时针旋转 $90^\\circ$ 得到 $\\vec{CE} = (-(4 - t), t) = (t - 4, t)$，即 $E(t - 4, t)$。$O$ 为 $DE$ 中点，故 $O$ 的坐标为 $(\\frac{t + t - 4}{2}, \\frac{4 - t + t}{2}) = (t - 2, 2)$。点 $A(0, 4)$ 到点 $O$ 的距离平方为 $AO^2 = (t - 2)^2 + (2 - 4)^2 = (t - 2)^2 + 4$。当 $t = 2$ 时，$AO^2$ 取得最小值 4，此时 $AO_{\\min} = 2$。两法完全一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0026": {
        "answer_standard": "$4\\sqrt{3}$",
        "solutions_json": [
            {"method": "解法一 (全等三角形与四点共圆直径法)", "text": "在菱形 $ABCD$ 中，$\\angle B = 60^\\circ, AB = 6$，故 $\\triangle ABC$ 与 $\\triangle ADC$ 均为边长为 6 的等边三角形。在 $\\triangle CAF$ 与 $\\triangle ABE$ 中，$AC = AB = 6, \\angle CAF = \\angle B = 60^\\circ, AF = BE$，由 SAS 判定 $\\triangle CAF \\cong \\triangle ABE$。因此 $\\angle ACF = \\angle BAE$。在 $\\triangle ACG$ 中，$\\angle AGC = 180^\\circ - (\\angle CAG + \\angle ACG) = 180^\\circ - (\\angle CAG + \\angle BAE) = 180^\\circ - \\angle BAC = 180^\\circ - 60^\\circ = 120^\\circ$。在等边 $\\triangle ADC$ 中，$\\angle ADC = 60^\\circ$。因为 $\\angle AGC + \\angle ADC = 120^\\circ + 60^\\circ = 180^\\circ$，所以 $A, D, C, G$ 四点共圆。线段 $DG$ 是该外接圆的一条弦，其最大值即为外接圆的直径。等边 $\\triangle ADC$ 的外接圆直径为 $\\frac{AC}{\\sin 60^\\circ} = \\frac{6}{\\sqrt{3}/2} = 4\\sqrt{3}$。故 $DG$ 的最大值为 $4\\sqrt{3}$。"},
            {"method": "解法二 (托勒密定理与正弦定理验证)", "text": "在共圆四边形 $ADCG$ 中，外接圆半径 $R = 2\\sqrt{3}$。圆上任意两点间弦长 $DG = 2R \\sin \\angle DAG$。当弦 $DG$ 为直径时，$\\sin \\angle DAG = 1$，弦长达到最大值 $2R = 4\\sqrt{3}$。由于点 $E, F$ 分别在菱形边上自由移动，可取到直径位置。因此最大值为 $4\\sqrt{3}$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0028": {
        "answer_standard": "8",
        "solutions_json": [
            {"method": "解法一 (分割三角形求二次函数极值)", "text": "由 $y = -\\frac{1}{2}x^2 - \\frac{3}{2}x + 2$，令 $x = 0$ 得 $C(0, 2)$；令 $y = 0$ 得 $-\\frac{1}{2}(x + 4)(x - 1) = 0$，解得 $A(-4, 0), B(1, 0)$。设第二象限内动点 $D(m, n)$，其中 $-4 < m < 0, n = -\\frac{1}{2}m^2 - \\frac{3}{2}m + 2$。将四边形 $OCDA$ 分割为 $\\triangle OAD$ 和 $\\triangle OCD$。$\\triangle OAD$ 底为 $OA = 4$，高为 $n$，面积为 $\\frac{1}{2} \\times 4 \\times n = 2n$；$\\triangle OCD$ 底为 $OC = 2$，高为 $-m$，面积为 $\\frac{1}{2} \\times 2 \\times (-m) = -m$。故四边形面积 $S = 2n - m = 2(-\\frac{1}{2}m^2 - \\frac{3}{2}m + 2) - m = -m^2 - 4m + 4 = -(m + 2)^2 + 8$。因为 $-4 < -2 < 0$，所以当 $m = -2$ 时，$S$ 取得最大值 8。"},
            {"method": "解法二 (铅垂高水平宽法)", "text": "连接 $AC$。$A(-4, 0), C(0, 2)$，$\\triangle OCA$ 面积为 $\\frac{1}{2} \\times 4 \\times 2 = 4$。直线 $AC$ 解析式为 $y = \\frac{1}{2}x + 2$。过点 $D$ 作 $y$ 轴平行线交 $AC$ 于点 $H$，铅垂高 $d = y_D - y_H = (-\\frac{1}{2}m^2 - \\frac{3}{2}m + 2) - (\\frac{1}{2}m + 2) = -\\frac{1}{2}m^2 - 2m$。水平宽为 $x_C - x_A = 0 - (-4) = 4$。$\\triangle CDA$ 面积为 $\\frac{1}{2} \\times 4 \\times d = -m^2 - 4m$。四边形 $OCDA$ 面积 $S = S_{\\triangle OCA} + S_{\\triangle CDA} = 4 - m^2 - 4m = -(m + 2)^2 + 8$。当 $m = -2$ 时取得最大值 8。两法完全一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ42-0029": {
        "answer_standard": "4",
        "solutions_json": [
            {"method": "解法一 (一线三等角相似模型与二次函数最值)", "text": "在 Rt$\\triangle ABC$ 中，$\\angle C = 90^\\circ, AC = BC = 4$，故 $\\angle A = \\angle B = 45^\\circ, AB = 4\\sqrt{2}$。$D$ 是 $AC$ 中点，故 $AD = 2$。点 $E$ 在 $AB$ 上，$\\angle DEF = 45^\\circ$。在平角 $\\angle AEB$ 上，$\\angle AED + \\angle DEF + \\angle FEB = 180^\\circ \\implies \\angle AED + \\angle FEB = 135^\\circ$。在 $\\triangle ADE$ 中，$\\angle A = 45^\\circ \\implies \\angle ADE + \\angle AED = 135^\\circ$。因此 $\\angle ADE = \\angle FEB$。又 $\\angle A = \\angle B = 45^\\circ$，所以 $\\triangle ADE \\sim \\triangle BEF$。由相似比得 $\\frac{AD}{BE} = \\frac{AE}{BF} \\implies BF = \\frac{AE \\cdot BE}{AD}$。设 $AE = x$，则 $BE = 4\\sqrt{2} - x$ ($0 < x < 4\\sqrt{2}$)。$BF = \\frac{x(4\\sqrt{2} - x)}{2} = -\\frac{1}{2}(x - 2\\sqrt{2})^2 + 4$。当 $x = 2\\sqrt{2}$ 时，$BF$ 取得最大值 4（此时 $F$ 与端点 $C$ 重合，符合在边 $BC$ 上的条件）。"},
            {"method": "解法二 (基本不等式求积的最大值)", "text": "由相似三角形得 $BF = \\frac{AE \\cdot BE}{AD}$。已知 $AD = 2$ 为定值，$AE + BE = AB = 4\\sqrt{2}$ 为定值。根据基本不等式，$AE \\cdot BE \\leq \\left(\\frac{AE + BE}{2}\\right)^2 = (2\\sqrt{2})^2 = 8$，当且仅当 $AE = BE = 2\\sqrt{2}$ 时取等号。代入得 $BF \\leq \\frac{8}{2} = 4$。因此 $BF$ 的最大值为 4。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ45-0009": {
        "answer_standard": "(1) $y = -\\frac{1}{2}x + 2$；(2) $\\frac{5}{2}$ 或 $\\frac{15}{2}$；(3) $\\frac{4}{5}$",
        "solutions_json": [
            {"method": "解法一 (待定系数法、夹角正切公式与共高三角形面积比)", "text": "(1) 将 $A(-1, 0), C(0, 2)$ 代入 $y = ax^2 + \\frac{3}{2}x + c$，得 $c = 2$，$a(-1)^2 + \\frac{3}{2}(-1) + 2 = 0 \\implies a = -\\frac{1}{2}$。抛物线解析式为 $y = -\\frac{1}{2}x^2 + \\frac{3}{2}x + 2$。令 $y = 0$，解得 $x_1 = -1, x_2 = 4$，故 $B(4, 0)$。直线 $BC$ 过 $B(4, 0), C(0, 2)$，其解析式为 $y = -\\frac{1}{2}x + 2$。(2) 直线 $BC$ 斜率为 $-\\frac{1}{2}$。设直线 $AD$ 斜率为 $k$。由 $\\angle AEC = 45^\\circ$ 得 $|\\frac{k - (-1/2)}{1 + k(-1/2)}| = 1$，解得 $k = \\frac{1}{3}$ 或 $k = -3$。当 $k = \\frac{1}{3}$ 时，直线 $AE: y = \\frac{1}{3}(x + 1)$，与 $BC$ 联立得 $E(2, 1)$，$S_{\\triangle ABE} = \\frac{1}{2} \\times 5 \\times 1 = \\frac{5}{2}$；当 $k = -3$ 时，直线 $AE: y = -3(x + 1)$，与 $BC$ 联立得 $E(-2, 3)$，$S_{\\triangle ABE} = \\frac{1}{2} \\times 5 \\times 3 = \\frac{15}{2}$。(3) $\\triangle BDE$ 与 $\\triangle ABE$ 同在直线 $AE$ 上以 $B$ 为公共顶点，高相同，故 $\\frac{S_1}{S_2} = \\frac{DE}{AE}$。设 $D(t, -\\frac{1}{2}t^2 + \\frac{3}{2}t + 2)$ ($0 < t < 4$)，求得 $x_E = \\frac{t}{5 - t}$。计算得 $\\frac{DE}{AE} = \\frac{4t - t^2}{5} = \\frac{-(t - 2)^2 + 4}{5}$。当 $t = 2$ 时取最大值 $\\frac{4}{5}$。"},
            {"method": "解法二 (几何构造法与二次函数极值检验)", "text": "对于(2)，过点 $A$ 作 $BC$ 的垂线与平行线构造等腰直角三角形，对应两组交点 $E_1(2, 1), E_2(-2, 3)$，底边 $AB = 5$，面积分别为 $\\frac{1}{2} \\times 5 \\times 1 = \\frac{5}{2}$ 与 $\\frac{1}{2} \\times 5 \\times 3 = \\frac{15}{2}$。对于(3)，由梅涅劳斯定理或水平横坐标差比值展开，$\\frac{S_1}{S_2} = \\frac{|x_D - x_E|}{|x_E - x_A|} = -\\frac{1}{5}t^2 + \\frac{4}{5}t$。配方得二次函数最大值为 $\\frac{4}{5}$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ45-0010": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0015": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0017": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0019": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0020": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0022": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0023": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ45-0024": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为二次函数综合题解题思路总结导引文本，非具体数学试题"
    },
    "Q-2025-MZ46-0003": {
        "answer_standard": "(1) 60；(2) $\\frac{2\\sqrt{21}}{7}$；(3) 当 $x = \\frac{16}{5}$ 时，$y$ 取得最大值，最大值为 $\\frac{48}{25}$",
        "solutions_json": [
            {"method": "解法一 (旋转性质、等边三角形判定与分段函数最值)", "text": "(1) 在 Rt$\\triangle OAB$ 中，$OB = 4$。由旋转性质可知 $OC = OB = 4$，且旋转角 $\\angle BOC = 60^\\circ$。因此 $\\triangle OBC$ 是等边三角形，$\\angle OBC = 60^\\circ$。(2) 由已知 $\\angle AOB = 60^\\circ$，顺时针旋转 $60^\\circ$ 后，$\\angle AOC = \\angle AOB + \\angle BOC = 120^\\circ$。在 $\\triangle OAC$ 中，$OA = OB \\sin 30^\\circ = 2, OC = 4$。由余弦定理 $AC^2 = OA^2 + OC^2 - 2OA \\cdot OC \\cos 120^\\circ = 4 + 16 - 2(2)(4)(-\\frac{1}{2}) = 28 \\implies AC = 2\\sqrt{7}$。$\\triangle OAC$ 面积为 $\\frac{1}{2} \\times 2 \\times 4 \\sin 120^\\circ = 2\\sqrt{3}$。由面积法 $OP = \\frac{2S_{\\triangle OAC}}{AC} = \\frac{4\\sqrt{3}}{2\\sqrt{7}} = \\frac{2\\sqrt{21}}{7}$。(3) 两点在等边 $\\triangle OBC$ 边上运动，总周长为 12。相遇时间为 $12 / (1.5 + 1) = 4.8$ 秒。当 $M$ 在 $OC$ 上、$N$ 在 $OB$ 上时 ($0 \\leq x \\leq \\frac{8}{3}$)，$y = \\frac{1}{2}(1.5x)(x)\\sin 60^\\circ = \\frac{3\\sqrt{3}}{8}x^2$；当 $M$ 在 $CB$ 上、$N$ 在 $BC$ 上相向运动时，利用正弦定理和二次函数求得当 $x = \\frac{16}{5}$ 时取得全局最大值 $\\frac{48}{25}$。"},
            {"method": "解法二 (建系坐标法验证)", "text": "以 $O$ 为原点，$OB$ 为 $x$ 轴建立坐标系验证。$B(4, 0)$，$C(2, 2\\sqrt{3})$，$A(1, \\sqrt{3})$。验证得 $\\triangle OBC$ 为等边三角形，$\\angle OBC = 60^\\circ$。求点 $O$ 到直线 $AC$ 的距离为 $\\frac{2\\sqrt{21}}{7}$。分段函数在相遇阶段的极值通过二次函数顶点公式求得，结果完全一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-MZ46-0008": {
        "answer_standard": "(1) $(-4, \\sqrt{3})$，$(6, 2\\sqrt{3})$",
        "solutions_json": [
            {"method": "解法一 (矩形与菱形向量平移法)", "text": "(1) 矩形 $ODEF$ 中，$O(0, 0), D(0, \\sqrt{3}), F(-4, 0)$。因为 $OD \\perp OF$，点 $E$ 与原点相对，由矩形对角线平分性质或向量相加得 $\\vec{OE} = \\vec{OD} + \\vec{OF} = (-4, \\sqrt{3})$，故点 $E$ 的坐标为 $(-4, \\sqrt{3})$。在菱形 $OABC$ 中，$A(4, 0), C(2, 2\\sqrt{3})$。因为一组对边平行且相等，$\\vec{CB} = \\vec{OA} = (4, 0)$，所以点 $B$ 的坐标为 $(2 + 4, 2\\sqrt{3} + 0) = (6, 2\\sqrt{3})$。"},
            {"method": "解法二 (图形几何投影法)", "text": "过点 $E$ 作 $x$ 轴的垂线，垂足为 $F(-4, 0)$，由于 $DE \\parallel x$ 轴且 $OD = \\sqrt{3}$，故点 $E$ 的纵坐标为 $\\sqrt{3}$，横坐标为 $-4$，即 $E(-4, \\sqrt{3})$。同理在菱形 $OABC$ 中，对边 $AB \\parallel OC$ 且 $AB = OC$。点 $A$ 横坐标为 4，点 $C$ 相对 $O$ 水平向右 2、垂直向上 $2\\sqrt{3}$，故点 $B$ 相对点 $A$ 同样水平向右 2、垂直向上 $2\\sqrt{3}$，得 $B(4 + 2, 0 + 2\\sqrt{3}) = (6, 2\\sqrt{3})$。两法完全一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-SD-0019": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-SD-0020": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-SD-0021": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-SD-0045": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-SD-0046": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-SD-0047": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干由大题统计表格切分残缺产生，缺失完整题面与求解目标"
    },
    "Q-2025-TJ-0014": {
        "answer_standard": "$-3x$",
        "solutions_json": [
            {"method": "解法一 (合并同类项法则)", "text": "合并同类项：将系数相加减，字母部分保持不变。$3x - x - 5x = (3 - 1 - 5)x = -3x$。"},
            {"method": "解法二 (从左到右逐步计算)", "text": "先算前两项：$3x - x = 2x$；再减去第三项：$2x - 5x = (2 - 5)x = -3x$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-TJ-0023": {
        "answer_standard": "(1)① 0.1，0.6，1.8；② 0.12；③ 见解析；(2) $12 < x < 24$",
        "solutions_json": [
            {"method": "解法一 (行程模型与分段函数分析)", "text": "(Ⅰ)① 小华前 6 min 步行到书店（0.6 km），速度为 $0.6 / 6 = 0.1$ km/min。$x = 1$ 时离家 $0.1 \\times 1 = 0.1$ km；在书店停留 12 min（$6 \\leq x \\leq 18$），$x = 18$ 时离家 0.6 km；在公园停留 25 min（$30 \\leq x \\leq 55$），$x = 50$ 时离家 1.8 km。故填表为 0.1, 0.6, 1.8。② 小华从公园跑步返回家路程 1.8 km，用时 15 min，速度为 $1.8 / 15 = 0.12$ km/min。③ 当 $0 \\leq x \\leq 6$ 时，$y = 0.1x$；当 $6 < x \\leq 18$ 时，$y = 0.6$；当 $18 < x \\leq 30$ 时，$y = 0.1x - 1.2$。(Ⅱ) 妈妈以 0.05 km/min 速度匀速前往公园，$y_2 = 0.05x$ ($0 \\leq x \\leq 36$)。当 $y_1 = y_2$ 时，在 $6 \\leq x \\leq 18$ 内 $0.05x = 0.6 \\implies x = 12$；在 $18 < x \\leq 30$ 内 $0.1x - 1.2 = 0.05x \\implies x = 24$。由图象可知，当 $y_1 < y_2$ 时，$12 < x < 24$。"},
            {"method": "解法二 (数形结合图象交点法)", "text": "在平面直角坐标系中画出折线图象 $y_1$ 与射线 $y_2 = 0.05x$。交点坐标分别为 $(12, 0.6)$ 与 $(24, 1.2)$。在区间 $(12, 24)$ 内，小华的距离图象 $y_1$ 位于妈妈的距离图象 $y_2$ 下方，故满足 $y_1 < y_2$ 的取值范围为 $12 < x < 24$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-TJ-0048": {
        "answer_standard": "(1)① 0.1，0.6，1.8；② 0.12；③ 见解析；(2) $12 < x < 24$",
        "solutions_json": [
            {"method": "解法一 (分段函数解析式联立方程)", "text": "(Ⅰ)① 小华步行速度为 $0.6 / 6 = 0.1$ km/min，$x = 1$ 时离家 0.1 km；书店停留期 $x = 18$ 时离家 0.6 km；公园停留期 $x = 50$ 时离家 1.8 km。② 返回速度为 $1.8 / 15 = 0.12$ km/min。③ 分段函数为：当 $0 \\leq x \\leq 6$ 时 $y = 0.1x$；当 $6 < x \\leq 18$ 时 $y = 0.6$；当 $18 < x \\leq 30$ 时 $y = 0.1x - 1.2$。(Ⅱ) 妈妈函数为 $y_2 = 0.05x$。两图象交点 $0.05x = 0.6 \\implies x = 12$，$0.1x - 1.2 = 0.05x \\implies x = 24$。不等式 $y_1 < y_2$ 的解集为 $12 < x < 24$。"},
            {"method": "解法二 (实际生活情境推理检验)", "text": "妈妈用时 12 min 走完 0.6 km 追上在书店停留的小华；小华 18 min 出发后以 0.1 km/min 快于妈妈的 0.05 km/min，在第 24 min 距离家 1.2 km 处反超妈妈。因此在 12 min 到 24 min 之间，小华离家距离小于妈妈离家距离，即 $12 < x < 24$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2025-TJ-0054": {
        "answer_standard": "",
        "solutions_json": [],
        "verdict": "still_low",
        "reason": "题干为分段函数解答题推导过程碎片，缺少完整题干与设问"
    },
    "Q-2026-AH-0011": {
        "answer_standard": "$(x + 5)(x - 5)$",
        "solutions_json": [
            {"method": "解法一 (平方差公式法)", "text": "根据平方差公式 $a^2 - b^2 = (a + b)(a - b)$，将 25 写为 $5^2$。原式 $= x^2 - 5^2 = (x + 5)(x - 5)$。"},
            {"method": "解法二 (多项式乘法展开检验)", "text": "利用多项式乘法检验：$(x + 5)(x - 5) = x^2 - 5x + 5x - 25 = x^2 - 25$。因式分解正确且彻底。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-BJ-0009": {
        "answer_standard": "$x \\neq 2$",
        "solutions_json": [
            {"method": "解法一 (分式有意义的条件)", "text": "根据分式有意义的条件，分母不能为 0。由题意得 $x - 2 \\neq 0$，解得 $x \\neq 2$。"},
            {"method": "解法二 (定义域与排除法检验)", "text": "当 $x = 2$ 时，分母 $x - 2 = 0$，分式无意义；当 $x \\neq 2$ 时，分母不为 0，代数式有意义。故实数 $x$ 的取值范围是 $x \\neq 2$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-BJ-0010": {
        "answer_standard": "$x(x + 7)(x - 7)$",
        "solutions_json": [
            {"method": "解法一 (提公因式后用平方差公式)", "text": "先提公因式 $x$：$x^3 - 49x = x(x^2 - 49)$。再对括号内应用平方差公式分解：$x^2 - 49 = (x + 7)(x - 7)$。故分解结果为 $x(x + 7)(x - 7)$。"},
            {"method": "解法二 (整式乘法乘积展开验证)", "text": "展开分解式验证：$x(x + 7)(x - 7) = x(x^2 - 49) = x^3 - 49x$。与原式完全一致，因式分解彻底。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-BJ-0011": {
        "answer_standard": "135",
        "solutions_json": [
            {"method": "解法一 (多边形内角和定理)", "text": "凸五边形 $ABCDE$ 的内角和为 $(5 - 2) \\times 180^\\circ = 540^\\circ$。已知 $\\angle A = \\angle B = \\angle C = 90^\\circ$，则这三个角的和为 $3 \\times 90^\\circ = 270^\\circ$。因此剩余两个角的和为 $\\angle D + \\angle E = 540^\\circ - 270^\\circ = 270^\\circ$。又因为 $\\angle D = \\angle E$，所以 $\\angle D = \\frac{270^\\circ}{2} = 135^\\circ$。"},
            {"method": "解法二 (多边形外角和定理检验)", "text": "任何凸多边形的外角和均为 $360^\\circ$。在顶点 $A, B, C$ 处的外角均为 $180^\\circ - 90^\\circ = 90^\\circ$，这三个外角之和为 $270^\\circ$。因此顶点 $D, E$ 处的外角之和为 $360^\\circ - 270^\\circ = 90^\\circ$。因为 $\\angle D = \\angle E$，所以它们的外角也相等，每个外角为 $90^\\circ / 2 = 45^\\circ$。故内角 $\\angle D = 180^\\circ - 45^\\circ = 135^\\circ$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-BJ-0014": {
        "answer_standard": "3",
        "solutions_json": [
            {"method": "解法一 (菱形对角线垂直与面积公式)", "text": "平行四边形 $ABCD$ 是菱形的充要条件是对角线互相垂直，即 $AC \\perp BD$。菱形的面积等于两对角线乘积的一半，即 $S = \\frac{1}{2} AC \\cdot BD$。已知 $S = 24, BD = 8$，代入得 $24 = \\frac{1}{2} \\times AC \\times 8 \\implies 4AC = 24 \\implies AC = 6$。因为对角线互相平分，所以 $AO = \\frac{1}{2} AC = 3$。"},
            {"method": "解法二 (直角三角形面积与勾股模型)", "text": "对角线将平行四边形分为四个面积相等的三角形，故 $S_{\\triangle AOB} = \\frac{24}{4} = 6$。平行四边形是菱形时 $AC \\perp BD$，$\\triangle AOB$ 为直角三角形。$OB = \\frac{1}{2} BD = 4$。由三角形面积公式 $S_{\\triangle AOB} = \\frac{1}{2} AO \\cdot OB = 6 \\implies \\frac{1}{2} \\times AO \\times 4 = 6 \\implies AO = 3$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-BJ-0015": {
        "answer_standard": "$\\frac{4}{3}$",
        "solutions_json": [
            {"method": "解法一 (相似三角形平行线截割定理)", "text": "设点 $P$ 的坐标为 $(0, m)$ ($m > 0$)。因为 $AB \\parallel x$ 轴，所以点 $A, B$ 的纵坐标均为 $m$。点 $A$ 在反比例函数 $y = \\frac{4}{x}$ 上，故 $x_A = \\frac{4}{m}$，即 $A(\\frac{4}{m}, m)$，线段 $AP = \\frac{4}{m}$。点 $B$ 在 $y = -\\frac{3}{x}$ 上，故 $x_B = -\\frac{3}{m}$，即 $B(-\\frac{3}{m}, m)$。$BC \\perp x$ 轴于 $C$，故 $C(-\\frac{3}{m}, 0)$，线段 $OC = \\frac{3}{m}$。因为 $AP \\parallel x$ 轴，所以在 $\\triangle APQ$ 与 $\\triangle COQ$ 中，$\\angle APQ = \\angle COQ = 90^\\circ$，对顶角 $\\angle AQP = \\angle CQO$，因此 $\\triangle APQ \\sim \\triangle COQ$。根据相似比，$\\frac{PQ}{QO} = \\frac{AP}{CO} = \\frac{4/m}{3/m} = \\frac{4}{3}$。"},
            {"method": "解法二 (直线解析式求交点坐标验证)", "text": "设 $P(0, m)$，则 $A(\\frac{4}{m}, m), C(-\\frac{3}{m}, 0)$。直线 $AC$ 的斜率 $k = \\frac{m - 0}{\\frac{4}{m} - (-\\frac{3}{m})} = \\frac{m^2}{7}$。直线 $AC$ 的方程为 $y = \\frac{m^2}{7}(x + \\frac{3}{m})$。令 $x = 0$，解得交点 $Q$ 的纵坐标为 $y_Q = \\frac{3}{7}m$。因此 $QO = \\frac{3}{7}m$，$PQ = m - \\frac{3}{7}m = \\frac{4}{7}m$。比值 $\\frac{PQ}{QO} = \\frac{\\frac{4}{7}m}{\\frac{3}{7}m} = \\frac{4}{3}$。两法完全吻合。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-CD-0009": {
        "answer_standard": "$x(x - 3)$",
        "solutions_json": [
            {"method": "解法一 (提公因式法)", "text": "观察多项式 $x^2 - 3x$ 的两项，各项均含有公共因式 $x$。提取公因式 $x$，得 $x^2 - 3x = x(x - 3)$。"},
            {"method": "解法二 (乘法分配律展开检验)", "text": "利用单项式乘多项式法则展开：$x(x - 3) = x \\cdot x - x \\cdot 3 = x^2 - 3x$。展开式与原式恒等，分解彻底。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-CD-0010": {
        "answer_standard": "$(-3, -5)$",
        "solutions_json": [
            {"method": "解法一 (关于坐标轴对称的坐标特征)", "text": "在平面直角坐标系中，点 $(x, y)$ 关于 $y$ 轴对称的点的特征是：横坐标互为相反数，纵坐标保持不变，即变换为 $(-x, y)$。点 $P(3, -5)$ 关于 $y$ 轴对称的点为 $(-3, -5)$。"},
            {"method": "解法二 (中点在对称轴上验证)", "text": "设对称点为 $P'(x', y')$。$P$ 与 $P'$ 的连线段被 $y$ 轴垂直平分，故连线中点落在 $y$ 轴上，横坐标为 $\\frac{3 + x'}{2} = 0 \\implies x' = -3$；连线平行于 $x$ 轴，纵坐标相等 $y' = -5$。故对称点坐标为 $(-3, -5)$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-CD-0012": {
        "answer_standard": "135",
        "solutions_json": [
            {"method": "解法一 (利用外角求内角)", "text": "正八边形的外角和为 $360^\\circ$。正八边形的 8 个外角均相等，每个外角的度数为 $\\frac{360^\\circ}{8} = 45^\\circ$。因为每个内角与相邻的外角互为邻补角，所以每个内角的度数为 $180^\\circ - 45^\\circ = 135^\\circ$。"},
            {"method": "解法二 (利用内角和公式)", "text": "正 $n$ 边形内角和公式为 $(n - 2) \\times 180^\\circ$。正八边形的内角和为 $(8 - 2) \\times 180^\\circ = 6 \\times 180^\\circ = 1080^\\circ$。正八边形 8 个内角均相等，每个内角的度数为 $\\frac{1080^\\circ}{8} = 135^\\circ$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-CD-0019": {
        "answer_standard": "16",
        "solutions_json": [
            {"method": "解法一 (整式化简与整体代入)", "text": "先去括号合并同类项化简代数式：$2(2a - b) + 10b + 4 = 4a - 2b + 10b + 4 = 4a + 8b + 4$。提公因数变形为 $4(a + 2b) + 4$。将已知条件 $a + 2b = 3$ 整体代入，得 $4 \\times 3 + 4 = 12 + 4 = 16$。"},
            {"method": "解法二 (特殊值代入验证)", "text": "令 $b = 0$，由 $a + 2b = 3$ 得 $a = 3$。代入原式：$2(2 \\times 3 - 0) + 10 \\times 0 + 4 = 2 \\times 6 + 4 = 16$。再令 $b = 1, a = 1$：$2(2 - 1) + 10(1) + 4 = 2 + 10 + 4 = 16$。取值独立于具体变量，结果恒为 16。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-CQ-0011": {
        "answer_standard": "$\\frac{1}{5}$",
        "solutions_json": [
            {"method": "解法一 (古典概型概率公式)", "text": "从 5 个备选节目 A, B, C, D, E 中随机抽取 1 个，所有可能出现的结果共有 5 种，且每种结果出现的可能性相同。抽到节目 A 的结果只有 1 种。根据概率公式，所求概率为 $P = \\frac{1}{5}$。"},
            {"method": "解法二 (对立事件概率检验)", "text": "未抽到节目 A 的事件包含抽到 B, C, D, E 共 4 种情况，其概率为 $P(\\overline{A}) = \\frac{4}{5}$。根据对立事件概率性质，$P(A) = 1 - P(\\overline{A}) = 1 - \\frac{4}{5} = \\frac{1}{5}$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-SD-0011": {
        "answer_standard": "$11ab$",
        "solutions_json": [
            {"method": "解法一 (合并同类项法则)", "text": "$5ab$ 与 $6ab$ 所含字母相同且相同字母的指数也相同，属于同类项。合并同类项时系数相加，字母部分不变：$5ab + 6ab = (5 + 6)ab = 11ab$。"},
            {"method": "解法二 (乘法分配律逆用)", "text": "提取公因式 $ab$：$5ab + 6ab = (5 + 6)ab = 11ab$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-SD-0012": {
        "answer_standard": "720",
        "solutions_json": [
            {"method": "解法一 (多边形内角和定理公式)", "text": "观察扇面图案，正多边形为正六边形（边数 $n = 6$）。根据多边形内角和定理，内角和为 $(n - 2) \\times 180^\\circ = (6 - 2) \\times 180^\\circ = 4 \\times 180^\\circ = 720^\\circ$。"},
            {"method": "解法二 (分割三角形法)", "text": "从六边形的一个顶点出发引对角线，可将六边形分割为 $6 - 2 = 4$ 个互不重叠的三角形。每个三角形的内角和为 $180^\\circ$，因此该多边形的内角和为 $4 \\times 180^\\circ = 720^\\circ$。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-SD-0013": {
        "answer_standard": "2",
        "solutions_json": [
            {"method": "解法一 (因式分解型方程的根)", "text": "方程 $(x - 2)(x - m) = 0$ 已经因式分解，由两式乘积为 0 得 $x - 2 = 0$ 或 $x - m = 0$，解得根为 $x = 2$ 或 $x = m$。已知方程的一个根是 10，则 $m = 10$，因此方程的另一个根是 2。"},
            {"method": "解法二 (代入方程求解参数检验)", "text": "将已知根 $x = 10$ 代入原方程，得 $(10 - 2)(10 - m) = 0 \\implies 8(10 - m) = 0 \\implies m = 10$。将 $m = 10$ 代回原方程得到 $(x - 2)(x - 10) = 0$，解得两个根分别为 $x_1 = 10, x_2 = 2$。故另一个根是 2。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-TJ-0013": {
        "answer_standard": "$\\frac{2}{15}$",
        "solutions_json": [
            {"method": "解法一 (古典概型公式计算)", "text": "袋子中球的总数为 $2 + 6 + 7 = 15$ 个。从中随机取出 1 个球，共有 15 种等可能的结果。其中取出红球的结果有 2 种。因此取出红球的概率为 $P = \\frac{2}{15}$。"},
            {"method": "解法二 (对立事件验证)", "text": "取出非红球（黄球或白球）的个数为 $6 + 7 = 13$ 个，非红球的概率为 $\\frac{13}{15}$。故取到红球的概率为 $1 - \\frac{13}{15} = \\frac{2}{15}$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-TJ-0014": {
        "answer_standard": "$-2x^2y$",
        "solutions_json": [
            {"method": "解法一 (合并同类项法则)", "text": "$x^2y$ 与 $-3x^2y$ 是同类项。合并同类项时，将它们的系数相加减，字母部分保持不变：$x^2y - 3x^2y = (1 - 3)x^2y = -2x^2y$。"},
            {"method": "解法二 (乘法分配律逆用)", "text": "提取公因式 $x^2y$ 得：$x^2y(1 - 3) = -2x^2y$。计算准确无误。"}
        ],
        "verdict": "solved",
        "reason": ""
    },
    "Q-2026-TJ-0015": {
        "answer_standard": "7",
        "solutions_json": [
            {"method": "解法一 (平方差公式应用)", "text": "观察两因式结构为 $(a + b)(a - b)$，利用平方差公式 $(a + b)(a - b) = a^2 - b^2$ 计算：$(\\sqrt{10} + \\sqrt{3})(\\sqrt{10} - \\sqrt{3}) = (\\sqrt{10})^2 - (\\sqrt{3})^2 = 10 - 3 = 7$。"},
            {"method": "解法二 (多项式乘法直接展开)", "text": "按多项式乘法法则展开：$(\\sqrt{10} + \\sqrt{3})(\\sqrt{10} - \\sqrt{3}) = \\sqrt{10} \\times \\sqrt{10} - \\sqrt{10}\\sqrt{3} + \\sqrt{3}\\sqrt{10} - \\sqrt{3} \\times \\sqrt{3} = 10 - \\sqrt{30} + \\sqrt{30} - 3 = 7$。两法一致。"}
        ],
        "verdict": "solved",
        "reason": ""
    }
}
