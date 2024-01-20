import Physics from "physicsjs";

// 캔버스 크기 설정
document.addEventListener("DOMContentLoaded", (event) => {
  const canvas = document.getElementById("viewport");
  canvas.width = 392;
  canvas.height = 798;
});

const mapWidth = 392;
const mapHeight = 798;
const blockSize = 32;

let activeBlock = null;
let gameEnded = false; // 게임 종료 상태

// PhysicsJS 초기화 및 물리 객체 설정
Physics(function (world) {
  const renderer = Physics.renderer("canvas", {
    el: "viewport",
    width: mapWidth,
    height: mapHeight,
  });

  world.add(renderer);
  world.add(
    Physics.behavior("constant-acceleration", { acc: { x: 0, y: 0.0001 } })
  ); // 중력 가속도 조정
  world.add(Physics.behavior("body-impulse-response"));
  world.add(Physics.behavior("body-collision-detection"));
  world.add(Physics.behavior("sweep-prune"));

  // 벽 생성
  createWalls(world);

  world.add(
    Physics.behavior("edge-collision-detection", {
      aabb: Physics.aabb(0, 0, mapWidth, mapHeight),
      restitution: 0.2,
      cof: 0.2,
    })
  );
  // 일정 시간마다 블록 생성
  const blockCreationInterval = setInterval(function () {
    if (!activeBlock && !gameEnded) {
      const randomType = Math.floor(Math.random() * 7) + 1;
      activeBlock = createTetrisBlock(randomType, mapWidth / 2, blockSize * 2); // 블록 생성 위치 조정
    }
  }, 5000); // 5초마다 블록 생성
  // 테트리스 블록 모양 정의
  const tetrisShapes = {
    1: [
      // L
      { x: -blockSize, y: blockSize },
      { x: -blockSize, y: 0 },
      { x: -blockSize, y: -blockSize },
      { x: 0, y: -blockSize },
    ],
    2: [
      // J
      { x: blockSize, y: blockSize },
      { x: blockSize, y: 0 },
      { x: blockSize, y: -blockSize },
      { x: 0, y: -blockSize },
    ],
    3: [
      // O
      { x: 0, y: 0 },
      { x: blockSize, y: 0 },
      { x: 0, y: blockSize },
      { x: blockSize, y: blockSize },
    ],
    4: [
      // I
      { x: 0, y: blockSize * 1.5 },
      { x: 0, y: blockSize * 0.5 },
      { x: 0, y: -blockSize * 0.5 },
      { x: 0, y: -blockSize * 1.5 },
    ],
    5: [
      // T
      { x: -blockSize, y: 0 },
      { x: 0, y: 0 },
      { x: blockSize, y: 0 },
      { x: 0, y: -blockSize },
    ],
    6: [
      // S
      { x: 0, y: blockSize },
      { x: 0, y: 0 },
      { x: blockSize, y: 0 },
      { x: blockSize, y: -blockSize },
    ],
    7: [
      // Z
      { x: 0, y: blockSize },
      { x: 0, y: 0 },
      { x: -blockSize, y: 0 },
      { x: -blockSize, y: -blockSize },
    ],
  };

  // 벽 생성 함수
  function createWalls(world) {
    const walls = [
      Physics.body("rectangle", {
        // 천장
        x: mapWidth / 2,
        y: -64,
        width: mapWidth - 16,
        height: 10,
        treatment: "static",
        label: "천장",
        restitution: 0.2, // 반발력 설정
        cof: 0.1, // 마찰 계수 감소
      }),
      Physics.body("rectangle", {
        // 바닥
        x: mapWidth / 2,
        y: mapHeight + 64,
        width: mapWidth - 16,
        height: 10,
        treatment: "static",
        label: "바닥",
        restitution: 0.3, // 반발력 설정
        cof: 0.1, // 마찰 계수 감소
      }),
      Physics.body("rectangle", {
        // 좌측 벽
        x: -8,
        y: mapHeight / 2,
        width: 10,
        height: mapHeight,
        treatment: "static",
        label: "좌측 벽",
        // restitution: 0.2, // 반발력 설정
        cof: 0.1, // 마찰 계수 감소
      }),
      Physics.body("rectangle", {
        // 우측 벽
        x: mapWidth + 8,
        y: mapHeight / 2,
        width: 10,
        height: mapHeight,
        treatment: "static",
        label: "우측 벽",
        //  restitution: 0.2, // 반발력 설정
        cof: 0.1, // 마찰 계수 감소
      }),
    ];
    walls.forEach((wall) => world.add(wall));
  }

  // 테트리스 블록 생성 함수
  function createTetrisBlock(type, x, y) {
    const blockParts = [];
    const shapes = tetrisShapes[type];

    // I 블록의 경우 y 좌표를 더 높게 설정
    if (type === 4) {
      y += blockSize * 2; // I 블록의 y 좌표 추가 조정
    }
    // 각 부분에 대한 물리 객체 생성
    shapes.forEach((shape) => {
      const part = Physics.body("rectangle", {
        x: x + shape.x + blockSize / 2,
        y: y + shape.y + blockSize / 2,
        width: blockSize,
        height: blockSize,
        treatment: "dynamic",
        restitution: 0.3, // 반발력 감소
        cof: 0.3, // 마찰 계수 감소
      });
      blockParts.push(part);
    });

    // 복합체 생성하여 블록 부분들 묶기
    const compound = Physics.body("compound", {
      x: x,
      y: y,
      children: blockParts,
      treatment: "dynamic",
    });

    world.add(compound);
    activeBlock = compound;
    console.log(`블록 생성: 유형 ${type}, 활성 블록:`, activeBlock); // 로깅 추가
    return compound;
  }

  // 버튼 클릭 시 랜덤 블록 생성
  document
    .getElementById("createBlockBtn")
    .addEventListener("click", function () {});

  // 렌더링
  world.on("step", function () {
    world.render();
  });

  world.on("render", function (data) {
    const { bodies } = data;
    const ctx = renderer.ctx;

    bodies.forEach((body) => {
      // 물리 객체 렌더링 (필요한 경우 여기에 코드 추가)
    });
  });

  // 충돌 감지 및 처리
  world.on("collisions:detected", function (data) {
    const collisions = data.collisions;
    collisions.forEach(function (collision) {
      // 충돌한 두 객체
      const bodyA = collision.bodyA;
      const bodyB = collision.bodyB;

      // 충돌 후 속도 감소
      bodyA.state.vel.mult(0.6);
      bodyB.state.vel.mult(0.6);

      if (collision.bodyA === activeBlock || collision.bodyB === activeBlock) {
        const otherBody =
          collision.bodyA === activeBlock ? collision.bodyB : collision.bodyA;

        // 충돌한 객체의 라벨을 확인하여 처리
        const label = otherBody.label || "알 수 없음";
        if (label === "천장") {
          console.log("게임 종료: 천장에 충돌");
          gameEnded = true; // 게임 종료 상태 설정
          clearInterval(blockCreationInterval); // 블록 생성 중지
          alert("게임 종료: 천장에 충돌");
          activeBlock = null;
        } else {
          // 블록이 생성된 직후라면 충돌을 무시 (단, 천장과의 충돌은 예외)
          if (activeBlock.justCreated) return;

          console.log(`충돌 감지: 제어권 상실`);
          activeBlock = null; // 액티브 블록이 충돌하면 제어권을 잃음
        }
      }
    });
  });

  // 복합체 회전 함수
  function rotateCompound(compound, angle) {
    const center = compound.state.pos; // 복합체의 중심점
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // 복합체의 각 부분에 대해
    compound.children.forEach(function (child) {
      // 현재 위치에서 중심점까지의 벡터 계산
      const r = {
        x: child.state.pos.x - center.x,
        y: child.state.pos.y - center.y,
      };

      // 벡터를 회전
      const rotated = {
        x: r.x * cos - r.y * sin,
        y: r.x * sin + r.y * cos,
      };

      // 회전된 위치로 부분을 이동
      child.state.pos.x = center.x + rotated.x;
      child.state.pos.y = center.y + rotated.y;
    });

    // 복합체의 각도 업데이트
    compound.state.angular.pos += angle;
  }

  // 키 이벤트 핸들러
  document.addEventListener("keydown", function (event) {
    if (!activeBlock || gameEnded) {
      console.log("키 이벤트: 현재 활성 블록 없음 또는 게임 종료 상태");
      return;
    }
    console.log(`키 이벤트: ${event.key}`); // 키 이벤트 로그
    switch (event.key) {
      case "ArrowLeft": // 좌
        activeBlock.applyForce(Physics.vector(-0.02, 0));
        break;
      case "ArrowRight": // 우
        activeBlock.applyForce(Physics.vector(0.02, 0));
        break;
      case "z": // 회전 (반시계 방향)
        rotateCompound(activeBlock, -Math.PI / 1600); // 숫자 늘릴수록 적게 회전전
        break;
      case "x": // 회전 (시계 방향)
        rotateCompound(activeBlock, Math.PI / 1600);
        break;
    }
    // 물리 시뮬레이션
    Physics.util.ticker.on(function (time) {
      world.step(time);
    });
    Physics.util.ticker.start();
  });
});
