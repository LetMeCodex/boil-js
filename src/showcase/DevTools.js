import confetti from 'canvas-confetti';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { getExperimentByKey, EXPERIMENTS } from '../engine/ExperimentRegistry.js';

/**
 * ============================================================================
 * DEV TOOLS & EXPERIMENT DEVELOPER SUITE
 * ============================================================================
 * Manages [INSPECT], [VIEW SOURCE], [COPY PROMPT], [REMIX THIS], and [FULLSCREEN].
 * Derives directly from canonical ExperimentRegistry.
 */

async function copyTextToClipboard(text) {
  if (!text) return false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {}
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    return false;
  }
}

export class DevTools {
  static init() {
    this.createModalDOM();
    this.bindModalCloseEvents();
  }

  static createModalDOM() {
    if (document.getElementById('boil-devtools-modals')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'boil-devtools-modals';
    modalContainer.innerHTML = `
      <!-- INSPECTOR MODAL -->
      <div id="modal-inspector" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title" id="inspector-title">EXPERIMENT INSPECTOR</div>
            <button class="dev-modal-close" aria-label="Close modal">&times;</button>
          </div>
          <div class="dev-modal-body">
            <div class="inspector-grid" id="inspector-details">
              <!-- Dynamically populated -->
            </div>
          </div>
          <div class="dev-modal-footer">
            <button class="tactile-btn outline dev-modal-close">Close</button>
            <button class="tactile-btn amber" id="btn-inspector-copy-spec">📋 Copy Specification</button>
          </div>
        </div>
      </div>

      <!-- SOURCE CODE MODAL -->
      <div id="modal-source" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card wide">
          <div class="dev-modal-header">
            <div class="dev-modal-title" id="source-title">SOURCE CODE</div>
            <button class="dev-modal-close" aria-label="Close modal">&times;</button>
          </div>
          <div class="dev-modal-body">
            <pre class="code-snippet-wrap"><code id="source-code-content">// Loading...</code></pre>
          </div>
          <div class="dev-modal-footer">
            <button class="tactile-btn outline dev-modal-close">Close</button>
            <button class="tactile-btn amber" id="btn-copy-code"><span>📋 Copy Code</span></button>
          </div>
        </div>
      </div>

      <!-- PROMPT MODAL -->
      <div id="modal-prompt" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title" id="prompt-title">AGENT PROMPT & ARCHITECTURE SPEC</div>
            <button class="dev-modal-close" aria-label="Close modal">&times;</button>
          </div>
          <div class="dev-modal-body">
            <div class="prompt-text-wrap" id="prompt-text-content">
              <!-- Dynamically populated -->
            </div>
          </div>
          <div class="dev-modal-footer">
            <button class="tactile-btn outline dev-modal-close">Close</button>
            <button class="tactile-btn amber" id="btn-copy-prompt"><span>✨ Copy Prompt</span></button>
          </div>
        </div>
      </div>

      <!-- REMIX MODAL -->
      <div id="modal-remix" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title" id="remix-title">REMIX EXPERIMENT PARAMETERS</div>
            <button class="dev-modal-close" aria-label="Close modal">&times;</button>
          </div>
          <div class="dev-modal-body">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
              Inject custom turbulence, chaotic turbulence fields, and alternate palettes into this live experiment.
            </p>
            <div class="control-group">
              <div class="control-label-row">
                <span>Remix Turbulence Multiplier:</span>
                <span id="val-remix-intensity" class="control-val">1.5x</span>
              </div>
              <input type="range" id="slider-remix-intensity" min="0.2" max="3.0" step="0.1" value="1.5" class="custom-range">
            </div>
          </div>
          <div class="dev-modal-footer">
            <button class="tactile-btn outline dev-modal-close">Cancel</button>
            <button class="tactile-btn primary" id="btn-apply-remix">⚡ Apply Live Remix</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const slider = document.getElementById('slider-remix-intensity');
    const val = document.getElementById('val-remix-intensity');
    slider?.addEventListener('input', (e) => {
      if (val) val.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
    });
  }

  static getSpec(key) {
    const exp = getExperimentByKey(key) || EXPERIMENTS[0];
    return exp.spec;
  }

  static openInspector(key) {
    const exp = getExperimentByKey(key) || EXPERIMENTS[0];
    const spec = exp.spec;
    document.getElementById('inspector-title').textContent = `INSPECT // ${spec.title}`;

    const grid = document.getElementById('inspector-details');
    grid.innerHTML = `
      <div class="spec-row">
        <div class="spec-label">EXPERIMENT</div>
        <div class="spec-value">${exp.title} (${exp.key})</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">RENDERING ENGINE</div>
        <div class="spec-value">${spec.engine}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">CORE LIBRARIES</div>
        <div class="spec-value">${spec.libraries}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">PARTICLES / GEOMETRY</div>
        <div class="spec-value">${spec.particles}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">RENDER MODE</div>
        <div class="spec-value">${spec.renderMode}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">USER INPUT</div>
        <div class="spec-value">${spec.input}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">PHYSICS / SHADERS</div>
        <div class="spec-value">${spec.physics}</div>
      </div>
      <div class="spec-row">
        <div class="spec-label">RUNTIME TUNING</div>
        <div class="spec-value">${spec.parameters}</div>
      </div>
    `;

    const copyBtn = document.getElementById('btn-inspector-copy-spec');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const specStr = `// ${spec.title}\nEngine: ${spec.engine}\nLibraries: ${spec.libraries}\nParticles: ${spec.particles}\nPhysics: ${spec.physics}\nParameters: ${spec.parameters}`;
        const success = await copyTextToClipboard(specStr);
        copyBtn.textContent = success ? 'COPIED ✓' : 'COPY FAILED';
        SoundFX.playPop(success ? 700 : 300);
        if (success) confetti({ particleCount: 20, spread: 45 });
        setTimeout(() => { copyBtn.textContent = '📋 Copy Specification'; }, 2000);
      };
    }

    DevTools.showModal('modal-inspector');
    SoundFX.playPop(520);
  }

  static openSource(key) {
    const spec = DevTools.getSpec(key);
    document.getElementById('source-title').textContent = `SOURCE // ${spec.title}`;
    document.getElementById('source-code-content').textContent = spec.sourceCode || 'SOURCE NOT AVAILABLE';

    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const success = await copyTextToClipboard(spec.sourceCode);
        copyBtn.innerHTML = `<span>${success ? 'COPIED ✓' : 'COPY FAILED'}</span>`;
        SoundFX.playPop(success ? 700 : 300);
        if (success) confetti({ particleCount: 20, spread: 45 });
        setTimeout(() => { copyBtn.innerHTML = '<span>📋 Copy Code</span>'; }, 2000);
      };
    }

    DevTools.showModal('modal-source');
    SoundFX.playPop(550);
  }

  static openPrompt(key) {
    const spec = DevTools.getSpec(key);
    document.getElementById('prompt-title').textContent = `PROMPT // ${spec.title}`;
    document.getElementById('prompt-text-content').textContent = spec.prompt || 'PROMPT NOT AVAILABLE';

    const copyBtn = document.getElementById('btn-copy-prompt');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const success = await copyTextToClipboard(spec.prompt);
        copyBtn.innerHTML = `<span>${success ? 'PROMPT COPIED ✓' : 'COPY FAILED'}</span>`;
        SoundFX.playPop(success ? 750 : 300);
        if (success) confetti({ particleCount: 25, spread: 50 });
        setTimeout(() => { copyBtn.innerHTML = '<span>✨ Copy Prompt</span>'; }, 2000);
      };
    }

    DevTools.showModal('modal-prompt');
    SoundFX.playPop(580);
  }

  static openRemix(key, sceneInstance) {
    const spec = DevTools.getSpec(key);
    document.getElementById('remix-title').textContent = `REMIX // ${spec.title}`;

    const applyBtn = document.getElementById('btn-apply-remix');
    if (applyBtn) {
      applyBtn.onclick = () => {
        const intensity = parseFloat(document.getElementById('slider-remix-intensity')?.value || 1.5);
        if (sceneInstance && typeof sceneInstance.setTurbulence === 'function') {
          sceneInstance.setTurbulence(intensity);
        } else if (sceneInstance && typeof sceneInstance.setSpeed === 'function') {
          sceneInstance.setSpeed(intensity);
        }
        SoundFX.playHarmonicChord();
        confetti({ particleCount: 30, spread: 60 });
        DevTools.hideModals();
      };
    }

    DevTools.showModal('modal-remix');
    SoundFX.playPop(520);
  }

  static toggleFullscreen(targetElement) {
    if (!targetElement) return;
    if (!document.fullscreenElement) {
      targetElement.requestFullscreen?.().catch(() => {});
      SoundFX.playPop(600);
    } else {
      document.exitFullscreen?.().catch(() => {});
      SoundFX.playPop(480);
    }
  }

  static showModal(id) {
    DevTools.hideModals();
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  static hideModals() {
    document.querySelectorAll('.dev-modal-backdrop').forEach(m => {
      m.style.display = 'none';
    });
  }

  static bindModalCloseEvents() {
    document.querySelectorAll('.dev-modal-close').forEach(btn => {
      btn.addEventListener('click', () => DevTools.hideModals());
    });

    document.querySelectorAll('.dev-modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) DevTools.hideModals();
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') DevTools.hideModals();
    });
  }
}
