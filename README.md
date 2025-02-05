### threejs_example
Demo exploring three JS

## Tools

Tools for the proejct are described below, toggle the active tool using the buttons in the upper left corner.

## Vertex editing

Modify the mesh shape by moving vertices along X-axis for selected object.

# How to use

Select an object, left-click on a vertex (displayed as red dots), move the mouse left/right to edit, left-click to finalize.

## Transform

Modifies object transform using the origin gizmo.

# How to use

Select an object, then left-click the origin point to begin moving the object, left-click to finalize the operation.

### Requirments

Requires Node.js and NPM to be installed, instructions can be found [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

### Automated package install and build

Run the 'launch.sh' bash script

bash <path_to_project>/launch.sh

### Manual package installation and build

From terminal in this folder install following package dependencies using npm

# three.js

 npm install --save three

# vite
 
 npm install --save-dev vite

# Build

Run vite to build project:

 npx vite

Open the locally hosted webpage

### Troubleshooting

Machine setting can prevent projects from being run/hosted locally. Make sure correct permissions are set to allow hosting on local machine.