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

  // V2.0: 联系人管理
  contact: router({
    list: publicProcedure.input(z.object({ companyId: z.number() })).query(({ input }) => db.getCompanyContacts(input.companyId)),
    add: protectedProcedure.input(z.object({
      companyId: z.number(), name: z.string().min(1), title: z.string().optional(),
      email: z.string().optional(), phone: z.string().optional(), linkedin: z.string().optional(), isPrimary: z.boolean().optional(),
    })).mutation(({ ctx, input }) => db.addCompanyContact({ ...input, addedByUserId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(), name: z.string().optional(), title: z.string().optional(),
      email: z.string().optional(), phone: z.string().optional(), linkedin: z.string().optional(), isPrimary: z.boolean().optional(),
    })).mutation(({ input }) => { const { id, ...data } = input; return db.updateCompanyContact(id, data); }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCompanyContact(input.id)),
  }),

  // V2.0: 信用评级
  credit: router({
    get: publicProcedure.input(z.object({ companyId: z.number() })).query(({ input }) => db.getCompanyCreditRating(input.companyId)),
    upsert: protectedProcedure.input(z.object({
      companyId: z.number(), registeredCapital: z.string().optional(), foundedYear: z.number().optional(),
      importFrequency: z.string().optional(), cooperationHistory: z.string().optional(), creditScore: z.number().optional(),
    })).mutation(({ ctx, input }) => { const { companyId, ...data } = input; return db.upsertCreditRating(companyId, { ...data, ratedByUserId: ctx.user.id }); }),
  }),

  // V2.0: 客户生命周期漏斗
  lifecycle: router({
    funnel: protectedProcedure.query(({ ctx }) => db.getLifecycleFunnel(ctx.user.id)),
    add: protectedProcedure.input(z.object({
      companyId: z.number(), stage: z.enum(['prospect', 'contacted', 'quoted', 'won', 'repurchase']),
      dealValue: z.string().optional(), expectedCloseDate: z.date().optional(), notes: z.string().optional(),
    })).mutation(({ ctx, input }) => { const { companyId, stage, ...data } = input; return db.addToLifecycle(ctx.user.id, companyId, stage, data); }),
    remove: protectedProcedure.input(z.object({ companyId: z.number() })).mutation(({ ctx, input }) => db.removeFromLifecycle(ctx.user.id, input.companyId)),
  }),

  // V2.0: A/B测试
  abTest: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserAbTests(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1), variantA_subject: z.string().optional(), variantA_body: z.string().optional(),
      variantB_subject: z.string().optional(), variantB_body: z.string().optional(),
    })).mutation(({ ctx, input }) => db.createAbTest(ctx.user.id, input)),
    updateStats: protectedProcedure.input(z.object({
      id: z.number(), variant: z.enum(['A', 'B']), field: z.enum(['sent', 'opened', 'replied']),
    })).mutation(({ input }) => db.updateAbTestStats(input.id, input.variant, input.field)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteAbTest(input.id)),
  }),

  // V2.0: 数据导出
  export: router({
    companies: protectedProcedure.input(z.object({
      continent: z.string().optional(), country: z.string().optional(), role: z.string().optional(), chinaOnly: z.boolean().optional(),
    })).query(({ input }) => db.exportCompanies(input)),
    favorites: protectedProcedure.input(z.object({ status: z.string().optional() }))
      .query(({ ctx, input }) => db.exportFavorites(ctx.user.id, input.status)),
  }),

  // V2.0: 团队区域权限
  regionAccess: router({
    get: protectedProcedure.input(z.object({ teamId: z.number() })).query(({ input }) => db.getTeamRegionAccess(input.teamId)),
    set: adminProcedure.input(z.object({
      teamId: z.number(), regions: z.array(z.object({ continent: z.string().optional(), country: z.string().optional() })),
    })).mutation(({ input }) => db.setTeamRegionAccess(input.teamId, input.regions)),
  }),

  // V2.0: 数据备份
  backup: router({
    list: adminProcedure.input(z.object({ page: z.number().optional(), pageSize: z.number().optional() }))
      .query(({ input }) => db.getBackupRecords(input.page, input.pageSize)),
    create: adminProcedure.mutation(async ({ ctx }) => {
      const allCompanies = await db.exportCompanies({});
      const id = await db.addBackupRecord({
        fileName: `backup_${new Date().toISOString().slice(0, 10)}.json`,
        recordCount: allCompanies.length,
        backupType: 'manual',
        createdByUserId: ctx.user.id,
      });
      return { id, recordCount: allCompanies.length };
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
