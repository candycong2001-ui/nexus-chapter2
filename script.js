"use strict";

const slides = [...document.querySelectorAll(".slide")];
const inDeck = () => document.body.classList.contains("deck");

/* ---------- 通用:滚动 reveal(演讲模式下不抢跑) ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && !inDeck()) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.18 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- 导航高亮 ---------- */
const navLinks = [...document.querySelectorAll(".nav-links a")];
const navIo = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
      }
    });
  },
  { threshold: 0.5 }
);
slides.forEach((s) => navIo.observe(s));

/* ==========================================================
   各页分步动画:统一为「幂等 run()」+「非 deck 时用 IO 自动触发」
   deck 模式改由 build 系统调用 run(step)
   ========================================================== */

/* ---------- P3 层位:自下而上搭建 ---------- */
const P3 = (function () {
  const arch = document.getElementById("archStack");
  if (!arch) return null;
  function litStep(step) {
    arch.querySelectorAll('[data-step="' + step + '"]').forEach((el) => el.classList.add("lit"));
  }
  function autoRun() {
    [1, 2, 3].forEach((step, idx) => setTimeout(() => {
      if (!inDeck()) litStep(step);
    }, idx * 620 + 200));
  }
  return { litStep, autoRun };
})();

/* ---------- P4 总领飞轮 ---------- */
const P4 = (function () {
  const wheel = document.getElementById("heroWheel");
  if (!wheel) return null;
  const nodes = [...wheel.querySelectorAll("[data-wheel-node]")];
  function litAll(force) {
    wheel.classList.add("is-live");
    nodes.forEach((n, i) => setTimeout(() => {
      if (force || !inDeck()) n.classList.add("lit");
    }, i * 140));
  }
  function reset() {
    wheel.classList.remove("is-live");
    nodes.forEach((n) => n.classList.remove("lit"));
  }
  return { litAll, autoRun: () => litAll(false), reset };
})();

/* ---------- P6 worker 高亮：复杂度在后台，但能力层级可见 ---------- */
const P6 = (function () {
  const worker = document.getElementById("orchWorker");
  if (!worker) return null;
  function fadeWorker() { worker.classList.add("ready"); }
  return { fadeWorker };
})();

/* ---------- P8 价值飞轮 ---------- */
const ValueFly = (function () {
  const root = document.getElementById("valueFly");
  const button = document.getElementById("valueFlyRun");
  const hint = document.getElementById("valueFlyHint");
  const nodes = root ? [...root.querySelectorAll("[data-value-node]")] : [];
  const rows = root ? [...root.querySelectorAll("[data-value-step]")] : [];
  const runner = root ? root.querySelector(".value-fly__runner") : null;
  if (!root || !button) return null;
  const labels = [
    "理解：把一句模糊感受收敛成本轮问题。",
    "调用记忆：唤醒已确认的视觉原则与历史反馈。",
    "编排：形成体验切片、验收标准并分配能力。",
    "执行：组织页面调查、实现与视觉验证。",
    "验证：用测试、截图和用户确认共同验收。",
    "沉淀记忆：保存经过验证的项目规则。",
    "反哺理解：下一轮不再从零开始。",
  ];
  const startDelay = 160;
  const stepDuration = 1200;
  const moveDuration = 450;
  const finishHold = 420;
  const totalDuration = startDelay + (labels.length - 1) * stepDuration + finishHold;
  let frame = 0;
  let running = false;
  let paused = false;
  let elapsed = 0;
  let lastTime = 0;
  let currentStep = -1;
  function renderProgress(degrees) {
    const angle = degrees * Math.PI / 180;
    root.style.setProperty("--fly-progress", degrees + "deg");
    if (runner) {
      runner.style.left = (50 + 48 * Math.sin(angle)) + "%";
      runner.style.top = (50 - 50 * Math.cos(angle)) + "%";
    }
  }
  function setStep(index) {
    // 六个环节顺时针推进；最后一步由“沉淀记忆”回到“理解”。
    const nodeMap = [0, 1, 2, 3, 4, 5, 0];
    const activeNode = nodeMap[index];
    nodes.forEach((n, i) => {
      n.classList.toggle("active", activeNode === i);
      n.classList.toggle("visited", index === 6 || (index >= 0 && i < activeNode));
    });
    rows.forEach((r, i) => r.classList.toggle("in", i <= index));
    root.classList.toggle("is-running", index >= 0);
    root.classList.toggle("is-returning", index === 6);
    root.dataset.flyStep = index < 0 ? "idle" : String(index);
    if (index >= 0 && hint) hint.textContent = labels[index];
  }
  function renderTimeline(time) {
    if (time < startDelay) return;
    const activeTime = time - startDelay;
    const settledStep = Math.min(labels.length - 1, Math.floor(activeTime / stepDuration));
    if (currentStep !== settledStep) {
      currentStep = settledStep;
      setStep(currentStep);
    }
    const phase = activeTime % stepDuration;
    const moveStart = stepDuration - moveDuration;
    const transitionProgress = settledStep >= labels.length - 1
      ? 0
      : Math.max(0, Math.min(1, (phase - moveStart) / moveDuration));
    renderProgress((settledStep + transitionProgress) * 60);
  }
  function finish() {
    renderProgress(360);
    root.classList.add("is-done");
    root.classList.remove("is-paused");
    running = false;
    paused = false;
    button.textContent = "↺ 再运行一次";
    if (hint) hint.textContent = "✓ 一轮协作完成；经过验证的记忆已经回到下一轮理解。";
  }
  function tick(now) {
    if (!running || paused) return;
    if (!lastTime) lastTime = now;
    elapsed += now - lastTime;
    lastTime = now;
    renderTimeline(elapsed);
    if (elapsed >= totalDuration) finish();
    else frame = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame);
    running = false; paused = false; elapsed = 0; lastTime = 0; currentStep = -1;
    root.classList.remove("is-running", "is-returning", "is-done", "is-paused");
    setStep(-1);
    renderProgress(0);
    button.textContent = "▶ 运行一轮协作";
    if (hint) hint.textContent = "点击后，沿圆环依次看完六个环节和一次反哺。";
  }
  function togglePause() {
    paused = !paused;
    root.classList.toggle("is-paused", paused);
    if (paused) {
      cancelAnimationFrame(frame);
      button.textContent = "▶ 继续";
      if (hint) hint.textContent = "⏸ 已暂停 · " + (labels[currentStep] || "准备开始");
    } else {
      lastTime = 0;
      button.textContent = "⏸ 暂停";
      if (hint && currentStep >= 0) hint.textContent = labels[currentStep];
      frame = requestAnimationFrame(tick);
    }
  }
  function run() {
    if (running) {
      togglePause();
      return;
    }
    if (root.classList.contains("is-done")) reset();
    running = true;
    button.textContent = "⏸ 暂停";
    frame = requestAnimationFrame(tick);
  }
  button.addEventListener("click", run);
  return { run, reset };
})();

/* ---------- P9 双泳道四阶段蓝图 ---------- */
const P9 = (function () {
  const grid = document.getElementById("bpGrid");
  if (!grid) return null;
  const buildBtn = document.getElementById("bpBuild");

  const phases = [
    { rn: "第一期 · 结构化", done: true, mem: "范围、类型、可信状态、载体分工与项目隔离", orch: "Manager 模式、两级路由、垂直切片、模型能力分层与主 Agent 验收", proof: "新对话能恢复脉络；每轮交付可独立验收" },
    { rn: "第二期 · 可观测、可评估", done: false, mem: "有界冷热记忆、混合检索、来源与可信度过滤", orch: "机器可读问题单与能力目录；路由追踪、质量 / 成本 / 失败评估", proof: "知道为何这样路由，并能用证据比较结果" },
    { rn: "第三期 · 可恢复、可续跑", done: false, mem: "原子记忆、关联 / 冲突 / 来源链与过期管理", orch: "持久任务图、检查点、人工暂停恢复、幂等执行与失败重规划", proof: "长任务跨会话继续，不重复成功步骤" },
    { rn: "第四期 · 记忆驱动、受治理", done: false, mem: "聚类、去重、陈旧检测与 Dream 式候选整理", orch: "记忆辅助意图预测、风险 / 能力选模、评估驱动的路由候选", proof: "候选可解释、可审阅、可拒绝、可回滚" },
  ];

  const cols = document.createElement("div");
  cols.className = "bp__cols";
  grid.appendChild(cols);
  const colEls = phases.map((p) => {
    const el = document.createElement("div");
    el.className = "bp__phase" + (p.done ? " bp__phase--done lit" : "");
    const tag = p.done
      ? '<span class="bp__tag bp__tag--done">✓ 已验证</span>'
      : '<span class="bp__tag bp__tag--route">路线</span>';
    el.innerHTML =
      `<div class="bp__ph"><b>${p.rn}</b>${tag}</div>` +
      `<div class="bp__cell bp__cell--mem"><span>记忆引擎</span><b>${p.mem}</b></div>` +
      `<div class="bp__cell bp__cell--orch"><span>编排引擎</span><b>${p.orch}</b></div>` +
      `<div class="bp__cell bp__cell--proof"><span>过闸证据</span><b>${p.proof}</b></div>`;
    cols.appendChild(el);
    return el;
  });

  // 重置到仅 Phase I 点亮(供演讲模式进入时用)
  function resetCols() {
    colEls.forEach((el, i) => { if (i > 0) el.classList.remove("lit"); });
  }
  // 手动逐列:litCol(1..3);Phase I 初始已亮
  function litCol(i) {
    if (i < 1 || i > 3) return;
    colEls[i].classList.add("lit");
    if (i === 3) {
      cols.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.015)" }, { transform: "scale(1)" }],
        { duration: 900, easing: "ease-out" }
      );
    }
  }
  let autoDone = false;
  function autoRun() {
    if (autoDone) return;
    autoDone = true;
    if (buildBtn) buildBtn.disabled = true;
    [1, 2, 3].forEach((idx, k) => setTimeout(() => {
      if (!inDeck()) litCol(idx);
    }, k * 800 + 300));
  }
  // 普通滚动模式:按钮点击 + 进入视口自动建成
  if (buildBtn) buildBtn.addEventListener("click", () => { if (!inDeck()) autoRun(); });
  return { litCol, autoRun, resetCols, buildBtn };
})();

/* ---------- 非 deck 模式:各页分步动画用 IO 自动触发 ---------- */
function observeAuto(elId, cb, threshold) {
  const el = typeof elId === "string" ? document.getElementById(elId) : elId;
  if (!el) return;
  const ob = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !inDeck()) { cb(); ob.unobserve(el); }
      });
    },
    { threshold: threshold || 0.35 }
  );
  ob.observe(el);
}
if (P3) observeAuto("archStack", P3.autoRun, 0.35);
if (P4) observeAuto("heroWheel", P4.autoRun, 0.4);
if (P6) observeAuto("orchWorker", () => setTimeout(() => {
  if (!inDeck()) P6.fadeWorker();
}, 1200), 0.4);
if (P9) observeAuto("bpGrid", P9.autoRun, 0.45);

/* ---------- P5/P6 小型演示：只展示一次最小闭环 ---------- */
function makeDemo({ button, log, steps, doneText, onStep, onDone }) {
  if (!button || !log) return null;
  let index = -1;
  const initialText = log.textContent;
  function reset() {
    index = -1;
    button.disabled = false;
    button.textContent = "▶ 第一步";
    log.classList.remove("is-running", "is-done");
    log.textContent = initialText;
    if (onStep) onStep(-1);
  }
  function run() {
    if (index >= steps.length - 1) { reset(); return; }
    index += 1;
    log.classList.remove("is-done");
    log.classList.add("is-running");
    log.textContent = steps[index];
    if (onStep) onStep(index);
    if (index === steps.length - 1) {
      log.textContent = doneText;
      log.classList.remove("is-running");
      log.classList.add("is-done");
      button.textContent = "↺ 重新开始";
      if (onDone) onDone();
    } else {
      button.textContent = `▶ 第${index + 2}步`;
    }
  }
  button.addEventListener("click", run);
  return { reset, run };
}

const MemoryDemo = makeDemo({
  button: document.getElementById("memoryDemoRun"),
  log: document.getElementById("memoryDemoLog"),
  steps: [
    "① 项目范围：只看当前项目的视觉问题记录。",
    "② 可信状态：优先已验证规则，跳过待复核旧猜测。",
    "③ 当前证据：用代码、截图与测试结果校对。",
    "④ 激活热记忆：把“间距与层级”带进本轮上下文。",
  ],
  doneText: "✓ 记忆被唤醒；任务结束后可形成候选，再重新降温。",
  onStep(index) {
    const graph = document.querySelector(".memory-demo__graph");
    const nodes = [...document.querySelectorAll("[data-memory-node]")];
    const edges = [...document.querySelectorAll("[data-memory-edge]")];
    if (graph) graph.classList.toggle("is-running", index >= 0);
    nodes.forEach((node, i) => node.classList.toggle("active", i === index));
    edges.forEach((edge, i) => edge.classList.toggle("active", i < index));
  },
  onDone() {
    const graph = document.querySelector(".memory-demo__graph");
    if (graph) graph.classList.add("is-done");
  },
});

const OrchDemo = makeDemo({
  button: document.getElementById("orchDemoRun"),
  log: document.getElementById("orchDemoLog"),
  steps: [
    "① 理解意图：这是体验问题，不先把它误写成 Bug。",
    "② 形成问题单：目标是层级清晰，验收是 1280×720 无滚动。",
    "③ 委派：Frontier 主控；Balanced 实现；Fast 做只读扫描。",
    "④ 回收证据：代码、测试、截图与运行结果一起返回。",
    "⑤ 主 Agent 审查：接受、退回或调整，最后统一交付。",
  ],
  doneText: "✓ 一次委派闭环完成；子 Agent 的完成不等于项目完成。",
  onStep(index) {
    const graph = document.querySelector(".orch-demo__graph");
    const nodes = [...document.querySelectorAll("[data-orch-node]")];
    const edges = [...document.querySelectorAll("[data-orch-edge]")];
    if (graph) graph.classList.toggle("is-running", index >= 0);
    const activeIndex = Math.min(index, nodes.length - 1);
    nodes.forEach((node, i) => node.classList.toggle("active", index >= nodes.length || i === activeIndex));
    edges.forEach((edge, i) => edge.classList.toggle("active", i < index));
  },
  onDone() {
    const graph = document.querySelector(".orch-demo__graph");
    if (graph) graph.classList.add("is-done");
  },
});

/* ==========================================================
   演讲模式:手动逐步 build
   ========================================================== */
(function deck() {
  const toggle = document.querySelector(".presentation-toggle");
  const ctrl = document.getElementById("deckCtrl");
  const numEl = document.getElementById("deckNum");
  const prevBtn = document.getElementById("deckPrev");
  const nextBtn = document.getElementById("deckNext");
  let on = false;
  let idx = 0;
  let step = 0; // 当前页已显示到第几个 build(0 = 只有标题/主句)

  // 每页的 build 分组:去重后的 data-build-step 排序数组
  function buildStepsOf(slide) {
    const set = new Set();
    slide.querySelectorAll("[data-build-step]").forEach((el) => set.add(+el.getAttribute("data-build-step")));
    return [...set].sort((a, b) => a - b);
  }
  // 每页最大 build 数(P9 特殊:蓝图三列 = 额外 3 步)
  function maxStepOf(i) {
    const slide = slides[i];
    if (slide.id === "p9") return 3; // Phase II/III/IV 三步(Phase I 初始已亮)
    const steps = buildStepsOf(slide);
    return steps.length ? steps[steps.length - 1] : 0;
  }

  // 显示某页到指定 step(step=0 只标题主句;>=1 显示对应 build 组)
  function applyStep(i, s) {
    const slide = slides[i];
    // 先让「无 build-step 的 reveal」立即出现(标题、主句)
    slide.querySelectorAll(".reveal").forEach((el) => {
      if (!el.closest("[data-build-step]") && !el.hasAttribute("data-build-step")) el.classList.add("in");
    });
    // 显示 <= s 的 build 组
    slide.querySelectorAll("[data-build-step]").forEach((el) => {
      const bs = +el.getAttribute("data-build-step");
      if (bs <= s) {
        el.classList.add("build-shown");
        el.querySelectorAll(".reveal").forEach((r) => r.classList.add("in"));
      }
    });
    // 触发该页分步动画到 step s
    triggerPageAnim(slide.id, s);
  }

  // 页内分步动画映射
  function triggerPageAnim(id, s) {
    if (id === "p3" && P3) { for (let k = 1; k <= s; k++) P3.litStep(k); }
    else if (id === "p4" && P4 && s >= 1) { P4.litAll(true); }
    else if (id === "p6" && P6 && s >= 3) { P6.fadeWorker(); }
    else if (id === "p9" && P9 && s >= 1) { for (let k = 1; k <= s; k++) P9.litCol(k); } // 累计点亮 Phase II/III/IV
  }

  function show(i) {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    step = 0;
    slides.forEach((s, k) => s.classList.toggle("deck-active", k === idx));
    const slide = slides[idx];
    // 重置本页 build 显示状态
    slide.querySelectorAll("[data-build-step]").forEach((el) => el.classList.remove("build-shown"));
    // 清除分步动画的 .lit 残留(普通模式滚动可能已触发),让 deck 从头分步
    if (slide.id === "p3") slide.querySelectorAll(".arch__layer,.arch__charter").forEach((el) => el.classList.remove("lit"));
    if (slide.id === "p4" && P4) P4.reset();
    if (slide.id === "p5" && MemoryDemo) MemoryDemo.reset();
    if (slide.id === "p6") slide.querySelectorAll(".orch__node--worker").forEach((el) => el.classList.remove("fade", "ready"));
    if (slide.id === "p6" && OrchDemo) OrchDemo.reset();
    if (slide.id === "p8" && ValueFly) ValueFly.reset();
    if (slide.id === "p9" && P9) P9.resetCols();
    slide.scrollTop = 0;
    applyStep(idx, 0);
    updateCounter();
  }

  function updateCounter() {
    const maxS = maxStepOf(idx);
    numEl.textContent = maxS
      ? `${idx + 1} / ${slides.length} · 步 ${step}/${maxS}`
      : `${idx + 1} / ${slides.length}`;
  }

  function advance() {
    const maxS = maxStepOf(idx);
    if (step < maxS) {
      step += 1;
      applyStep(idx, step);
      updateCounter();
    } else if (idx < slides.length - 1) {
      show(idx + 1);
    }
  }
  function back() {
    // 简化:回到上一页(整页显示,便于回看)
    if (idx > 0) {
      show(idx - 1);
      const maxS = maxStepOf(idx);
      step = maxS;
      applyStep(idx, maxS);
      updateCounter();
    }
  }

  function enter() {
    on = true;
    document.body.classList.add("deck");
    ctrl.hidden = false;
    toggle.textContent = "退出演讲";
    // 选当前视口中占据最多的页作为起点
    let cur = 0, best = -Infinity;
    const vh = window.innerHeight;
    slides.forEach((s, k) => {
      const r = s.getBoundingClientRect();
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible > best) { best = visible; cur = k; }
    });
    show(cur);
  }
  function exit() {
    on = false;
    document.body.classList.remove("deck");
    ctrl.hidden = true;
    toggle.textContent = "演讲模式";
    slides[idx].scrollIntoView();
  }

  toggle.addEventListener("click", () => (on ? exit() : enter()));
  nextBtn.addEventListener("click", advance);
  prevBtn.addEventListener("click", back);
  document.addEventListener("keydown", (e) => {
    if (!on) {
      if (e.key === "F5" || (e.key === "Enter" && e.shiftKey)) { e.preventDefault(); enter(); }
      return;
    }
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); advance(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); back(); }
    else if (e.key === "Escape") exit();
  });
})();
