"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] =
    useState<"start" | "playing" | "clear" | "gameover">("start");
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ===== レスポンシブサイズ =====
    const maxWidth = Math.min(window.innerWidth - 40, 500);
    canvas.width = maxWidth;
    canvas.height = maxWidth * 0.8;

    // ===== ボール =====
    let x = canvas.width / 2;
    let y = canvas.height - 60;
    const speed = 4.5;
    let dx = 0;
    let dy = speed;
    const radius = 8;

    const startTime = Date.now();
    let moveDistance = 0;
    let lastX = 0;

    // ===== パドル =====
    const paddleWidth = canvas.width * 0.2;
    const paddleHeight = 10;
    let paddleX = (canvas.width - paddleWidth) / 2;

    function movePaddle(clientX: number) {
      if(!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const posX = clientX - rect.left;

      if (lastX !== 0) {
        moveDistance += Math.abs(posX - lastX);
      }
      lastX = posX;

      paddleX = posX - paddleWidth / 2;

      if (paddleX < 0) paddleX = 0;
      if (paddleX + paddleWidth > canvas.width)
        paddleX = canvas.width - paddleWidth;
    }

    // PC
    function mouseMove(e: MouseEvent) {
      movePaddle(e.clientX);
    }

    // スマホ
    function touchMove(e: TouchEvent) {
      movePaddle(e.touches[0].clientX);
    }

    canvas.addEventListener("mousemove", mouseMove);
    canvas.addEventListener("touchmove", touchMove);

    // ===== ブロック =====
    const blockRowCount = 3;
    const blockColumnCount = 5;

    const blockWidth = canvas.width / 8;
    const blockHeight = 20;
    const blockPadding = 10;
    const blockOffsetTop = 60;

    const totalBlockWidth =
      blockColumnCount * blockWidth +
      (blockColumnCount - 1) * blockPadding;

    const blockOffsetLeft =
      (canvas.width - totalBlockWidth) / 2;

    const blocks: { x: number; y: number; status: number }[][] = [];

    for (let c = 0; c < blockColumnCount; c++) {
      blocks[c] = [];
      for (let r = 0; r < blockRowCount; r++) {
        blocks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

    function drawBlocks() {
      for (let c = 0; c < blockColumnCount; c++) {
        for (let r = 0; r < blockRowCount; r++) {
          if (blocks[c][r].status === 1) {
            const blockX =
              c * (blockWidth + blockPadding) + blockOffsetLeft;
            const blockY =
              r * (blockHeight + blockPadding) + blockOffsetTop;

            blocks[c][r].x = blockX;
            blocks[c][r].y = blockY;

            ctx.beginPath();
            ctx.rect(blockX, blockY, blockWidth, blockHeight);
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    function collisionDetection(): boolean {
      let remaining = 0;

      for (let c = 0; c < blockColumnCount; c++) {
        for (let r = 0; r < blockRowCount; r++) {
          const b = blocks[c][r];
          if (b.status === 1) {
            remaining++;
            if (
              x > b.x &&
              x < b.x + blockWidth &&
              y > b.y &&
              y < b.y + blockHeight
            ) {
              dy = -dy;
              b.status = 0;
              remaining--;
            }
          }
        }
      }

      if (remaining === 0) {
        const clearTime = (Date.now() - startTime) / 1000;
        const finalScore =
          10000 -
          Math.floor(clearTime * 100) -
          Math.floor(moveDistance * 0.1);

        setScore(finalScore);
        setGameState("clear");
        return true;
      }

      return false;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBlocks();

      // ボール
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "cyan";
      ctx.fill();
      ctx.closePath();

      // パドル
      ctx.beginPath();
      ctx.rect(
        paddleX,
        canvas.height - paddleHeight - 10,
        paddleWidth,
        paddleHeight
      );
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();

      const isClear = collisionDetection();
      if (isClear) return;

      if (x + dx > canvas.width - radius || x + dx < radius)
        dx = -dx;

      if (y + dy < radius)
        dy = -dy;

      if (
        y + dy > canvas.height - paddleHeight - 18 &&
        x > paddleX &&
        x < paddleX + paddleWidth
      ) {
        const hitPos =
          (x - (paddleX + paddleWidth / 2)) /
          (paddleWidth / 2);
        const angle = hitPos * (Math.PI / 3);

        dx = speed * Math.sin(angle);
        dy = -speed * Math.cos(angle);
      }

      if (y + dy > canvas.height - radius) {
        setGameState("gameover");
        return;
      }

      x += dx;
      y += dy;

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      canvas.removeEventListener("mousemove", mouseMove);
      canvas.removeEventListener("touchmove", touchMove);
    };
  }, [gameState]);

  return (
    <div
      style={{
        background: "black",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>Block Breaker</h1>

        <div
          style={{
            border: "3px solid white",
            padding: "10px",
            position: "relative",
          }}
        >
          <canvas ref={canvasRef} />

          {(gameState === "start" ||
            gameState === "clear" ||
            gameState === "gameover") && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "black",
                border: "2px solid white",
                padding: "30px",
              }}
            >
              {gameState === "start" && (
                <button onClick={() => setGameState("playing")}>
                  ▶START
                </button>
              )}

              {gameState === "clear" && (
                <>
                  <h2>CLEAR!</h2>
                  <p>SCORE: {score}</p>
                  <button onClick={() => setGameState("start")}>
                    ▶RESTART
                  </button>
                </>
              )}

              {gameState === "gameover" && (
                <>
                  <h2>GAME OVER</h2>
                  <button onClick={() => setGameState("start")}>
                    ▶RETRY
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}