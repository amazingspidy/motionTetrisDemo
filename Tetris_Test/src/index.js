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

let unionFind = new UnionFind(bodyToAdd);

for (let i = 0; i < bodyToAdd.length; i++) {
    for (let j = i + 1; j < bodyToAdd.length; j++) {
        let result = shouldCombine(bodyToAdd[i].vertices, bodyToAdd[j].vertices, 1);
        if (result) {
            unionFind.union(i, j);
        }
    }
}

const group = new Map();
for (let i = 0; i < bodyToAdd.length; i++) {
    let root = unionFind.find(i);
    if (group.get(root)) {
        group.get(root).push(bodyToAdd[i]);
    } else {
        group.set(root, []);
        group.get(root).push(bodyToAdd[i]);
    }
}
const realBodyToAdd = [];
console.log(group);
group.forEach((value) => {
    console.log("val", value);
    let add = Matter.Body.create({
        parts: value
    });
    realBodyToAdd.push(add);
})
World.add(engine.world, realBodyToAdd);
});

class UnionFind {
    constructor(elements) {
        this.count = elements.length;
        this.parent = [];
        for (let i = 0; i < this.count; i++) {
            this.parent[i] = i;
        }
    }

    union(a, b) {
        let rootA = this.find(a);
        let rootB = this.find(b);

        if (rootA === rootB) return;

        if (rootA < rootB) {
            if (this.parent[b] != b) this.union(this.parent[b], a);
            this.parent[b] = this.parent[a];
        } else {
            if (this.parent[a] != a) this.union(this.parent[a], b);
            this.parent[a] = this.parent[b];
        }
    }

    find(a) {
        while (this.parent[a] !== a) {
            a = this.parent[a];
        }
        return a;
    }

    connected(a, b) {
        return this.find(a) === this.find(b);
    }
}

function createBody(geometry) {
    const points = geoJsonToVectors(geometry);
    console.log(points, "point");
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

    const polygon = geometry[0].slice();
    polygon.pop();
    const result = polygon.map(mapToVector);
    return result;
}

function mapToVector(coord) {
    if (coord.length !== 2) {
        console.error("invalid coordinates");
        return;
    }

    return {x: coord[0], y: coord[1]};
}

function calculateDistance(point1, point2) {
    let dx = point1.x - point2.x;
    let dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function shouldCombine(body1, body2, maxDistance) {
    for (let i = 0; i < body1.length; i++) {
        for (let j = 0; j < body2.length; j++) {
            let distance = calculateDistance(body1[i], body2[j]);
            if (distance <= maxDistance) {
                return true;
            }
        }
    }
    return false;
}

Matter.Runner.run(engine);