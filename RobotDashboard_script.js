// ============ Robot state ============
let motorA = 0;          // -100..100 (negative = backward)
let motorB = 0;          // -100..100
let gripperStatus = 0;   // 1 = open, 0 = closed
let objectInGrip = 0;    // 1 = yes, 0 = no
let rangefinder = [10, 10, 10, 10, 10, 10, 10, 10]; // 10..80 cm, 8 units
let gripHeight = 0;      // 0..100 cm

// ============ Scene ============
const CW = 1284;     // sprite width
const CH = 588;      // sprite height
const R_ROBOT = 189; // robot radius: beams start here (px)
const MAX_R = 285;   // max distance for hit point from center (px)

// Beam directions in degrees (0 = right, +90 = down)
// up, up-right, right, down-right, down, down-left, left, up-left
const ANGLES = [-90, -45, 0, 45, 90, 135, 180, 225];

// ============ Init ============
let stage;
let platformLayer, wheelArrowL, wheelArrowR, vectorLayer, stageInfo;
const lines = [];   // thin sight lines
const hits = [];    // "rangefinder sees object" dots

function initScene() {
    stage = document.getElementById('robotStage');
    if (!stage) return;

    platformLayer = document.getElementById('platformLayer');
    wheelArrowL = document.getElementById('wheelArrowL');
    wheelArrowR = document.getElementById('wheelArrowR');
    vectorLayer = document.getElementById('vectorLayer');
    stageInfo = document.getElementById('stageInfo');

    ANGLES.forEach(function (ang, i) {
        // Sight line (starts at robot edge)
        const ln = document.createElement('div');
        ln.className = 'beam-line';
        ln.style.transform = 'rotate(' + ang + 'deg)';
        stage.appendChild(ln);
        lines.push(ln);

        // Hit dot (visible when rangefinder sees something)
        const h = document.createElement('img');
        h.className = 'hit-dot';
        h.src = 'img/laser_dot_counter.png';
        stage.appendChild(h);
        hits.push(h);
    });
    updateScene();
}

// ============ Update scene ============
function updateScene() {
    if (!stage) return;

    platformLayer.src = gripperStatus === 1 ? 'img/platform.png' : 'img/platform_closed_grap.png';

    setWheelArrow(wheelArrowL, motorA);
    setWheelArrow(wheelArrowR, motorB);

    updateVector();

    for (let i = 0; i < 8; i++) {
        const val = rangefinder[i];
        const rad = ANGLES[i] * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        // hit point distance from center
        const dist = R_ROBOT + 20 + (val - 10) / 70 * (MAX_R - R_ROBOT - 20);
        const px = CW / 2 + cos * dist;
        const py = CH / 2 + sin * dist;
        // line start: robot edge
        const sx = CW / 2 + cos * R_ROBOT;
        const sy = CH / 2 + sin * R_ROBOT;

        lines[i].style.left = (sx / CW * 100) + '%';
        lines[i].style.top = (sy / CH * 100) + '%';
        lines[i].style.width = Math.max(0, (dist - R_ROBOT) / CW * 100) + '%';

        hits[i].style.display = (val >= 80) ? 'none' : 'block';
        hits[i].style.left = (px / CW * 100) + '%';
        hits[i].style.top = (py / CH * 100) + '%';
    }

    if (stageInfo) {
        stageInfo.textContent = IconStrings.objInGrip + (objectInGrip ? IconStrings.yes : IconStrings.no)
            + IconStrings.height + gripHeight + IconStrings.cm;
    }
}

// Russian texts via unicode escapes (encoding-safe)
const IconStrings = {
    objInGrip: '\u041e\u0431\u044a\u0435\u043a\u0442 \u0432 \u0437\u0430\u0445\u0432\u0430\u0442\u0435: ',
    yes: '\u0435\u0441\u0442\u044c',
    no: '\u043d\u0435\u0442',
    height: '  \u2022  \u0412\u044b\u0441\u043e\u0442\u0430 \u0441\u0445\u0432\u0430\u0442\u0430: ',
    cm: ' \u0441\u043c'
};

function setWheelArrow(el, v) {
    if (!el) return;
    if (v === 0) { el.style.display = 'none'; return; }
    el.src = (v > 0) ? 'img/arrow_up.png' : 'img/arrow_down.png';
    el.style.display = 'block';
}

function updateVector() {
    const A = Math.sign(motorA);
    const B = Math.sign(motorB);
    let file = null;

    if (A !== 0 || B !== 0) {
        if (A === 0) {
            file = B > 0 ? 'img/velocity_summ_vector_rotate_left.png' : 'img/velocity_summ_vector_rotate_right.png';
        } else if (B === 0) {
            file = A > 0 ? 'img/velocity_summ_vector_rotate_right.png' : 'img/velocity_summ_vector_rotate_left.png';
        } else if (A === B) {
            const ma = Math.abs(motorA), mb = Math.abs(motorB);
            if (A > 0) {
                file = (ma === mb) ? 'img/velocity_summ_vector_up.png'
                    : (ma > mb ? 'img/velocity_summ_vector_up_left.png' : 'img/velocity_summ_vector_up_right.png');
            } else {
                file = (ma === mb) ? 'img/velocity_summ_vector_down.png'
                    : (ma > mb ? 'img/velocity_summ_vector_down_left.png' : 'img/velocity_summ_vector_down_right.png');
            }
        } else {
            file = A > 0 ? 'img/velocity_summ_vector_rotate_right.png' : 'img/velocity_summ_vector_rotate_left.png';
        }
    }

    if (file) {
        vectorLayer.src = file;
        vectorLayer.style.display = 'block';
    } else {
        vectorLayer.style.display = 'none';
    }
}

// ============ Sliders to variables ============
const SLIDERS = [
    ['motorA', 'motorAValue',  () => motorA],
    ['motorB', 'motorBValue',  () => motorB],
    ['rangefinder1', 'rangefinder1Value', () => rangefinder[0]],
    ['rangefinder2', 'rangefinder2Value', () => rangefinder[1]],
    ['rangefinder3', 'rangefinder3Value', () => rangefinder[2]],
    ['rangefinder4', 'rangefinder4Value', () => rangefinder[3]],
    ['rangefinder5', 'rangefinder5Value', () => rangefinder[4]],
    ['rangefinder6', 'rangefinder6Value', () => rangefinder[5]],
    ['rangefinder7', 'rangefinder7Value', () => rangefinder[6]],
    ['rangefinder8', 'rangefinder8Value', () => rangefinder[7]],
    ['gripHeight', 'gripHeightValue', () => gripHeight]
];

function setValue(idVal, val) {
    switch (idVal) {
        case 'motorA': motorA = val; break;
        case 'motorB': motorB = val; break;
        case 'gripHeight': gripHeight = val; break;
        default:
            const m = idVal.match(/^rangefinder(\d)$/);
            if (m) rangefinder[Number(m[1]) - 1] = val;
    }
}

function init() {
    initScene();

    SLIDERS.forEach(function (s) {
        const el = document.getElementById(s[0]);
        const out = document.getElementById(s[1]);
        if (!el || !out) return;
        el.value = s[2]();
        el.addEventListener('input', function () {
            const v = Number(el.value);
            setValue(s[0], v);
            out.textContent = v;
            updateScene();
        });
    });

    bindSelect('gripperStatus', function (v) { gripperStatus = v; });
    bindSelect('objectInGrip', function (v) { objectInGrip = v; });
}

function bindSelect(idSel, setter) {
    const el = document.getElementById(idSel);
    if (!el) return;
    setter(Number(el.value));
    el.addEventListener('change', function () {
        setter(Number(el.value));
        updateScene();
    });
}

document.addEventListener('DOMContentLoaded', init);
