import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// 访客用户对象（暂时开放浏览，无需登录）
const GUEST_USER = {
  id: 0,
  openId: "guest",
  name: "访客",
  role: "user" as const,
  feishuUserId: null,
  feishuUnionId: null,
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // 暂时开放：如果没有登录用户，使用访客身份
  const user = ctx.user || GUEST_USER;

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
