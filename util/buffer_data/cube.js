export default {
    vertices: [
        -0.5, -0.5,  0.5, // front-top-left
        -0.5,  0.5,  0.5, // front-bot-left
        0.5, -0.5,  0.5,  // front-top-right
        0.5,  0.5,  0.5,  // front-bot-right

        -0.5, -0.5, -0.5, // back-top-left
        -0.5,  0.5, -0.5, // back-bot-left
        0.5, -0.5, -0.5,  // back-top-right
        0.5,  0.5, -0.5,  // back-bot-right    
    ],
    vertex_colors: [
        0.2, 0.2, 0.2,
        0.8, 0.2, 0.2,
        0.2, 0.8, 0.2,
        0.2, 0.2, 0.8,
        0.2, 0.8, 0.8,
        0.8, 0.2, 0.8,
        0.8, 0.8, 0.2,
        0.8, 0.8, 0.8 
    ],
    indices: [
        0, 1, 2,  1, 2, 3, // front
        4, 5, 6,  5, 6, 7, // back
        0, 1, 4,  1, 4, 5, // left
        2, 3, 6,  3, 6, 7, // right
        0, 4, 6,  0, 2, 6, // top
        1, 5, 7,  1, 3, 7  // bottom        
    ]
}