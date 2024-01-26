const Matter = require("matter-js");
const Cutter = require("martinez-polygon-clipping");
const UpperBound = 330;
const LowerBound = 300;
const line = [[[10000, LowerBound], [10000, UpperBound], [-10000, UpperBound], [-10000, LowerBound], [10000, LowerBound]]];
const lineVertices = [
    { x: 10000, y: 0 },
    { x: 10000, y: UpperBound - LowerBound },
    { x: -10000, y: UpperBound - LowerBound },
    { x: -10000, y: 0 }
];
  
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
engine: engine,
options: {
    wireframes: false
}
});

Render.run(render);
const nonCollidableLine = Matter.Bodies.fromVertices(0, LowerBound + (UpperBound - LowerBound) / 2, [lineVertices], {
    isStatic: true, // Make the body static (not affected by physics)
    collisionFilter: {
      category: 0x0000, // Set a category that does not collide with any other category
      mask: 0x0000 // Set a mask that does not collide with any other category
    },
    render: {
        fillStyle: 'purple'
    },
    label: "line"
  });
Matter.World.add(engine.world, nonCollidableLine);
const mouse = Matter.Mouse.create(render.canvas),
mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse
});
document.addEventListener('keydown', (e) => {
    const key = e.key;
    console.log(key);
    let bodies = Composite.allBodies(engine.world).filter((body) => {
        if (body.label === "line") {
            return false;
        } else if (body.label === "wall") {
            return false;
        }
        return true;
    });

    switch (key) {
        case 'c':
            bodies.forEach((body) => {
                removeLines(body);
            })
        
            console.log("len:", Composite.allBodies(engine.world).length);
        case 'a':
            let sum = 0;
            bodies.forEach((body) => {
                sum += calculateLineArea(body);
            });
            console.log(sum);
    }
});
World.add(engine.world, mouseConstraint);
// 여러 폴리곤을 가진 복합체 생성

const compoundBody = Matter.Body.create({
    parts: [
        Matter.Bodies.rectangle(100, 100, 50, 50, {
            render: {
                fillStyle: 'blue'
            }
        }),
        Matter.Bodies.rectangle(150, 100, 50, 50, {
            render: {
                fillStyle: 'red'
            }
        }),
        Matter.Bodies.rectangle(200, 100, 50, 50, {
            render: {
                fillStyle: 'yellow'
            }
        }),
        Matter.Bodies.rectangle(150, 50, 50, 50, {
            render: {
                fillStyle: 'green'
            }
        }),
    ],
});

// 벽 생성
const wall = Bodies.rectangle(400, 400, 2000, 20, {
isStatic: true,
render: {
    fillStyle: 'gray'
},
label: 'wall'
});

// 복합체와 벽을 세계에 추가
World.add(engine.world, [compoundBody, wall]);

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

function createBody(geometry, style) {
    const points = geoJsonToVectors(geometry);
    return Bodies.fromVertices(Vertices.centre(points).x, Vertices.centre(points).y, points, {
        render: {fillStyle: style}
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

function calculateArea(vertices) {
    const n = vertices.length;
    let area = 0;

    for (let i = 0; i < n; i++) {
        const current = vertices[i];
        const next = vertices[(i + 1) % n];
        area += (current.x * next.y) - (next.x * current.y);
    }

    area = Math.abs(area) / 2;
    return area;
}

function calculateLineArea(body) {
    let sum = 0;
    for (let i = 1; i < body.parts.length; i++) {
        const part = body.parts[i];
        const poly = verticesToGeometry(part);
        const cut = Cutter.intersection(poly, line);
        if (!cut) {
            continue;
        }
        sum += calculateArea(geoJsonToVectors(cut[0]));
    }

    return sum;
}

function removeLines(body) {
    World.remove(engine.world, body);
    const bodyToAdd = [];
    console.log(body);
    for (let i = 1; i < body.parts.length; i++) {
        const part = body.parts[i];
        const poly = verticesToGeometry(part);
        const cut = Cutter.diff(poly, line);
        const cut1 = cut[0];
        const cut2 = cut[1];

        if (cut1) {
            bodyToAdd.push(createBody(cut1, body.parts[i].render.fillStyle));
        }

        if (cut2) {
            bodyToAdd.push(createBody(cut2, body.parts[i].render.fillStyle));
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
        console.log("added:", add.id, value);
        realBodyToAdd.push(add);
    })

    World.add(engine.world, realBodyToAdd);
}
Matter.Runner.run(engine);