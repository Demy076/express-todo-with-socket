import { NextFunction } from "connect";
import { Request, Response } from "express-serve-static-core";

export const is_authenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //   Check if session cookie exists
  if (!req.cookies?.session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const sessionCookie = req.cookies.session || "";
  console.log(sessionCookie);
  if (!sessionCookie) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const session = await req.prisma.sessions.findUnique({
    where: {
      token: sessionCookie,
    },
    include: {
      user: true,
    },
  });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  //   Save it
  req.session = session;
  return Promise.resolve(next());
};
