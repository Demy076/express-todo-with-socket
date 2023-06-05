import { Router } from "express";
import { is_authenticated } from "../auth/middlewares/is_authenticated";
import * as yup from "yup";

const todoSchemaCreation = yup.object().shape({
  title: yup.string().min(1).max(64).required(),
  completed: yup.boolean().default(false),
});

export const todoRouter = Router({
  caseSensitive: false,
});

todoRouter.use(is_authenticated);

todoRouter.get("/", async (req, res) => {
  const todos = await req.prisma.todos.findMany({
    where: {
      user: {
        id: req.session?.user?.id,
      },
    },
  });
  if (todos.length === 0) {
    return res.status(404).json({ message: "No todos found" });
  }
  return res.json(todos);
});

todoRouter.post("/", async (req, res) => {
  try {
    const { title, completed } = await todoSchemaCreation.validate(req.body);
    const todo = await req.prisma.todos.create({
      data: {
        title,
        completed,
        user: {
          connect: {
            id: req.session?.user?.id,
          },
        },
      },
    });
    req.mqttClient.publish(
      `user-${req.session?.user?.id}`,
      JSON.stringify(todo)
    );
    return res.json({
      message: "Todo created",
      todo,
    });
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

todoRouter.delete("/:id", async (req, res) => {
  const todo = await req.prisma.todos.findUnique({
    where: {
      id: parseInt(req.params.id),
    },

    select: {
      id: true,
      title: true,
      completed: true,
      user: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }
  if (todo.user.id !== req.session?.user?.id) {
    return res.status(403).json({ message: "You don't own this todo" });
  }
  await req.prisma.todos.delete({
    where: {
      id: todo.id,
    },
  });
  req.mqttClient.publish(
    `user-${req.session?.user?.id}`,
    JSON.stringify({ message: "Todo deleted", todo })
  );
  return res.json({ message: "Todo deleted", todo });
});
