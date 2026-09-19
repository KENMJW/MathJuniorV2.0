const fs = require('fs');
const file = 'src/modules/sandbox/LeapLab.tsx';
let content = fs.readFileSync(file, 'utf8');

// The LeapLab currently renders:
// 1. Header (Model title, tags)
// 2. 4 controls in a grid
// 3. SandboxRenderer in the center
// 4. MathRenderer at the bottom

// We need to change it to:
// <div style={{flex: 1, display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '1rem'}}>
//   <div className="canvas-container" style={{flex: 1, background: '#0f172a', ...}}>
//     <SandboxRenderer ... />
//     <BottomBar ... />
//   </div>
//   <div className="console-container" style={{width: 300}}>
//     Controls (Carrier, Parameter, Posture, Camouflage) + Invariants
//   </div>
// </div>

const newLayout = `
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768; // simple fallback

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isDesktop ? 'row' : 'column', gap: '1rem', minHeight: 0, height: '100%' }}>
      {/* 中部核心画布 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
        {/* X-Ray 骨架透视 HUD 图层 */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            background: morphState.xrayActive ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-pill)',
            border: morphState.xrayActive ? '1px solid var(--ios-blue)' : '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: morphState.xrayActive ? 'var(--ios-blue)' : 'var(--text-tertiary)', boxShadow: morphState.xrayActive ? '0 0 8px var(--ios-blue)' : 'none' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: morphState.xrayActive ? 'white' : 'var(--text-secondary)' }}>
            {morphState.xrayActive ? 'X-Ray 透视已激活' : 'X-Ray (关)'}
          </span>
          <button
            onClick={handleToggleXray}
            style={{
              marginLeft: '0.5rem',
              background: morphState.xrayActive ? 'var(--ios-blue)' : 'transparent',
              border: morphState.xrayActive ? 'none' : '1px solid var(--text-tertiary)',
              color: morphState.xrayActive ? 'white' : 'var(--text-secondary)',
              padding: '0.15rem 0.6rem',
              borderRadius: '12px',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            {morphState.xrayActive ? '关闭' : '开启'}
          </button>
        </div>

        <SandboxRenderer
          key={compiledSandboxConfig.sandbox_id}
          config={compiledSandboxConfig}
          onInvariantsChange={() => {}} // leap lab does not strictly need this yet if it uses other ways, but can add if needed
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
        />

        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', borderRadius: '12px', padding: '0.8rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem' }}>
             <Icon name="bulb" size={16} style={{marginRight: '0.4rem'}} />
             <strong>探究指南：</strong> {locale === 'en' ? currentModel.model_brief_en : currentModel.model_brief_zh}
          </div>
          <button style={{ background: 'var(--ios-blue)', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', cursor: 'pointer', fontWeight: 600 }}>下一步 ▸</button>
        </div>
      </div>

      {/* 右侧 4D 控制台 */}
      <div style={{ width: isDesktop ? '320px' : '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>4D 控制台</h3>
        
        {carrierSpec.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>① 载体变异 (Carrier)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {carrierSpec.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectCarrier(opt.id)}
                  style={{
                    border: morphState.carrierId === opt.id ? '1.5px solid var(--ios-blue)' : '1px solid rgba(0,0,0,0.1)',
                    background: morphState.carrierId === opt.id ? 'var(--ios-blue)' : 'var(--glass-bg-elevated)',
                    color: morphState.carrierId === opt.id ? 'white' : 'var(--text-primary)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: morphState.carrierId === opt.id ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {locale === 'en' ? opt.nameEn : opt.nameZh}
                </button>
              ))}
            </div>
          </div>
        )}

        {parameterSpec.sliders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>② 参数变异 (Parameter)</span>
            {parameterSpec.sliders.map((slider) => {
              const val = morphState.parameterValues[slider.id] ?? slider.default;
              return (
                <div key={slider.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{locale === 'en' ? slider.nameEn : slider.nameZh}:</span>
                    <span style={{ fontWeight: 700, color: 'var(--ios-blue)' }}>{val}{slider.unit || ''}</span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={val}
                    onChange={(e) => handleSliderChange(slider.id, parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'white' }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {postureSpec.modes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>③ 姿态变异 (Posture)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {postureSpec.modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSelectPosture(mode.id)}
                  style={{
                    border: morphState.postureId === mode.id ? '1.5px solid var(--ios-indigo)' : '1px solid rgba(0,0,0,0.1)',
                    background: morphState.postureId === mode.id ? 'var(--ios-indigo)' : 'var(--glass-bg-elevated)',
                    color: morphState.postureId === mode.id ? 'white' : 'var(--text-primary)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: morphState.postureId === mode.id ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {locale === 'en' ? mode.nameEn : mode.nameZh}
                </button>
              ))}
            </div>
          </div>
        )}

        {camouflageSpec.distractorLayers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>④ 干扰加壳 (Camouflage)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {camouflageSpec.distractorLayers.map((layer) => {
                const active = morphState.activeCamouflageIds.includes(layer.id);
                return (
                  <button
                    key={layer.id}
                    type="button"
                    disabled={morphState.xrayActive}
                    onClick={() => handleToggleCamouflage(layer.id)}
                    style={{
                      border: active ? '1px solid rgba(0,0,0,0.2)' : '1px dashed rgba(0,0,0,0.15)',
                      background: active ? 'var(--bg-card-hover)' : 'var(--glass-bg-elevated)',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      cursor: morphState.xrayActive ? 'not-allowed' : 'pointer',
                      opacity: morphState.xrayActive ? 0.4 : 1,
                    }}
                  >
                    <Icon name={active ? 'eye' : 'eye-off'} size={13} />
                    <span style={{marginLeft: 4}}>{locale === 'en' ? layer.nameEn : layer.nameZh}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
`;

const returnRegex = /return \([\s\S]*?\);\n\};\n/m;
content = content.replace(returnRegex, newLayout + '\n};\n');
fs.writeFileSync(file, content);
