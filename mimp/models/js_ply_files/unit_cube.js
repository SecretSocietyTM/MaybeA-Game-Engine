export default `
ply
format ascii 1.0
comment Created in Blender version 4.3.0
element vertex 8
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
property uchar alpha
element face 12
property list uchar uint vertex_indices
end_header
-1 1 1 203 51 203 255
-1 -1 1 203 127 64 255
-1 1 -1 51 203 203 255
-1 -1 -1 203 203 51 255
1 1 1 203 51 51 255
1 -1 1 51 51 51 255
1 1 -1 51 203 51 255
1 -1 -1 51 51 203 255
3 4 2 0
3 2 7 3
3 6 5 7
3 1 7 5
3 0 3 1
3 4 1 5
3 4 6 2
3 2 6 7
3 6 4 5
3 1 3 7
3 0 2 3
3 4 0 1

`