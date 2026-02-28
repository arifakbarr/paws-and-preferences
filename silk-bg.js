(function () {
  'use strict';

  function hexToNormalizedRGB(hex) {
    hex = hex.replace('#', '');
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }

  var vertexShader = [
    'varying vec2 vUv;',
    'varying vec3 vPosition;',
    'void main() {',
    '  vPosition = position;',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var fragmentShader = [
    'varying vec2 vUv;',
    'varying vec3 vPosition;',
    'uniform float uTime;',
    'uniform vec3  uColor;',
    'uniform float uSpeed;',
    'uniform float uScale;',
    'uniform float uRotation;',
    'uniform float uNoiseIntensity;',
    'const float e = 2.71828182845904523536;',
    'float noise(vec2 texCoord) {',
    '  float G = e;',
    '  vec2  r = (G * sin(G * texCoord));',
    '  return fract(r.x * r.y * (1.0 + texCoord.x));',
    '}',
    'vec2 rotateUvs(vec2 uv, float angle) {',
    '  float c = cos(angle);',
    '  float s = sin(angle);',
    '  mat2  rot = mat2(c, -s, s, c);',
    '  return rot * uv;',
    '}',
    'void main() {',
    '  float rnd        = noise(gl_FragCoord.xy);',
    '  vec2  uv         = rotateUvs(vUv * uScale, uRotation);',
    '  vec2  tex        = uv * uScale;',
    '  float tOffset    = uSpeed * uTime;',
    '  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);',
    '  float pattern = 0.6 +',
    '    0.4 * sin(5.0 * (tex.x + tex.y +',
    '      cos(3.0 * tex.x + 5.0 * tex.y) +',
    '      0.02 * tOffset) +',
    '      sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));',
    '  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;',
    '  col.a = 1.0;',
    '  gl_FragColor = col;',
    '}'
  ].join('\n');

  var container = document.getElementById('silk-bg');
  if (!container || typeof THREE === 'undefined') return;

  var width = container.clientWidth;
  var height = container.clientHeight;
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  var color = '#2d1b4e';
  var rgb = hexToNormalizedRGB(color);
  var uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) },
    uSpeed: { value: 5 },
    uScale: { value: 1 },
    uRotation: { value: 0 },
    uNoiseIntensity: { value: 1.5 }
  };

  var geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthWrite: false
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value += 0.1 * clock.getDelta();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    width = container.clientWidth;
    height = container.clientHeight;
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);
})();
