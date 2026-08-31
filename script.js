"use strict";

(function initializeTriageApplication(global) {
  const GRADE_META = Object.freeze({
    1: Object.freeze({ name: "즉시소생", color: "빨강" }),
    2: Object.freeze({ name: "매우위급", color: "주황" }),
    3: Object.freeze({ name: "응급", color: "노랑" }),
    4: Object.freeze({ name: "준응급", color: "초록" }),
    5: Object.freeze({ name: "비응급", color: "파랑" }),
  });

  const NORMAL_RANGES = Object.freeze({
    temperature: Object.freeze({ label: "체온", min: 36, max: 37.5, displayMin: 34, displayMax: 42, unit: "℃" }),
    pulse: Object.freeze({ label: "맥박", min: 60, max: 100, displayMin: 0, displayMax: 180, unit: "회/분" }),
    respiration: Object.freeze({ label: "호흡", min: 12, max: 20, displayMin: 0, displayMax: 40, unit: "회/분" }),
    systolicBP: Object.freeze({ label: "위혈압", min: 90, max: 140, displayMin: 0, displayMax: 200, unit: "mmHg" }),
    spo2: Object.freeze({ label: "산소포화도", min: 95, max: 100, displayMin: 0, displayMax: 100, unit: "%" }),
    pain: Object.freeze({ label: "통증", min: 0, max: 3, displayMin: 0, displayMax: 10, unit: "/ 10" }),
  });

  const INPUT_LIMITS = Object.freeze({
    age: Object.freeze({ label: "나이", min: 0, max: 120, integer: true }),
    temperature: Object.freeze({ label: "체온", min: 0, max: 50, integer: false }),
    pulse: Object.freeze({ label: "맥박", min: 0, max: 300, integer: false }),
    respiration: Object.freeze({ label: "호흡수", min: 0, max: 100, integer: false }),
    systolic: Object.freeze({ label: "위혈압", min: 0, max: 300, integer: false }),
    diastolic: Object.freeze({ label: "아래혈압", min: 0, max: 300, integer: false }),
    spo2: Object.freeze({ label: "산소포화도", min: 0, max: 100, integer: false }),
    pain: Object.freeze({ label: "통증점수", min: 0, max: 10, integer: true }),
  });

  const CONSCIOUSNESS_LEVELS = Object.freeze(["명료", "혼란", "혼미", "무반응"]);
  const VITAL_KEYS = Object.freeze(["temperature", "pulse", "respiration", "systolicBP", "spo2", "pain"]);

  function hasNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function classifyPatient(patient) {
    if (!patient || typeof patient !== "object") {
      throw new TypeError("환자 정보 객체가 필요합니다.");
    }

    const levelOneReasons = [];
    if (patient.consciousness === "무반응") {
      levelOneReasons.push("의식수준이 무반응으로 1단계 기준에 해당합니다.");
    }
    if (patient.pulse < 40) {
      levelOneReasons.push(`맥박이 ${patient.pulse}회/분으로 40 미만입니다.`);
    } else if (patient.pulse > 140) {
      levelOneReasons.push(`맥박이 ${patient.pulse}회/분으로 140 초과입니다.`);
    }
    if (patient.respiration < 8) {
      levelOneReasons.push(`호흡수가 ${patient.respiration}회/분으로 8 미만입니다.`);
    } else if (patient.respiration > 30) {
      levelOneReasons.push(`호흡수가 ${patient.respiration}회/분으로 30 초과입니다.`);
    }
    if (patient.systolicBP < 80) {
      levelOneReasons.push(`위혈압이 ${patient.systolicBP}mmHg로 80 미만입니다.`);
    }
    if (patient.spo2 < 90) {
      levelOneReasons.push(`산소포화도가 ${patient.spo2}%로 90 미만입니다.`);
    }
    if (levelOneReasons.length > 0) {
      return makeClassification(1, levelOneReasons);
    }

    const levelTwoReasons = [];
    if (patient.consciousness === "혼란" || patient.consciousness === "혼미") {
      levelTwoReasons.push(`의식수준이 ${patient.consciousness} 상태로 2단계 기준에 해당합니다.`);
    }
    if (patient.pulse >= 110 && patient.pulse <= 140) {
      levelTwoReasons.push(`맥박이 ${patient.pulse}회/분으로 110~140 범위입니다.`);
    }
    if (patient.respiration >= 24 && patient.respiration <= 30) {
      levelTwoReasons.push(`호흡수가 ${patient.respiration}회/분으로 24~30 범위입니다.`);
    }
    if (patient.systolicBP >= 80 && patient.systolicBP <= 90) {
      levelTwoReasons.push(`위혈압이 ${patient.systolicBP}mmHg로 80~90 범위입니다.`);
    }
    if (patient.spo2 >= 90 && patient.spo2 < 94) {
      levelTwoReasons.push(`산소포화도가 ${patient.spo2}%로 90 이상 94 미만입니다.`);
    }
    if (levelTwoReasons.length > 0) {
      return makeClassification(2, levelTwoReasons);
    }

    const levelThreeReasons = [];
    if (patient.temperature >= 38) {
      levelThreeReasons.push(`체온이 ${patient.temperature}℃로 38 이상입니다.`);
    }
    if (patient.pulse >= 96 && patient.pulse < 110) {
      levelThreeReasons.push(`맥박이 ${patient.pulse}회/분으로 96 이상 110 미만입니다.`);
    }
    if (patient.respiration >= 20 && patient.respiration < 24) {
      levelThreeReasons.push(`호흡수가 ${patient.respiration}회/분으로 20 이상 24 미만입니다.`);
    }
    if (patient.spo2 >= 94 && patient.spo2 < 96) {
      levelThreeReasons.push(`산소포화도가 ${patient.spo2}%로 94 이상 96 미만입니다.`);
    }
    if (levelThreeReasons.length > 0) {
      return makeClassification(3, levelThreeReasons);
    }

    const levelFourReasons = [];
    if (patient.pulse >= 80 && patient.pulse < 96) {
      levelFourReasons.push(`맥박이 ${patient.pulse}회/분으로 80 이상 96 미만입니다.`);
    }
    if (patient.respiration >= 16 && patient.respiration < 20) {
      levelFourReasons.push(`호흡수가 ${patient.respiration}회/분으로 16 이상 20 미만입니다.`);
    }
    if (levelFourReasons.length > 0) {
      return makeClassification(4, levelFourReasons);
    }

    return makeClassification(5, ["1~4단계의 어떤 조건에도 해당하지 않아 5단계로 분류합니다."]);
  }

  function makeClassification(grade, reasons) {
    const meta = GRADE_META[grade];
    return Object.freeze({
      grade,
      gradeName: meta.name,
      label: `${grade}단계 ${meta.name}`,
      reasons: Object.freeze(reasons.slice()),
      reason: reasons.join(" "),
    });
  }

  function isWithinNormalRange(key, value) {
    const range = NORMAL_RANGES[key];
    return Boolean(range && hasNumber(value) && value >= range.min && value <= range.max);
  }

  function maskKoreanName(name) {
    const characters = Array.from(String(name || ""));
    if (characters.length < 3) {
      return characters.length === 2 ? `${characters[0]}○` : String(name || "");
    }
    return `${characters[0]}${"○".repeat(characters.length - 2)}${characters[characters.length - 1]}`;
  }

  function compareAnswer(patient, result) {
    const matches = Number(patient.answerGrade) === result.grade;
    return Object.freeze({
      matches,
      message: matches ? "규칙과 일치" : "규칙 재검토 필요",
    });
  }

  function validateManualInput(rawValues) {
    const source = rawValues || {};
    const errors = {};
    const parsed = {};

    Object.keys(INPUT_LIMITS).forEach(function validateField(key) {
      const config = INPUT_LIMITS[key];
      const raw = source[key];
      const text = raw === null || raw === undefined ? "" : String(raw).trim();

      if (text === "") {
        errors[key] = `${config.label}을(를) 입력해 주세요.`;
        return;
      }

      const value = Number(text);
      if (!Number.isFinite(value)) {
        errors[key] = `${config.label}은(는) 숫자로 입력해 주세요.`;
        return;
      }
      if (value < config.min || value > config.max) {
        errors[key] = `${config.label}은(는) ${config.min}~${config.max} 범위로 입력해 주세요.`;
        return;
      }
      if (config.integer && !Number.isInteger(value)) {
        errors[key] = `${config.label}은(는) 정수로 입력해 주세요.`;
        return;
      }
      parsed[key] = value;
    });

    const consciousness = source.consciousness === null || source.consciousness === undefined
      ? ""
      : String(source.consciousness).trim();
    if (!CONSCIOUSNESS_LEVELS.includes(consciousness)) {
      errors.consciousness = "의식수준을 목록에서 선택해 주세요.";
    }

    if (!errors.systolic && !errors.diastolic && parsed.diastolic > parsed.systolic) {
      const relationError = "아래혈압은 위혈압보다 클 수 없습니다.";
      errors.systolic = relationError;
      errors.diastolic = relationError;
    }

    const valid = Object.keys(errors).length === 0;
    const values = valid
      ? Object.freeze({
          id: "MANUAL",
          name: "직접 입력",
          age: parsed.age,
          sex: "미입력",
          symptom: "직접 입력 사례",
          consciousness,
          temperature: parsed.temperature,
          pulse: parsed.pulse,
          respiration: parsed.respiration,
          systolicBP: parsed.systolic,
          diastolicBP: parsed.diastolic,
          spo2: parsed.spo2,
          pain: parsed.pain,
        })
      : null;

    return Object.freeze({ valid, values, errors: Object.freeze(errors) });
  }

  const publicApi = {
    GRADE_META,
    NORMAL_RANGES,
    INPUT_LIMITS,
    CONSCIOUSNESS_LEVELS,
    classifyPatient,
    isWithinNormalRange,
    maskKoreanName,
    compareAnswer,
    validateManualInput,
  };

  global.TriageApp = Object.freeze(publicApi);

  if (typeof document === "undefined") {
    return;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function formatNumber(value, decimals) {
    if (!Number.isFinite(value)) {
      return "--";
    }
    if (decimals === 1) {
      return value.toFixed(1);
    }
    return String(Math.round(value));
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text !== undefined && text !== null) {
      element.textContent = text;
    }
    return element;
  }

  class MonitorController {
    constructor(canvas, elements) {
      this.canvas = canvas;
      this.context = canvas ? canvas.getContext("2d") : null;
      this.elements = elements;
      this.patient = null;
      this.liveVitals = null;
      this.buffers = {
        ecg: new Float32Array(1),
        respiration: new Float32Array(1),
        spo2: new Float32Array(1),
      };
      this.phases = { ecg: 0, respiration: 0, spo2: 0 };
      this.visibleSeconds = 5;
      this.sampleRate = 60;
      this.sampleAccumulator = 0;
      this.lastFrame = 0;
      this.lastFastUpdate = 0;
      this.lastBloodPressureUpdate = 0;
      this.lastTemperatureUpdate = 0;
      this.frameRequest = null;
      this.running = false;
      this.cssWidth = 0;
      this.cssHeight = 0;
      this.reducedMotionQuery = typeof global.matchMedia === "function"
        ? global.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false };
      this.boundFrame = this.frame.bind(this);
      this.boundResize = this.resize.bind(this);
      this.boundMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
      this.requested = false;
      this.resizeObserver = typeof ResizeObserver === "function" && canvas
        ? new ResizeObserver(this.boundResize)
        : null;

      if (this.resizeObserver) {
        this.resizeObserver.observe(canvas);
      } else if (typeof global.addEventListener === "function") {
        global.addEventListener("resize", this.boundResize);
      }
      if (typeof this.reducedMotionQuery.addEventListener === "function") {
        this.reducedMotionQuery.addEventListener("change", this.boundMotionPreferenceChange);
      } else if (typeof this.reducedMotionQuery.addListener === "function") {
        this.reducedMotionQuery.addListener(this.boundMotionPreferenceChange);
      }
    }

    setPatient(patient) {
      this.patient = patient;
      this.liveVitals = {
        pulse: patient.pulse,
        respiration: patient.respiration,
        spo2: patient.spo2,
        systolicBP: patient.systolicBP,
        diastolicBP: patient.diastolicBP,
        temperature: patient.temperature,
        pain: patient.pain,
      };
      this.phases = { ecg: 0, respiration: 0, spo2: 0 };
      this.sampleAccumulator = 0;
      this.resize(true);
      this.updateReadings();
      this.updateAlert();
      this.draw();
    }

    start() {
      this.requested = true;
      if (this.running || !this.patient || document.hidden) {
        return;
      }
      if (this.reducedMotionQuery.matches) {
        this.running = false;
        this.primeStaticWaveforms();
        this.updateReadings();
        this.draw();
        return;
      }
      this.running = true;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.lastFrame = now;
      this.lastFastUpdate = now;
      this.lastBloodPressureUpdate = now;
      this.lastTemperatureUpdate = now;
      this.frameRequest = global.requestAnimationFrame(this.boundFrame);
    }

    stop() {
      this.requested = false;
      this.haltFrame();
    }

    haltFrame() {
      this.running = false;
      if (this.frameRequest !== null) {
        global.cancelAnimationFrame(this.frameRequest);
        this.frameRequest = null;
      }
    }

    destroy() {
      this.stop();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      } else if (typeof global.removeEventListener === "function") {
        global.removeEventListener("resize", this.boundResize);
      }
      if (typeof this.reducedMotionQuery.removeEventListener === "function") {
        this.reducedMotionQuery.removeEventListener("change", this.boundMotionPreferenceChange);
      } else if (typeof this.reducedMotionQuery.removeListener === "function") {
        this.reducedMotionQuery.removeListener(this.boundMotionPreferenceChange);
      }
    }

    handleMotionPreferenceChange(event) {
      const reduce = Boolean(event && event.matches);
      if (reduce) {
        this.haltFrame();
        this.primeStaticWaveforms();
        this.updateReadings();
        this.draw();
      } else if (this.requested && !document.hidden) {
        this.start();
      }
    }

    resize(force) {
      if (!this.canvas || !this.context) {
        return;
      }
      const width = Math.floor(this.canvas.clientWidth || 0);
      const height = Math.floor(this.canvas.clientHeight || 0);
      if (width <= 0 || height <= 0) {
        return;
      }
      if (!force && width === this.cssWidth && height === this.cssHeight) {
        return;
      }

      this.cssWidth = width;
      this.cssHeight = height;
      const pixelRatio = clamp(global.devicePixelRatio || 1, 1, 3);
      this.canvas.width = Math.max(1, Math.round(width * pixelRatio));
      this.canvas.height = Math.max(1, Math.round(height * pixelRatio));
      this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      this.visibleSeconds = clamp(width / 120, 3, 8);
      const sampleCount = Math.max(180, Math.round(this.visibleSeconds * this.sampleRate));
      this.buffers = {
        ecg: new Float32Array(sampleCount),
        respiration: new Float32Array(sampleCount),
        spo2: new Float32Array(sampleCount),
      };
      this.draw();
    }

    frame(timestamp) {
      if (!this.running) {
        return;
      }

      if (this.reducedMotionQuery.matches) {
        this.haltFrame();
        this.primeStaticWaveforms();
        this.updateReadings();
        this.draw();
        return;
      }

      const elapsed = clamp(timestamp - this.lastFrame, 0, 100);
      this.lastFrame = timestamp;
      this.resize(false);
      this.updateLiveValues(timestamp, false);
      this.sampleAccumulator += (elapsed / 1000) * this.sampleRate;
      const samplesToAdd = Math.floor(this.sampleAccumulator);
      for (let index = 0; index < samplesToAdd; index += 1) {
        this.pushWaveSample();
        this.sampleAccumulator -= 1;
      }
      this.draw();

      this.frameRequest = global.requestAnimationFrame(this.boundFrame);
    }

    updateLiveValues(timestamp, reducedMotion) {
      if (!this.liveVitals || !this.patient || reducedMotion) {
        return;
      }

      let changed = false;
      if (timestamp - this.lastFastUpdate >= 1000) {
        this.lastFastUpdate = timestamp;
        this.liveVitals.pulse = this.jitter("pulse", 1, 3, 0);
        this.liveVitals.respiration = this.jitter("respiration", 1, 2, 0);
        this.liveVitals.spo2 = this.jitter("spo2", 0.2, 1, 1, 0, 100);
        changed = true;
      }
      if (timestamp - this.lastBloodPressureUpdate >= 9000) {
        this.lastBloodPressureUpdate = timestamp;
        this.liveVitals.systolicBP = this.jitter("systolicBP", 1, 3, 0);
        this.liveVitals.diastolicBP = this.jitter("diastolicBP", 1, 2, 0);
        changed = true;
      }
      if (timestamp - this.lastTemperatureUpdate >= 15000) {
        this.lastTemperatureUpdate = timestamp;
        this.liveVitals.temperature = this.jitter("temperature", 0.1, 0.2, 1, 0, 50);
        changed = true;
      }
      if (changed) {
        this.updateReadings();
      }
    }

    jitter(key, step, radius, decimals, absoluteMin, absoluteMax) {
      const baseline = this.patient[key];
      if (baseline === 0) {
        return 0;
      }
      const current = this.liveVitals[key];
      const direction = Math.random() < 0.5 ? -1 : 1;
      const minimum = Math.max(absoluteMin === undefined ? -Infinity : absoluteMin, baseline - radius);
      const maximum = Math.min(absoluteMax === undefined ? Infinity : absoluteMax, baseline + radius);
      const next = clamp(current + direction * step, minimum, maximum);
      const factor = 10 ** decimals;
      return Math.round(next * factor) / factor;
    }

    pushWaveSample() {
      if (!this.patient || !this.liveVitals) {
        return;
      }

      const pulse = this.liveVitals.pulse;
      const respiration = this.liveVitals.respiration;
      this.phases.ecg = this.advancePhase(this.phases.ecg, pulse);
      this.phases.spo2 = this.advancePhase(this.phases.spo2, pulse);
      this.phases.respiration = this.advancePhase(this.phases.respiration, respiration);

      const ecgValue = this.patient.pulse === 0 ? 0 : this.ecgSample(this.phases.ecg);
      const respirationValue = this.patient.respiration === 0 ? 0 : Math.sin(this.phases.respiration * Math.PI * 2);
      const spo2Value = this.patient.pulse === 0 || this.patient.spo2 === 0 ? 0 : this.plethSample(this.phases.spo2);

      this.shiftBuffer(this.buffers.ecg, ecgValue);
      this.shiftBuffer(this.buffers.respiration, respirationValue);
      this.shiftBuffer(this.buffers.spo2, spo2Value);
    }

    advancePhase(phase, ratePerMinute) {
      if (ratePerMinute <= 0) {
        return phase;
      }
      return (phase + ratePerMinute / 60 / this.sampleRate) % 1;
    }

    gaussian(phase, center, width, amplitude) {
      const rawDistance = Math.abs(phase - center);
      const distance = Math.min(rawDistance, 1 - rawDistance);
      return amplitude * Math.exp(-(distance * distance) / (2 * width * width));
    }

    ecgSample(phase) {
      return (
        this.gaussian(phase, 0.16, 0.025, 0.12) +
        this.gaussian(phase, 0.35, 0.012, -0.16) +
        this.gaussian(phase, 0.39, 0.009, 1) +
        this.gaussian(phase, 0.43, 0.014, -0.32) +
        this.gaussian(phase, 0.66, 0.06, 0.27)
      );
    }

    plethSample(phase) {
      const primary = Math.exp(-phase * 4.6);
      const notch = this.gaussian(phase, 0.28, 0.026, -0.16);
      return primary + notch - 0.16;
    }

    shiftBuffer(buffer, value) {
      if (buffer.length > 1) {
        buffer.copyWithin(0, 1);
      }
      buffer[buffer.length - 1] = value;
    }

    primeStaticWaveforms() {
      const sampleCount = this.buffers.ecg.length;
      for (let index = 0; index < sampleCount; index += 1) {
        this.pushWaveSample();
      }
    }

    draw() {
      if (!this.context || this.cssWidth <= 0 || this.cssHeight <= 0) {
        return;
      }
      const context = this.context;
      const width = this.cssWidth;
      const height = this.cssHeight;
      context.clearRect(0, 0, width, height);

      const tracks = [
        { key: "ecg", label: "ECG", color: "#6df29a", amplitude: 0.34 },
        { key: "respiration", label: "RESP", color: "#f5dc64", amplitude: 0.24 },
        { key: "spo2", label: "SpO₂", color: "#62d9f6", amplitude: 0.3 },
      ];
      const trackHeight = height / tracks.length;

      tracks.forEach((track, trackIndex) => {
        const centerY = trackHeight * (trackIndex + 0.5);
        context.save();
        context.strokeStyle = track.color;
        context.lineWidth = 1.8;
        context.lineJoin = "round";
        context.shadowColor = track.color;
        context.shadowBlur = 5;
        context.beginPath();
        const buffer = this.buffers[track.key];
        for (let index = 0; index < buffer.length; index += 1) {
          const x = buffer.length === 1 ? 0 : (index / (buffer.length - 1)) * width;
          const y = centerY - buffer[index] * trackHeight * track.amplitude;
          if (index === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
        context.restore();

        context.save();
        context.fillStyle = track.color;
        context.font = "700 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.fillText(track.label, 10, trackHeight * trackIndex + 18);
        context.restore();
      });

      context.save();
      context.font = "800 13px -apple-system, BlinkMacSystemFont, sans-serif";
      if (this.patient && this.patient.pulse === 0) {
        context.fillStyle = "#ff6464";
        context.fillText("ASYSTOLE", Math.max(10, width - 92), 22);
      }
      if (this.patient && this.patient.respiration === 0) {
        context.fillStyle = "#ff6464";
        context.fillText("APNEA", Math.max(10, width - 72), trackHeight + 22);
      }
      context.fillStyle = "#617a76";
      context.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillText(`${this.visibleSeconds.toFixed(1)}초`, Math.max(10, width - 38), height - 8);
      context.restore();

      if (this.canvas && this.patient) {
        const labels = [];
        if (this.patient.pulse === 0) labels.push("심전도 평선, ASYSTOLE");
        if (this.patient.respiration === 0) labels.push("호흡 평선, APNEA");
        const suffix = labels.length ? `, ${labels.join(", ")}` : "";
        this.canvas.setAttribute("aria-label", `심전도, 호흡, 산소포화도 파형${suffix}`);
      }
    }

    updateAlert() {
      const alertElement = this.elements.alert;
      if (!alertElement || !this.patient) {
        return;
      }
      alertElement.classList.remove("is-danger", "is-warning");
      if (this.patient.pulse === 0) {
        alertElement.textContent = "ASYSTOLE · 즉시 심폐소생술 확인";
        alertElement.classList.add("is-danger");
        return;
      }
      if (this.patient.respiration === 0) {
        alertElement.textContent = "APNEA · 즉시 호흡 확인";
        alertElement.classList.add("is-danger");
        return;
      }

      const classification = classifyPatient(this.patient);
      if (classification.grade === 1) {
        alertElement.textContent = `긴급 경고 · ${classification.reasons[0]}`;
        alertElement.classList.add("is-danger");
      } else if (classification.grade === 2) {
        alertElement.textContent = "주의 · 매우 위급한 상태";
        alertElement.classList.add("is-warning");
      } else if (classification.grade === 3) {
        alertElement.textContent = "관찰 필요 · 응급 상태";
        alertElement.classList.add("is-warning");
      } else {
        alertElement.textContent = "파형 감시 중";
      }
    }

    updateReadings() {
      if (!this.liveVitals) {
        return;
      }
      const values = this.liveVitals;
      this.setReading("pulse", formatNumber(values.pulse, 0), !isWithinNormalRange("pulse", values.pulse));
      this.setReading("spo2", formatNumber(values.spo2, 1), !isWithinNormalRange("spo2", values.spo2));
      this.setReading(
        "respiration",
        formatNumber(values.respiration, 0),
        !isWithinNormalRange("respiration", values.respiration),
      );
      this.setReading(
        "bloodPressure",
        `${formatNumber(values.systolicBP, 0)}/${formatNumber(values.diastolicBP, 0)}`,
        !isWithinNormalRange("systolicBP", values.systolicBP),
      );
      this.setReading(
        "temperature",
        formatNumber(values.temperature, 1),
        !isWithinNormalRange("temperature", values.temperature),
      );
      this.setReading("pain", formatNumber(values.pain, 0), !isWithinNormalRange("pain", values.pain));
    }

    setReading(key, text, danger) {
      const output = this.elements[key];
      if (!output) {
        return;
      }
      output.textContent = text;
      const container = output.closest(".monitor-value");
      if (container) {
        container.classList.toggle("is-danger", danger);
      }
    }
  }

  function initializeDom() {
    const patients = global.TriageData && Array.isArray(global.TriageData.patients)
      ? global.TriageData.patients
      : [];
    const elements = {
      patientTab: document.getElementById("tab-patients"),
      manualTab: document.getElementById("tab-manual"),
      patientPanel: document.getElementById("panel-patients"),
      manualPanel: document.getElementById("panel-manual"),
      patientList: document.getElementById("patient-list"),
      patientHeading: document.getElementById("patient-heading"),
      patientDetails: document.getElementById("patient-details"),
      vitalBars: document.getElementById("vital-bars"),
      judgeButton: document.getElementById("judge-patient"),
      patientResult: document.getElementById("patient-result"),
      manualForm: document.getElementById("manual-form"),
      manualErrorSummary: document.getElementById("manual-error-summary"),
      manualResult: document.getElementById("manual-result"),
      canvas: document.getElementById("monitor-canvas"),
      monitorAlert: document.getElementById("monitor-alert"),
      monitorPulse: document.getElementById("monitor-pulse"),
      monitorSpo2: document.getElementById("monitor-spo2"),
      monitorRespiration: document.getElementById("monitor-respiration"),
      monitorBloodPressure: document.getElementById("monitor-blood-pressure"),
      monitorTemperature: document.getElementById("monitor-temperature"),
      monitorPain: document.getElementById("monitor-pain"),
    };

    const requiredElements = [
      "patientTab",
      "manualTab",
      "patientPanel",
      "manualPanel",
      "patientList",
      "patientHeading",
      "patientDetails",
      "vitalBars",
      "judgeButton",
      "patientResult",
      "manualForm",
      "manualResult",
      "canvas",
    ];
    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      console.error(`필수 화면 요소를 찾을 수 없습니다: ${missingElements.join(", ")}`);
      return;
    }

    if (patients.length === 0) {
      elements.patientList.replaceChildren(
        createElement("p", "loading-message", "환자 데이터를 불러오지 못했습니다."),
      );
      elements.patientList.setAttribute("aria-busy", "false");
      return;
    }

    const state = {
      activeTab: "patients",
      selectedPatientId: patients[0].id,
    };

    const monitor = new MonitorController(elements.canvas, {
      alert: elements.monitorAlert,
      pulse: elements.monitorPulse,
      spo2: elements.monitorSpo2,
      respiration: elements.monitorRespiration,
      bloodPressure: elements.monitorBloodPressure,
      temperature: elements.monitorTemperature,
      pain: elements.monitorPain,
    });

    function currentPatient() {
      return patients.find((patient) => patient.id === state.selectedPatientId) || patients[0];
    }

    function renderPatientList() {
      const fragment = document.createDocumentFragment();
      patients.forEach((patient) => {
        const result = classifyPatient(patient);
        const button = createElement("button", "patient-button");
        button.type = "button";
        button.dataset.patientId = patient.id;
        button.setAttribute("aria-current", String(patient.id === state.selectedPatientId));
        button.setAttribute(
          "aria-label",
          `${patient.id}, ${maskKoreanName(patient.name)}, ${patient.age}세 ${patient.sex}, 규칙 결과 ${result.label}`,
        );

        const marker = createElement("span", "patient-marker", patient.id.replace("P-", "#"));
        const identity = createElement("span", "patient-identity");
        identity.append(
          createElement("span", "patient-name", maskKoreanName(patient.name)),
          createElement("span", "patient-meta", `${patient.age}세 · ${patient.sex} · ${result.label}`),
        );
        const dot = createElement("span", `grade-dot grade-${result.grade}`);
        dot.dataset.grade = String(result.grade);
        dot.setAttribute("aria-hidden", "true");
        button.append(marker, identity, dot);
        button.addEventListener("click", () => selectPatient(patient.id));
        fragment.append(button);
      });
      elements.patientList.replaceChildren(fragment);
      elements.patientList.setAttribute("aria-busy", "false");
    }

    function selectPatient(patientId) {
      if (!patients.some((patient) => patient.id === patientId)) {
        return;
      }
      state.selectedPatientId = patientId;
      const patient = currentPatient();
      elements.patientList.querySelectorAll(".patient-button").forEach((button) => {
        const selected = button.dataset.patientId === patientId;
        button.setAttribute("aria-current", String(selected));
        button.classList.toggle("is-selected", selected);
      });
      renderPatient(patient);
      elements.patientResult.hidden = true;
      elements.patientResult.replaceChildren();
      monitor.setPatient(patient);
      if (state.activeTab === "patients") {
        monitor.start();
      }
    }

    function renderPatient(patient) {
      elements.patientHeading.textContent = `${patient.id.replace("P-", "#")} ${maskKoreanName(patient.name)}`;
      const details = [
        ["나이 · 성별", `${patient.age}세 · ${patient.sex}`, false],
        ["의식수준", patient.consciousness, false],
        ["증상", patient.symptom, true],
        ["체온", `${patient.temperature}℃`, false],
        ["맥박", `${patient.pulse}회/분`, false],
        ["호흡수", `${patient.respiration}회/분`, false],
        ["혈압", `${patient.systolicBP}/${patient.diastolicBP}mmHg`, false],
        ["산소포화도", `${patient.spo2}%`, false],
        ["통증점수", `${patient.pain}/10`, false],
      ];
      const fragment = document.createDocumentFragment();
      details.forEach(([label, value, wide]) => {
        const wrapper = createElement("div", wide ? "detail-wide" : "");
        wrapper.append(createElement("dt", "", label), createElement("dd", "", value));
        fragment.append(wrapper);
      });
      elements.patientDetails.replaceChildren(fragment);
      renderVitalBars(patient);
      elements.judgeButton.disabled = false;
    }

    function renderVitalBars(patient) {
      const fragment = document.createDocumentFragment();
      VITAL_KEYS.forEach((key) => {
        const range = NORMAL_RANGES[key];
        const value = patient[key];
        const span = range.displayMax - range.displayMin;
        const normalStart = ((range.min - range.displayMin) / span) * 100;
        const normalWidth = ((range.max - range.min) / span) * 100;
        const markerPosition = clamp(((value - range.displayMin) / span) * 100, 0, 100);
        const normal = isWithinNormalRange(key, value);

        const row = createElement("div", "vital-bar-row");
        const label = createElement("div", "vital-label", range.label);
        label.append(createElement("small", "", `정상 ${range.min}~${range.max}${range.unit}`));

        const track = createElement("div", "vital-bar-track");
        track.setAttribute("role", "img");
        track.setAttribute(
          "aria-label",
          `${range.label} ${value}${range.unit}, 정상범위 ${range.min}에서 ${range.max}${range.unit}, ${normal ? "정상범위" : "정상범위 밖"}`,
        );
        track.style.setProperty("--normal-start", `${normalStart}%`);
        track.style.setProperty("--normal-width", `${normalWidth}%`);
        track.style.setProperty("--marker-position", `${markerPosition}%`);
        const normalBand = createElement("span", "vital-normal");
        normalBand.setAttribute("aria-hidden", "true");
        const marker = createElement("span", `vital-marker${normal ? "" : " is-danger"}`);
        marker.setAttribute("aria-hidden", "true");
        track.append(normalBand, marker);

        const reading = createElement("div", `vital-reading${normal ? "" : " is-danger"}`, `${value}${range.unit}`);
        reading.append(createElement("small", "", "판단에 쓰는 값"));
        row.append(label, track, reading);
        fragment.append(row);
      });
      elements.vitalBars.replaceChildren(fragment);
    }

    function renderResult(container, result, patient) {
      container.className = `result-panel${container === elements.manualResult ? " manual-result" : ""} grade-${result.grade}`;
      container.dataset.grade = String(result.grade);

      const header = createElement("div", "result-header");
      const badge = createElement("span", "grade-badge", result.label);
      const title = createElement("h3", "", `${result.gradeName} 단계로 판단했습니다`);
      title.id = container === elements.manualResult ? "manual-result-title" : "patient-result-title";
      header.append(badge, title);

      const reasonHeading = createElement("h4", "", "판단 이유");
      const reasonList = createElement("ul", "result-reasons");
      result.reasons.forEach((reason) => reasonList.append(createElement("li", "", reason)));
      const children = [header, reasonHeading, reasonList];

      if (patient && Object.prototype.hasOwnProperty.call(patient, "answerGrade")) {
        const comparison = compareAnswer(patient, result);
        const answerMeta = GRADE_META[patient.answerGrade];
        const comparisonElement = createElement(
          "p",
          `answer-comparison ${comparison.matches ? "is-match" : "is-mismatch"}`,
          `정답 ${patient.answerGrade}단계 ${answerMeta.name} · ${comparison.message}`,
        );
        children.push(comparisonElement);
      }

      container.replaceChildren(...children);
      container.hidden = false;
    }

    function activateTab(tabName, moveFocus) {
      const showPatients = tabName === "patients";
      state.activeTab = showPatients ? "patients" : "manual";
      elements.patientTab.setAttribute("aria-selected", String(showPatients));
      elements.manualTab.setAttribute("aria-selected", String(!showPatients));
      elements.patientTab.tabIndex = showPatients ? 0 : -1;
      elements.manualTab.tabIndex = showPatients ? -1 : 0;
      elements.patientPanel.hidden = !showPatients;
      elements.manualPanel.hidden = showPatients;
      if (showPatients) {
        monitor.resize(true);
        monitor.start();
      } else {
        monitor.stop();
      }
      if (moveFocus) {
        (showPatients ? elements.patientTab : elements.manualTab).focus();
      }
    }

    const tabs = [elements.patientTab, elements.manualTab];
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(index === 0 ? "patients" : "manual", false));
      tab.addEventListener("keydown", (event) => {
        let targetIndex = index;
        if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") targetIndex = 0;
        else if (event.key === "End") targetIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(targetIndex === 0 ? "patients" : "manual", true);
      });
    });

    elements.judgeButton.addEventListener("click", () => {
      const patient = currentPatient();
      renderResult(elements.patientResult, classifyPatient(patient), patient);
      elements.patientResult.focus({ preventScroll: true });
      elements.patientResult.scrollIntoView({ behavior: "auto", block: "nearest" });
    });

    function clearManualErrors() {
      Object.keys(INPUT_LIMITS).concat("consciousness").forEach((key) => {
        const field = document.getElementById(`manual-${key}`);
        const error = document.getElementById(`manual-${key}-error`);
        if (field) field.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
      });
      if (elements.manualErrorSummary) {
        elements.manualErrorSummary.hidden = true;
        elements.manualErrorSummary.textContent = "";
      }
    }

    elements.manualForm.addEventListener("input", (event) => {
      const target = event.target;
      if (!target || !target.id || !target.id.startsWith("manual-")) {
        return;
      }
      target.removeAttribute("aria-invalid");
      const error = document.getElementById(`${target.id}-error`);
      if (error) error.textContent = "";
    });

    elements.manualForm.addEventListener("submit", (event) => {
      event.preventDefault();
      clearManualErrors();
      const formData = new FormData(elements.manualForm);
      const rawValues = {};
      formData.forEach((value, key) => {
        rawValues[key] = value;
      });
      const validation = validateManualInput(rawValues);
      if (!validation.valid) {
        const errorKeys = Object.keys(validation.errors);
        errorKeys.forEach((key) => {
          const field = document.getElementById(`manual-${key}`);
          const error = document.getElementById(`manual-${key}-error`);
          if (field) field.setAttribute("aria-invalid", "true");
          if (error) error.textContent = validation.errors[key];
        });
        elements.manualResult.hidden = true;
        if (elements.manualErrorSummary) {
          elements.manualErrorSummary.textContent = `입력값 ${errorKeys.length}개를 확인해 주세요.`;
          elements.manualErrorSummary.hidden = false;
        }
        const firstInvalidField = document.getElementById(`manual-${errorKeys[0]}`);
        if (firstInvalidField) firstInvalidField.focus();
        return;
      }
      renderResult(elements.manualResult, classifyPatient(validation.values), null);
      elements.manualResult.focus({ preventScroll: true });
      elements.manualResult.scrollIntoView({ behavior: "auto", block: "nearest" });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden || state.activeTab !== "patients") {
        monitor.stop();
      } else {
        monitor.start();
      }
    });
    global.addEventListener("pagehide", (event) => {
      if (event.persisted) {
        monitor.stop();
      } else {
        monitor.destroy();
      }
    });
    global.addEventListener("pageshow", (event) => {
      if (event.persisted && state.activeTab === "patients") {
        monitor.resize(true);
        monitor.start();
      }
    });

    renderPatientList();
    selectPatient(patients[0].id);

    const summaries = patients.map((patient) => ({ patient, result: classifyPatient(patient) }));
    const gradeCounts = summaries.reduce((counts, entry) => {
      counts[entry.result.grade] += 1;
      return counts;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const emptyReasons = summaries.filter((entry) => entry.result.reason.trim() === "");
    const mismatches = summaries
      .filter((entry) => entry.result.grade !== entry.patient.answerGrade)
      .map((entry) => entry.patient.id);
    console.info("응급환자 분류 데이터 점검", { gradeCounts, emptyReasons: emptyReasons.length, mismatches });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDom, { once: true });
  } else {
    initializeDom();
  }
})(globalThis);
