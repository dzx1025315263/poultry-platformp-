import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'editor') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理员权限' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  company: router({
    stats: publicProcedure.query(() => db.getCompanyStats()),
    countryStats: publicProcedure.query(() => db.getCountryStats()),
    search: publicProcedure.input(z.object({
      query: z.string().optional(), continent: z.string().optional(), country: z.string().optional(),
      role: z.string().optional(), chinaOnly: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(),
    })).query(({ input }) => db.searchCompanies(input)),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => db.getCompanyById(input.id)),
    byContinent: publicProcedure.input(z.object({ continent: z.string() })).query(({ input }) => db.getCompaniesByContinent(input.continent)),
    byCountry: publicProcedure.input(z.object({ country: z.string() })).query(({ input }) => db.getCompaniesByCountry(input.country)),
  }),

  favorite: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserFavorites(ctx.user.id)),
    ids: protectedProcedure.query(({ ctx }) => db.getUserFavoriteIds(ctx.user.id)),
    add: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(({ ctx, input }) => db.addFavorite(ctx.user.id, input.companyId)),
    remove: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(({ ctx, input }) => db.removeFavorite(ctx.user.id, input.companyId)),
    update: protectedProcedure.input(z.object({
      companyId: z.number(), followUpStatus: z.string().optional(), followUpDate: z.date().nullable().optional(), notes: z.string().optional(),
    })).mutation(({ ctx, input }) => { const { companyId, ...data } = input; return db.updateFavorite(ctx.user.id, companyId, data); }),
  }),

  team: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserTeams(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const inviteCode = nanoid(8);
      return db.createTeam(input.name, ctx.user.id, inviteCode);
    }),
    join: protectedProcedure.input(z.object({ inviteCode: z.string() })).mutation(({ ctx, input }) => db.joinTeam(input.inviteCode, ctx.user.id)),
    members: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamMembers(input.teamId)),
    leave: protectedProcedure.input(z.object({ teamId: z.number() })).mutation(({ ctx, input }) => db.leaveTeam(input.teamId, ctx.user.id)),
    delete: protectedProcedure.input(z.object({ teamId: z.number() })).mutation(({ input }) => db.deleteTeam(input.teamId)),
    shareCompany: protectedProcedure.input(z.object({ teamId: z.number(), companyId: z.number() })).mutation(({ ctx, input }) => db.shareCompanyToTeam(input.teamId, input.companyId, ctx.user.id)),
    sharedCompanies: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamSharedCompanies(input.teamId)),
    updateShared: protectedProcedure.input(z.object({ id: z.number(), followUpStatus: z.string().optional(), notes: z.string().optional() }))
      .mutation(({ ctx, input }) => { const { id, ...data } = input; return db.updateTeamSharedCompany(id, ctx.user.id, data); }),
  }),

  inquiry: router({
    getTemplate: protectedProcedure.query(({ ctx }) => db.getInquiryTemplate(ctx.user.id)),
    saveTemplate: protectedProcedure.input(z.object({
      companyName: z.string().optional(), contactPerson: z.string().optional(), email: z.string().optional(),
      phone: z.string().optional(), destinationPort: z.string().optional(), emailBody: z.string().optional(),
    })).mutation(({ ctx, input }) => db.upsertInquiryTemplate(ctx.user.id, input)),
    getSmtp: protectedProcedure.query(({ ctx }) => db.getSmtpConfig(ctx.user.id)),
    saveSmtp: protectedProcedure.input(z.object({
      host: z.string(), port: z.number(), secure: z.boolean().optional(),
      username: z.string(), password: z.string(), fromName: z.string().optional(), fromEmail: z.string().optional(),
    })).mutation(({ ctx, input }) => db.upsertSmtpConfig(ctx.user.id, input)),
    emailHistory: protectedProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ ctx, input }) => db.getEmailHistory(ctx.user.id, input.page, input.pageSize)),
    sendEmail: protectedProcedure.input(z.object({
      recipients: z.string(), subject: z.string(), body: z.string(),
      sendType: z.enum(["single", "bcc"]).optional(), companyId: z.number().optional(), internalNote: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.addEmailHistory({ userId: ctx.user.id, companyId: input.companyId, recipients: input.recipients, subject: input.subject, body: input.body, sendType: input.sendType || 'single', status: 'sent', internalNote: input.internalNote });
      return { success: true };
    }),
  }),

  admin: router({
    updateCompany: adminProcedure.input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCompany(input.id, input.data);
        await db.addAuditLog(ctx.user.id, 'update', 'companies', input.id, JSON.stringify(input.data));
        return { success: true };
      }),
    deleteCompany: adminProcedure.input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCompany(input.id);
        await db.addAuditLog(ctx.user.id, 'delete', 'companies', input.id);
        return { success: true };
      }),
    createCompany: adminProcedure.input(z.object({ data: z.record(z.string(), z.any()) }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCompany(input.data);
        await db.addAuditLog(ctx.user.id, 'create', 'companies', id ?? undefined);
        return { id };
      }),
    auditLogs: adminProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ input }) => db.getAuditLogs(input.page, input.pageSize)),
  }),
});

export type AppRouter = typeof appRouter;
