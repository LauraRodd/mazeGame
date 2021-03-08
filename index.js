// Store objects from the Matter library
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Configuration Variables
const cellsHorizontal = 10;
const cellsVertical = 5;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

// Create a new engine
const engine = Engine.create();
engine.world.gravity.y = 0;
// Get access to a world that got created along with that engine
const { world } = engine;
// Create Render object that will show some content on the screen and pass elements
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
// Render content on the screen
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];
World.add(world, walls);

// *****************
// Maze Generation
// *****************
// Take some array and randomly reorder elements inside it
const shuffle = (arr) => {
  let counter = arr.length;
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};

// Grid array
const grid = Array(cellsVertical) //rows
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false)); //columns

// Verticals array
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));
// Horizontals array
const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

// Pick random index to start maze
const startRow = Math.floor(Math.random() * cellsVertical);
const startCol = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, col) => {
  // If visited the cell at [row, column], then return
  if (grid[row][col]) {
    return;
  }
  // Mark this cell as being visited
  grid[row][col] = true;
  // Assemble randomly ordered list of neighbor cells
  const neighbors = shuffle([
    [row - 1, col, "up"],
    [row, col + 1, "right"],
    [row + 1, col, "down"],
    [row, col - 1, "left"],
  ]);
  // For each neighbor
  for (let neighbor of neighbors) {
    const [nextRow, nextCol, direction] = neighbor;
    // See if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextCol < 0 ||
      nextCol >= cellsHorizontal
    ) {
      continue;
    }
    // If neighbor is visited, continue to next neighbor
    if (grid[nextRow][nextCol]) {
      continue;
    }
    // Remove wall from either horizontals or verticals
    if (direction === "left") {
      verticals[row][col - 1] = true;
    } else if (direction === "right") {
      verticals[row][col] = true;
    } else if (direction === "up") {
      horizontals[row - 1][col] = true;
    } else if (direction === "down") {
      horizontals[row][col] = true;
    }
    stepThroughCell(nextRow, nextCol);
  }
  // Visit that next cell
};

stepThroughCell(startRow, startCol);

// Iterate over horizontal walls
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, colIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      colIndex * unitLengthX + unitLengthX / 2, //For X direction
      rowIndex * unitLengthY + unitLengthY, //For Y direction
      unitLengthX, // width
      5, // height
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

//Iterate over vertical walls
verticals.forEach((row, rowIndex) => {
  row.forEach((open, colIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      colIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

// Draw goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    isStatic: true,
    label: "goal",
    render: {
      fillStyle: "green",
    },
  }
);
World.add(world, goal);

// Draw ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: {
    fillStyle: "blue",
  },
});
World.add(world, ball);

// Handle Keypresses
document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;
  const speedLimit = 7;
  if (event.key === "ArrowUp" && y > -speedLimit) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }
  if (event.key === "ArrowRight" && x < speedLimit) {
    Body.setVelocity(ball, { x: x + 5, y });
  }
  if (event.key === "ArrowDown" && y < speedLimit) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.key === "ArrowLeft" && x > -speedLimit) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});
// Win Condition
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
