const Matter = require("matter-js");
const Cutter = require("martinez-polygon-clipping");
const line = [[[1000, 300], [1000, 360], [-1000, 360], [-1000, 300], [1000, 300]]];

const Engine = Matter.Engine,
Render = Matter.Render,
World = Matter.World,
Bodies = Matter.Bodies,
Vertices = Matter.Vertices,
Bounds = Matter.Bounds,
Vector = Matter.Vector,
Composite = Matter.Composite;
const engine = Engine.create();
const render = Render.create({
element: document.body,
engine: engine
});

let OriginalPolygonRemoved = false;
const blockSize = 80;
Render.run(render);

const mouse = Matter.Mouse.create(render.canvas),
mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse
});

World.add(engine.world, mouseConstraint);
// 여러 폴리곤을 가진 복합체 생성

const compoundBody = Matter.Body.create({
    parts: [
        Matter.Bodies.rectangle(100, 100, 50, 50),
        Matter.Bodies.rectangle(150, 100, 50, 50),
        Matter.Bodies.rectangle(125, 50, 50, 50),
    ],
});

// 벽 생성
const wall = Bodies.rectangle(400, 400, 800, 20, {
isStatic: true,
render: {
    fillStyle: 'gray'
}
});

// 복합체와 벽을 세계에 추가
World.add(engine.world, [compoundBody, wall]);

// 마우스 클릭 이벤트
Matter.Events.on(mouseConstraint, 'mousedown', (event) => {

if (OriginalPolygonRemoved) {
    return;
}
World.remove(engine.world, compoundBody);
OriginalPolygonRemoved = true;
const bodyToAdd = [];
for (let i = 1; i < compoundBody.parts.length; i++) {
    const body = compoundBody.parts[i];
    const poly = verticesToGeometry(body);
    const cut = Cutter.diff(poly, line);
    console.log(cut);
    const cut1 = cut[0];
    const cut2 = cut[1];

    if (cut1) {
        bodyToAdd.push(createBody(cut1));
    }

    if (cut2) {
        bodyToAdd.push(createBody(cut2));
    }
}

World.add(engine.world, bodyToAdd);
});

function createBody(geometry) {
    if (!geometry) {
        return;
    }
    if (geometry[0].length < 4) {
        console.log(geometry);
        return;
    }
    points = [];
    geometry[0].pop();
    for (geo of geometry[0]) {
        points.push({
            x: geo[0],
            y: geo[1],
        })
    }
    console.log(points);
    return Bodies.fromVertices(Vertices.centre(points).x, Vertices.centre(points).y, points, {
        render: {fillStyle: 'blue'}
    });
}

function verticesToGeometry(body) {
    let vertices = Vertices.clockwiseSort(body.vertices.slice());
    vertices.push(vertices[0]);
    return [vertices.map(vertexToArray)];
}

function vertexToArray(vertex) {
    return [vertex.x, vertex.y];
}

function geoJsonToVectors(geometry) {
    if (!geometry) {
        console.error("geometry is null or undefined");
        return;
    }

    if (geometry.length !== 1) {
        console.error("invalid geometry");
        return;
    }

    const polygon = geometry[0];
    return polygon.map(mapToVector).pop();
}

function mapToVector(coord) {
    if (coord.length !== 2) {
        console.error("invalid coordinates");
        return;
    }

    return {x: coord[0], y: coord[1]};
}

Matter.Runner.run(engine);