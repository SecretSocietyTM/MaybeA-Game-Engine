export default `
precision mediump float;

varying vec4 v_clr;

void main() {
    gl_FragColor = v_clr;
}
`