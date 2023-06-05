import { Router } from "express";
import { compareSync, hashSync } from "bcrypt";
import * as yup from "yup";
const loginSchema = yup.object().shape({
  username: yup.string().min(1).max(64).required(),
  password: yup.string().min(8).max(24).required(),
});

const registerSchema = yup.object().shape({
  username: yup.string().min(1).max(64).required(),
  password: yup.string().min(8).max(24).required(),
  email: yup.string().email().required(),
  name: yup.string().min(1).max(64).required(),
});

export const authRouter = Router({
  caseSensitive: false,
});

authRouter.post("/login", async (req, res) => {
  try {
    const { username, password } = await loginSchema.validate(req.body);
    const user = await req.prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const isPasswordValid = compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const session = await req.prisma.sessions.create({
      data: {
        token: hashSync(`${user.id}-${Date.now()}`, 10),
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    res.cookie("session", session.token, {
      httpOnly: true,
      secure: false,
    });
    return res.json({ message: "Logged in" });
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

authRouter.post("/register", async (req, res) => {
  try {
    const { username, password, email, name } = await registerSchema.validate(
      req.body
    );
    const user = await req.prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    await req.prisma.users.create({
      data: {
        username,
        password: hashSync(password, 10),
        email,
        name,
      },
    });
    return res.json({ message: "User created" });
  } catch (e) {
    return res.status(400).json({ message: e });
  }
});
